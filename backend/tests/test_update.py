import json
import shutil
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from studio.app import create_app
from studio.config import LIBRARY
from studio.ingest import build_manifest, library_files
from studio.library import file_sha256, read_manifest

PORT = 8765
ORIGIN = {"Origin": f"http://127.0.0.1:{PORT}"}
LECTURE = "lecture-notes/lecture-03-the-posterior-distribution.md"
LECTURE_PDF = "lecture-notes/lecture-03-the-posterior-distribution.pdf"


# ---------------------------------------------------------------- a throwaway "GitHub": serves a folder, can misbehave
class Repo:
    def __init__(self, root: Path):
        self.root = root
        self.overrides: dict[str, object] = {}  # path -> bytes to serve instead, or an int status code
        self.hits: list[str] = []
        repo = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_GET(self):
                path = self.path.lstrip("/").split("?")[0]
                repo.hits.append(path)
                if path in repo.overrides:
                    o = repo.overrides[path]
                    if isinstance(o, int):
                        self.send_response(o)
                        self.end_headers()
                        return
                    body = o
                else:
                    f = repo.root / path
                    if not f.is_file():
                        self.send_response(404)
                        self.end_headers()
                        return
                    body = f.read_bytes()
                self.send_response(200)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}/"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def stop(self):
        self.server.shutdown()
        self.server.server_close()


def make_library(root: Path) -> Path:
    """A small real library: the actual transcripts and search index (no PDFs), plus a manifest."""
    root.mkdir(parents=True)
    shutil.copytree(LIBRARY / "transcripts", root / "transcripts")
    shutil.copytree(LIBRARY / "index", root / "index")
    (root / "lecture-notes").mkdir()
    (root / "lecture-notes" / "extra.pdf").write_bytes(b"%PDF-1.4 old extra")
    build_manifest(root)
    return root


@pytest.fixture()
def world(tmp_path):
    bundled = make_library(tmp_path / "bundled")
    remote_dir = tmp_path / "remote"
    shutil.copytree(bundled, remote_dir)
    repo = Repo(remote_dir)
    yield type("World", (), {"tmp": tmp_path, "bundled": bundled, "remote": remote_dir, "repo": repo})
    repo.stop()


def publish(world, mutate):
    """Change the 'repository' and regenerate its manifest, like the maintainer would."""
    mutate(world.remote)
    build_manifest(world.remote)


def edit_lecture(remote: Path):
    p = remote / "transcripts" / LECTURE
    p.write_text(p.read_text(encoding="utf-8").replace("Posterior Distribution", "Posterior Distribution (revised)", 1), encoding="utf-8")


def new_client(world, data="data", base=True):
    app = create_app(
        data_dir=world.tmp / data,
        library_dir=world.bundled,
        static_dir=world.tmp / "nostatic",
        port=PORT,
        auto_check=False,
    )
    if base:
        # point the updater at the fake repository
        import studio.update as u

        original = u.channel_base_url
        u.channel_base_url = lambda: world.repo.url
        app.state._restore = lambda: setattr(u, "channel_base_url", original)
    return TestClient(app, base_url=f"http://127.0.0.1:{PORT}")


@pytest.fixture()
def client(world):
    c = new_client(world)
    with c:
        yield c
    c.app.state._restore()


def check(c):
    r = c.post("/api/library/check", headers=ORIGIN)
    assert r.status_code == 200, r.text
    return r.json()


def install(c):
    from studio.update import Updater  # synchronous path so the test can inspect the outcome

    return c.app.state.updater.install()


# ---------------------------------------------------------------- the manifest tool
def test_manifest_is_idempotent_and_bumps_only_on_change(tmp_path):
    lib = make_library(tmp_path / "lib")
    v1 = read_manifest(lib)
    assert v1["version"] == 1 and "library.json" not in v1["files"] and "README.md" not in v1["files"]
    build_manifest(lib)
    assert read_manifest(lib)["version"] == 1  # nothing changed
    (lib / "transcripts" / LECTURE).write_text("changed\n", encoding="utf-8")
    build_manifest(lib)
    assert read_manifest(lib)["version"] == 2


def test_hashes_ignore_windows_line_endings(tmp_path):
    a, b = tmp_path / "a.md", tmp_path / "b.md"
    a.write_bytes(b"one\ntwo\n")
    b.write_bytes(b"one\r\ntwo\r\n")
    assert file_sha256(a) == file_sha256(b)


def test_the_committed_manifest_matches_the_library_files():
    """Fails when library files changed without running `python -m studio.ingest build-manifest`."""
    manifest = read_manifest(LIBRARY)
    assert manifest is not None, "course-library/library.json is missing"
    assert manifest["files"] == library_files(LIBRARY)


# ---------------------------------------------------------------- checking
def test_not_configured_says_so(world):
    import studio.update as u

    original = u.channel_base_url
    u.channel_base_url = lambda: None
    try:
        with new_client(world, base=False) as c:
            s = check(c)
            assert s["configured"] is False and "isn't set up" in s["error"]
    finally:
        u.channel_base_url = original


