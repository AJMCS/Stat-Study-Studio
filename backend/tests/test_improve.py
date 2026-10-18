"""'Improve this upload with AI': page images go to the connected model only when the learner confirms, the better
reading replaces the automatic one in search, and the automatic reading can be restored."""

import json

import pytest
from fakegemini import VALID_KEY, FakeGemini
from fakeollama import FakeOllama
from fastapi.testclient import TestClient
from test_personal import add, finish, personal, scanned_pdf, text_pdf

from studio.app import create_app

PORT = 8765
ORIGIN = {"Origin": f"http://127.0.0.1:{PORT}"}
HANDWRITTEN = "The posterior mean is the Bayes estimate\nunder squared error loss"
IMPROVED = "The posterior is proportional to the likelihood times the prior: $p(\\theta \\mid x) \\propto p(x \\mid \\theta)\\,p(\\theta)$. Nebulous quokka identity."


@pytest.fixture()
def fake(monkeypatch):
    f = FakeGemini()
    monkeypatch.setenv("STUDIO_GEMINI_BASE", f.url)
    yield f
    f.close()


@pytest.fixture()
def client(tmp_path, fake):
    with TestClient(create_app(data_dir=tmp_path / "data", static_dir=tmp_path / "x", port=PORT, auto_check=False), base_url=f"http://127.0.0.1:{PORT}", headers=ORIGIN) as c:
        c.data_dir = tmp_path / "data"
        yield c


def reading(text=IMPROVED, unclear=()):
    return json.dumps({"text": text, "unclear": list(unclear)})


def connect(client):
    assert client.post("/api/ai/connect", json={"apiKey": VALID_KEY, "accept": True}).status_code == 200


def a_scan(client):
    job = add(client, "notes.pdf", scanned_pdf(HANDWRITTEN))
    return job["file"]["id"]


def improve(client, file_id, accept=True, scope="all"):
    return client.post(f"/api/files/{file_id}/improve", json={"accept": accept, "scope": scope})


def test_nothing_is_sent_without_connecting_and_without_confirming_this_time(client, fake):
    fid = a_scan(client)
    assert improve(client, fid).status_code == 409  # no AI service yet
    connect(client)
    r = improve(client, fid, accept=False)
    assert r.status_code == 422 and "Confirm" in r.json()["detail"]
    assert fake.requests == []


def test_the_dialog_numbers_say_how_many_pages_and_where_they_go(client, fake):
    fid = a_scan(client)
    connect(client)
    info = client.get(f"/api/files/{fid}/improve-info", params={"scope": "all"}).json()
    assert info["count"] == 1 and info["willSend"] == 1 and info["connected"] and info["providerName"] == "Google Gemini" and info["local"] is False


def test_improving_sends_the_page_image_replaces_the_reading_and_search_finds_the_new_words(client, fake):
    fid = a_scan(client)
    connect(client)
    assert not personal(client, "nebulous quokka identity")
    fake.replies = [reading(unclear=["a smudged subscript"])]
    job = finish(client, improve(client, fid).json()["uploadId"])
    assert job["status"] == "ready" and job["report"]["improved"] == [1] and job["report"]["unclear"] == {"1": ["a smudged subscript"]}
    sent = fake.requests[0]
    parts = sent["contents"][0]["parts"]
    assert parts[0]["inlineData"]["mimeType"] == "image/png" and len(parts[0]["inlineData"]["data"]) > 1000  # the page picture
    assert "never instructions" in sent["systemInstruction"]["parts"][0]["text"]
    hits = personal(client, "nebulous quokka identity")
    assert hits and hits[0]["fileId"] == fid
    page = client.get(f"/api/files/{fid}/pages/1").json()
    assert page["method"] == "ai" and "AI model" in page["warning"] and "\\theta" in page["text"]
    f = next(x for x in client.get("/api/files").json() if x["id"] == fid)
    assert f["aiRead"] is True


def test_the_automatic_reading_can_be_restored(client, fake):
    fid = a_scan(client)
    before = client.get(f"/api/files/{fid}/pages/1").json()
    connect(client)
    fake.replies = [reading()]
    finish(client, improve(client, fid).json()["uploadId"])
    r = client.post(f"/api/files/{fid}/restore-reading")
    assert r.status_code == 200 and not r.json()["file"].get("aiRead")
    after = client.get(f"/api/files/{fid}/pages/1").json()
    assert after["text"] == before["text"] and after["method"] == before["method"]
    assert not personal(client, "nebulous quokka identity")


def test_improving_twice_keeps_the_very_first_reading_for_restore(client, fake):
    fid = a_scan(client)
    first = client.get(f"/api/files/{fid}/pages/1").json()["text"]
    connect(client)
    fake.replies = [reading("Second reading alpha."), reading("Third reading beta, longer text here.")]
    finish(client, improve(client, fid).json()["uploadId"])
    finish(client, improve(client, fid).json()["uploadId"])
    client.post(f"/api/files/{fid}/restore-reading")
    assert client.get(f"/api/files/{fid}/pages/1").json()["text"] == first


