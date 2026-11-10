"""Course material named in an ask: what a review guide covers, and what comes along with it for the model."""

import json

from studio.config import LIBRARY
from studio.named import named_documents, related_documents, topics_covered
from studio.pages import PageStore
from test_ai import client, connect, fake, question  # noqa: F401  (client and fake are fixtures)

EXAM_2 = "exams/exam-02-review.pdf"
EXAM_1 = "exams/exam-01-review.pdf"


def test_a_review_guide_covers_the_topics_it_names_and_not_the_others():
    pages = PageStore(LIBRARY)
    covered = [t["lecture"] for t in topics_covered(pages.document_text(EXAM_2, 20000))]
    assert {7, 8, 10, 11} <= set(covered), covered  # sampling distributions, chi-squared, t, interval estimation
    assert not {2, 3} & set(covered), covered  # Bayesian inference and the posterior are midterm 1
    first = [t["lecture"] for t in topics_covered(pages.document_text(EXAM_1, 20000))]
    assert {2, 5} <= set(first), first  # frequentist vs. Bayesian, maximum likelihood
    assert not {8, 10, 11} & set(first), first


def test_a_review_guide_brings_the_problem_sets_first_then_the_notes_of_its_topics():
    pages = PageStore(LIBRARY)
    rel = related_documents(pages.document_text(EXAM_2, 20000), pages, {EXAM_2})
    assert "homework/homework-03.pdf" in rel and "discussion-sections/disc-05.pdf" in rel and "discussion-sections/disc-06.pdf" in rel
    notes = [r for r in rel if r.startswith("lecture-notes/")]
    assert "lecture-notes/lecture-08-the-chi-squared-distribution.pdf" in notes and "lecture-notes/lecture-11-interval-estimation.pdf" in notes
    assert all(r.startswith(("homework/", "discussion-sections/")) for r in rel[: len(rel) - len(notes)])  # sets before notes
    assert not any("annotated" in r for r in rel) and "lecture-notes/lecture-03-the-posterior-distribution.pdf" not in rel
    assert related_documents("nothing about any topic here", pages) == []


def test_a_mock_exam_from_a_review_guide_is_scoped_to_it_and_asked_the_professors_way(client, fake):
    connect(client)
    fake.replies = [json.dumps({"questions": [question(1), question(2)]})]
    sections = ["Probability Review & Introduction to Statistical Inference", "Frequentist vs. Bayesian Inference", "Maximum Likelihood Estimation"]
    body = {"topic": "STAT 132, every topic of the course", "focus": "a mock exam based on exam 2 review", "count": 2, "examples": [{"concept": "MLE", "prompt": "Find the MLE for an exponential sample."}], "sections": sections}
    r = client.post("/api/ai/exam", json=body)
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["basedOn"] == ["Exam 2 review"] and "Homework 3" in out["alsoRead"] and any(t.startswith("Lecture 8") or "χ²" in t for t in out["alsoRead"]), out["alsoRead"]
    text = fake.requests[0]["contents"][0]["parts"][0]["text"]
    assert "Source 1: Exam 2 review" in text and "related course material" in text and "Homework 3" in text
    assert "Topic: what the source material covers" in text
    assert "Spread the questions" not in text and "for tagging only" in text  # the app's sections no longer force midterm 1 questions
    assert "Find the MLE for an exponential sample." not in text and "(none; the source material is the guide)" in text
    assert "The first source sets the scope" in text


def test_a_named_document_that_is_not_a_review_brings_nothing_else(client, fake):
    connect(client)
    fake.replies = [json.dumps({"questions": [question(1), question(2)]})]
    r = client.post("/api/ai/exam", json={"topic": "x", "focus": "based on homework 1", "count": 2, "examples": []})
    assert r.status_code == 200 and r.json()["basedOn"] == ["Homework 1"] and r.json()["alsoRead"] == []
    assert named_documents("based on homework 1", PageStore(LIBRARY)) == ["homework/homework-01.pdf"]
