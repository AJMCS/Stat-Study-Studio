"""The shared course library the app is currently using, and how a newer one replaces it.

The app ships with a bundled library. An update downloads only the files that changed into a new folder
<data dir>/library/v<N>/, checks that the new library loads and searches, then points the app at it by rewriting one
small pointer file. The old version is never modified, so a failed or interrupted update changes nothing.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import shutil
from dataclasses import dataclass
from pathlib import Path

from .embedder import Embedder
from .pages import PageStore
from .retrieval import SharedIndex

log = logging.getLogger(__name__)

MANIFEST = "library.json"
POINTER = "CURRENT"
KEEP_VERSIONS = 2
TEXT_SUFFIXES = {".md", ".json", ".jsonl"}


def file_sha256(path: Path, as_suffix: str | None = None) -> str:
    """Hash a library file. Text files are hashed with LF line endings so a Windows checkout matches the repository.
    `as_suffix` says what kind of file this will become (for a download still named *.part)."""
    data = path.read_bytes()
    if (as_suffix or path.suffix).lower() in TEXT_SUFFIXES:
        data = data.replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()


def file_size(path: Path) -> int:
    n = path.stat().st_size
    if path.suffix.lower() in TEXT_SUFFIXES:
        n = len(path.read_bytes().replace(b"\r\n", b"\n"))
    return n


def read_manifest(root: Path) -> dict | None:
    path = root / MANIFEST
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) and isinstance(data.get("version"), int) and isinstance(data.get("files"), dict) else None
    except (OSError, ValueError):
        return None


@dataclass
class LibraryInfo:
    version: int
    built_at: str | None
    source: str  # "bundled" or "update"

    def as_dict(self) -> dict:
        return {"version": self.version, "builtAt": self.built_at, "source": self.source}


def check_loads(root: Path, embedder: Embedder) -> tuple[PageStore, SharedIndex | None]:
    """Build what the app needs from a library folder. Raises if it is unusable."""
    pages = PageStore(root)
    index_dir = root / "index"
    index = SharedIndex(index_dir, embedder=embedder) if (index_dir / "index.json").exists() else None
    if index is not None:
        if index.meta["embedding_model"] != embedder.model_name:
            raise ValueError("this library needs a different search model; update the app first")
        if len(index.rows) == 0:
            raise ValueError("the library index is empty")
    return pages, index


class LibraryRuntime:
    def __init__(self, bundled: Path, data_dir: Path, embedder: Embedder):
        self.bundled = bundled
        self.store = data_dir / "library"
        self.embedder = embedder
        self.root = bundled
        self.source = "bundled"
        self.pages: PageStore = PageStore(bundled)
        self.index: SharedIndex | None = None
        self._select_and_load()
        self._cleanup()

    # ------------------------------------------------------------------ choosing a version
    def _pointer_dir(self) -> Path | None:
        try:
            name = (self.store / POINTER).read_text(encoding="utf-8").strip()
        except OSError:
            return None
        return self.store / name if name else None

    def _select_and_load(self) -> None:
        bundled_version = (read_manifest(self.bundled) or {}).get("version", 0)
        candidate = self._pointer_dir()
        if candidate is not None:
            m = read_manifest(candidate)
            if m and m["version"] > bundled_version:
                try:
                    self._activate(candidate, "update")
                    return
                except Exception as e:  # a damaged update must never stop the app
                    log.warning("Ignoring the downloaded library (%s); using the bundled one.", e)
        self._activate(self.bundled, "bundled")

    def _activate(self, root: Path, source: str) -> None:
        pages, index = check_loads(root, self.embedder)
        self.pages, self.index, self.root, self.source = pages, index, root, source

    def reload_from(self, root: Path) -> None:
        """Switch to a new library folder after it has been downloaded."""
        self._activate(root, "update")
        self.store.mkdir(parents=True, exist_ok=True)
        tmp = self.store / f"{POINTER}.tmp"
        tmp.write_text(root.name, encoding="utf-8")
        os.replace(tmp, self.store / POINTER)  # one atomic step: either the old or the new version is current
        self._cleanup()

    def _cleanup(self) -> None:
        if not self.store.exists():
            return
        keep = {self.root.name}
        versions = sorted((p for p in self.store.iterdir() if p.is_dir() and p.name.startswith("v")), key=lambda p: p.name)
        for p in versions[-KEEP_VERSIONS:]:
            keep.add(p.name)
        for p in self.store.iterdir():
            if p.is_dir() and p.name not in keep:
                shutil.rmtree(p, ignore_errors=True)

    # ------------------------------------------------------------------ facts
    @property
    def manifest(self) -> dict | None:
        return read_manifest(self.root)

    def info(self) -> LibraryInfo:
        m = self.manifest or {}
        return LibraryInfo(version=m.get("version", 0), built_at=m.get("built_at"), source=self.source)

    def file(self, relative: str) -> Path | None:
        """A file in the current library, or None. The path can never leave the library folder."""
        root = self.root.resolve()
        candidate = (root / relative).resolve()
        if root in candidate.parents and candidate.is_file():
            return candidate
        return None
