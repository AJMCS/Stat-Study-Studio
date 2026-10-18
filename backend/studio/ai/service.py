from __future__ import annotations

import json
import threading
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import anthropic as anthropic_api
from . import openai_provider as openai_api
from .anthropic import Claude
from .errors import AiError
from .gemini import DEFAULT_MODEL, Gemini
from .keystore import KeyStore
from .ollama import Ollama, local_base
from .openai_provider import OpenAI
from .provider import Provider

# Bump when a notice changes in a way that matters; everyone is then asked again.
CONSENT_VERSION = 1

NOTICE = {
    "gemini": (
        "When you use the AI features, the app sends Google Gemini what you typed (your answers and questions) and the "
        "few course or personal-file excerpts that match them. It never sends whole files or your progress history. "
        "Google's free tier may use what is sent to improve its products, and people may review it; "
        "paid accounts are not used that way. Do not type personal information. Your key stays on this computer. "
        "You can disconnect at any time and the app keeps working without AI."
    ),
    "anthropic": (
        "When you use the AI features, the app sends Anthropic (Claude) what you typed (your answers and questions) and the "
        "few course or personal-file excerpts that match them, using your own Anthropic API account. It never sends whole "
        "files or your progress history. Each AI action uses a little of your API credit; a Claude chat subscription does "
        "not include API credit. How Anthropic may use API data depends on its current terms for your account, so read "
        "them. Do not type personal information. Your key stays on this computer. You can disconnect at any time and the "
        "app keeps working without AI."
    ),
    "openai": (
        "When you use the AI features, the app sends OpenAI what you typed (your answers and questions) and the few course "
        "or personal-file excerpts that match them, using your own OpenAI API account. It never sends whole files or your "
        "progress history. Each AI action uses a little of your API credit; a ChatGPT subscription does not include API "
        "credit. How OpenAI may use API data depends on its current terms for your account, so read them. Do not type "
        "personal information. Your key stays on this computer. You can disconnect at any time and the app keeps working "
        "without AI."
    ),
    "ollama": (
        "The AI features will use a model running on this computer through Ollama. What you type, your course excerpts "
        "and your personal-file excerpts go only to Ollama on this computer; nothing is sent over the internet. "
        "Smaller local models can be slower and less consistent than online ones, especially at scoring: treat their "
        "scores as a rough guide. You can disconnect at any time and the app keeps working without AI."
    ),
}
PROVIDER_NAMES = {"gemini": "Google Gemini", "anthropic": "Anthropic Claude", "openai": "OpenAI", "ollama": "Ollama (on this computer)"}
LOCAL = {"ollama"}
KEYED = ("gemini", "anthropic", "openai")  # services that need a pasted API key
DEFAULT_MODELS = {"gemini": DEFAULT_MODEL}  # the others are chosen from what the learner's account can use


def _version(name: str) -> tuple[int, ...]:
    return tuple(int(n) for n in re.findall(r"\d+", name) if len(n) < 6)  # skip date stamps like 20251001


def pick_model(ids: list[str], patterns: tuple[str, ...]) -> str | None:
    """The newest model matching the first pattern that matches anything. Names change often, so we choose from the
    account's own list instead of hard-coding one."""
    for pattern in patterns:
        found = [i for i in ids if re.search(pattern, i)]
        if found:
            return sorted(found, key=lambda i: (_version(i), -len(i)), reverse=True)[0]
    return None


