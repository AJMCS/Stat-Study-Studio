"""A stand-in for the Gemini API: checks the key, records every request, and answers from a script."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VALID_KEY = "good-key-123"


class FakeGemini:
    def __init__(self):
        self.requests: list[dict] = []  # generateContent bodies, in order
        self.replies: list = []  # str (model text), int (HTTP status) or callable(body) -> str; the last one repeats
        self.listed = 0
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
                if self.headers.get("x-goog-api-key") != VALID_KEY:
                    self._json(400, {"error": {"code": 400, "message": "API key not valid. Please pass a valid API key."}})
                    return False
                return True

            def do_GET(self):
                if not self._authorized():
                    return
                fake.listed += 1
                self._json(200, {"models": [{"name": "models/gemini-flash-latest"}]})

            def do_POST(self):
                if not self._authorized():
                    return
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                body["_path"] = self.path
                fake.requests.append(body)
                reply = fake.replies[min(len(fake.requests) - 1, len(fake.replies) - 1)] if fake.replies else "ok"
                if callable(reply):
                    reply = reply(body)
                if isinstance(reply, int):
                    self._json(reply, {"error": {"code": reply, "message": "scripted failure"}})
                else:
                    self._json(200, {"candidates": [{"content": {"parts": [{"text": reply}]}, "finishReason": "STOP"}]})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()
