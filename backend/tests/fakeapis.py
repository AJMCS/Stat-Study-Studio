"""Stand-ins for the Anthropic and OpenAI APIs: check the key, list models, record chat requests, answer from a script."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

KEY = "sk-good-key"


class FakeChatApi:
    """kind is "anthropic" or "openai". `replies` entries: str (model text), int (HTTP status), dict (raw error body + status via tuple)."""

    def __init__(self, kind, models):
        self.kind = kind
        self.models = list(models)
        self.requests: list[dict] = []
        self.replies: list = []
        self.reject_temperature = False
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

            def do_GET(self):
                if self._authorized():
                    self._json(200, {"data": [{"id": m} for m in fake.models]})

            def do_POST(self):
                if not self._authorized():
                    return
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                if fake.reject_temperature and "temperature" in body:
                    return self._json(400, {"error": {"message": "Unsupported value: 'temperature' does not support 0.2 with this model."}})
                fake.requests.append(body)
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
