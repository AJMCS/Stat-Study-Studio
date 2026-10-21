"""Stand-ins for the Anthropic and OpenAI APIs: check the key, list models, record chat requests, answer from a script."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

KEY = "sk-good-key"


NOT_SCOPED = (
    "This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header with the ID "
    "of the workspace to use. Add the header, or use an API key that is scoped to a workspace."
)


class FakeChatApi:
    """kind is "anthropic" or "openai". `replies` entries: str (model text), int (HTTP status), dict (raw error body + status via tuple).

    Anthropic workspaces: with `require_workspace` on, /v1/models and /v1/messages answer the real API's 400 unless the
    request carries an `anthropic-workspace-id` that is one of `workspaces` ({"id", "name", optional "archived_at",
    optional "default": True for the Default Workspace}); an unknown one gets the 404, a malformed one the 400.
    GET /v1/organizations/workspaces lists them (the default one only with include_default=true), or answers 403 when
    `workspace_list_forbidden`. `request_headers[i]` are the headers of `requests[i]`."""

    def __init__(self, kind, models):
        self.kind = kind
        self.models = list(models)
        self.requests: list[dict] = []
        self.request_headers: list[dict] = []
        self.replies: list = []
        self.reject_temperature = False
        self.require_workspace = False
        self.workspaces: list[dict] = []
        self.workspace_list_forbidden = False
        self.workspace_list_calls = 0
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _json(self, code, obj):
                data = json.dumps(obj).encode()
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def _authorized(self):
                got = self.headers.get("x-api-key") if fake.kind == "anthropic" else (self.headers.get("Authorization") or "").removeprefix("Bearer ")
                if got != KEY:
                    self._json(401, {"error": {"message": "invalid x-api-key" if fake.kind == "anthropic" else "Incorrect API key provided", "code": "invalid_api_key"}})
                    return False
                if fake.kind == "anthropic" and self.headers.get("anthropic-version") is None:
                    self._json(400, {"error": {"message": "anthropic-version header is required"}})
                    return False
                return True

            def _workspace_ok(self):
                """The Anthropic workspace rule for /v1/models and /v1/messages; True when the request may go on."""
                if fake.kind != "anthropic" or not fake.require_workspace:
                    return True
                got = self.headers.get("anthropic-workspace-id")
                if got is None:
                    self._json(400, {"type": "error", "error": {"type": "invalid_request_error", "message": NOT_SCOPED}})
                    return False
                if not got.startswith("wrkspc_"):
                    self._json(400, {"type": "error", "error": {"type": "invalid_request_error", "message": "anthropic-workspace-id header must be a valid workspace ID."}})
                    return False
                if got not in [w["id"] for w in fake.workspaces if not w.get("archived_at")]:
                    self._json(404, {"type": "error", "error": {"type": "not_found_error", "message": f"Workspace `{got}` not found."}})
                    return False
                return True

            def do_GET(self):
                if not self._authorized():
                    return
                path, _, query = self.path.partition("?")
                if fake.kind == "anthropic" and path == "/v1/organizations/workspaces":
                    fake.workspace_list_calls += 1
                    if fake.workspace_list_forbidden:
                        return self._json(403, {"type": "error", "error": {"type": "permission_error", "message": "This API key does not have permission to list workspaces."}})
                    with_default = "include_default=true" in query
                    rows = [{"archived_at": None, **w} for w in fake.workspaces if with_default or not w.get("default")]
                    return self._json(200, {"data": rows, "has_more": False})
                if self._workspace_ok():
                    self._json(200, {"data": [{"id": m} for m in fake.models]})

            def do_POST(self):
                if not self._authorized() or not self._workspace_ok():
                    return
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                if fake.reject_temperature and "temperature" in body:
                    return self._json(400, {"error": {"message": "Unsupported value: 'temperature' does not support 0.2 with this model."}})
                fake.requests.append(body)
                fake.request_headers.append({k.lower(): v for k, v in self.headers.items()})
                reply = fake.replies[min(len(fake.requests) - 1, len(fake.replies) - 1)] if fake.replies else "ok"
                if isinstance(reply, tuple):
                    return self._json(reply[0], reply[1])
                if isinstance(reply, int):
                    return self._json(reply, {"error": {"message": "scripted failure"}})
                if fake.kind == "anthropic":
                    self._json(200, {"content": [{"type": "text", "text": reply}], "stop_reason": "end_turn"})
                else:
                    self._json(200, {"choices": [{"message": {"role": "assistant", "content": reply}, "finish_reason": "stop"}]})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()