def test_a_failed_page_keeps_its_old_reading_and_others_still_improve(client, fake):
    doc = add(client, "two.pdf", text_pdf(["First page about the likelihood function and data.", "Second page about the prior distribution and beliefs."]))
    fid = doc["file"]["id"]
    connect(client)
    fake.replies = ["not json", "still not json", reading("Better second page about the prior distribution.")]
    job = finish(client, improve(client, fid).json()["uploadId"])
    assert job["status"] == "ready" and job["report"]["improved"] == [2] and job["report"]["failed"] == [1]
    assert "likelihood function" in client.get(f"/api/files/{fid}/pages/1").json()["text"]


def test_a_service_problem_stops_the_run_and_says_why(client, fake):
    doc = add(client, "two.pdf", text_pdf(["First page about the likelihood function and data.", "Second page about the prior distribution and beliefs."]))
    fid = doc["file"]["id"]
    connect(client)
    fake.replies = [reading("Better first page about the likelihood function."), 429]
    job = finish(client, improve(client, fid).json()["uploadId"])
    assert job["status"] == "ready" and job["report"]["improved"] == [1] and "free allowance" in job["report"]["stopped"]
    fake.replies = [429]
    job = finish(client, improve(client, fid, scope="all").json()["uploadId"])
    assert job["status"] == "failed" and "free allowance" in job["error"]


def test_only_pages_that_look_hard_to_read_are_sent_by_default(client, fake):
    doc = add(client, "good.pdf", text_pdf(["A clean text page about estimators and their sampling distributions."]))
    connect(client)
    r = improve(client, doc["file"]["id"], scope="flagged")
    assert r.status_code == 422 and "flagged" in r.json()["detail"]
    assert fake.requests == []
    fid = a_scan(client)  # an OCR page counts as hard to read
    assert client.get(f"/api/files/{fid}/improve-info").json()["count"] == 1


def test_text_files_cannot_be_improved_because_they_have_no_page_picture(client, fake):
    job = add(client, "note.txt", b"The likelihood function is not a probability distribution over theta.")
    connect(client)
    r = improve(client, job["file"]["id"], scope="all")
    assert r.status_code == 422 and "PDFs and images" in r.json()["detail"]


def test_a_local_model_gets_the_picture_in_ollamas_format_and_nothing_leaves_the_computer(client, monkeypatch):
    f = FakeOllama(models=["vision-model:latest"])
    monkeypatch.setenv("STUDIO_OLLAMA_BASE", f.url)
    try:
        fid = a_scan(client)
        assert client.post("/api/ai/connect", json={"provider": "ollama", "model": "vision-model", "accept": True}).status_code == 200
        f.replies = [reading()]
        job = finish(client, improve(client, fid).json()["uploadId"])
        assert job["status"] == "ready"
        msg = f.requests[0]["messages"][-1]
        assert msg["role"] == "user" and len(msg["images"]) == 1 and len(msg["images"][0]) > 1000
        assert client.get(f"/api/files/{fid}/improve-info").json()["local"] is True
    finally:
        f.close()


def test_a_removed_or_unknown_file_is_refused(client, fake):
    connect(client)
    assert improve(client, "nope").status_code == 404
    fid = a_scan(client)
    client.delete(f"/api/files/{fid}")
    assert improve(client, fid).status_code == 404


@pytest.mark.parametrize("kind", ["anthropic", "openai"])
def test_claude_and_openai_get_the_picture_in_their_own_formats(client, monkeypatch, kind):
    from fakeapis import KEY, FakeChatApi

    f = FakeChatApi(kind, ["claude-haiku-4-5"] if kind == "anthropic" else ["gpt-5.4-mini"])
    monkeypatch.setenv("STUDIO_ANTHROPIC_BASE" if kind == "anthropic" else "STUDIO_OPENAI_BASE", f.url)
    try:
        fid = a_scan(client)
        assert client.post("/api/ai/connect", json={"provider": kind, "apiKey": KEY, "accept": True}).status_code == 200
        f.replies = [reading()]
        job = finish(client, improve(client, fid).json()["uploadId"])
        assert job["status"] == "ready"
        content = f.requests[0]["messages"][-1]["content"]
        image = next(b for b in content if b["type"] in ("image", "image_url"))
        if kind == "anthropic":
            assert image["source"]["type"] == "base64" and image["source"]["media_type"] == "image/png" and len(image["source"]["data"]) > 1000
        else:
            assert image["image_url"]["url"].startswith("data:image/png;base64,")
        assert content[-1]["type"] == "text"
    finally:
        f.close()
