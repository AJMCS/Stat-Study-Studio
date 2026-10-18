from __future__ import annotations

import os
from urllib.parse import urlparse

import httpx

from .errors import AiError
from .provider import Message

BASE = "http://127.0.0.1:11434"


def local_base(value: str | None = None) -> str:
    """The Ollama address. Only this computer is allowed, so "nothing leaves your computer" stays true."""
    base = (value or os.environ.get("STUDIO_OLLAMA_BASE") or BASE).rstrip("/")
    host = urlparse(base).hostname or ""
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("Ollama must be running on this computer (127.0.0.1 or localhost).")
    return base


class Ollama:
    """A model running on the learner's own computer through Ollama (https://ollama.com). No key, no account, and
    nothing is sent over the internet."""

    name = "Ollama (on this computer)"
    local = True

    def __init__(self, model: str, base: str | None = None, timeout: float = 300.0):
        self.model = model
        self.base = local_base(base)
        # Local models can be slow, especially while loading, so allow a long read.
        self._http = httpx.Client(timeout=httpx.Timeout(timeout, connect=5.0))

    def _send(self, method: str, path: str, **kw) -> dict:
        try:
            r = self._http.request(method, f"{self.base}{path}", **kw)
        except (httpx.ConnectError, httpx.ConnectTimeout) as e:
            raise AiError("local_not_running", str(e)) from e
        except httpx.HTTPError as e:
            raise AiError("offline", str(e)) from e
        if r.status_code == 404:
            raise AiError("model_missing", r.text[:200])
        if r.status_code >= 400:
            raise AiError("server", f"{r.status_code} {r.text[:200]}")
        try:
            return r.json()
        except ValueError as e:
            raise AiError("bad_response", "not JSON") from e

    def installed(self) -> list[str]:
        """Names of the models installed in Ollama."""
        return sorted(m["name"] for m in self._send("GET", "/api/tags").get("models", []))

    def check_key(self) -> None:
        names = self.installed()
        wanted = self.model if ":" in self.model else f"{self.model}:latest"
        if self.model not in names and wanted not in names:
            raise AiError("model_missing", self.model)

    def generate(self, system: str, messages: list[Message], *, json_output: bool = False, temperature: float = 0.4) -> str:
        body: dict = {
            "model": self.model,
            "stream": False,
            "messages": [{"role": "system", "content": system}, *({"role": m.role, "content": m.text} for m in messages)],
            # The default context window is small and would silently cut off the course excerpts.
            "options": {"temperature": temperature, "num_ctx": 8192},
        }
        if json_output:
            body["format"] = "json"
        data = self._send("POST", "/api/chat", json=body)
        text = (data.get("message") or {}).get("content", "")
        if not text.strip():
            raise AiError("bad_response", "empty")
        return text
