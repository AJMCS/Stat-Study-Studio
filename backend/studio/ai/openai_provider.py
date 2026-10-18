from __future__ import annotations

import base64
import os

import httpx

from .errors import AiError
from .provider import Message

BASE = "https://api.openai.com"
# Tried in this order against the models the learner's account can use; the newest match wins.
PREFERRED = (r"^gpt-[\d.]+-mini$", r"^gpt-[\d.]+$", r"^gpt-4o-mini$")


class OpenAI:
    name = "OpenAI"
    local = False

    def __init__(self, api_key: str, model: str = "", base: str | None = None, timeout: float = 90.0):
        self.model = model
        self.base = (base or os.environ.get("STUDIO_OPENAI_BASE") or BASE).rstrip("/")
        self._http = httpx.Client(timeout=timeout, headers={"Authorization": f"Bearer {api_key}"})

    def _send(self, method: str, path: str, **kw) -> dict:
        try:
            r = self._http.request(method, f"{self.base}{path}", **kw)
        except httpx.HTTPError as e:
            raise AiError("offline", str(e)) from e
        if r.status_code >= 400:
            raise _from_status(r)
        try:
            return r.json()
        except ValueError as e:
            raise AiError("bad_response", "not JSON") from e

    def models(self) -> list[str]:
        return [m["id"] for m in self._send("GET", "/v1/models").get("data", [])]

    def check_key(self) -> None:
        ids = self.models()
        if self.model and self.model not in ids:
            raise AiError("model_missing", self.model)

    def generate(self, system: str, messages: list[Message], *, json_output: bool = False, temperature: float = 0.4) -> str:
        body: dict = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, *(_message(m) for m in messages)],
        }
        if json_output:
            body["response_format"] = {"type": "json_object"}
        try:
            data = self._send("POST", "/v1/chat/completions", json={**body, "temperature": temperature})
        except AiError as e:
            # Some newer models only accept their default temperature; ask again without ours.
            if e.kind == "bad_response" and "temperature" in e.detail.lower():
                data = self._send("POST", "/v1/chat/completions", json=body)
            else:
                raise
        choices = data.get("choices") or []
        if not choices:
            raise AiError("bad_response", "no choices")
        choice = choices[0]
        text = (choice.get("message") or {}).get("content") or ""
        if not text.strip():
            raise AiError("blocked" if choice.get("finish_reason") == "content_filter" else "bad_response", choice.get("finish_reason") or "empty")
        return text


def _message(m: Message) -> dict:
    if not m.images:
        return {"role": m.role, "content": m.text}
    content = [{"type": "image_url", "image_url": {"url": f"data:{mime};base64,{base64.b64encode(data).decode()}"}} for data, mime in m.images]
    return {"role": m.role, "content": [*content, {"type": "text", "text": m.text}]}


def _from_status(r: httpx.Response) -> AiError:
    detail, code_name = "", ""
    try:
        err = r.json().get("error", {})
        detail, code_name = err.get("message", ""), err.get("code") or ""
    except (ValueError, AttributeError):
        pass
    code = r.status_code
    if code == 429 and code_name == "insufficient_quota":
        return AiError("billing", detail)
    if code == 429:
        return AiError("rate_limited", detail)
    if code in (401, 403):
        return AiError("invalid_key", detail)
    if code == 404 or code_name == "model_not_found":
        return AiError("model_missing", detail)
    if code >= 500:
        return AiError("server", detail)
    return AiError("bad_response", f"{code} {detail}")