def test_up_to_date(client):
    s = check(client)
    assert s["configured"] and s["available"] is None and s["error"] is None
    assert s["installed"]["version"] == 1 and s["installed"]["source"] == "bundled" and s["checkedAt"]


def test_reports_a_newer_version_with_what_will_change(client, world):
    publish(world, edit_lecture)
    s = check(client)
    assert s["available"]["version"] == 2 and s["available"]["files"] >= 1 and s["available"]["bytes"] > 0
    assert s["installed"]["version"] == 1  # checking installs nothing


def test_an_older_or_equal_remote_is_not_an_update(client, world):
    publish(world, edit_lecture)
    world.repo.overrides["library.json"] = json.dumps({**read_manifest(world.bundled), "version": 0}).encode()
    assert check(client)["available"] is None


def test_offline_is_explained_and_the_app_keeps_working(world):
    import studio.update as u

    original = u.channel_base_url
    u.channel_base_url = lambda: "http://127.0.0.1:9/"  # nothing listens here
    try:
        with new_client(world, base=False) as c:
            s = check(c)
            assert "Couldn't reach" in s["error"] and s["available"] is None
            assert c.get("/api/search", params={"q": "conjugate prior"}).json()["results"]
    finally:
        u.channel_base_url = original


@pytest.mark.parametrize(
    "served,message",
    [(404, "not found online"), (500, "error (500)"), (b"not json", "expected format"), (b'{"version": "x", "files": {}}', "expected format")],
)
def test_bad_server_answers_are_explained(client, world, served, message):
    world.repo.overrides["library.json"] = served
    assert message in check(client)["error"]


# ---------------------------------------------------------------- installing
def test_install_downloads_only_what_changed_and_switches_without_a_restart(client, world):
    publish(world, edit_lecture)
    before = client.get("/api/page", params={"source": LECTURE_PDF, "page": 1}).json()["title"]
    assert "(revised)" not in before
    check(client)
    world.repo.hits.clear()
    s = install(client)
    assert s["error"] is None and s["justUpdated"] is True and s["available"] is None
    assert s["installed"] == {**s["installed"], "version": 2, "source": "update"}
    downloaded = [h for h in world.repo.hits if h != "library.json"]
    assert downloaded == [f"transcripts/{LECTURE}"]  # nothing else was fetched
    assert "(revised)" in client.get("/api/page", params={"source": LECTURE_PDF, "page": 1}).json()["title"]
    assert client.get("/api/search", params={"q": "conjugate prior"}).json()["results"]  # search still works


def test_new_and_removed_files_are_applied(client, world):
    def change(remote: Path):
        (remote / "lecture-notes" / "extra.pdf").unlink()
        (remote / "lecture-notes" / "lecture-08.pdf").write_bytes(b"%PDF-1.4 brand new lecture")

    assert client.get("/course-library/lecture-notes/extra.pdf").status_code == 200
    publish(world, change)
    check(client)
    install(client)
    assert client.get("/course-library/lecture-notes/lecture-08.pdf").content == b"%PDF-1.4 brand new lecture"
    assert client.get("/course-library/lecture-notes/extra.pdf").status_code == 404


def test_the_update_survives_a_restart(world):
    publish(world, edit_lecture)
    with new_client(world) as c:
        check(c)
        install(c)
    c.app.state._restore()
    with new_client(world, base=False) as c2:
        assert c2.get("/api/library").json()["installed"]["version"] == 2
        assert "(revised)" in c2.get("/api/page", params={"source": LECTURE_PDF, "page": 1}).json()["title"]


def test_a_newer_bundled_library_wins_over_an_old_download(world):
    publish(world, edit_lecture)
    with new_client(world) as c:
        check(c)
        install(c)
    c.app.state._restore()
    # the app is reinstalled with a library newer than the downloaded one
    (world.bundled / "transcripts" / LECTURE).write_text("brand new bundled\n", encoding="utf-8")
    build_manifest(world.bundled)
    build_manifest(world.bundled)
    manifest = read_manifest(world.bundled)
    manifest["version"] = 5
    (world.bundled / "library.json").write_text(json.dumps(manifest), encoding="utf-8")
    with new_client(world, base=False) as c2:
        assert c2.get("/api/library").json()["installed"] == {**c2.get("/api/library").json()["installed"], "version": 5, "source": "bundled"}


def test_a_corrupted_download_changes_nothing(client, world):
    publish(world, edit_lecture)
    world.repo.overrides[f"transcripts/{LECTURE}"] = b"garbage instead of the real file"
    check(client)
    s = install(client)
    assert "checksum" in s["error"] and s["justUpdated"] is False
    assert s["installed"]["version"] == 1 and s["installed"]["source"] == "bundled"
    assert "(revised)" not in client.get("/api/page", params={"source": LECTURE_PDF, "page": 1}).json()["title"]
    store = client.app.state.library.store
    assert not any(p.name.startswith("incoming") for p in store.iterdir()) if store.exists() else True
    # and a later retry succeeds once the server is fixed
    del world.repo.overrides[f"transcripts/{LECTURE}"]
    assert install(client)["installed"]["version"] == 2


