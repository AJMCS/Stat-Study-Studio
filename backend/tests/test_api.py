import copy
import json
import sqlite3

import pytest
from fastapi.testclient import TestClient

from studio.app import create_app

PORT = 8765
ORIGIN = {"Origin": f"http://127.0.0.1:{PORT}"}


@pytest.fixture()
def client(tmp_path):
    app = create_app(data_dir=tmp_path / "data", static_dir=tmp_path / "no-static", port=PORT)
    with TestClient(app, base_url=f"http://127.0.0.1:{PORT}") as c:
        c.data_dir = tmp_path / "data"
        yield c


def attempt(i=0, **kw):
    base = {
        "id": f"a{i}", "topicId": "t1", "at": f"2026-01-0{i + 1}T00:00:00Z", "kind": "quiz", "counted": True,
        "composite": 70, "criteria": {"core": 70, "depth": 70, "relevance": 70, "application": 70}, "note": "graded quiz",
    }
    return {**base, **kw}


CONFIG = {
    "weights": {"core": 1, "depth": 1, "relevance": 1, "application": 1},
    "compositeCutoff": 80,
    "criterionCutoffs": {"core": 80, "depth": 80, "relevance": 80, "application": 80},
    "recencyWindow": 5,
}


def put(client, name, value):
    return client.put(f"/api/state/{name}", json=value, headers=ORIGIN)


def test_fresh_state_is_empty_but_has_general_collection(client):
    r = client.get("/api/state").json()
    assert r["initialized"] is False
    s = r["state"]
    assert s["attempts"] == [] and s["files"] == [] and s["config"] is None
    assert [c["name"] for c in s["collections"]] == ["General"]


def test_slice_roundtrip_preserves_order_and_fields(client):
    items = [attempt(2, aiScored=True), attempt(0, note=None), attempt(1, selfScored=True)]
    items[1].pop("note")
    assert put(client, "attempts", items).status_code == 200
    got = client.get("/api/state").json()
    assert got["initialized"] is True
    out = got["state"]["attempts"]
    assert [a["id"] for a in out] == ["a2", "a0", "a1"]
    assert "note" not in out[1] and out[2]["selfScored"] is True and "selfScored" not in out[0]
    assert out[0]["aiScored"] is True and "aiScored" not in out[1] and "aiScored" not in out[2]


def test_every_slice_roundtrips(client):
    state = {
        "attempts": [attempt()],
        "quizzes": [{"id": "q1", "topicId": "t1", "at": "x", "score": 7, "total": 10, "items": [{"a": 1}], "flaggedConcepts": []}],
        "exams": [{"id": "e1", "topicId": "t1", "at": "x", "composite": 60, "items": []}],
        "topicState": {"t1": {"streak": 2, "flagged": False, "misses": 1, "warnCriteria": ["depth"], "recallHistory": [{"at": "x", "composite": 85, "qualified": True}], "strengths": ["a"], "gaps": []}},
        "session": {"topicId": "t1", "activity": "quiz", "at": "x"},
        "collections": [
            {"id": "general", "name": "General", "consent": False, "searchByDefault": True},
            {"id": "c2", "name": "Homework 3", "consent": True, "searchByDefault": False},
        ],
        "config": CONFIG,
        "hostedDisclosureAck": True,
        "chats": {"t1": [{"role": "tutor", "text": "hi"}]},
        "onboarding": {"done": True, "completedAt": "2026-10-19T12:00:00Z"},
    }
    for name, value in state.items():
        assert put(client, name, value).status_code == 200, name
    got = client.get("/api/state").json()["state"]
    assert got.pop("files") == []  # owned by the service, not a slice the app can write
    assert got == state


def test_invalid_data_is_rejected_with_a_readable_message(client):
    bad = attempt(composite=140)
    r = put(client, "attempts", [bad])
    assert r.status_code == 422 and "composite" in r.json()["detail"]
    assert put(client, "attempts", [attempt(kind="nonsense")]).status_code == 422
    assert put(client, "config", {**CONFIG, "recencyWindow": 0}).status_code == 422
    assert put(client, "nope", []).status_code == 404
    # nothing was written by the failed requests
    assert client.get("/api/state").json()["state"]["attempts"] == []


