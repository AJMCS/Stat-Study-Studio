from __future__ import annotations

import base64
import re

import httpx

from .errors import AiError
from .provider import Message

BASE = "https://api.anthropic.com"
VERSION = "2023-06-01"
# Tried in this order against the models the learner's account can use; the newest match wins.
PREFERRED = (r"^claude-haiku-[\d-]+$", r"^claude-sonnet-[\d-]+$", r"^claude-haiku-", r"^claude-sonnet-")


class Claude:
    name = "Anthropic Claude"
    local = False

    def __init__(self, api_key: str, model: str = "", workspace: str | None = None, base: str | None = None, timeout: float = 90.0):
        import os

        self.model = model
        # A key made for every workspace of the organisation must name the workspace on each request; a key made for
        # one workspace needs no header. Without it the API answers 400 "not scoped to a workspace" (see _from_status).
        self.workspace = workspace or None
        self.base = (base or os.environ.get("STUDIO_ANTHROPIC_BASE") or BASE).rstrip("/")
        headers = {"x-api-key": api_key, "anthropic-version": VERSION}
        if self.workspace:
            headers["anthropic-workspace-id"] = self.workspace
        self._http = httpx.Client(timeout=timeout, headers=headers)

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
        return [m["id"] for m in self._send("GET", "/v1/models", params={"limit": 100}).get("data", [])]

    def workspaces(self) -> list[dict]:
        """The organisation's workspaces this key may use, as [{"id", "name"}] without the archived ones. A key that is
        not scoped to a workspace is accepted by this Admin API endpoint; when the account's role is refused it (401/403,
        or a 404 from an account without the endpoint) the answer is [] rather than an error, so the caller can ask the
        learner for the ID instead."""
        try:
            r = self._http.get(f"{self.base}/v1/organizations/workspaces", params={"include_default": "true", "limit": 100})
        except httpx.HTTPError as e:
            raise AiError("offline", str(e)) from e
        if r.status_code in (401, 403, 404):
            return []
        if r.status_code >= 400:
            raise _from_status(r)
        try:
            rows = r.json().get("data", [])
        except (ValueError, AttributeError) as e:
            raise AiError("bad_response", "not JSON") from e
        return [{"id": w["id"], "name": w.get("name") or w["id"]} for w in rows if isinstance(w, dict) and w.get("id") and not w.get("archived_at")]

    def check_key(self) -> None:
        ids = self.models()
        if self.model and self.model not in ids:
            raise AiError("model_missing", self.model)

    def generate(self, system: str, messages: list[Message], *, json_output: bool = False, temperature: float = 0.4) -> str:
        # No sampling parameters: current Claude models reject any non-default temperature with a 400, which used to
        # surface here as "unreadable" on every request. The model's default sampling is right for these tasks anyway.
        # max_tokens is a ceiling, not a target: the newer models think before answering (that costs output tokens),
        # and a page transcription can be long, so give them room rather than truncating mid-answer.
        del temperature
        body = {
            "model": self.model,
            "max_tokens": 16000,
            "system": system + ("\n\nReply with the JSON document only, no other text." if json_output else ""),
            "messages": _alternating(messages),
        }
        data = self._send("POST", "/v1/messages", json=body)
        if data.get("stop_reason") == "refusal":
            raise AiError("blocked", "refusal")
        text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
        if not text.strip():
            raise AiError("bad_response", data.get("stop_reason") or "empty")
        return text


def _alternating(messages: list[Message]) -> list[dict]:
    """Claude wants the conversation to start with the user and to alternate."""
    out: list[dict] = []
    for m in messages:
        role = "assistant" if m.role == "assistant" else "user"
        if not out and role == "assistant":
            out.append({"role": "user", "content": "(The student has just opened the conversation.)"})
        content = m.text
        if m.images:  # images first, then the instruction, as a list of blocks
            content = [{"type": "image", "source": {"type": "base64", "media_type": mime, "data": base64.b64encode(data).decode()}} for data, mime in m.images]
            content.append({"type": "text", "text": m.text})
        if out and out[-1]["role"] == role and isinstance(content, str) and isinstance(out[-1]["content"], str):
            out[-1]["content"] += "\n\n" + content
        else:
            out.append({"role": role, "content": content})
    return out


def _image_error(detail: str) -> bool:
    """The service refused the request because of the picture in it (a drawing, a page photo)."""
    return bool(re.search(r"image|vision", detail, re.IGNORECASE))


def _from_status(r: httpx.Response) -> AiError:
    detail = ""
    try:
        detail = r.json().get("error", {}).get("message", "")
    except (ValueError, AttributeError):
        pass
    code = r.status_code
    low = detail.lower()
    if code == 400 and "credit balance" in low:
        return AiError("billing", detail)
    # A key made for every workspace of the organisation: the request must say which one (anthropic-workspace-id).
    if code == 400 and "not scoped to a workspace" in low:
        return AiError("workspace_needed", detail)
    if code == 400 and "must be a valid workspace id" in low:
        return AiError("workspace_invalid", detail)
    if code == 404 and low.startswith("workspace") and "not found" in low:
        return AiError("workspace_invalid", detail)
    if code in (401, 403):
        return AiError("invalid_key", detail)
    if code == 402:
        return AiError("billing", detail)
    if code == 404:
        return AiError("model_missing", detail)
    if code == 429:
        return AiError("rate_limited", detail)
    if code >= 500:
        return AiError("server", detail)
    if code == 400 and _image_error(detail):
        return AiError("image_unsupported", detail)
    if code == 400:
        # The service understood us and said no (a parameter it does not accept, an oversized image, ...). That is a
        # fault in the app's request, not a transient glitch: say what the service said instead of "retry".
        return AiError("rejected", detail or "the request was rejected")
    return AiError("bad_response", f"{code} {detail}")