def test_a_truncated_download_is_caught_by_the_checksum(client, world):
    publish(world, edit_lecture)
    full = (world.remote / "transcripts" / LECTURE).read_bytes()
    world.repo.overrides[f"transcripts/{LECTURE}"] = full[: len(full) // 2]
    check(client)
    assert "checksum" in install(client)["error"]
    assert client.get("/api/library").json()["installed"]["version"] == 1


@pytest.mark.parametrize("bad", ["../escape.md", "/etc/passwd.md", "C:/x.md", "transcripts/../../x.md", "a\\b.md"])
def test_unsafe_paths_in_an_update_are_refused(client, world, bad, tmp_path):
    publish(world, edit_lecture)
    m = read_manifest(world.remote)
    m["files"][bad] = {"sha256": "0" * 64, "size": 3}
    world.repo.overrides["library.json"] = json.dumps(m).encode()
    check(client)
    s = install(client)
    assert "unsafe file path" in s["error"] and s["installed"]["version"] == 1
    assert not (tmp_path / "escape.md").exists()


def test_unexpected_file_types_are_refused(client, world):
    publish(world, edit_lecture)
    m = read_manifest(world.remote)
    m["files"]["tools/run.exe"] = {"sha256": "0" * 64, "size": 3}
    world.repo.overrides["library.json"] = json.dumps(m).encode()
    check(client)
    assert "unexpected kind of file" in install(client)["error"]


def test_a_broken_new_library_is_not_switched_to(client, world):
    def break_index(remote: Path):
        (remote / "index" / "chunks.jsonl").write_text("", encoding="utf-8")

    publish(world, break_index)
    check(client)
    s = install(client)
    assert "nothing was changed" in s["error"]
    assert s["installed"]["version"] == 1
    assert client.get("/api/search", params={"q": "conjugate prior"}).json()["results"]


def test_an_update_that_needs_a_different_search_model_is_refused(client, world):
    def change_model(remote: Path):
        meta = json.loads((remote / "index" / "index.json").read_text(encoding="utf-8"))
        meta["embedding_model"] = "someone/other-model"
        (remote / "index" / "index.json").write_text(json.dumps(meta), encoding="utf-8")

    publish(world, change_model)
    check(client)
    assert "nothing was changed" in install(client)["error"] or "different search model" in install(client)["error"]
    assert client.get("/api/library").json()["installed"]["version"] == 1


def test_old_versions_are_cleaned_up(world):
    with new_client(world) as c:
        for n in range(3):
            publish(world, lambda r, n=n: (r / "transcripts" / LECTURE).write_text(f"revision {n}\n", encoding="utf-8"))
            check(c)
            assert install(c)["installed"]["version"] == n + 2
        store = c.app.state.library.store
        versions = sorted(p.name for p in store.iterdir() if p.is_dir())
        assert versions == ["v3", "v4"], versions  # the current one and one previous
    c.app.state._restore()


# ---------------------------------------------------------------- the API
def test_update_endpoint_runs_in_the_background_and_reports_progress(client, world):
    publish(world, edit_lecture)
    check(client)
    r = client.post("/api/library/update", headers=ORIGIN)
    assert r.status_code == 202
    deadline = time.time() + 30
    while time.time() < deadline:
        s = client.get("/api/library").json()
        if s["state"] == "idle" and s["justUpdated"]:
            break
        time.sleep(0.1)
    assert s["installed"]["version"] == 2 and s["error"] is None


def test_update_with_nothing_new_is_a_no_op(client):
    r = client.post("/api/library/update", headers=ORIGIN)
    assert r.status_code == 202 and r.json()["installed"]["version"] == 1 and r.json()["available"] is None


def test_check_and_update_require_the_app_origin(client):
    assert client.post("/api/library/check").status_code == 403
    assert client.post("/api/library/update", headers={"Origin": "https://evil.example"}).status_code == 403


def test_the_app_checks_by_itself_on_startup(world, monkeypatch):
    publish(world, edit_lecture)
    import studio.update as u

    monkeypatch.setattr(u, "channel_base_url", lambda: world.repo.url)
    app = create_app(data_dir=world.tmp / "auto", library_dir=world.bundled, static_dir=world.tmp / "x", port=PORT, auto_check=True)
    with TestClient(app, base_url=f"http://127.0.0.1:{PORT}") as c:
        deadline = time.time() + 15
        while time.time() < deadline and not c.get("/api/library").json()["available"]:
            time.sleep(0.1)
        s = c.get("/api/library").json()
        assert s["available"] and s["available"]["version"] == 2
        assert s["installed"]["version"] == 1  # it only looked; installing waits for the learner


def test_library_files_cannot_be_used_to_leave_the_library(client):
    for bad in ["../library.json", "..%2f..%2fstudio.sqlite3", "%2e%2e/%2e%2e/x", "transcripts/../../../x"]:
        r = client.get(f"/course-library/{bad}")
        assert r.status_code == 404