def test_a_failed_write_leaves_existing_data_untouched(client):
    assert put(client, "attempts", [attempt(0), attempt(1)]).status_code == 200
    assert put(client, "attempts", [attempt(0), attempt(0)]).status_code == 422  # duplicate id
    assert [a["id"] for a in client.get("/api/state").json()["state"]["attempts"]] == ["a0", "a1"]


def test_general_collection_cannot_be_removed_or_renamed(client):
    assert put(client, "collections", []).status_code == 422
    assert put(client, "collections", [{"id": "general", "name": "Mine", "consent": False, "searchByDefault": True}]).status_code == 422


def test_duplicate_collection_names_are_rejected_case_insensitively(client):
    cols = [
        {"id": "general", "name": "General", "consent": False, "searchByDefault": True},
        {"id": "a", "name": "Notes", "consent": False, "searchByDefault": False},
        {"id": "b", "name": "notes", "consent": False, "searchByDefault": False},
    ]
    assert put(client, "collections", cols).status_code == 422


def test_import_then_refuses_to_overwrite_without_flag(client):
    state = {"attempts": [attempt()], "collections": [{"id": "general", "name": "General", "consent": True, "searchByDefault": True}], "hostedDisclosureAck": True}
    assert client.post("/api/import", json=state, headers=ORIGIN).status_code == 200
    got = client.get("/api/state").json()["state"]
    assert got["attempts"][0]["id"] == "a0" and got["collections"][0]["consent"] is True
    assert client.post("/api/import", json=state, headers=ORIGIN).status_code == 409
    assert client.post("/api/import?overwrite=true", json=state, headers=ORIGIN).status_code == 200


def test_import_rejects_unknown_fields(client):
    assert client.post("/api/import", json={"surprise": 1}, headers=ORIGIN).status_code == 422


def test_export_contains_everything_and_delete_erases_it(client):
    put(client, "attempts", [attempt()])
    exported = client.get("/api/export")
    assert "attachment" in exported.headers["content-disposition"]
    body = json.loads(exported.content)
    assert body["data"]["attempts"][0]["id"] == "a0"
    assert client.delete("/api/data", headers=ORIGIN).status_code == 200
    after = client.get("/api/state").json()
    assert after["initialized"] is False and after["state"]["attempts"] == []
    assert [c["name"] for c in after["state"]["collections"]] == ["General"]


def test_onboarding_defaults_to_not_done_and_takes_the_plain_shape(client):
    assert client.get("/api/state").json()["state"]["onboarding"] == {"done": False}
    assert put(client, "onboarding", {"done": True}).status_code == 200
    got = client.get("/api/state").json()
    assert got["state"]["onboarding"] == {"done": True}
    # finishing setup is a preference, not study data, so a later migration of old browser progress still runs
    assert got["initialized"] is False
    assert put(client, "onboarding", {"done": False}).status_code == 200
    assert client.get("/api/state").json()["state"]["onboarding"] == {"done": False}


def test_onboarding_rejects_other_shapes(client):
    assert put(client, "onboarding", True).status_code == 422
    assert put(client, "onboarding", {"done": "yes please"}).status_code == 422
    assert put(client, "onboarding", {"done": True, "extra": 1}).status_code == 422
    assert put(client, "onboarding", {}).status_code == 422


def test_onboarding_is_exported_imported_and_wiped(client):
    put(client, "onboarding", {"done": True, "completedAt": "2026-10-19T12:00:00Z"})
    body = json.loads(client.get("/api/export").content)
    assert body["data"]["onboarding"] == {"done": True, "completedAt": "2026-10-19T12:00:00Z"}
    assert client.delete("/api/data", headers=ORIGIN).status_code == 200
    assert client.get("/api/state").json()["state"]["onboarding"] == {"done": False}
    restored = {k: v for k, v in body["data"].items() if k != "files"}
    assert client.post("/api/import?overwrite=true", json=restored, headers=ORIGIN).status_code == 200
    assert client.get("/api/state").json()["state"]["onboarding"]["done"] is True
    # an older export without the field imports as "not done"
    older = {k: v for k, v in restored.items() if k != "onboarding"}
    assert client.post("/api/import?overwrite=true", json=older, headers=ORIGIN).status_code == 200
    assert client.get("/api/state").json()["state"]["onboarding"] == {"done": False}


