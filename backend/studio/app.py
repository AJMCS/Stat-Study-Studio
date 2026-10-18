"""The local FastAPI service. It listens on 127.0.0.1 only and serves the built web app, the shared course
library files and a small JSON API for learner data.

Because any web page the learner has open can try to talk to localhost, the service refuses requests whose Host
header is not localhost (DNS rebinding) and refuses state-changing requests whose Origin is not this app.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from platformdirs import user_data_dir
from pydantic import ValidationError

from . import __version__
from .config import INDEX_DIR, LIBRARY, REPO_ROOT
from .db import Database
from .highlight import best_highlight
from .models import ALL_SLICES
from .pages import PageStore
from .retrieval import SharedIndex

DEFAULT_PORT = 8765
DEV_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}


def default_data_dir() -> Path:
    return Path(os.environ.get("STUDIO_DATA_DIR") or user_data_dir("StatsStudio", appauthor=False))


def create_app(
    data_dir: Path | None = None,
    library_dir: Path | None = None,
    static_dir: Path | None = None,
    port: int = DEFAULT_PORT,
    allow_dev_origin: bool = False,
) -> FastAPI:
    data_dir = Path(data_dir) if data_dir else default_data_dir()
    library_dir = Path(library_dir) if library_dir else LIBRARY
    static_dir = Path(static_dir) if static_dir else REPO_ROOT / "app" / "dist"
    allowed_hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}
    allowed_origins = {f"http://127.0.0.1:{port}", f"http://localhost:{port}"} | (DEV_ORIGINS if allow_dev_origin else set())
    if allow_dev_origin:
        allowed_hosts |= {"localhost:5173", "127.0.0.1:5173"}

    index_dir = library_dir / "index"
    model_cache = os.environ.get("STUDIO_MODEL_CACHE")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.db = Database(data_dir / "studio.sqlite3")
        app.state.pages = PageStore(library_dir)
        app.state.index = SharedIndex(index_dir, cache_dir=Path(model_cache) if model_cache else None) if (index_dir / "index.json").exists() else None
        yield
        app.state.db.close()

    app = FastAPI(title="Stats 132 Study Studio", version=__version__, lifespan=lifespan, docs_url=None, redoc_url=None)

    @app.middleware("http")
    async def local_only(request: Request, call_next):
        if request.headers.get("host", "") not in allowed_hosts:
            return JSONResponse({"detail": "Unrecognized host"}, status_code=403)
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            origin = request.headers.get("origin")
            if origin is None or origin not in allowed_origins:
                return JSONResponse({"detail": "Requests must come from the study app"}, status_code=403)
        return await call_next(request)

    def db() -> Database:
        return app.state.db

    # ------------------------------------------------------------------ API
    @app.get("/api/health")
    def health() -> dict[str, Any]:
        index_file = INDEX_DIR / "index.json" if library_dir == LIBRARY else library_dir / "index" / "index.json"
        index = json.loads(index_file.read_text(encoding="utf-8")) if index_file.exists() else None
        return {
            "ok": True,
            "version": __version__,
            "library": {"chunks": index["chunks"], "documents": index["documents"], "builtAt": index["built_at"]} if index else None,
        }

    @app.get("/api/search")
    def search(q: str = Query(min_length=1, max_length=500), k: int = Query(5, ge=1, le=10)) -> dict[str, Any]:
        """Passages from the shared course library that match the question, each with a citation."""
        index: SharedIndex | None = app.state.index
        if index is None:
            raise HTTPException(503, "The course library index is missing. Ask the maintainer to rebuild it.")
        pages: PageStore = app.state.pages
        results = []
        for hit in index.search(q, k=k):
            page = pages.get(hit.source, hit.page)
            d = hit.as_dict()
            d["title"] = pages.title(hit.source)
            d["highlight"] = best_highlight(page.text, q) if page else None
            d["warning"] = page.warning if page else None
            results.append(d)
        return {"query": q, "mode": index.mode, "results": results}

    @app.get("/api/page")
    def get_page(source: str = Query(max_length=300), page: int = Query(ge=1)) -> dict[str, Any]:
        """One page of a shared-library document as text, for the citation preview."""
        found = app.state.pages.get(source, page)
        if found is None:
            raise HTTPException(404, "That page is not in the course library")
        return found.as_dict()

    @app.get("/api/state")
    def get_state() -> dict[str, Any]:
        return {"initialized": db().initialized(), "state": db().get_state()}

    @app.put("/api/state/{name}")
    def put_slice(name: str, value: Any = Body(...)) -> dict[str, bool]:
        if name not in ALL_SLICES:
            raise HTTPException(404, f"Unknown data slice: {name}")
        try:
            db().put_slice(name, value)
        except (ValidationError, ValueError, sqlite3.IntegrityError) as e:
            raise HTTPException(422, _explain(e)) from e
        return {"ok": True}

    @app.post("/api/import")
    def import_state(state: dict[str, Any] = Body(...), overwrite: bool = False) -> dict[str, bool]:
        if db().initialized() and not overwrite:
            raise HTTPException(409, "Study data already exists on this device")
        try:
            db().import_state(state)
        except (ValidationError, ValueError, sqlite3.IntegrityError) as e:
            raise HTTPException(422, _explain(e)) from e
        return {"ok": True}

    @app.get("/api/export")
    def export() -> Response:
        payload = {
            "app": "Stats 132 Study Studio",
            "version": __version__,
            "exportedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "data": db().get_state(),
        }
        return Response(
            json.dumps(payload, indent=2, ensure_ascii=False),
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="stats132-study-data.json"'},
        )

    @app.delete("/api/data")
    def delete_all() -> dict[str, bool]:
        db().wipe()
        return {"ok": True}

    # ------------------------------------------------------------------ files
    if library_dir.exists():
        app.mount("/course-library", StaticFiles(directory=library_dir), name="course-library")
    if static_dir.exists():
        if (static_dir / "assets").exists():
            app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        def spa(path: str) -> FileResponse:
            if path.startswith("api/"):
                raise HTTPException(404, "Not found")
            candidate = (static_dir / path).resolve()
            if path and static_dir.resolve() in candidate.parents and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(static_dir / "index.html")

    return app


def _explain(e: Exception) -> str:
    if isinstance(e, sqlite3.IntegrityError):
        return "Duplicate id or name in the submitted data"
    if isinstance(e, ValidationError):
        first = e.errors()[0]
        where = ".".join(str(p) for p in first["loc"])
        return f"Invalid data at {where}: {first['msg']}"
    return str(e)
