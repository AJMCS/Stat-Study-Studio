from __future__ import annotations

import json
import threading
import re
import time
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
# How long a warmed local model is assumed to stay loaded before the app asks Ollama to load it again (its keep-alive
# is longer, so this only avoids pointless repeat requests).
WARM_FOR = 10 * 60


def _version(name: str) -> tuple[int, ...]:
    return tuple(int(n) for n in re.findall(r"\d+", name) if len(n) < 6)  # skip date stamps like 20251001


class WorkspaceChoice(Exception):
    """Connecting needs the learner to choose: the Anthropic key may be used in several workspaces of the
    organisation, and nothing is saved until they say which one the app should use."""

    message = "This key can work in several workspaces. Which one should the app use?"

    def __init__(self, workspaces: list[dict]):
        self.workspaces = [{"id": w["id"], "name": w["name"]} for w in workspaces]
        super().__init__(self.message)


def pick_model(ids: list[str], patterns: tuple[str, ...]) -> str | None:
    """The newest model matching the first pattern that matches anything. Names change often, so we choose from the
    account's own list instead of hard-coding one."""
    for pattern in patterns:
        found = [i for i in ids if re.search(pattern, i)]
        if found:
            return sorted(found, key=lambda i: (_version(i), -len(i)), reverse=True)[0]
    return None


