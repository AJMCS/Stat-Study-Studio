"""Course documents a learner names in an ask, found in the shared library.

"a practice quiz based on exam 2 review", "homework 3", "lecture 5" and the like name documents the library holds;
the exam and quiz writers then get those documents whole (within a size limit) as the material to base the questions
on, rather than the few passages a search would return. Answer-key material (quiz and exam reviews) is reachable this
way on purpose: it is never searched or cited in general, but a learner asking for practice based on it gets it.
"""

from __future__ import annotations

import re

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
