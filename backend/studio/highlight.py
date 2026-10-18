"""Choose the passage to highlight in a cited page.

The preview renders the page's transcript, so a highlight has to be text that appears verbatim in one piece
of that rendered text. We therefore only consider "plain runs": stretches of the Markdown with no math,
emphasis, table or list markup inside them. If no run matches the question well enough, there is no highlight
and the page is shown as is, which is better than highlighting something that might be the wrong passage.
"""

from __future__ import annotations

import re

_MATH = re.compile(r"\$\$.*?\$\$|\$[^$\n]+\$", re.DOTALL)
_MARKUP_BREAK = re.compile(r"[\x00*`|>#\n]|^\s*(?:[-+]|\d+\.)\s", re.MULTILINE)
_SENTENCE_BREAK = re.compile(r"(?<=[.!?:;])\s+")
_WORD = re.compile(r"[a-z][a-z0-9]{2,}")

STOP = frozenset(
    "the and for are but not you all any can had her was one our out has have how its let may who why what when "
    "where which that this these those with from into over than then them they their there about also does did "
    "doing done find show give make made use used using like each some such only same other both between".split()
)

MIN_LEN, MAX_LEN = 25, 320


def _stem(w: str) -> str:
    for suffix in ("ing", "es", "s", "ed"):
        if w.endswith(suffix) and len(w) - len(suffix) >= 4:
            return w[: -len(suffix)]
    return w


def content_terms(text: str) -> set[str]:
    return {_stem(w) for w in _WORD.findall(text.lower()) if w not in STOP}


def plain_runs(markdown: str) -> list[str]:
    no_math = _MATH.sub("\x00", markdown)
    return [r.strip() for r in _MARKUP_BREAK.split(no_math) if r.strip()]


def candidates(markdown: str) -> list[str]:
    out: list[str] = []
    for run in plain_runs(markdown):
        sentences = [s.strip() for s in _SENTENCE_BREAK.split(run) if s.strip()]
        for i, s in enumerate(sentences):
            out.append(s)
            if i + 1 < len(sentences):
                out.append(f"{s} {sentences[i + 1]}")
    return [c for c in out if MIN_LEN <= len(c) <= MAX_LEN]


def plain_candidates(text: str) -> list[str]:
    """Candidate passages for plain text (personal uploads), which has no markup to avoid: one line at a time."""
    out: list[str] = []
    for line in text.split("\n"):
        sentences = [s.strip() for s in _SENTENCE_BREAK.split(line) if s.strip()]
        for i, sent in enumerate(sentences):
            out.append(sent)
            if i + 1 < len(sentences):
                out.append(f"{sent} {sentences[i + 1]}")
    return [c for c in out if MIN_LEN <= len(c) <= MAX_LEN]


def best_highlight(page_text: str, query: str, markdown: bool = True) -> str | None:
    """The best matching passage, as a verbatim substring of `page_text`, or None if nothing matches well.

    `markdown=False` is for plain text, which is shown as is, so any line can hold a highlight."""
    terms = content_terms(query)
    if not terms:
        return None
    need = min(2, len(terms))
    best, best_score = None, 0.0
    for cand in (candidates(page_text) if markdown else plain_candidates(page_text)):
        if cand not in page_text:  # sentence pairs are joined with one space; keep only true substrings
            continue
        hits = len(terms & content_terms(cand))
        if hits < need or hits / len(terms) < 0.4:
            continue
        score = hits - 0.0015 * len(cand)
        if score > best_score:
            best, best_score = cand, score
    return best
