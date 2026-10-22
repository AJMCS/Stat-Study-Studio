from __future__ import annotations

import base64
import os
import re
from urllib.parse import urlparse

import httpx

from .errors import AiError
from .provider import Message

BASE = "http://127.0.0.1:11434"
# How long Ollama keeps the model in memory after a request. Its default is five minutes, which is shorter than a
# study session, so the learner would pay the load time again after every pause.
KEEP_ALIVE = "30m"
# The context window asked for: Ollama's own default (2048) would silently cut the start off a long prompt such as the
# path builder's catalogue, so it is sized to the request, between these bounds. Tokens are estimated at 3.5
# characters each, plus room for the reply.
MIN_CTX, MAX_CTX = 8192, 32768
REPLY_TOKENS = 2048
CHARS_PER_TOKEN = 3.5
# A text-only model that is sent a picture answers an error that mentions images (or vision).
_IMAGE_ERROR = re.compile(r"image|vision", re.IGNORECASE)


def local_base(value: str | None = None) -> str:
    """The Ollama address. Only this computer is allowed, so "nothing leaves your computer" stays true."""
    base = (value or os.environ.get("STUDIO_OLLAMA_BASE") or BASE).rstrip("/")
    host = urlparse(base).hostname or ""
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("Ollama must be running on this computer (127.0.0.1 or localhost).")
    return base


def context_size(system: str, messages: list[Message]) -> int:
    """The num_ctx for a request: the prompt's estimated tokens plus the reply, rounded up to a power of two and kept
    between MIN_CTX and MAX_CTX. Short prompts keep MIN_CTX."""
    chars = len(system) + sum(len(m.text) for m in messages)
    need = chars / CHARS_PER_TOKEN + REPLY_TOKENS
    size = MIN_CTX
    while size < need and size < MAX_CTX:
        size *= 2
    return size


def _message(m: Message) -> dict:
    out: dict = {"role": m.role, "content": m.text}
    if m.images:
        out["images"] = [base64.b64encode(data).decode() for data, _ in m.images]
    return out


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
        if r.status_code >= 400 and _IMAGE_ERROR.search(r.text):
            raise AiError("image_unsupported", r.text[:200])
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

    def warm(self) -> None:
        """Load the model into memory now and keep it there, so the first real request does not pay the load time.
        Ollama treats a chat request with no messages as exactly that. Blocks until the model is loaded."""
        self._send("POST", "/api/chat", json={"model": self.model, "messages": [], "keep_alive": KEEP_ALIVE})

    def generate(self, system: str, messages: list[Message], *, json_output: bool = False, temperature: float = 0.4) -> str:
        body: dict = {
            "model": self.model,
            "stream": False,
            "messages": [{"role": "system", "content": system}, *(_message(m) for m in messages)],
            "options": {"temperature": temperature, "num_ctx": context_size(system, messages)},
            "keep_alive": KEEP_ALIVE,
        }
        if json_output:
            body["format"] = "json"
        data = self._send("POST", "/api/chat", json=body)
        text = (data.get("message") or {}).get("content", "")
        if not text.strip():
            raise AiError("bad_response", "empty")
        return text
