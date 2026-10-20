"""Start a freshly built package and check that it really works, the way a student's first minute would.

    python packaging/smoke_test.py            # tests packaging/dist/StatsStudio

Checks the self-test, then starts the program on a spare port with an empty data folder and verifies the app page,
the course library, semantic search with a citation, and that the local-only protections are on.
Works the same on Windows, macOS and Linux. Exits non-zero on the first problem.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = 8791
EXE = "StatsStudio.exe" if sys.platform == "win32" else "StatsStudio"


def get(path: str, headers: dict | None = None, method="GET", data: bytes | None = None):
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", headers=headers or {}, method=method, data=data)
    with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310
        return r.status, r.read()


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def main() -> None:
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "packaging" / "dist" / "StatsStudio"
    exe = folder / EXE
    if not exe.exists():
        fail(f"{exe} does not exist; build it first (python packaging/build.py)")

    print("self-test:")
    if subprocess.run([str(exe), "--selftest"], timeout=600).returncode != 0:
        fail("the self-test did not pass")

    data = tempfile.mkdtemp(prefix="studio-smoke-")
    env = {**os.environ, "STUDIO_DATA_DIR": data, "STUDIO_AUTOCHECK": "0", "STUDIO_KEYSTORE": "file", "HTTPS_PROXY": "http://127.0.0.1:9", "HTTP_PROXY": "http://127.0.0.1:9"}
    proc = subprocess.Popen([str(exe), "--no-browser", "--port", str(PORT)], env=env)  # a dead proxy stands in for "no internet"
    try:
        for _ in range(120):
            if proc.poll() is not None:
                fail(f"the program exited early with code {proc.returncode}")
            try:
                status, body = get("/api/health")
                if status == 200:
                    break
            except (urllib.error.URLError, ConnectionError, TimeoutError):
                pass
            time.sleep(1)
        else:
            fail("the service did not become ready within 2 minutes")
        health = json.loads(body)
        print(f"service up: {health['library']['documents']} documents, {health['library']['chunks']} passages")

        status, page = get("/")
        if status != 200 or b"Stats Study Studio" not in page:  # the app's <title>
            fail("the app page was not served")
        status, manifest = get("/course-library/library.json")
        if status != 200 or "files" not in json.loads(manifest):
            fail("the course library manifest was not served")

        status, body = get("/api/search?q=how%20do%20I%20update%20my%20beliefs%20after%20seeing%20data")
        result = json.loads(body)
        if status != 200 or not result["results"]:
            fail("search returned nothing")
        if result["mode"] != "semantic":
            fail(f"search ran in {result['mode']} mode: the bundled model did not load")
        top = result["results"][0]
        print(f"search ok (semantic): {top['title']}, page {top['page']}")
        status, _ = get(f"/api/page?source={urllib.request.quote(top['source'])}&page={top['page']}")
        if status != 200:
            fail("the cited page could not be opened")

        status, body = get("/api/ai")
        if status != 200 or json.loads(body)["connected"]:
            fail("a fresh install should have no AI service connected")

        try:
            get("/api/data", method="DELETE")
            fail("a request without the app's Origin was accepted")
        except urllib.error.HTTPError as e:
            if e.code != 403:
                fail(f"expected 403 for a request from outside the app, got {e.code}")
        print("smoke test passed")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=20)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
