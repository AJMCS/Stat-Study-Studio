from __future__ import annotations

import base64
import os

import httpx

from .errors import AiError
from .provider import Message

BASE = "https://generativelanguage.googleapis.com"
# Google renames models often; this alias always points at its current fast model. Learners can override it in Settings.
DEFAULT_MODEL = "gemini-flash-latest"


class Gemini:
    name = "Google Gemini"

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL, base: str | None = None, timeout: float = 60.0):
        self.model = model or DEFAULT_MODEL
        self.base = (base or os.environ.get("STUDIO_GEMINI_BASE") or BASE).rstrip("/")
        self._http = httpx.Client(timeout=timeout, headers={"x-goog-api-key": api_key})

    # ------------------------------------------------------------------ calls
    def _send(self, method: str, path: str, **kw) -> dict:
        try:
            r = self._http.request(method, f"{self.base}{path}", **kw)
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout, httpx.WriteTimeout, httpx.PoolTimeout, httpx.RemoteProtocolError) as e:
            raise AiError("offline", str(e)) from e
        except httpx.HTTPError as e:
            raise AiError("offline", str(e)) from e
        if r.status_code >= 400:
            raise _from_status(r)
        try:
            return r.json()
        except ValueError as e:
            raise AiError("bad_response", "not JSON") from e

    def check_key(self) -> None:
        """Listing models needs a valid key but costs no quota."""
        self._send("GET", "/v1beta/models", params={"pageSize": 1})

    def generate(self, system: str, messages: list[Message], *, json_output: bool = False, temperature: float = 0.4) -> str:
        body: dict = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": _contents(messages),
            "generationConfig": {"temperature": temperature},
        }
        if json_output:
            body["generationConfig"]["responseMimeType"] = "application/json"
        data = self._send("POST", f"/v1beta/models/{self.model}:generateContent", json=body)
        if data.get("promptFeedback", {}).get("blockReason"):
            raise AiError("blocked", data["promptFeedback"]["blockReason"])
        candidates = data.get("candidates") or []
        if not candidates:
            raise AiError("bad_response", "no candidates")
        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
        if not text.strip():
            reason = candidates[0].get("finishReason", "")
            raise AiError("blocked" if reason in ("SAFETY", "PROHIBITED_CONTENT", "RECITATION") else "bad_response", reason or "empty")
        return text


def _contents(messages: list[Message]) -> list[dict]:
    """Gemini wants the conversation to start with the user and to alternate; make it so without changing the meaning."""
    out: list[dict] = []
    for m in messages:
        role = "model" if m.role == "assistant" else "user"
        if not out and role == "model":
            out.append({"role": "user", "parts": [{"text": "(The student has just opened the conversation.)"}]})
        parts = [{"inlineData": {"mimeType": mime, "data": base64.b64encode(data).decode()}} for data, mime in m.images] + [{"text": m.text}]
        if out and out[-1]["role"] == role:
            if m.images:
                out[-1]["parts"].extend(parts)
            else:
                out[-1]["parts"][-1]["text"] += "\n\n" + m.text
        else:
            out.append({"role": role, "parts": parts})
    return out


def _from_status(r: httpx.Response) -> AiError:
    detail = ""
    try:
        detail = r.json().get("error", {}).get("message", "")
    except ValueError:
        pass
    code = r.status_code
    if code == 429:
        return AiError("rate_limited", detail)
    if code in (401, 403) or (code == 400 and "api key" in detail.lower()):
        return AiError("invalid_key", detail)
    if code >= 500:
        return AiError("server", detail)
    return AiError("bad_response", f"{code} {detail}")
