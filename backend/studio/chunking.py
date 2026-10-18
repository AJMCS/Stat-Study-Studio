"""Parse page-aligned Markdown transcripts and split them into retrievable chunks."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from .config import SEARCHABLE_KINDS

PAGE_MARK = re.compile(r"^<!--\s*page\s+(\d+)\s*-->\s*$", re.MULTILINE)
MAX_CHARS = 900
MIN_CHARS = 180


@dataclass
class Chunk:
    id: str
    source: str  # path of the original PDF, relative to course-library/
    transcript: str  # path of the transcript, relative to course-library/
    page: int
    heading: str
    text: str
    kind: str
    method: str
    ordinal: int = 0
    extra: dict = field(default_factory=dict)


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---", 3)
    if end == -1:
        return {}, raw
    meta = {}
    for line in raw[3:end].strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, raw[end + 4 :].lstrip("\n")


EXTRACT_NOTE = re.compile(r"^<!--\s*extracted via .*?confidence=([0-9.]+)(?:\s+flags=(\S+))?\s*-->\s*$", re.MULTILINE)
COMMENT_LINE = re.compile(r"^<!--.*?-->\s*$", re.MULTILINE)


def split_pages(body: str) -> list[tuple[int, str]]:
    marks = list(PAGE_MARK.finditer(body))
    pages = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(body)
        pages.append((int(m.group(1)), body[m.end() : end].strip()))
    return pages


def page_quality(raw_page: str) -> dict:
    """Confidence and flags recorded by the automatic extractor, if this page came from it."""
    m = EXTRACT_NOTE.search(raw_page)
    if not m:
        return {}
    return {"confidence": float(m.group(1)), "flags": (m.group(2) or "").split(",") if m.group(2) else []}


def _blocks(text: str) -> list[str]:
    """Split on blank lines, but keep $$ display math and tables together with their neighbours."""
    blocks, cur, in_math = [], [], False
    for line in text.splitlines():
        if line.strip().startswith("$$") and line.strip().count("$$") == 1:
            in_math = not in_math
        if not line.strip() and not in_math:
            if cur:
                blocks.append("\n".join(cur))
                cur = []
        else:
            cur.append(line)
    if cur:
        blocks.append("\n".join(cur))
    return blocks


def chunk_page(text: str) -> list[tuple[str, str]]:
    """Return (heading, text) pairs of roughly MAX_CHARS, never splitting inside a block."""
    heading = ""
    out: list[tuple[str, str]] = []
    buf: list[str] = []
    buf_heading = ""

    def flush():
        nonlocal buf
        if buf:
            out.append((buf_heading, "\n\n".join(buf)))
            buf = []

    for block in _blocks(text):
        first = block.lstrip()
        if first.startswith("#"):
            heading = re.sub(r"^#+\s*", "", first.splitlines()[0]).strip()
            if buf and sum(len(b) for b in buf) >= MIN_CHARS:
                flush()
            if not buf:
                buf_heading = heading
        if not buf:
            buf_heading = heading
        size = sum(len(b) for b in buf)
        if buf and size + len(block) > MAX_CHARS and size >= MIN_CHARS:
            flush()
            buf_heading = heading
        buf.append(block)
    flush()
    # Merge a tiny trailing chunk into the previous one.
    if len(out) > 1 and len(out[-1][1]) < MIN_CHARS // 2:
        h, t = out.pop()
        ph, pt = out.pop()
        out.append((ph, pt + "\n\n" + t))
    return out


_WORD = re.compile(r"[A-Za-z]{3,}")


def is_junk(text: str) -> bool:
    """Automatic extraction of scribbles or figures yields strings of stray letters, not prose."""
    tokens = text.split()
    if not tokens:
        return True
    words = _WORD.findall(text)
    return len(words) < 6 or len(words) / len(tokens) < 0.3


def load_transcript(path: Path, library: Path) -> list[Chunk]:
    raw = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(raw)
    kind = meta.get("kind", "lecture")
    rel = path.relative_to(library).as_posix()
    source = meta.get("source", rel)
    method = meta.get("method", "unknown")
    chunks: list[Chunk] = []
    n = 0
    for page, raw_page in split_pages(body):
        quality = page_quality(raw_page)
        text = COMMENT_LINE.sub("", raw_page).strip()
        if not text.strip():
            continue
        for heading, piece in chunk_page(text):
            if len(piece.strip()) < 40:
                continue
            if not method.startswith("manual") and is_junk(piece):
                continue
            chunks.append(
                Chunk(
                    id=f"{Path(source).stem}#p{page}-{n}",
                    source=source,
                    transcript=rel,
                    page=page,
                    heading=heading,
                    text=piece.strip(),
                    kind=kind,
                    method=method.split("(")[0].strip(),
                    ordinal=n,
                    extra=quality,
                )
            )
            n += 1
    return chunks


def load_all(library: Path, searchable_only: bool = True) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in sorted((library / "transcripts").rglob("*.md")):
        for c in load_transcript(path, library):
            if searchable_only and c.kind not in SEARCHABLE_KINDS:
                continue
            chunks.append(c)
    return chunks
