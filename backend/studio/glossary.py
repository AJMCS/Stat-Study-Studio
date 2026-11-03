"""Key terms read from the course material itself.

Every numbered definition in the lecture notes' transcripts ("**Definition 2.1** (Likelihood Function). ...") becomes a
glossary entry, cited to its page, and the same pattern is read from the learner's own uploads. Nothing is hard-coded,
so a lecture added to the library (or a file the learner uploads) brings its terms with it: the app's hand-written
vocabulary covers the first topics in depth, and this fills in everything else.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from .chunking import parse_frontmatter, split_pages

# "**Definition 1.2** (Conjugate Prior). text" or "**Definition 1.1.** text", possibly inside a "> " blockquote.
DEF_MD = re.compile(r"^>?\s*\*\*Definition\s+(?P<num>[\d.]+?)\.?\*\*\.?\s*(?:\((?P<name>[^)]+)\)\.?)?\s*(?P<rest>.*)$")
# the same in plain text (a learner's notes, a transcribed page): "Definition 3 (Pivot): ..." / "Definition. ..."
DEF_TXT = re.compile(r"(?:^|(?<=\s))Definition\s*(?P<num>\d+(?:\.\d+)*)?\s*(?:\((?P<name>[^)]+)\))?\s*[.:]\s*", re.IGNORECASE)
ARTICLE = r"(?:a |an |the )?"
MATH = r"(?:\$[^$]*\$\s*)?"
STOP = r"(?=\s+(?:if|when|with|where|for|of)\b|\s*[.,;:(]|$)"
# how the notes name the thing being defined, tried in order
NAMERS = [
    re.compile(r"is said to (?:be|follow|have)\s+" + ARTICLE + MATH + r"\*{0,2}(?P<t>[^*$.,;:()]+?)\*{0,2}" + STOP),
    re.compile(r"is called\s+" + ARTICLE + MATH + r"\*{0,2}(?P<t>[^*$.,;:()]+?)\*{0,2}" + STOP),
    re.compile(r"(?:follows|has|have)\s+" + ARTICLE + MATH + r"\*{0,2}(?P<t>[^*$.,;:()]+?)\*{0,2}" + STOP),
    re.compile(r"\*\*(?P<t>[^*]+)\*\*"),
    re.compile(r"^(?:A|An|The)\s+(?P<t>[^,.$]+?)\s+(?:is|are)\b"),
]
MAX_DEFINITION = 700


def _name_from(text: str) -> str | None:
    for pat in NAMERS:
        m = pat.search(text)
        if m:
            t = " ".join(m.group("t").split()).strip(" -")
            if 2 <= len(t) <= 60:
                return t
    return None


def _tidy(term: str) -> str:
    term = " ".join(term.split())
    # capitalise, except a one-letter symbol that starts the name ("t-distribution", "p-value")
    if term and not re.match(r"^[a-z][ -]", term):
        term = term[0].upper() + term[1:]
    return term


def _trim(text: str, limit: int = MAX_DEFINITION) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text.rfind(". ", 0, limit)
    return (text[: cut + 1] if cut > limit // 2 else text[:limit].rstrip()) + " …"


def _paragraphs(page_text: str) -> list[str]:
    """Blank-line separated blocks, with blockquote markers removed and lines joined."""
    out: list[str] = []
    cur: list[str] = []
    for line in page_text.splitlines():
        s = re.sub(r"^>\s?", "", line).rstrip()
        if not s.strip():
            if cur:
                out.append("\n".join(cur))
                cur = []
        else:
            cur.append(s)
    if cur:
        out.append("\n".join(cur))
    return out


def _lecture_number(source: str) -> int | None:
    m = re.search(r"lecture-(\d+)", source)
    return int(m.group(1)) if m else None


def terms_in_transcript(raw: str) -> list[dict]:
    """Every numbered definition in one page-aligned transcript."""
    meta, body = parse_frontmatter(raw)
    source = meta.get("source", "")
    lecture = _lecture_number(source)
    found: list[dict] = []
    heading = ""
    for page, text in split_pages(body):
        for para in _paragraphs(text):
            first = para.split("\n", 1)[0]
            if first.startswith("#"):
                heading = first.lstrip("#").strip()
                heading = re.sub(r"^[\d.]+\s+", "", heading)
                continue
            m = DEF_MD.match(first)
            if not m:
                continue
            rest = (m.group("rest") + ("\n" + para.split("\n", 1)[1] if "\n" in para else "")).strip()
            flat = " ".join(rest.split())
            name = m.group("name") or _name_from(flat) or heading
            if not name:
                continue
            found.append(
                {
                    "id": f"def-{Path(source).stem}-{m.group('num').rstrip('.')}",
                    "term": _tidy(name),
                    "definition": _trim(rest),
                    "source": source,
                    "page": page,
                    "heading": heading,
                    "lecture": lecture,
                    "verified": meta.get("method", "").startswith("manual"),
                }
            )
    return found


def shared_terms(library: Path) -> list[dict]:
    """The definitions in the library's lecture notes, in lecture order, with the lecture's title from the manifest."""
    titles: dict[int, str] = {}
    try:
        for t in json.loads((library / "manifest.json").read_text(encoding="utf-8")).get("topics", []):
            if isinstance(t.get("lecture"), int):
                titles[t["lecture"]] = t.get("title") or ""
    except (OSError, ValueError):
        pass
    out: list[dict] = []
    folder = library / "transcripts" / "lecture-notes"
    for md in sorted(folder.glob("*.md")) if folder.is_dir() else []:
        try:
            raw = md.read_text(encoding="utf-8")
        except OSError:
            continue
        for term in terms_in_transcript(raw):
            term["title"] = titles.get(term["lecture"] or -1, "")
            out.append(term)
    out.sort(key=lambda t: (t["lecture"] or 0, t["page"], t["id"]))
    return out


def terms_in_plain_text(text: str) -> list[dict]:
    """Definitions written the way the notes write them, in a plain-text page (a learner's upload). A definition
    runs to the next one in the same paragraph, or to the end of the paragraph."""
    found: list[dict] = []
    for para in _paragraphs(text):
        flat = " ".join(para.split())
        marks = list(DEF_TXT.finditer(flat))
        for i, m in enumerate(marks):
            end = marks[i + 1].start() if i + 1 < len(marks) else len(flat)
            rest = flat[m.end() : end].strip()
            name = m.group("name") or _name_from(rest)
            if not name or len(rest) < 12:
                continue
            found.append({"term": _tidy(name), "definition": _trim(rest), "num": m.group("num") or ""})
    return found


def personal_terms(db) -> list[dict]:
    """Definitions in the learner's uploaded files (every collection; the terms are the learner's own)."""
    rows = db.read(
        "SELECT p.file_id, p.page, p.text, f.filename, f.collection_id, c.name AS collection "
        "FROM personal_pages p JOIN files f ON f.id = p.file_id LEFT JOIN collections c ON c.id = f.collection_id "
        "WHERE f.removed = 0 AND p.text LIKE '%Definition%' ORDER BY f.position, p.page"
    )
    out: list[dict] = []
    for r in rows:
        for k, t in enumerate(terms_in_plain_text(r["text"])):
            out.append(
                {
                    "id": f"def-{r['file_id']}-{r['page']}-{k}",
                    "term": t["term"],
                    "definition": t["definition"],
                    "fileId": r["file_id"],
                    "filename": r["filename"],
                    "collectionId": r["collection_id"],
                    "collection": r["collection"] or "",
                    "page": r["page"],
                }
            )
    return out
