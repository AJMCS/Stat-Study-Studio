"""Page-level access to the shared library transcripts, for citation previews."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from .chunking import COMMENT_LINE, page_quality, parse_frontmatter, split_pages
from .extract import PageText

_H1 = re.compile(r"^#\s+(.+)$", re.MULTILINE)


def readable_title(source: str) -> str:
    """A title for documents whose transcript has no heading (automatic extractions)."""
    stem = Path(source).stem
    def sentence(t: str) -> str:
        t = re.sub(r"(?<=-)0+(?=\d)", "", t).replace("-", " ")  # "homework-03" reads "Homework 3"
        return t[:1].upper() + t[1:]
    if m := re.fullmatch(r"notes-(\d+)-(.+)", stem):
        return f"STAT 131 notes {int(m.group(1))}: {sentence(m.group(2))}"
    if m := re.fullmatch(r"reading-ch(\d+)-(.+)", stem):
        return f"Reading, chapter {int(m.group(1))}: {sentence(m.group(2))}"
    if m := re.fullmatch(r"exam-(\d+)-review", stem):
        return f"Exam {int(m.group(1))} review"
    if m := re.fullmatch(r"exam-(\d+)", stem):
        return f"Exam {int(m.group(1))}"
    return sentence(stem)


@dataclass
class Page:
    source: str  # original PDF, relative to course-library/
    title: str
    page: int
    pages: int
    kind: str
    text: str
    verified: bool
    quality: dict

    @property
    def warning(self) -> str | None:
        flags = self.quality.get("flags", [])
        if "text-layer-corrupted" in flags:
            return PageText(self.page, "", "ocr", 0.0, ["text-layer-corrupted"]).warning
        if "low-ocr-confidence" in flags or "little-text" in flags:
            return PageText(self.page, "", "ocr", 0.0, [f for f in flags if f in {"low-ocr-confidence", "little-text"}]).warning
        return None

    def as_dict(self) -> dict:
        return {
            "source": self.source,
            "title": self.title,
            "page": self.page,
            "pages": self.pages,
            "kind": self.kind,
            "text": self.text,
            "verified": self.verified,
            "lowConfidence": bool(self.quality.get("flags")) or self.quality.get("confidence", 1.0) < 0.8,
            "warning": self.warning,
        }


class PageStore:
    def __init__(self, library: Path):
        self._pages: dict[tuple[str, int], Page] = {}
        self._titles: dict[str, str] = {}
        for path in sorted((library / "transcripts").rglob("*.md")):
            meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))
            source = meta.get("source")
            if not source:
                continue
            pages = split_pages(body)
            first = pages[0][1] if pages else ""
            h1 = _H1.search(COMMENT_LINE.sub("", first))
            title = h1.group(1).strip() if h1 else readable_title(source)
            self._titles[source] = title
            for number, raw in pages:
                self._pages[(source, number)] = Page(
                    source=source,
                    title=title,
                    page=number,
                    pages=len(pages),
                    kind=meta.get("kind", "lecture"),
                    text=COMMENT_LINE.sub("", raw).strip(),
                    verified=meta.get("method", "").startswith("manual"),
                    quality=page_quality(raw),
                )

    def get(self, source: str, page: int) -> Page | None:
        return self._pages.get((source, page))

    def title(self, source: str) -> str:
        return self._titles.get(source, Path(source).stem)

    def sources(self) -> list[str]:
        """Every document with a transcript, by its library path, in library order."""
        return sorted(self._titles)

    def document_text(self, source: str, max_chars: int) -> str:
        """A whole document as the model reads it: its pages in order, each marked, cut at `max_chars`."""
        parts: list[str] = []
        used = 0
        for (src, number), page in sorted(self._pages.items(), key=lambda kv: kv[0][1]):
            if src != source or not page.text.strip():
                continue
            piece = f"[page {number}]\n{page.text.strip()}"[: max_chars - used]
            parts.append(piece)
            used += len(piece)
            if used >= max_chars:
                break
        return "\n\n".join(parts)
