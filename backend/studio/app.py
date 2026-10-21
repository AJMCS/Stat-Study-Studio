"""The local FastAPI service. It listens on 127.0.0.1 only and serves the built web app, the shared course
library files and a small JSON API for learner data.

Because any web page the learner has open can try to talk to localhost, the service refuses requests whose Host
header is not localhost (DNS rebinding) and refuses state-changing requests whose Origin is not this app.
"""

from __future__ import annotations

import json
import os
import shutil
import sqlite3
import threading
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from platformdirs import user_data_dir
from pydantic import BaseModel, Field, ValidationError

from . import __version__
from .ai import AiError, AiService, tasks
from .config import INDEX_DIR, LIBRARY, REPO_ROOT
from .db import Database
from .embedder import DEFAULT_MODEL, Embedder
from .highlight import best_highlight
from .library import LibraryRuntime
from .models import ALL_SLICES
from .pages import PageStore
from .personal import MAX_BYTES, MAX_IMPROVE_PAGES, MEDIA_TYPES, PersonalStore, UploadRejected
from .retrieval import SharedIndex
from .update import Updater

DEFAULT_PORT = 8765
DEV_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}


class ConnectBody(BaseModel):
    apiKey: str = ""
    accept: bool
    model: str | None = None
    provider: str = "gemini"

class ModelBody(BaseModel):
    model: str | None = None


class SwitchBody(BaseModel):
    provider: str


class Turn(BaseModel):
    role: str = Field(pattern="^(tutor|learner)$")
    text: str = Field(max_length=6000)


class TutorBody(BaseModel):
    topic: str = Field(max_length=200)
    stage: str = Field(pattern="^(probe|diagnose|plan|build|bridge|done)$")
    history: list[Turn] = Field(min_length=1, max_length=60)


class ExampleQuestion(BaseModel):
    concept: str = Field(default="", max_length=200)
    prompt: str = Field(max_length=3000)


class ExamBody(BaseModel):
    topic: str = Field(max_length=200)
    focus: str = Field(default="", max_length=500)
    count: int = Field(default=4, ge=1, le=6)
    examples: list[ExampleQuestion] = Field(default_factory=list, max_length=8)


class ImproveBody(BaseModel):
    accept: bool
    scope: str = Field(default="flagged", pattern="^(flagged|all)$")


class ScoreBody(BaseModel):
    topic: str = Field(max_length=200)
    question: str = Field(max_length=8000)
    answer: str = Field(max_length=20000)
    reference: str = Field(default="", max_length=8000)
    keyPoints: list[str] = Field(default_factory=list, max_length=20)
    stage: str = Field(default="conceptual", pattern="^(conceptual|formal)$")


def default_data_dir() -> Path:
    return Path(os.environ.get("STUDIO_DATA_DIR") or user_data_dir("StatsStudio", appauthor=False))


