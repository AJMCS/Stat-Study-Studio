"""Personal uploads: stored, parsed and searched on the learner's own device.

Originals live in <data dir>/personal/<file id>/original.<ext>; text, pages and the index live in the SQLite
file. Nothing here talks to the network except (once) downloading the embedding model.

Lifecycle of a file
  upload -> checked -> parsed in the background (OCR where needed) -> chunked and embedded -> searchable
  replace -> the new file is a new version; the old version stops being searched but keeps its pages and original
             so past activity can still show what it cited
  remove  -> leaves search at once; text and original are deleted; a record stays, marked unavailable
"""

from __future__ import annotations

import hashlib
import logging
import re
import shutil
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from rank_bm25 import BM25Plus

from .chunking import is_junk
from .db import Database
from .embedder import Embedder
from .extract import ACCEPTED_SUFFIXES, ParseError, PageText, extract
from .highlight import best_highlight
from .models import GENERAL_ID
from .retrieval import RRF_K
from .textnorm import tokenize

log = logging.getLogger(__name__)

MAX_BYTES = 200 * 1024 * 1024
MIN_TEXT = 20
CHUNK_CHARS = 800
JOB_TTL_SECONDS = 3600
EMBED_BACKFILL_PER_SEARCH = 256

MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
}


class UploadRejected(Exception):
    def __init__(self, message: str, status: int = 422):
        super().__init__(message)
        self.status = status


@dataclass
class UploadJob:
    id: str
    filename: str
    status: str = "queued"  # queued | processing | ready | failed
    progress: int = 0
    total: int = 0
    error: str | None = None
    file: dict | None = None
    report: dict | None = None
    created: float = field(default_factory=time.time)

    def as_dict(self) -> dict:
        return {
            "uploadId": self.id,
            "filename": self.filename,
            "status": self.status,
            "progress": self.progress,
            "total": self.total,
            "error": self.error,
            "file": self.file,
            "report": self.report,
        }


def _uid() -> str:
    return uuid.uuid4().hex[:12]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def chunk_plain(text: str, max_chars: int = CHUNK_CHARS) -> list[tuple[str, str]]:
    """Split page text into (heading, chunk) pieces of about max_chars, on sentence boundaries."""
    heading = ""
    chunks: list[tuple[str, str]] = []
    buf: list[str] = []
    buf_heading = ""
    size = 0

    def flush():
        nonlocal buf, size
        if buf:
            chunks.append((buf_heading, " ".join(buf)))
        buf, size = [], 0

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("# "):
            flush()
            heading = line[2:].strip()
            buf_heading = heading
            continue
        for sent in re.split(r"(?<=[.!?])\s+", line):
            if not buf:
                buf_heading = heading
            if buf and size + len(sent) > max_chars:
                flush()
                buf_heading = heading
            buf.append(sent)
            size += len(sent) + 1
    flush()
    if len(chunks) > 1 and len(chunks[-1][1]) < max_chars // 5:
        h, t = chunks.pop()
        ph, pt = chunks.pop()
        chunks.append((ph, f"{pt} {t}"))
    return chunks


def _page_warning(flags: list[str]) -> str | None:
    return PageText(0, "", "ocr", 0.0, flags).warning


def _flags(s: str) -> list[str]:
    return [f for f in s.split(",") if f]


