"""Course documents a learner names in an ask, found in the shared library.

"a practice quiz based on exam 2 review", "homework 3", "lecture 5" and the like name documents the library holds;
the exam and quiz writers then get those documents whole (within a size limit) as the material to base the questions
on, rather than the few passages a search would return. Answer-key material (quiz and exam reviews) is reachable this
way on purpose: it is never searched or cited in general, but a learner asking for practice based on it gets it.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache

from .config import LIBRARY
from .pages import PageStore

# what a learner calls it -> (the library folder, the file-name prefix the number follows)
KINDS = {
    "exam": ("exams/", "exam-"),
    "midterm": ("exams/", "exam-"),
    "homework": ("homework/", "homework-"),
    "hw": ("homework/", "homework-"),
    "quiz": ("quizzes/", "quiz-"),
    "lecture": ("lecture-notes/", "lecture-"),
    "lec": ("lecture-notes/", "lecture-"),
    "discussion": ("discussion-sections/", "disc-"),
    "disc": ("discussion-sections/", "disc-"),
    "reading": ("readings/", "reading-ch"),
    "chapter": ("readings/", "reading-ch"),
}
MENTION = re.compile(r"\b(" + "|".join(KINDS) + r")\s*#?\s*(\d{1,2})\b", re.IGNORECASE)
MAX_DOCUMENTS = 3


def named_documents(ask: str, pages: PageStore, max_documents: int = MAX_DOCUMENTS) -> list[str]:
    """The library paths of the documents the ask names, in the order named, without repeats. "exam 2" matches every
    file numbered 2 under exams/ (the paper and its review); "lecture 5" matches the notes, not the recording."""
    found: list[str] = []
    for kind, number in MENTION.findall(ask):
        folder, prefix = KINDS[kind.lower()]
        wanted = re.compile(rf"^{re.escape(folder + prefix)}0*{int(number)}(?!\d)")
        for source in pages.sources():
            if wanted.match(source) and source not in found:
                found.append(source)
    return found[:max_documents]


# ---------------------------------------------------------------------------------------- what a review guide covers
# Title words that turn up in every part of the course; a topic counts as covered only when a telling word of its
# title appears too (a topic whose title is all such words needs three of them).
COMMON = {
    "distribution", "distributions", "estimation", "estimator", "estimators", "inference", "statistical", "functions",
    "properties", "review", "sample", "mean", "variance", "probability", "introduction",
}
STOP = {"the", "of", "and", "a", "an", "to", "vs", "vs.", "&", "its"}
# A title word that is written several ways in the materials; any of them counts.
ALIASES: dict[str, tuple[str, ...]] = {
    "χ²": ("χ2", "χ²", "chi-square", "chi-squared", "chi square", "chi squared", "chisquare"),
    "t": ("t distribution", "t-distribution", "t dist", "student's t", "students t"),
}
# Documents a review guide or exam paper names the topics of: the professor's problem sets first (the style), then the
# notes (the content). Readings are the textbook's voice, so they stay out.
RELATED_KINDS = ("homework", "relatedDiscussion", "lectureNotes")


@lru_cache(maxsize=1)
def course_topics() -> list[dict]:
    """The topic manifest: each topic's title and the library files that go with it."""
    try:
        return json.loads((LIBRARY / "manifest.json").read_text(encoding="utf-8")).get("topics", [])
    except (OSError, ValueError):
        return []


def _title_words(title: str) -> list[str]:
    return [w for w in re.split(r"[\s/,:]+", title.lower()) if w and w.strip(".") not in STOP]


def _mentions(low: str, word: str) -> bool:
    if word in ALIASES:
        return any(a in low for a in ALIASES[word])
    return re.search(rf"(?<![a-z]){re.escape(word.rstrip('s'))}s?(?![a-z])", low) is not None


def topics_covered(text: str) -> list[dict]:
    """The manifest topics a document covers, read from its text: three fifths of a topic's title words appear
    (plurals and the usual spellings of χ² and t allowed), among them a telling one (not a word every part of the
    course uses). Best-covered first, so a budget cuts the least certain."""
    low = text.lower()
    scored: list[tuple[float, int, int, dict]] = []
    for n, t in enumerate(course_topics()):
        words = _title_words(t.get("title", ""))
        if not words:
            continue
        hits = [w for w in words if _mentions(low, w)]
        telling = [w for w in hits if w not in COMMON]
        all_common = all(w in COMMON for w in words)
        if len(hits) / len(words) >= 0.6 and (telling or (all_common and len(hits) >= 3)):
            scored.append((len(hits) / len(words), len(telling), -n, t))
    return [t for _, _, _, t in sorted(scored, key=lambda s: (s[0], s[1], s[2]), reverse=True)]


def related_documents(text: str, pages: PageStore, already: set[str] | None = None) -> list[str]:
    """For a review guide or an exam paper: the library paths of the documents of the topics it covers, in the
    order the professor's way of asking is best learned from: the homework and discussion problem sets, then the
    lecture notes. Annotated (worked) discussions and paths already in hand are left out."""
    seen = set(already or ())
    sets: list[str] = []
    notes: list[str] = []
    for t in topics_covered(text):
        for src in list(t.get("homework") or []) + [d for d in t.get("relatedDiscussion") or [] if "annotated" not in d]:
            if src not in seen and pages.has(src):
                sets.append(src)
                seen.add(src)
        ln = t.get("lectureNotes")
        if ln and ln not in seen and pages.has(ln):
            notes.append(ln)
            seen.add(ln)
    return sets + notes
