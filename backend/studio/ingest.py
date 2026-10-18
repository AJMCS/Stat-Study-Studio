"""Maintainer tools for the shared course library.

    python -m studio.ingest transcribe-missing [--force]   # auto-extract PDFs that have no transcript yet
    python -m studio.ingest build-index                    # chunk + embed all searchable transcripts

Run from the backend/ folder with the project venv. Hand transcripts (method: manual transcription) are never
overwritten by transcribe-missing, even with --force.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import time
from pathlib import Path

import numpy as np

from .chunking import Chunk, load_all, parse_frontmatter
from .config import INDEX_DIR, LIBRARY, TRANSCRIPTS
from .extract import extract, to_transcript
from .textnorm import latex_to_text

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
INDEX_VERSION = 1

KIND_BY_FOLDER = {
    "lecture-notes": "lecture",
    "discussion-sections": "problem-set",
    "homework": "problem-set",
    "quizzes": "answer-key",
    "readings": "reading",
    "prerequisites-stat131": "prerequisite",
}


def kind_for(rel: Path) -> str:
    if rel.parts[0] == "discussion-sections" and rel.stem.endswith("-annotated"):
        return "worked-solutions"
    return KIND_BY_FOLDER.get(rel.parts[0], "lecture")


def library_pdfs() -> list[Path]:
    skip = {"transcripts", "index"}
    return sorted(p for p in LIBRARY.rglob("*.pdf") if p.relative_to(LIBRARY).parts[0] not in skip)


def transcribe_missing(force: bool = False) -> None:
    for pdf in library_pdfs():
        rel = pdf.relative_to(LIBRARY)
        out = TRANSCRIPTS / rel.with_suffix(".md")
        if out.exists():
            meta, _ = parse_frontmatter(out.read_text(encoding="utf-8"))
            if "manual" in meta.get("method", ""):
                continue
            if not force:
                continue
        t0 = time.time()
        pages = extract(pdf)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(to_transcript(pages, rel.as_posix(), kind_for(rel)), encoding="utf-8")
        warned = sum(1 for p in pages if p.warning)
        print(f"{rel.as_posix()}: {len(pages)} pages, {warned} flagged, {time.time() - t0:.1f}s")


def sha256(path: Path) -> str:
    """Hash with line endings normalised so Windows checkouts (CRLF) match the committed (LF) index."""
    data = path.read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()[:16]


def embedding_text(c: Chunk) -> str:
    return latex_to_text(f"{c.heading}. {c.text}")


def build_index() -> None:
    from fastembed import TextEmbedding

    chunks = load_all(LIBRARY)
    if not chunks:
        raise SystemExit("No searchable transcripts found.")
    model = TextEmbedding(model_name=EMBEDDING_MODEL)
    emb = np.array(list(model.embed([embedding_text(c) for c in chunks])), dtype=np.float32)
    emb /= np.linalg.norm(emb, axis=1, keepdims=True)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    with (INDEX_DIR / "chunks.jsonl").open("w", encoding="utf-8", newline="\n") as f:
        for c in chunks:
            f.write(
                json.dumps(
                    {
                        "id": c.id,
                        "source": c.source,
                        "page": c.page,
                        "heading": c.heading,
                        "kind": c.kind,
                        "method": c.method,
                        "text": c.text,
                        **({"quality": c.extra} if c.extra else {}),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
    np.save(INDEX_DIR / "embeddings.npy", emb.astype(np.float16))
    transcripts = sorted({c.transcript for c in chunks})
    meta = {
        "version": INDEX_VERSION,
        "embedding_model": EMBEDDING_MODEL,
        "dimensions": int(emb.shape[1]),
        "chunks": len(chunks),
        "documents": len({c.source for c in chunks}),
        "transcripts": {t: sha256(LIBRARY / t) for t in transcripts},
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    (INDEX_DIR / "index.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"Indexed {len(chunks)} chunks from {meta['documents']} documents into {INDEX_DIR}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("transcribe-missing")
    t.add_argument("--force", action="store_true", help="re-run automatic extraction (never touches hand transcripts)")
    sub.add_parser("build-index")
    args = ap.parse_args()
    if args.cmd == "transcribe-missing":
        transcribe_missing(args.force)
    else:
        build_index()


if __name__ == "__main__":
    main()