class AiService:
    """The learner's AI services. Several can be saved at once (one key per hosted service, one chosen model for
    Ollama), each with its own model and its own accepted notice. Exactly one is active, and every AI feature goes
    through it; switching to another saved service needs no key."""

    def __init__(self, data_dir: Path):
        self._file = Path(data_dir) / "ai.json"
        self._lock = threading.Lock()
        self.stores = {p: KeyStore(data_dir, account=p) for p in KEYED}
        # The local model's warm-up: {"model", "state": "loading" | "ready" | "failed", "at"}; see warm().
        self._warm: dict[str, Any] = {}

    @property
    def keys(self) -> KeyStore:
        """Where this machine keeps keys (every service uses the same kind of store)."""
        return self.stores["gemini"]

    # ------------------------------------------------------------------ settings file
    def _read(self) -> dict[str, Any]:
        """{"provider": <the active service or None>, "accounts": {service: {"model", "consentVersion", "consentedAt"}}}.
        A file written before several services could be saved held one flat connection; it is read as one account."""
        try:
            s = json.loads(self._file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {"provider": None, "accounts": {}}
        if "accounts" not in s:
            p = s.get("provider")
            accounts = {p: {"model": s.get("model"), "consentVersion": s.get("consentVersion"), "consentedAt": s.get("consentedAt")}} if p else {}
            return {"provider": p, "accounts": accounts}
        return {"provider": s.get("provider"), "accounts": s.get("accounts") or {}}

    def _write(self, data: dict[str, Any]) -> None:
        self._file.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._file.with_suffix(".tmp")
        tmp.write_text(json.dumps(data), encoding="utf-8")
        tmp.replace(self._file)

    # ------------------------------------------------------------------ state
    def _ready(self, provider: str | None, accounts: dict[str, Any]) -> bool:
        """Saved and usable: a stored key (hosted) or a chosen model (local), with the current notice accepted."""
        a = accounts.get(provider or "")
        if not a or a.get("consentVersion") != CONSENT_VERSION:
            return False
        if provider in LOCAL:
            return bool(a.get("model"))
        return provider in self.stores and self.stores[provider].get() is not None

    @property
    def is_local(self) -> bool:
        """True when the active model runs on this computer, so nothing leaves it."""
        return self._read().get("provider") in LOCAL

    def status(self, provider: str | None = None) -> dict[str, Any]:
        s = self._read()
        active, accounts = s["provider"], s["accounts"]
        shown = provider if provider in PROVIDER_NAMES else (active or "gemini")
        a = accounts.get(shown, {})
        has_key = shown in self.stores and self.stores[shown].get() is not None
        connected = active is not None and self._ready(active, accounts)
        saved = [
            {"id": p, "name": PROVIDER_NAMES[p], "model": accounts[p].get("model") or DEFAULT_MODELS.get(p, ""), "local": p in LOCAL, "active": p == active}
            for p in PROVIDER_NAMES
            if self._ready(p, accounts)
        ]
        warm = None
        if connected and active in LOCAL and self._warm.get("model") == accounts[active].get("model"):
            warm = {"state": self._warm.get("state")}
        return {
            "provider": shown,
            "providerName": PROVIDER_NAMES[shown],
            "providers": [{"id": k, "name": v, "local": k in LOCAL} for k, v in PROVIDER_NAMES.items()],
            "local": shown in LOCAL,
            "connected": connected,
            "active": active if connected else None,
            "accounts": saved,
            "keyStored": has_key,
            "keyLocation": self.keys.where,
            "consented": a.get("consentVersion") == CONSENT_VERSION,
            "consentedAt": a.get("consentedAt"),
            "model": a.get("model") or DEFAULT_MODELS.get(shown, ""),
            "defaultModel": DEFAULT_MODELS.get(shown, ""),
            # Anthropic only: the workspace a key made for the whole organisation was told to use (null for a key
            # scoped to one workspace, and for every other service).
            "workspace": (a.get("workspace") or None) if shown == "anthropic" else None,
            "workspaceName": (a.get("workspaceName") or None) if shown == "anthropic" else None,
            "needsKey": shown in KEYED,
            "notice": NOTICE[shown],
            "noticeVersion": CONSENT_VERSION,
            "warm": warm,
        }

    def connect(self, api_key: str, accept: bool, model: str | None = None, provider: str = "gemini", workspace: str | None = None) -> dict[str, Any]:
        """Check the connection with the provider, then save it and make it the active one. Nothing is saved if the
        check fails, and the other saved services keep their keys.

        `workspace` is for Anthropic only: a key made for every workspace of the organisation must say which one to
        use. When the key needs one and none was given, the app looks the workspaces up: the only one there is gets
        used without asking; several raise WorkspaceChoice for the learner to pick from; when the account may not
        list them, AiError("workspace_needed") asks for the ID to be pasted."""
        if provider not in PROVIDER_NAMES:
            raise ValueError(f"Unknown AI service: {provider}")
        if not accept:
            raise AiError("no_consent")
        model = (model or "").strip() or None
        workspace = ((workspace or "").strip() or None) if provider == "anthropic" else None
        workspace_name: str | None = None
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
            client = self._build(provider, api_key, model, workspace)
            if provider == "gemini":
                client.check_key()
            else:
                try:
                    ids = client.models()  # also proves the key works
                except AiError as e:
                    if e.kind != "workspace_needed" or workspace or not isinstance(client, Claude):
                        raise
                    found = client.workspaces()
                    if len(found) > 1:
                        raise WorkspaceChoice(found) from e
                    if not found:
                        raise  # cannot list them: the learner pastes the ID
                    workspace, workspace_name = found[0]["id"], found[0]["name"]
                    client = self._build(provider, api_key, model, workspace)
                    ids = client.models()
                if isinstance(client, Claude) and workspace and workspace_name is None:
                    workspace_name = _workspace_name(client, workspace)
                if model and model not in ids:
                    raise AiError("model_missing", model)
                if not model:
                    prefs = anthropic_api.PREFERRED if provider == "anthropic" else openai_api.PREFERRED
                    model = pick_model(ids, prefs)
                    if not model:
                        raise ValueError("The key works, but no suitable model was found on your account. Type the name of the model you want to use and connect again.")
        with self._lock:
            s = self._read()
            if provider in self.stores:
                self.stores[provider].set(api_key)
            s["accounts"][provider] = {
                "model": model,
                "consentVersion": CONSENT_VERSION,
                "consentedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            if provider == "anthropic":
                s["accounts"][provider].update({"workspace": workspace, "workspaceName": workspace_name})
            s["provider"] = provider
            self._write(s)
        return self.status()

    def switch(self, provider: str) -> dict[str, Any]:
        """Make a saved service the active one. No key is needed: it was checked and stored when it was connected."""
        if provider not in PROVIDER_NAMES:
            raise ValueError(f"Unknown AI service: {provider}")
        with self._lock:
            s = self._read()
            a = s["accounts"].get(provider)
            if a is None:
                raise AiError("not_connected", f"{provider} is not saved")
            if a.get("consentVersion") != CONSENT_VERSION:
                raise AiError("no_consent", provider)
            if not self._ready(provider, s["accounts"]):
                raise AiError("not_connected", provider)
            s["provider"] = provider
            self._write(s)
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
        """Change the active service's model."""
        with self._lock:
            s = self._read()
            p = s["provider"]
            if p and p in s["accounts"]:
                s["accounts"][p]["model"] = (model or "").strip() or None
                self._write(s)
        return self.status()

    def disconnect(self, provider: str | None = None) -> dict[str, Any]:
        """Forget one saved service (its key included): the given one, or the active one. The others stay saved;
        if the forgotten one was active, nothing is active until the learner switches or connects."""
        with self._lock:
            s = self._read()
            p = provider if provider in PROVIDER_NAMES else s["provider"]
            if p in self.stores:
                self.stores[p].delete()
            s["accounts"].pop(p, None)
            if s["provider"] == p:
                s["provider"] = None
            if p in LOCAL:
                self._warm = {}
            if s["accounts"]:
                self._write(s)
            else:
                try:
                    self._file.unlink()
                except OSError:
                    pass
        return self.status()

    def disconnect_all(self) -> dict[str, Any]:
        """Forget every saved service, for "delete all my data"."""
        with self._lock:
            for store in self.stores.values():
                store.delete()
            self._warm = {}
            try:
                self._file.unlink()
            except OSError:
                pass
        return self.status()

    def test(self) -> dict[str, Any]:
        self.provider().check_key()
        return self.status()

    def warm(self) -> dict[str, Any]:
        """Start loading the active local model in the background, so the learner's first question does not wait for
        it. Returns at once. Does nothing for a hosted service, or when the model was loaded recently."""
        s = self._read()
        p = s["provider"]
        if p not in LOCAL or not self._ready(p, s["accounts"]):
            return {"warming": False, "state": None}
        model = s["accounts"][p]["model"]
        with self._lock:
            w = self._warm
            fresh = w.get("model") == model and (w.get("state") == "loading" or (w.get("state") == "ready" and time.time() - w.get("at", 0) < WARM_FOR))
            if fresh:
                return {"warming": w["state"] == "loading", "state": w["state"]}
            self._warm = {"model": model, "state": "loading", "at": time.time()}

        def run() -> None:
            try:
                Ollama(model).warm()
                state = "ready"
            except (AiError, ValueError):
                state = "failed"
            with self._lock:
                if self._warm.get("model") == model:
                    self._warm.update({"state": state, "at": time.time()})

        threading.Thread(target=run, name="ollama-warm", daemon=True).start()
        return {"warming": True, "state": "loading"}

    def provider(self) -> Provider:
        """The active model, or an AiError saying what is missing. Every AI feature goes through here."""
        s = self._read()
        p = s["provider"]
        a = s["accounts"].get(p or "")
        if not p or a is None:
            raise AiError("not_connected")
        if a.get("consentVersion") != CONSENT_VERSION:
            raise AiError("no_consent")
        if p in LOCAL:
            if not a.get("model"):
                raise AiError("not_connected")
            return Ollama(a["model"])
        key = self.stores[p].get() if p in self.stores else None
        if key is None:
            raise AiError("not_connected")
        return self._build(p, key, a.get("model"), a.get("workspace"))

    @staticmethod
    def _build(provider: str, key: str, model: str | None, workspace: str | None = None) -> Provider:
        if provider == "anthropic":
            return Claude(key, model or "", workspace or None)
        if provider == "openai":
            return OpenAI(key, model or "")
        return Gemini(key, model or DEFAULT_MODEL)


def _workspace_name(client: Claude, workspace: str) -> str | None:
    """The name of a workspace the learner pasted the ID of, when the account may list them; never an error."""
    try:
        return next((w["name"] for w in client.workspaces() if w["id"] == workspace), None)
    except AiError:
        return None