class PersonalStore:
    def __init__(self, db: Database, data_dir: Path, embedder: Embedder):
        self.db = db
        self.root = data_dir / "personal"
        self.root.mkdir(parents=True, exist_ok=True)
        self.embedder = embedder
        self.jobs: dict[str, UploadJob] = {}
        self._pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="upload")
        self._tok: dict[str, list[str]] = {}
        self.cleanup_orphans()
        self.verify_links()

    # ------------------------------------------------------------------ housekeeping
    def file_dir(self, file_id: str) -> Path:
        return self.root / file_id

    def original_path(self, file_id: str) -> Path | None:
        row = self._file(file_id)
        if not row or row["removed"]:
            return None
        path = self.file_dir(file_id) / f"original{row['ext']}"
        return path if path.exists() else None

    @property
    def incoming_dir(self) -> Path:
        return self.root / "_incoming"

    def cleanup_orphans(self) -> None:
        """Remove folders left by a crash mid-upload (no matching record, or half-received uploads)."""
        shutil.rmtree(self.incoming_dir, ignore_errors=True)
        self.incoming_dir.mkdir(parents=True, exist_ok=True)
        known = {r["id"] for r in self.db.read("SELECT id FROM files")}
        for child in self.root.iterdir():
            if child.is_dir() and child.name != "_incoming" and child.name not in known:
                shutil.rmtree(child, ignore_errors=True)

    def verify_links(self) -> None:
        """A file whose original has gone missing is excluded from search until it is reconnected or re-added."""
        with self.db.transaction() as c:
            for r in c.execute("SELECT id, ext, removed, link_broken FROM files WHERE removed=0").fetchall():
                missing = not (self.file_dir(r["id"]) / f"original{r['ext']}").exists()
                if missing != bool(r["link_broken"]):
                    c.execute("UPDATE files SET link_broken=? WHERE id=?", (int(missing), r["id"]))

    def _file(self, file_id: str):
        rows = self.db.read("SELECT * FROM files WHERE id=?", (file_id,))
        return rows[0] if rows else None

    def _prune_jobs(self) -> None:
        cutoff = time.time() - JOB_TTL_SECONDS
        for jid in [j for j, job in self.jobs.items() if job.created < cutoff and job.status in {"ready", "failed"}]:
            del self.jobs[jid]

    # ------------------------------------------------------------------ upload
    def submit(self, upload_path: Path, filename: str, collection_id: str, replace_id: str | None = None) -> UploadJob:
        """Validate quickly, then parse and index in the background. Raises UploadRejected with a learner-readable reason."""
        self._prune_jobs()
        name = Path(filename).name.strip() or "upload"
        ext = Path(name).suffix.lower()
        if ext == ".doc":
            raise UploadRejected(
                f'"{name}" is an older Word format (.doc), which this app does not read. In Word, choose File > Save As and pick Word Document (.docx) or PDF, then upload that copy.'
            )
        if ext not in ACCEPTED_SUFFIXES:
            raise UploadRejected(
                f'"{name}" is not a supported type. Upload a PDF, Word file (.docx), .txt, or an image (PNG, JPG, TIFF, BMP, WebP).'
            )
        size = upload_path.stat().st_size
        if size == 0:
            raise UploadRejected(f'"{name}" is empty, so there is nothing to index.')
        if size > MAX_BYTES:
            raise UploadRejected(f'"{name}" is larger than {MAX_BYTES // (1024 * 1024)} MB. Split it into smaller files.')
        coll = self.db.read("SELECT id, name FROM collections WHERE id=?", (collection_id,))
        if not coll:
            raise UploadRejected("That collection no longer exists. Pick another one.", 404)

        digest = _hash_file(upload_path)
        active = self.db.read(
            """SELECT * FROM files f WHERE f.removed=0 AND f.collection_id=?
               AND NOT EXISTS (SELECT 1 FROM files g WHERE g.supersedes=f.id)""",
            (collection_id,),
        )
        old = None
        if replace_id:
            old = next((r for r in active if r["id"] == replace_id), None)
            if old is None:
                raise UploadRejected("The file you are replacing is no longer in this collection.", 404)
            if old["sha256"] == digest:
                raise UploadRejected("This is the same file as the current version, so there is nothing to update.")
        else:
            for r in active:
                if r["sha256"] == digest:
                    raise UploadRejected(f'This exact file is already in "{coll[0]["name"]}" as "{r["filename"]}".')
                if r["filename"].lower() == name.lower():
                    raise UploadRejected(
                        f'A file named "{name}" is already in "{coll[0]["name"]}". Use Replace on it to upload a newer version.'
                    )

        job = UploadJob(id=_uid(), filename=name)
        self.jobs[job.id] = job
        self._pool.submit(self._run, job, upload_path, name, ext, collection_id, old, digest, size)
        return job

    def _run(self, job: UploadJob, path: Path, name: str, ext: str, collection_id: str, old, digest: str, size: int) -> None:
        job.status = "processing"
        try:
            def progress(done: int, total: int) -> None:
                job.progress, job.total = done, total

            pages = extract(path, progress=progress)
            if sum(len(p.text.strip()) for p in pages) < MIN_TEXT:
                raise ParseError(
                    "No readable text was found in this file. If it is a scan or a photo, make sure the writing is clear and the "
                    "page is upright, then try again."
                )
            chunks = self._make_chunks(pages)
            if not chunks:
                raise ParseError("No readable text was found in this file after cleaning up the extraction. Try a clearer copy.")
            emb = self.embedder.embed_passages([f"{h}. {t}" if h else t for _, _, h, t in chunks])
            file_row = self._store(path, name, ext, collection_id, old, digest, size, pages, chunks, emb)
            job.file = file_row
            job.report = self._report(pages)
            job.status = "ready"
        except ParseError as e:
            job.status, job.error = "failed", str(e)
        except Exception:  # unexpected: log the detail, show the learner something actionable
            log.exception("Upload of %s failed", name)
            job.status = "failed"
            job.error = "Something went wrong while reading this file. Try again, or save it as a PDF and upload that."
        finally:
            try:
                path.unlink(missing_ok=True)
                path.parent.rmdir()
            except OSError:
                pass

    @staticmethod
    def _make_chunks(pages: list[PageText]) -> list[tuple[int, int, str, str]]:
        out: list[tuple[int, int, str, str]] = []
        n = 0
        for p in pages:
            for heading, text in chunk_plain(p.text):
                if len(text.strip()) < 25:
                    continue
                if p.method == "ocr" and is_junk(text):
                    continue
                out.append((p.page, n, heading, text))
                n += 1
        return out

    @staticmethod
    def _report(pages: list[PageText]) -> dict:
        flagged = [{"page": p.page, "warning": p.warning} for p in pages if p.warning]
        ocr_pages = [p for p in pages if p.method == "ocr"]
        return {
            "pages": len(pages),
            "ocrPages": len(ocr_pages),
            "flaggedPages": flagged,
            "lowConfidence": any({"low-ocr-confidence", "little-text"} & set(p.flags) for p in pages),
        }

    def _store(self, path: Path, name: str, ext: str, collection_id: str, old, digest: str, size: int,
               pages: list[PageText], chunks: list[tuple[int, int, str, str]], emb: np.ndarray | None) -> dict:
        file_id = _uid()
        dest = self.file_dir(file_id)
        dest.mkdir(parents=True)
        try:
            shutil.copy2(path, dest / f"original{ext}")
            ocr_pages = [p for p in pages if p.method == "ocr"]
            flagged = [p for p in pages if p.warning]
            version = (old["version"] + 1) if old else 1
            with self.db.transaction() as c:
                pos = c.execute("SELECT COALESCE(MAX(position), -1) + 1 FROM files").fetchone()[0]
                c.execute(
                    """INSERT INTO files (position, id, collection_id, filename, version, uploaded_at, pages, ocr, ocr_confidence,
                       removed, supersedes, link_broken, sha256, size, ext, flagged_pages, low_confidence)
                       VALUES (?,?,?,?,?,?,?,?,?,0,?,0,?,?,?,?,?)""",
                    (
                        pos, file_id, collection_id, name, version, _now(), len(pages), int(bool(ocr_pages)),
                        float(np.mean([p.confidence for p in ocr_pages])) if ocr_pages else None,
                        old["id"] if old else None, digest, size, ext, len(flagged),
                        int(any({"low-ocr-confidence", "little-text"} & set(p.flags) for p in pages)),
                    ),
                )
                c.executemany(
                    "INSERT INTO personal_pages (file_id, page, text, method, confidence, flags) VALUES (?,?,?,?,?,?)",
                    [(file_id, p.page, p.text, p.method, p.confidence, ",".join(p.flags)) for p in pages],
                )
                c.executemany(
                    "INSERT INTO personal_chunks (id, file_id, page, ordinal, heading, text, embedding) VALUES (?,?,?,?,?,?,?)",
                    [
                        (f"{file_id}#p{pg}-{o}", file_id, pg, o, h, t, emb[i].astype(np.float16).tobytes() if emb is not None else None)
                        for i, (pg, o, h, t) in enumerate(chunks)
                    ],
                )
                if old:  # the old version stops being searched; its pages and original stay for past activity
                    c.execute("DELETE FROM personal_chunks WHERE file_id=?", (old["id"],))
        except Exception:
            shutil.rmtree(dest, ignore_errors=True)
            raise
        self._tok.clear()
        return next(f for f in self.db.get_state()["files"] if f["id"] == file_id)

    def job(self, job_id: str) -> UploadJob | None:
        return self.jobs.get(job_id)

    # ------------------------------------------------------------------ remove / reconnect
    def remove(self, file_id: str) -> bool:
        row = self._file(file_id)
        if not row or row["removed"]:
            return False
        chain = [file_id]
        cur = row
        while cur and cur["supersedes"]:  # older versions go with it
            chain.append(cur["supersedes"])
            cur = self._file(cur["supersedes"])
        with self.db.transaction() as c:
            for fid in chain:
                c.execute("DELETE FROM personal_chunks WHERE file_id=?", (fid,))
                c.execute("DELETE FROM personal_pages WHERE file_id=?", (fid,))
                c.execute("UPDATE files SET removed=1, link_broken=0 WHERE id=?", (fid,))
        for fid in chain:
            shutil.rmtree(self.file_dir(fid), ignore_errors=True)
        self._tok.clear()
        return True

    def reconnect(self, file_id: str, upload_path: Path) -> None:
        row = self._file(file_id)
        if not row or row["removed"]:
            raise UploadRejected("That file is not in your collections.", 404)
        digest = _hash_file(upload_path)
        if digest != row["sha256"]:
            raise UploadRejected("That isn't the same file. To upload a newer version, use Replace instead.")
        dest = self.file_dir(file_id)
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(upload_path, dest / f"original{row['ext']}")
        self.verify_links()

    # ------------------------------------------------------------------ read
    def get_page(self, file_id: str, page: int) -> dict | None:
        f = self._file(file_id)
        if not f or f["removed"]:
            return None
        rows = self.db.read("SELECT * FROM personal_pages WHERE file_id=? AND page=?", (file_id, page))
        if not rows:
            return None
        r = rows[0]
        flags = _flags(r["flags"])
        coll = self.db.read("SELECT name FROM collections WHERE id=?", (f["collection_id"],))
        return {
            "scope": "personal",
            "fileId": file_id,
            "filename": f["filename"],
            "collection": coll[0]["name"] if coll else "",
            "version": f["version"],
            "uploadedAt": f["uploaded_at"],
            "page": page,
            "pages": f["pages"],
            "text": r["text"],
            "method": r["method"],
            "confidence": r["confidence"],
            "lowConfidence": bool({"low-ocr-confidence", "little-text"} & set(flags)) or r["confidence"] < 0.8,
            "warning": _page_warning(flags),
            "hasImage": f["ext"] == ".pdf" or f["ext"] in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"},
            "available": self.original_path(file_id) is not None,
        }

    def page_image(self, file_id: str, page: int) -> tuple[bytes, str] | None:
        path = self.original_path(file_id)
        f = self._file(file_id)
        if path is None or f is None:
            return None
        if f["ext"] == ".pdf":
            import pymupdf

            doc = pymupdf.open(path)
            if not 1 <= page <= len(doc):
                return None
            return doc[page - 1].get_pixmap(dpi=110).tobytes("png"), "image/png"
        if f["ext"] in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"} and page == 1:
            return path.read_bytes(), MEDIA_TYPES[f["ext"]]
        return None

    # ------------------------------------------------------------------ search
    def _tokens(self, chunk_id: str, heading: str, text: str) -> list[str]:
        t = self._tok.get(chunk_id)
        if t is None:
            t = self._tok[chunk_id] = tokenize(f"{heading}. {text}")
        return t

    def search(self, query: str, k: int, collection_ids: set[str]) -> list[dict]:
        """Hybrid search over active personal files. General is always included."""
        self.verify_links()
        ids = set(collection_ids) | {GENERAL_ID}
        rows = self._candidates(ids)
        if not rows:
            return []
        if self._backfill(rows):  # chunks stored before the model was available now have embeddings
            rows = self._candidates(ids)
        corpus = [self._tokens(r["id"], r["heading"], r["text"]) for r in rows]
        bm = np.asarray(BM25Plus(corpus).get_scores(tokenize(query)))

        qv = self.embedder.embed_query(query)
        dense = np.zeros(len(rows))
        if qv is not None:
            for i, r in enumerate(rows):
                if r["embedding"] is not None:
                    dense[i] = float(np.frombuffer(r["embedding"], dtype=np.float16).astype(np.float32) @ qv)
        fused = np.zeros(len(rows))
        for scores in ((dense, bm) if qv is not None else (bm,)):
            for rank, pos in enumerate(np.argsort(-scores)):
                fused[pos] += 1.0 / (RRF_K + rank + 1)
        relevant = (bm > 0) | (dense > 0.35)
        final = fused * relevant

        out: list[dict] = []
        for pos in np.argsort(-final)[:k]:
            if final[pos] <= 0:
                break
            r = rows[int(pos)]
            page = self.get_page(r["file_id"], r["page"])
            out.append(
                {
                    "id": r["id"],
                    "scope": "personal",
                    "fileId": r["file_id"],
                    "collectionId": r["collection_id"],
                    "collection": r["collection"],
                    "filename": r["filename"],
                    "title": r["filename"],
                    "page": r["page"],
                    "heading": r["heading"],
                    "text": r["text"],
                    "score": round(float(final[pos]), 5),
                    "version": r["version"],
                    "uploadedAt": r["uploaded_at"],
                    "ocr": bool(r["ocr"]) and bool(page and page["method"] == "ocr"),
                    "lowConfidence": bool(page and page["lowConfidence"]),
                    "warning": page["warning"] if page else None,
                    "highlight": best_highlight(page["text"], query, markdown=False) if page else None,
                }
            )
        return out

    def _candidates(self, collection_ids: set[str]):
        marks = ",".join("?" for _ in collection_ids)
        return self.db.read(
            f"""SELECT c.id, c.file_id, c.page, c.heading, c.text, c.embedding, f.collection_id, f.filename, f.version,
                       f.uploaded_at, f.ocr, k.name AS collection
                FROM personal_chunks c JOIN files f ON f.id = c.file_id JOIN collections k ON k.id = f.collection_id
                WHERE f.removed=0 AND f.link_broken=0 AND f.collection_id IN ({marks})
                  AND NOT EXISTS (SELECT 1 FROM files g WHERE g.supersedes = f.id)
                ORDER BY c.file_id, c.ordinal""",
            tuple(collection_ids),
        )

    def _backfill(self, rows) -> bool:
        """Embed chunks that were stored before the embedding model was available. True if anything was updated."""
        missing = [r for r in rows if r["embedding"] is None][:EMBED_BACKFILL_PER_SEARCH]
        if not missing or not self.embedder.available:
            return False
        emb = self.embedder.embed_passages([f"{r['heading']}. {r['text']}" if r["heading"] else r["text"] for r in missing])
        if emb is None:
            return False
        with self.db.transaction() as c:
            for r, v in zip(missing, emb):
                c.execute("UPDATE personal_chunks SET embedding=? WHERE id=?", (v.astype(np.float16).tobytes(), r["id"]))
        return True

    def wipe(self) -> None:
        shutil.rmtree(self.root, ignore_errors=True)
        self.root.mkdir(parents=True, exist_ok=True)
        self.incoming_dir.mkdir(parents=True, exist_ok=True)
        self._tok.clear()

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)


def _hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()
