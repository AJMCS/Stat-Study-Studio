from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from studio.app import create_app
from studio.highlight import best_highlight, candidates, content_terms
from studio.pages import PageStore
from studio.config import LIBRARY
from studio.retrieval import SharedIndex

PORT = 8765


@pytest.fixture(scope="module")
def client():
    app = create_app(port=PORT, data_dir=Path(__import__("tempfile").mkdtemp()), static_dir=Path("/nonexistent"))
    with TestClient(app, base_url=f"http://127.0.0.1:{PORT}") as c:
        yield c


# ---------------------------------------------------------------- highlight
PAGE = """## 1.4 Conjugate Priors

> **Definition 1.2** (Conjugate Prior). For a given likelihood, if the prior and posterior distribution belong to the same family, this is said to be a **conjugate** prior distribution. In this case, posterior updating can be done simply by updating the parameters that correspond to the family.

The posterior mean is $\\mu_1 = \\frac{a}{b}$ and we then compare it with the prior.
"""


def test_highlight_is_a_verbatim_substring_of_the_page():
    hl = best_highlight(PAGE, "what does it mean for the prior and posterior to belong to the same family")
    assert hl and hl in PAGE
    assert "same family" in hl


def test_highlight_never_spans_math_or_markup():
    for q in ["posterior mean prior comparison", "conjugate prior definition", "updating the parameters"]:
        hl = best_highlight(PAGE, q)
        if hl:
            assert hl in PAGE and "$" not in hl and "*" not in hl and "\n" not in hl


def test_no_highlight_when_nothing_matches_well():
    assert best_highlight(PAGE, "Cauchy distribution heavy tails") is None
    assert best_highlight(PAGE, "the") is None  # only stop words


def test_content_terms_stem_and_drop_stop_words():
    assert content_terms("updating the parameters") == {"updat", "parameter"} or "parameter" in content_terms("parameters")
    assert "the" not in content_terms("the prior")


def test_candidates_are_in_length_bounds():
    assert all(25 <= len(c) <= 320 for c in candidates(PAGE))


# ---------------------------------------------------------------- page store
def test_page_store_has_titles_pages_and_quality():
    store = PageStore(LIBRARY)
    page = store.get("lecture-notes/lecture-03-the-posterior-distribution.pdf", 4)
    assert page and page.pages == 7 and page.verified and "Conjugate" in page.text
    assert store.title("lecture-notes/lecture-03-the-posterior-distribution.pdf") == "Lecture 3: The Posterior Distribution"
    auto = store.get("prerequisites-stat131/notes-09-normal-distribution.pdf", 3)
    assert auto and not auto.verified and auto.warning and "Math on this page" in auto.warning
    assert auto.title == "STAT 131 notes 9: Normal distribution"
    assert store.title("readings/reading-ch04-loss-functions-and-bayes-estimators.pdf").startswith("Reading, chapter 4: Loss functions")
    assert store.get("lecture-notes/nope.pdf", 1) is None


# ---------------------------------------------------------------- API
def test_search_returns_cited_passages_with_a_verbatim_highlight(client):
    r = client.get("/api/search", params={"q": "what is a conjugate prior"}).json()
    assert r["query"] == "what is a conjugate prior" and r["mode"] in {"semantic", "keyword"}
    top = r["results"][0]
    assert top["scope"] == "shared" and top["source"].endswith("lecture-03-the-posterior-distribution.pdf") and top["page"] == 4
    assert top["verified"] is True and top["title"].startswith("Lecture 3")
    page = client.get("/api/page", params={"source": top["source"], "page": top["page"]}).json()
    assert top["highlight"] and top["highlight"] in page["text"]


def test_search_never_returns_answer_keys(client):
    for q in ["posterior mean Beta(7, 10)", "MLE for the standard deviation of fish length", "standard error sigma over root n"]:
        for hit in client.get("/api/search", params={"q": q, "k": 10}).json()["results"]:
            assert not hit["source"].startswith("quizzes/")


def test_search_with_no_relevant_sources_says_so_with_an_empty_list(client):
    r = client.get("/api/search", params={"q": "zzzzqqqq xxyyzz"}).json()
    assert r["results"] == []


def test_search_validates_input(client):
    assert client.get("/api/search", params={"q": ""}).status_code == 422
    assert client.get("/api/search", params={"q": "x" * 501}).status_code == 422
    assert client.get("/api/search", params={"q": "prior", "k": 99}).status_code == 422
    assert client.get("/api/search").status_code == 422


def test_low_confidence_pages_carry_a_warning(client):
    hits = client.get("/api/search", params={"q": "normal distribution standard deviations of the mean probability", "k": 10}).json()["results"]
    flagged = [h for h in hits if h["lowConfidence"]]
    assert all(h["warning"] for h in flagged)


def test_page_endpoint(client):
    ok = client.get("/api/page", params={"source": "lecture-notes/lecture-05-maximum-likelihood-estimation.pdf", "page": 2}).json()
    assert ok["pages"] == 5 and "Procedure" in ok["text"]
    assert client.get("/api/page", params={"source": "lecture-notes/lecture-05-maximum-likelihood-estimation.pdf", "page": 99}).status_code == 404
    # only documents in the library can be read; paths cannot escape it
    for bad in ["../backend/studio/app.py", "..\\..\\secrets.txt", "/etc/passwd", "backend/studio/app.py"]:
        assert client.get("/api/page", params={"source": bad, "page": 1}).status_code == 404


# ---------------------------------------------------------------- keyword fallback
def test_search_still_works_when_the_embedding_model_is_unavailable(monkeypatch):
    idx = SharedIndex()
    monkeypatch.setattr(idx, "_ensure_model", lambda: None)
    hits = idx.search("conjugate prior definition", k=3)
    assert idx.mode == "keyword"
    assert any(h.source.endswith("lecture-03-the-posterior-distribution.pdf") and h.page == 4 for h in hits)
