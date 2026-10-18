"""Checking for, and installing, newer course materials from the project's GitHub repository.

The maintainer publishes `course-library/library.json` (a list of every library file with its SHA-256) in the
repository's main branch. The app fetches that small file, compares it with what is installed, and downloads only the
files that differ. Every file is verified against its hash, and the new library must load before the app switches to it.

Only the shared course library is updated here (lecture notes, transcripts, the search index), never program code.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path, PurePosixPath

from .library import MANIFEST, LibraryRuntime, check_loads, file_sha256, read_manifest

log = logging.getLogger(__name__)

CHANNEL_FILE = Path(__file__).with_name("channel.json")
ALLOWED_SUFFIXES = {".pdf", ".md", ".json", ".jsonl", ".npy"}
MAX_FILE_BYTES = 200 * 1024 * 1024
CHECK_TIMEOUT = 8
DOWNLOAD_TIMEOUT = 60
USER_AGENT = "StatsStudio-update-check"


class UpdateError(Exception):
    """A problem the learner can understand and act on."""


def channel_base_url() -> str | None:
    """Where the library lives. STUDIO_UPDATE_BASE overrides the repository (used by tests and for mirrors)."""
    override = os.environ.get("STUDIO_UPDATE_BASE")
    if override:
        return override.rstrip("/") + "/"
    try:
        cfg = json.loads(CHANNEL_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    repo, ref = cfg.get("repo", "").strip(), cfg.get("ref", "main").strip()
    if not repo:
        return None
    return f"https://raw.githubusercontent.com/{repo}/{ref}/course-library/"


def _get(url: str, timeout: int) -> urllib.request.addinfourl:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Cache-Control": "no-cache"})
    return urllib.request.urlopen(req, timeout=timeout)  # noqa: S310 (https URL from our own channel file)


def _explain(e: Exception) -> str:
    if isinstance(e, urllib.error.HTTPError):
        if e.code == 404:
            return "The course materials were not found online. They may not be published yet; try again later."
        return f"The update server answered with an error ({e.code}). Try again later."
    if isinstance(e, (urllib.error.URLError, TimeoutError, ConnectionError, OSError)):
        return "Couldn't reach the update server. Check your internet connection and try again."
    return "Something went wrong while checking for updates."


def safe_path(relative: str) -> PurePosixPath:
    """A manifest path we are willing to write: relative, inside the library, a known file type."""
    p = PurePosixPath(relative)
    if p.is_absolute() or ".." in p.parts or not p.parts or "\\" in relative or ":" in relative:
        raise UpdateError("The update contains an unsafe file path, so it was not installed.")
    if p.suffix.lower() not in ALLOWED_SUFFIXES:
        raise UpdateError("The update contains an unexpected kind of file, so it was not installed.")
    return p


class Updater:
    def __init__(self, runtime: LibraryRuntime, base_url: str | None = None):
        self.runtime = runtime
        self._base = base_url
        self._lock = threading.Lock()
        self.state = "idle"  # idle | checking | downloading | failed
        self.checked_at: float | None = None
        self.error: str | None = None
        self.available: dict | None = None
        self.progress = {"done": 0, "total": 0}
        self.just_updated = False
        self._remote: dict | None = None

    @property
    def base(self) -> str | None:
        return self._base or channel_base_url()

    def status(self) -> dict:
        return {
            "configured": self.base is not None,
            "installed": self.runtime.info().as_dict(),
            "state": self.state,
            "checkedAt": self.checked_at,
            "error": self.error,
            "available": self.available,
            "progress": self.progress,
            "justUpdated": self.just_updated,
        }

    # ------------------------------------------------------------------ check
    def check(self) -> dict:
        """Ask the server whether a newer library exists. Never raises; the outcome is in the status."""
        if self.state in {"checking", "downloading"}:
            return self.status()
        base = self.base
        if base is None:
            self.error = "Update checking isn't set up for this copy of the app yet."
            return self.status()
        self.state, self.error = "checking", None
        try:
            with _get(base + MANIFEST, CHECK_TIMEOUT) as r:
                remote = json.loads(r.read(5 * 1024 * 1024))
            if not isinstance(remote, dict) or not isinstance(remote.get("version"), int) or not isinstance(remote.get("files"), dict):
                raise UpdateError("The update information was not in the expected format.")
            self._remote = remote
            local = self.runtime.manifest or {"version": 0, "files": {}}
            if remote["version"] > local["version"]:
                changes = self._changes(local, remote)
                self.available = {
                    "version": remote["version"],
                    "builtAt": remote.get("built_at"),
                    "files": len(changes),
                    "bytes": sum(remote["files"][p]["size"] for p in changes),
                }
            else:
                self.available = None
            self.checked_at = time.time()
        except UpdateError as e:
            self.error = str(e)
        except ValueError:  # not JSON
            self.error = "The update information was not in the expected format."
        except Exception as e:
            log.info("Update check failed: %s", e)
            self.error = _explain(e)
        finally:
            self.state = "idle"
        return self.status()

    @staticmethod
    def _changes(local: dict, remote: dict) -> list[str]:
        have = local.get("files", {})
        return sorted(p for p, meta in remote["files"].items() if have.get(p, {}).get("sha256") != meta.get("sha256"))

    # ------------------------------------------------------------------ install
    def _begin(self) -> bool:
        """Claim the install. False if another is running or there is nothing newer to install."""
        if self._remote is None or self.available is None:
            self.check()
        with self._lock:
            if self.state in {"checking", "downloading"} or self.available is None or self._remote is None:
                return False
            self.state, self.error, self.just_updated = "downloading", None, False
            self.progress = {"done": 0, "total": 0}
        return True

    def install(self) -> dict:
        """Download, verify and switch, and wait for it to finish."""
        if self._begin():
            self._install_body()
        return self.status()

    def start_install(self) -> dict:
        """Same as install() but in the background; poll status() for progress."""
        if self._begin():
            threading.Thread(target=self._install_body, daemon=True, name="library-update").start()
        return self.status()

    def _install_body(self) -> None:
        """Download what changed, verify it, check the new library loads, then switch to it. All or nothing."""
        staging: Path | None = None
        try:
            remote = self._remote
            local = self.runtime.manifest or {"version": 0, "files": {}}
            for rel in remote["files"]:
                safe_path(rel)
            changes = self._changes(local, remote)
            self.progress = {"done": 0, "total": len(changes)}
            store = self.runtime.store
            store.mkdir(parents=True, exist_ok=True)
            final = store / f"v{remote['version']}"
            staging = store / f"incoming-{remote['version']}"
            shutil.rmtree(staging, ignore_errors=True)
            shutil.copytree(self.runtime.root, staging)
            for rel in list(self._files_under(staging)):
                if rel not in remote["files"] and rel != MANIFEST:  # removed upstream
                    (staging / rel).unlink()
            for n, rel in enumerate(changes, 1):
                self._download(rel, remote["files"][rel], staging)
                self.progress["done"] = n
            (staging / MANIFEST).write_text(json.dumps(remote, indent=2), encoding="utf-8")
            self._verify(staging, remote)
            check_loads(staging, self.runtime.embedder)  # the new library must load before we switch to it
            shutil.rmtree(final, ignore_errors=True)
            staging.rename(final)
            staging = None
            self.runtime.reload_from(final)
            self.available, self._remote, self.just_updated = None, None, True
            self.checked_at = time.time()
        except UpdateError as e:
            self.error = str(e)
        except Exception as e:
            log.exception("Library update failed")
            self.error = "The update could not be installed, so nothing was changed. " + _explain(e)
        finally:
            if staging is not None:
                shutil.rmtree(staging, ignore_errors=True)
            self.state = "idle"

    @staticmethod
    def _files_under(root: Path):
        for p in root.rglob("*"):
            if p.is_file():
                yield p.relative_to(root).as_posix()

    def _download(self, rel: str, meta: dict, staging: Path) -> None:
        safe = safe_path(rel)
        size = meta.get("size")
        if not isinstance(size, int) or size < 0 or size > MAX_FILE_BYTES:
            raise UpdateError("The update lists a file with an invalid size, so it was not installed.")
        dest = staging.joinpath(*safe.parts)
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_name(dest.name + ".part")
        url = self.base + "/".join(urllib.request.quote(part) for part in safe.parts)
        try:
            with _get(url, DOWNLOAD_TIMEOUT) as r, tmp.open("wb") as out:
                got = 0
                while chunk := r.read(1024 * 1024):
                    got += len(chunk)
                    if got > MAX_FILE_BYTES:
                        raise UpdateError("A downloaded file was larger than expected, so the update was cancelled.")
                    out.write(chunk)
        except UpdateError:
            tmp.unlink(missing_ok=True)
            raise
        if file_sha256(tmp, as_suffix=dest.suffix) != meta.get("sha256"):
            tmp.unlink(missing_ok=True)
            raise UpdateError(f"A downloaded file ({safe.name}) did not match its checksum, so nothing was installed. Try again.")
        os.replace(tmp, dest)

    @staticmethod
    def _verify(staging: Path, remote: dict) -> None:
        for rel, meta in remote["files"].items():
            path = staging.joinpath(*PurePosixPath(rel).parts)
            if not path.is_file():
                raise UpdateError("The update is incomplete, so nothing was installed. Try again.")
        installed = read_manifest(staging)
        if not installed or installed["version"] != remote["version"]:
            raise UpdateError("The update could not be verified, so nothing was installed.")
