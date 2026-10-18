from __future__ import annotations

import logging
import os
from pathlib import Path

log = logging.getLogger("studio.ai")
SERVICE = "StatsStudio"


class KeyStore:
    """Keeps the learner's API key in the operating system's credential store (Windows Credential Manager, macOS
    Keychain, Secret Service on Linux). If the machine has none, falls back to a file in the app's data folder that
    only the current user can read, and says so. The key is never written to the database, logs or exports.

    Tests set STUDIO_KEYSTORE=file to avoid touching the real credential store."""

    def __init__(self, data_dir: Path, account: str = "gemini"):
        self.account = account
        self._file = Path(data_dir) / f"{account}.key"
        self._keyring = None
        if os.environ.get("STUDIO_KEYSTORE") != "file":
            try:
                import keyring
                from keyring.backends import fail

                if not isinstance(keyring.get_keyring(), fail.Keyring):
                    self._keyring = keyring
            except Exception as e:  # no usable credential store on this machine
                log.info("No operating-system credential store (%s); using a private file instead.", e)

    @property
    def where(self) -> str:
        return "os" if self._keyring else "file"

    def get(self) -> str | None:
        if self._keyring:
            try:
                return self._keyring.get_password(SERVICE, self.account)
            except Exception as e:
                log.warning("Reading the credential store failed: %s", e)
                return None
        try:
            return self._file.read_text(encoding="utf-8").strip() or None
        except OSError:
            return None

    def set(self, key: str) -> None:
        if self._keyring:
            self._keyring.set_password(SERVICE, self.account, key)
            return
        self._file.parent.mkdir(parents=True, exist_ok=True)
        self._file.write_text(key, encoding="utf-8")
        try:
            self._file.chmod(0o600)
        except OSError:
            pass

    def delete(self) -> None:
        if self._keyring:
            try:
                self._keyring.delete_password(SERVICE, self.account)
            except Exception:
                pass
        try:
            self._file.unlink()
        except OSError:
            pass
