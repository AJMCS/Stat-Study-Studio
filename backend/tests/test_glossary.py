"""The glossary is read from the material itself: every numbered definition in the lecture notes, and the same
pattern in the learner's uploads. New material brings its terms without anyone editing the app."""

import tempfile
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from studio.app import create_app
from studio.glossary import terms_in_plain_text, terms_in_transcript

PORT = 8767
ORIGIN = {"Origin": f"http://127.0.0.1:{PORT}"}


@pytest.fixture(scope="module")
def client():
    app = create_app(port=PORT, data_dir=Path(tempfile.mkdtemp()), static_dir=Path("/nonexistent"))
    with TestClient(app, base_url=f"http://127.0.0.1:{PORT}") as c:
        yield c


def test_named_and_unnamed_definitions_are_read_from_a_transcript():
    raw = (
        "---\nsource: lecture-notes/lecture-42-things.pdf\nmethod: manual transcription\nkind: lecture\n---\n\n"
        "<!-- page 1 -->\n## 1.1 Definition\n\n> **Definition 1.1** (Pivotal Quantity). A function of the data and the parameter.\n\n"
        "**Definition 1.2.** An estimator $\\delta(\\mathbf{X})$ is said to be **unbiased** if $E[\\delta] = \\theta$.\n\n"
        "<!-- page 2 -->\n**Definition 2.1.** The random interval $(L, U)$ is called a $1 - \\alpha$ confidence interval.\n\n"
        "**Definition 2.2.** Let $Z$ be standard normal. The ratio\n$$T = Z / \\sqrt{Y/m}$$\nfollows a t-distribution with $m$ degrees of freedom.\n"
    )
    got = terms_in_transcript(raw)
    assert [(t["term"], t["page"]) for t in got] == [("Pivotal Quantity", 1), ("Unbiased", 1), ("Confidence interval", 2), ("t-distribution", 2)]
    assert got[0]["lecture"] == 42 and got[0]["verified"] and got[0]["id"] == "def-lecture-42-things-1.1"
    assert got[3]["definition"].startswith("Let $Z$ be standard normal.") and "$$T = Z" in got[3]["definition"]


def test_plain_text_definitions_in_a_learners_notes():
    text = "My notes\nDefinition 3 (Standard error): the standard deviation of a sampling distribution. Definition. An estimator is said to be consistent if it converges to the parameter."
    assert [(t["term"], t["num"]) for t in terms_in_plain_text(text)] == [("Standard error", "3"), ("Consistent", "")]
    assert terms_in_plain_text("Definition: x") == []  # nothing to define


def test_the_glossary_holds_every_lecture_definition_in_lecture_order(client):
    g = client.get("/api/glossary").json()
    terms = {(t["term"], t["lecture"], t["page"]) for t in g["shared"]}
    assert {("Likelihood Function", 2, 5), ("Conjugate Prior", 3, 4), ("Pivotal quantity", 11, 7), ("t-distribution", 10, 2), ("Mean squared error", 12, 4)} <= terms
    lectures = [t["lecture"] for t in g["shared"]]
    assert lectures == sorted(lectures) and all(t["verified"] for t in g["shared"])
    pivot = next(t for t in g["shared"] if t["term"] == "Pivotal quantity")
    assert pivot["source"] == "lecture-notes/lecture-11-interval-estimation.pdf" and pivot["title"] == "Interval Estimation"
    assert "distribution does not depend on" in pivot["definition"]
    # the cited page really holds the definition
    page = client.get("/api/page", params={"source": pivot["source"], "page": pivot["page"]}).json()
    assert "pivotal quantity" in page["text"]
    assert g["personal"] == []


def test_a_learners_upload_adds_its_definitions_to_the_glossary(client):
    notes = b"Week 6 notes\n\nDefinition 1 (Standard error): the standard deviation of a sampling distribution.\n\nDefinition 2. A pivot is said to be a pivotal quantity if its distribution is free of the parameter.\n"
    r = client.post("/api/uploads", files={"file": ("week6.txt", notes)}, data={"collectionId": "general"}, headers=ORIGIN)
    assert r.status_code == 202, r.text
    deadline = time.time() + 60
    while time.time() < deadline:
        job = client.get(f"/api/uploads/{r.json()['uploadId']}").json()
        if job["status"] in {"ready", "failed"}:
            break
        time.sleep(0.1)
    assert job["status"] == "ready", job
    mine = client.get("/api/glossary").json()["personal"]
    assert [(t["term"], t["filename"], t["page"]) for t in mine] == [("Standard error", "week6.txt", 1), ("Pivotal quantity", "week6.txt", 1)]
    file_id = job["file"]["id"]
    assert mine[0]["fileId"] == file_id and mine[0]["collection"]
    assert client.delete(f"/api/files/{file_id}", headers=ORIGIN).status_code < 300
    assert client.get("/api/glossary").json()["personal"] == []
