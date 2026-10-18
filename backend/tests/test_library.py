import json
from pathlib import Path

import pytest

from studio.chunking import chunk_page, load_all, parse_frontmatter, split_pages
from studio.config import INDEX_DIR, LIBRARY
from studio.extract import PageText, extract_text_file, normalize, suspect_ratio
from studio.ingest import library_pdfs, sha256
from studio.retrieval import SharedIndex
from studio.textnorm import latex_to_text, tokenize


def test_frontmatter_and_pages():
    raw = "---\nsource: a.pdf\nkind: lecture\n---\n\n<!-- page 1 -->\nHello\n<!-- page 2 -->\nWorld\n"
    meta, body = parse_frontmatter(raw)
    assert meta == {"source": "a.pdf", "kind": "lecture"}
    assert split_pages(body) == [(1, "Hello"), (2, "World")]


def test_chunks_never_split_display_math():
    text = "# T\n\n" + ("Sentence about things. " * 40) + "\n\n$$\na = b\n\nc = d\n$$\n\n" + ("More words here. " * 40)
    for _, piece in chunk_page(text):
        assert piece.count("$$") % 2 == 0


def test_latex_to_text_spells_out_symbols():
    assert {"hat", "theta"} <= set(tokenize(r"$\hat{\theta}$"))
    assert "mu" in tokenize(r"$\mu_0$ and \sigma^2")


def test_normalize_folds_math_italics():
    assert normalize("\U0001d44e + \U0001d703") == "a + θ"


def test_suspect_ratio_flags_mismapped_math_fonts():
    assert suspect_ratio("the prior ⇡(✓) expresses") > 0.004
    assert suspect_ratio("the prior pi(theta) expresses") == 0


def test_text_file_extraction(tmp_path: Path):
    f = tmp_path / "n.txt"
    f.write_text("First paragraph.\n\nSecond paragraph.", encoding="utf-8")
    pages = extract_text_file(f)
    assert pages and isinstance(pages[0], PageText) and "Second" in pages[0].text


def test_every_library_pdf_has_a_transcript():
    missing = [p.relative_to(LIBRARY).as_posix() for p in library_pdfs() if not (LIBRARY / "transcripts" / p.relative_to(LIBRARY).with_suffix(".md")).exists()]
    assert not missing, f"run `python -m studio.ingest transcribe-missing`: {missing}"


def test_every_transcript_points_at_a_real_pdf():
    for t in (LIBRARY / "transcripts").rglob("*.md"):
        meta, _ = parse_frontmatter(t.read_text(encoding="utf-8"))
        assert (LIBRARY / meta["source"]).exists(), f"{t.name} -> {meta['source']}"


def test_index_is_current():
    meta = json.loads((INDEX_DIR / "index.json").read_text(encoding="utf-8"))
    stale = [t for t, h in meta["transcripts"].items() if sha256(LIBRARY / t) != h]
    assert not stale, f"transcripts changed since the index was built; run `python -m studio.ingest build-index`: {stale}"
    current = {c.transcript for c in load_all(LIBRARY)}
    assert current == set(meta["transcripts"]), "set of searchable transcripts changed; rebuild the index"


@pytest.fixture(scope="module")
def index() -> SharedIndex:
    return SharedIndex()


@pytest.mark.parametrize(
    "query,source_stem,pages",
    [
        ("definition of conjugate prior", "lecture-03-the-posterior-distribution", {4}),
        ("absolute error loss posterior median", "lecture-04-loss-functions-and-bayes-estimators", {5}),
        ("invariance property of the MLE", "lecture-06-maximum-likelihood-properties", {2}),
        ("what is a sampling distribution", "lecture-07-sampling-distributions", {2}),
        ("is the likelihood a probability distribution", "lecture-02-frequentist-vs-bayesian-inference", {6}),
    ],
)
def test_lecture_questions_find_the_lecture_page(index, query, source_stem, pages):
    hits = index.search(query, k=3)
    assert any(Path(h.source).stem == source_stem and h.page in pages for h in hits), [(h.source, h.page) for h in hits]


def test_answer_keys_are_never_returned(index):
    for q in ["posterior mean beta 7 17", "standard error sigma over root n", "MLE for the standard deviation of fish length"]:
        assert all(h.kind != "answer-key" for h in index.search(q, k=10))
    assert not any("quizzes/" in h.source for h in index.search("Beta(2 + 5, 3 + 12 - 5)", k=20))


def test_gibberish_returns_nothing(index):
    assert index.search("zzzzqqqq xxyyzz", k=5) == []


def test_hits_report_verification_and_confidence(index):
    hit = index.search("conjugate prior", k=1)[0]
    d = hit.as_dict()
    assert d["scope"] == "shared" and d["verified"] is True
    auto = [h for h in index.search("probability density function normal distribution", k=10) if h.kind in {"prerequisite", "reading"}]
    assert all(not h.as_dict()["verified"] for h in auto)