class AiService:
    def __init__(self, data_dir: Path):
        self._file = Path(data_dir) / "ai.json"
        self._lock = threading.Lock()
        self.stores = {p: KeyStore(data_dir, account=p) for p in KEYED}

    @property
    def keys(self) -> KeyStore:
        """Where this machine keeps keys (every service uses the same kind of store)."""
        return self.stores["gemini"]

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
    @property
    def is_local(self) -> bool:
        """True when the connected model runs on this computer, so nothing leaves it."""
        return self._read().get("provider") in LOCAL

    def status(self, provider: str | None = None) -> dict[str, Any]:
        s = self._read()
        saved = s.get("provider", "gemini")
        shown = provider if provider in PROVIDER_NAMES else saved
        consented = s.get("consentVersion") == CONSENT_VERSION
        has_key = shown in self.stores and self.stores[shown].get() is not None
        active = shown == saved
        ready = (shown in LOCAL) or has_key
        return {
            "provider": shown,
            "providerName": PROVIDER_NAMES[shown],
            "providers": [{"id": k, "name": v, "local": k in LOCAL} for k, v in PROVIDER_NAMES.items()],
            "local": shown in LOCAL,
            "connected": active and ready and consented and bool(s),
            "keyStored": has_key,
            "keyLocation": self.keys.where,
            "consented": consented and active,
            "consentedAt": s.get("consentedAt") if active else None,
            "model": (s.get("model") if active else None) or DEFAULT_MODELS.get(shown, ""),
            "defaultModel": DEFAULT_MODELS.get(shown, ""),
            "needsKey": shown in KEYED,
            "notice": NOTICE[shown],
            "noticeVersion": CONSENT_VERSION,
        }

    def connect(self, api_key: str, accept: bool, model: str | None = None, provider: str = "gemini") -> dict[str, Any]:
        """Check the connection with the provider, then save it. Nothing is saved if the check fails."""
        if provider not in PROVIDER_NAMES:
            raise ValueError(f"Unknown AI service: {provider}")
        if not accept:
            raise AiError("no_consent")
        model = (model or "").strip() or None
        if provider == "ollama":
            if not model:
                raise ValueError("Choose which Ollama model to use.")
            local_base()
            Ollama(model).check_key()
            api_key = ""
        else:
            api_key = api_key.strip()
            if not api_key:
                raise AiError("invalid_key", "empty")
            client = self._build(provider, api_key, model)
            if provider == "gemini":
                client.check_key()
            else:
                ids = client.models()  # also proves the key works
                if model and model not in ids:
                    raise AiError("model_missing", model)
                if not model:
                    prefs = anthropic_api.PREFERRED if provider == "anthropic" else openai_api.PREFERRED
                    model = pick_model(ids, prefs)
                    if not model:
                        raise ValueError("The key works, but no suitable model was found on your account. Type the name of the model you want to use and connect again.")
        with self._lock:
            for name, store in self.stores.items():  # one connection at a time: only the chosen service keeps a key
                if name == provider:
                    store.set(api_key)
                else:
                    store.delete()
            self._write(
                {
                    "provider": provider,
                    "model": model,
                    "consentVersion": CONSENT_VERSION,
                    "consentedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
            )
        return self.status()

    def local_models(self) -> dict[str, Any]:
        """What Ollama has installed, so Settings can offer a list. Says plainly when Ollama is not running."""
        try:
            return {"running": True, "models": Ollama("-").installed()}
        except AiError as e:
            if e.kind == "local_not_running":
                return {"running": False, "models": []}
            raise

    def set_model(self, model: str | None) -> dict[str, Any]:
        with self._lock:
            s = self._read()
            s["model"] = (model or "").strip() or None
            self._write(s)
        return self.status()

    def disconnect(self) -> dict[str, Any]:
        with self._lock:
            for store in self.stores.values():
                store.delete()
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
        if not s:
            raise AiError("not_connected")
        if s.get("consentVersion") != CONSENT_VERSION:
            raise AiError("no_consent")
        if s.get("provider") == "ollama":
            if not s.get("model"):
                raise AiError("not_connected")
            return Ollama(s["model"])
        provider = s.get("provider", "gemini")
        key = self.stores[provider].get() if provider in self.stores else None
        if key is None:
            raise AiError("not_connected")
        return self._build(provider, key, s.get("model"))

    @staticmethod
    def _build(provider: str, key: str, model: str | None) -> Provider:
        if provider == "anthropic":
            return Claude(key, model or "")
        if provider == "openai":
            return OpenAI(key, model or "")
        return Gemini(key, model or DEFAULT_MODEL)
