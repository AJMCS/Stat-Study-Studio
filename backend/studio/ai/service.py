from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .errors import AiError
from .gemini import DEFAULT_MODEL, Gemini
from .keystore import KeyStore
from .provider import Provider

# Bump when the notice changes in a way that matters; everyone is then asked again.
CONSENT_VERSION = 1

NOTICE = {
    "gemini": (
        "When you use the AI features, the app sends Google Gemini what you typed (your answers and questions) and the "
        "few course or personal-file excerpts that match them. It never sends whole files or your progress history. "
        "Google's free tier may use what is sent to improve its products, and people may review it; "
        "paid accounts are not used that way. Do not type personal information. Your key stays on this computer. "
        "You can disconnect at any time and the app keeps working without AI."
    )
}
PROVIDER_NAMES = {"gemini": "Google Gemini"}


class AiService:
    def __init__(self, data_dir: Path):
        self._file = Path(data_dir) / "ai.json"
        self._lock = threading.Lock()
        self.keys = KeyStore(data_dir)

    # ------------------------------------------------------------------ settings file
    def _read(self) -> dict[str, Any]:
        try:
            return json.loads(self._file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def _write(self, data: dict[str, Any]) -> None:
        self._file.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._file.with_suffix(".tmp")
        tmp.write_text(json.dumps(data), encoding="utf-8")
        tmp.replace(self._file)

    # ------------------------------------------------------------------ state
    def status(self) -> dict[str, Any]:
        s = self._read()
        provider = s.get("provider", "gemini")
        has_key = self.keys.get() is not None
        consented = s.get("consentVersion") == CONSENT_VERSION
        return {
            "provider": provider,
            "providerName": PROVIDER_NAMES[provider],
            "connected": has_key and consented,
            "keyStored": has_key,
            "keyLocation": self.keys.where,
            "consented": consented,
            "consentedAt": s.get("consentedAt"),
            "model": s.get("model") or DEFAULT_MODEL,
            "defaultModel": DEFAULT_MODEL,
            "notice": NOTICE[provider],
            "noticeVersion": CONSENT_VERSION,
        }

    def connect(self, api_key: str, accept: bool, model: str | None = None, provider: str = "gemini") -> dict[str, Any]:
        """Check the key with the provider, then store it. Nothing is stored if the key is not accepted."""
        if provider not in PROVIDER_NAMES:
            raise ValueError(f"Unknown AI service: {provider}")
        if not accept:
            raise AiError("no_consent")
        api_key = api_key.strip()
        if not api_key:
            raise AiError("invalid_key", "empty")
        model = (model or "").strip() or None
        Gemini(api_key, model or DEFAULT_MODEL).check_key()
        with self._lock:
            self.keys.set(api_key)
            self._write(
                {
                    "provider": provider,
                    "model": model,
                    "consentVersion": CONSENT_VERSION,
                    "consentedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
            )
        return self.status()

    def set_model(self, model: str | None) -> dict[str, Any]:
        with self._lock:
            s = self._read()
            s["model"] = (model or "").strip() or None
            self._write(s)
        return self.status()

    def disconnect(self) -> dict[str, Any]:
        with self._lock:
            self.keys.delete()
            try:
                self._file.unlink()
            except OSError:
                pass
        return self.status()

    def test(self) -> dict[str, Any]:
        self.provider().check_key()
        return self.status()

    def provider(self) -> Provider:
        """The connected model, or an AiError saying what is missing. Every AI feature goes through here."""
        s = self._read()
        key = self.keys.get()
        if key is None:
            raise AiError("not_connected")
        if s.get("consentVersion") != CONSENT_VERSION:
            raise AiError("no_consent")
        return Gemini(key, s.get("model") or DEFAULT_MODEL)