def test_onboarding_survives_a_restart(tmp_path):
    kwargs = dict(data_dir=tmp_path / "d", static_dir=tmp_path / "x", port=PORT)
    with TestClient(create_app(**kwargs), base_url=f"http://127.0.0.1:{PORT}") as c:
        assert c.put("/api/state/onboarding", json={"done": True}, headers=ORIGIN).status_code == 200
    with TestClient(create_app(**kwargs), base_url=f"http://127.0.0.1:{PORT}") as c:
        assert c.get("/api/state").json()["state"]["onboarding"]["done"] is True


def test_data_survives_a_restart(tmp_path):
    kwargs = dict(data_dir=tmp_path / "d", static_dir=tmp_path / "x", port=PORT)
    with TestClient(create_app(**kwargs), base_url=f"http://127.0.0.1:{PORT}") as c:
        c.put("/api/state/attempts", json=[attempt()], headers=ORIGIN)
    with TestClient(create_app(**kwargs), base_url=f"http://127.0.0.1:{PORT}") as c:
        assert c.get("/api/state").json()["state"]["attempts"][0]["id"] == "a0"


def test_database_is_one_file_in_the_data_dir(client):
    put(client, "attempts", [attempt()])
    assert (client.data_dir / "studio.sqlite3").exists()
    con = sqlite3.connect(client.data_dir / "studio.sqlite3")
    assert con.execute("SELECT COUNT(*) FROM attempts").fetchone()[0] == 1


# ---------------------------------------------------------------- localhost protection
def test_foreign_host_header_is_refused(client):
    r = client.get("/api/state", headers={"Host": "evil.example"})
    assert r.status_code == 403


def test_writes_without_the_app_origin_are_refused(client):
    assert client.put("/api/state/attempts", json=[attempt()]).status_code == 403
    assert client.put("/api/state/attempts", json=[attempt()], headers={"Origin": "https://evil.example"}).status_code == 403
    assert client.delete("/api/data", headers={"Origin": "null"}).status_code == 403
    assert client.get("/api/state").json()["state"]["attempts"] == []


def test_dev_origin_only_when_enabled(tmp_path):
    dev = {"Origin": "http://localhost:5173"}
    plain = create_app(data_dir=tmp_path / "a", static_dir=tmp_path / "x", port=PORT)
    with TestClient(plain, base_url=f"http://127.0.0.1:{PORT}") as c:
        assert c.put("/api/state/hostedDisclosureAck", json=True, headers=dev).status_code == 403
    devapp = create_app(data_dir=tmp_path / "b", static_dir=tmp_path / "x", port=PORT, allow_dev_origin=True)
    with TestClient(devapp, base_url=f"http://127.0.0.1:{PORT}") as c:
        assert c.put("/api/state/hostedDisclosureAck", json=True, headers=dev).status_code == 200


def test_health_reports_library_index(client):
    r = client.get("/api/health").json()
    assert r["ok"] is True and r["library"]["chunks"] > 100


def test_course_library_files_are_served_and_unknown_api_paths_404(tmp_path):
    lib = tmp_path / "lib"
    (lib / "lecture-notes").mkdir(parents=True)
    (lib / "lecture-notes" / "x.pdf").write_bytes(b"%PDF-1.4 fake")
    static = tmp_path / "dist"
    (static / "assets").mkdir(parents=True)
    (static / "index.html").write_text("<html>app</html>")
    app = create_app(data_dir=tmp_path / "d", library_dir=lib, static_dir=static, port=PORT)
    with TestClient(app, base_url=f"http://127.0.0.1:{PORT}") as c:
        assert c.get("/course-library/lecture-notes/x.pdf").content.startswith(b"%PDF")
        assert c.get("/some/spa/route").text == "<html>app</html>"
        assert c.get("/api/nope").status_code == 404
        (tmp_path / "secret.txt").write_text("top secret")
        for sneaky in ("/%2e%2e/secret.txt", "/..%2fsecret.txt", "/course-library/%2e%2e/%2e%2e/secret.txt"):
            assert "top secret" not in c.get(sneaky).text