def create_app(
    data_dir: Path | None = None,
    library_dir: Path | None = None,
    static_dir: Path | None = None,
    port: int = DEFAULT_PORT,
    allow_dev_origin: bool = False,
    auto_check: bool | None = None,
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
    if auto_check is None:
        auto_check = os.environ.get("STUDIO_AUTOCHECK", "1") != "0"

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.db = Database(data_dir / "studio.sqlite3")
        model_name = DEFAULT_MODEL
        if (index_dir / "index.json").exists():
            model_name = json.loads((index_dir / "index.json").read_text(encoding="utf-8"))["embedding_model"]
        app.state.embedder = Embedder(model_name, Path(model_cache) if model_cache else None)
        app.state.library = LibraryRuntime(library_dir, data_dir, app.state.embedder)
        app.state.updater = Updater(app.state.library)
        app.state.personal = PersonalStore(app.state.db, data_dir, app.state.embedder)
        app.state.ai = AiService(data_dir)
        if auto_check and app.state.updater.base is not None:
            # Look for newer course materials in the background; never delays or breaks starting up.
            threading.Thread(target=app.state.updater.check, daemon=True, name="library-check").start()
        yield
        app.state.personal.shutdown()
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

    @app.exception_handler(AiError)
    async def ai_error(_: Request, e: AiError):
        # Plain-language message for the learner; the technical detail is only for the log.
        return JSONResponse({"detail": e.message, "kind": e.kind}, status_code=e.status)

    def db() -> Database:
        return app.state.db

    def ai() -> AiService:
        return app.state.ai

    # ------------------------------------------------------------------ AI service (the learner's own key)
    @app.get("/api/ai")
    def ai_status(provider: str | None = Query(default=None, max_length=20)) -> dict[str, Any]:
        """Connection state. `provider` previews another service's notice and settings without changing anything."""
        return ai().status(provider)

    @app.get("/api/ai/local-models")
    def ai_local_models() -> dict[str, Any]:
        """The models installed in Ollama on this computer (and whether Ollama is running)."""
        return ai().local_models()

    @app.post("/api/ai/connect")
    def ai_connect(body: ConnectBody) -> dict[str, Any]:
        """Checks the key with the provider, then stores it in the OS credential store. Requires accepting the notice."""
        try:
            return ai().connect(body.apiKey, body.accept, body.model, body.provider)
        except ValueError as e:
            raise HTTPException(422, str(e)) from e

    @app.post("/api/ai/test")
    def ai_test() -> dict[str, Any]:
        return ai().test()

    @app.put("/api/ai/model")
    def ai_model(body: ModelBody) -> dict[str, Any]:
        return ai().set_model(body.model)

    @app.post("/api/ai/switch")
    def ai_switch(body: SwitchBody) -> dict[str, Any]:
        """Make another saved service the active one; its key was checked and stored when it was connected."""
        try:
            return ai().switch(body.provider)
        except ValueError as e:
            raise HTTPException(422, str(e)) from e

    @app.post("/api/ai/warm")
    def ai_warm() -> dict[str, Any]:
        """Start loading the active local model (Ollama) in the background so the first question does not wait for it."""
        return ai().warm()

    @app.post("/api/ai/score")
    def ai_score(body: ScoreBody) -> dict[str, Any]:
        """Score one written answer on the four criteria. Sends only the question, the answer and the reference text."""
        provider = ai().provider()
        scored = tasks.score_answer(
            provider, topic=body.topic, question=body.question, answer=body.answer, reference=body.reference, key_points=body.keyPoints, stage=body.stage
        )
        scores = scored["criteria"]
        return {
            "criteria": {k: v["score"] for k, v in scores.items()},
            "feedback": [{"criterion": k, **v} for k, v in scores.items()],
            # what a tutor would say first; the four criteria are the score sheet beneath it
            "note": scored["note"],
            "model": getattr(provider, "model", ""),
        }

    @app.post("/api/ai/tutor")
    def ai_tutor(body: TutorBody) -> dict[str, Any]:
        """The tutor's next reply, grounded in course pages. The conversation lives in the browser; this holds nothing."""
        provider = ai().provider()
        last = next((t.text for t in reversed(body.history) if t.role == "learner"), "")
        sources = grounding(f"{body.topic} {last}"[:500])
        excerpts = [f"{h['title']}, page {h['page']}: {h['text'][:900]}" for h in sources]
        turn = tasks.tutor_turn(provider, topic=body.topic, stage=body.stage, history=[(t.role, t.text) for t in body.history], excerpts=excerpts)
        cited = [sources[i - 1] for i in turn.pop("cites")]
        return {**turn, "sources": cited}

    @app.post("/api/ai/exam")
    def ai_exam(body: ExamBody) -> dict[str, Any]:
        """Write exam questions around a focus, adapting the question bank where useful, grounded in course pages."""
        provider = ai().provider()
        sources = grounding(f"{body.topic} {body.focus}".strip()[:500], shared=5, personal=3)
        excerpts = [f"{h['title']}, page {h['page']}: {h['text'][:900]}" for h in sources]
        questions = tasks.generate_exam(
            provider,
            topic=body.topic,
            focus=body.focus,
            count=body.count,
            examples=[e.model_dump() for e in body.examples],
            excerpts=excerpts,
        )
        for q in questions:
            q["sources"] = [sources[i - 1] for i in q.pop("cites")]
        return {"questions": questions, "model": getattr(provider, "model", "")}

    @app.delete("/api/ai")
    def ai_disconnect(provider: str | None = Query(default=None, max_length=20)) -> dict[str, Any]:
        """Forget one saved service (the given one, or the active one); the others stay saved."""
        return ai().disconnect(provider)

    def shared_results(q: str, k: int) -> list[dict[str, Any]]:
        index: SharedIndex | None = app.state.library.index
        pages: PageStore = app.state.library.pages
        results = []
        if index is not None:
            for hit in index.search(q, k=k):
                page = pages.get(hit.source, hit.page)
                d = hit.as_dict()
                d["title"] = pages.title(hit.source)
                d["highlight"] = best_highlight(page.text, q) if page else None
                d["warning"] = page.warning if page else None
                results.append(d)
        return results

    def grounding(q: str, shared: int = 3, personal: int = 2) -> list[dict[str, Any]]:
        """Passages to ground an AI reply: shared course pages, plus excerpts from personal collections the learner
        has allowed to be sent to an AI service. Nothing else is ever sent."""
        hits = shared_results(q, shared)
        # A model on this computer never sends anything away, so every collection may be used; a hosted one needs the
        # learner's per-collection permission.
        sql = "SELECT id FROM collections" if ai().is_local else "SELECT id FROM collections WHERE consent=1"
        allowed = {r["id"] for r in db().read(sql)}
        if allowed:
            hits += [h for h in app.state.personal.search(q, k=personal, collection_ids=allowed) if h["collectionId"] in allowed]
        return hits

    # ------------------------------------------------------------------ API
    @app.get("/api/health")
    def health() -> dict[str, Any]:
        lib: LibraryRuntime = app.state.library
        index = lib.index.meta if lib.index else None
        return {
            "ok": True,
            "version": __version__,
            "library": {"chunks": index["chunks"], "documents": index["documents"], "builtAt": index["built_at"], **lib.info().as_dict()} if index else None,
        }

    @app.get("/api/library")
    def library_status() -> dict[str, Any]:
        """What course materials are installed, and whether a newer version is available."""
        return app.state.updater.status()

    @app.post("/api/library/check")
    def library_check() -> dict[str, Any]:
        """Look for newer course materials now (the app also does this once when it starts)."""
        return app.state.updater.check()

    @app.post("/api/library/update", status_code=202)
    def library_update() -> dict[str, Any]:
        """Install newer course materials in the background; poll /api/library for progress."""
        return app.state.updater.start_install()

    @app.get("/api/search")
    def search(
        q: str = Query(min_length=1, max_length=500),
        k: int = Query(5, ge=1, le=10),
        collection: list[str] = Query(default=[]),
    ) -> dict[str, Any]:
        """Passages that match the question, each with a citation.

        `results` come from the shared course library; `personal` from the learner's uploads. The General collection
        is always searched; `collection` adds named ones."""
        index: SharedIndex | None = app.state.library.index
        results = shared_results(q, k)
        personal = app.state.personal.search(q, k=k, collection_ids=set(collection))
        if index is None and not personal and not app.state.db.read("SELECT 1 FROM files LIMIT 1"):
            raise HTTPException(503, "The course library index is missing. Ask the maintainer to rebuild it.")
        mode = "semantic" if app.state.embedder.available else "keyword"
        return {"query": q, "mode": mode, "results": results, "personal": personal}

    @app.get("/api/page")
    def get_page(source: str = Query(max_length=300), page: int = Query(ge=1)) -> dict[str, Any]:
        """One page of a shared-library document as text, for the citation preview."""
        found = app.state.library.pages.get(source, page)
        if found is None:
            raise HTTPException(404, "That page is not in the course library")
        return found.as_dict()

    # ------------------------------------------------------------------ personal files
    async def _receive(upload: UploadFile) -> Path:
        """Stream an upload to disk (never into memory) and enforce the size limit."""
        name = Path(upload.filename or "upload").name or "upload"
        folder = app.state.personal.incoming_dir / uuid.uuid4().hex
        folder.mkdir(parents=True)
        dest = folder / f"original{Path(name).suffix.lower() or '.bin'}"
        size = 0
        try:
            with dest.open("wb") as out:
                while chunk := await upload.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise UploadRejected(f'"{name}" is larger than {MAX_BYTES // (1024 * 1024)} MB. Split it into smaller files.', 413)
                    out.write(chunk)
        except BaseException:
            shutil.rmtree(folder, ignore_errors=True)
            raise
        return dest

    @app.post("/api/uploads", status_code=202)
    async def upload(file: UploadFile = File(...), collectionId: str = Form(...), replaceId: str | None = Form(None)) -> dict[str, Any]:
        """Start adding a file. Parsing and OCR run in the background; poll /api/uploads/{id} for progress."""
        store: PersonalStore = app.state.personal
        try:
            dest = await _receive(file)
            try:
                job = store.submit(dest, file.filename or "upload", collectionId, replaceId)
            except BaseException:
                shutil.rmtree(dest.parent, ignore_errors=True)
                raise
        except UploadRejected as e:
            raise HTTPException(e.status, str(e)) from e
        return job.as_dict()

    @app.get("/api/uploads/{upload_id}")
    def upload_status(upload_id: str) -> dict[str, Any]:
        job = app.state.personal.job(upload_id)
        if job is None:
            raise HTTPException(404, "Unknown upload")
        return job.as_dict()

    @app.get("/api/files")
    def list_files() -> list[dict[str, Any]]:
        return app.state.db.get_state()["files"]

    @app.delete("/api/files/{file_id}")
    def remove_file(file_id: str) -> dict[str, bool]:
        if not app.state.personal.remove(file_id):
            raise HTTPException(404, "That file is not in your collections")
        return {"ok": True}

    @app.post("/api/files/{file_id}/reconnect")
    async def reconnect_file(file_id: str, file: UploadFile = File(...)) -> dict[str, bool]:
        try:
            dest = await _receive(file)
            try:
                app.state.personal.reconnect(file_id, dest)
            finally:
                shutil.rmtree(dest.parent, ignore_errors=True)
        except UploadRejected as e:
            raise HTTPException(e.status, str(e)) from e
        return {"ok": True}

    @app.get("/api/files/{file_id}/original")
    def original_file(file_id: str) -> FileResponse:
        path = app.state.personal.original_path(file_id)
        if path is None:
            raise HTTPException(404, "The original file is not available on this device")
        row = app.state.db.read("SELECT filename FROM files WHERE id=?", (file_id,))[0]
        return FileResponse(
            path,
            media_type=MEDIA_TYPES.get(path.suffix.lower(), "application/octet-stream"),
            filename=row["filename"],
            content_disposition_type="inline",
            headers={"X-Content-Type-Options": "nosniff"},
        )

    @app.get("/api/files/{file_id}/improve-info")
    def improve_info(file_id: str, scope: str = Query("flagged", pattern="^(flagged|all)$")) -> dict[str, Any]:
        """What "Improve with AI" would do for this file, so the learner can decide with the real numbers in front of them."""
        store: PersonalStore = app.state.personal
        if not store._file(file_id) or store._file(file_id)["removed"]:
            raise HTTPException(404, "That file is not in your collections.")
        pages = store.pages_to_improve(file_id, scope)
        info = ai().status()
        return {
            "pages": pages[:MAX_IMPROVE_PAGES],
            "count": len(pages),
            "willSend": min(len(pages), MAX_IMPROVE_PAGES),
            "limit": MAX_IMPROVE_PAGES,
            "connected": info["connected"],
            "providerName": info["providerName"],
            "local": info["local"],
            "model": info["model"],
        }

    @app.post("/api/files/{file_id}/improve", status_code=202)
    def improve_file(file_id: str, body: ImproveBody) -> dict[str, Any]:
        """Re-read a file's pages from their images with the connected AI model. Each call needs `accept: true`: the learner
        agrees every time, because this sends page images (not just text). Poll /api/uploads/{id} for progress."""
        if not body.accept:
            raise HTTPException(422, "Confirm that you want these page images sent to the AI service.")
        provider = ai().provider()
        try:
            return app.state.personal.submit_improve(file_id, provider, body.scope).as_dict()
        except UploadRejected as e:
            raise HTTPException(e.status, str(e)) from e

    @app.post("/api/files/{file_id}/restore-reading")
    def restore_reading(file_id: str) -> dict[str, Any]:
        """Go back to the automatic reading of every page an AI model re-read."""
        try:
            return {"file": app.state.personal.restore_original_reading(file_id)}
        except UploadRejected as e:
            raise HTTPException(e.status, str(e)) from e

    @app.get("/api/files/{file_id}/pages/{page}")
    def file_page(file_id: str, page: int) -> dict[str, Any]:
        found = app.state.personal.get_page(file_id, page)
        if found is None:
            raise HTTPException(404, "That page is not available")
        return found

    @app.get("/api/files/{file_id}/pages/{page}/image")
    def file_page_image(file_id: str, page: int) -> Response:
        found = app.state.personal.page_image(file_id, page)
        if found is None:
            raise HTTPException(404, "No picture of that page is available")
        data, media = found
        return Response(data, media_type=media, headers={"X-Content-Type-Options": "nosniff"})

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
            app.state.personal.wipe()  # an import replaces everything, including uploaded files
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
        app.state.personal.wipe()
        db().wipe()
        ai().disconnect_all()
        return {"ok": True}

    # ------------------------------------------------------------------ files
    @app.get("/course-library/{path:path}", include_in_schema=False)
    def library_file(path: str) -> FileResponse:
        """The original PDFs of the course library (the current version, which an update can replace)."""
        found = app.state.library.file(path)
        if found is None:
            raise HTTPException(404, "Not found")
        return FileResponse(found)

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
