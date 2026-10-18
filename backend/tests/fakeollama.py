"""A stand-in for a local Ollama: lists installed models, records chat requests, answers from a script."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class FakeOllama:
    def __init__(self, models=("llama3.2:latest",)):
        self.models = list(models)
        self.requests: list[dict] = []
        self.replies: list = []
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

            def do_GET(self):
                self._json(200, {"models": [{"name": m} for m in fake.models]})

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                fake.requests.append(body)
                reply = fake.replies[min(len(fake.requests) - 1, len(fake.replies) - 1)] if fake.replies else "ok"
                if isinstance(reply, int):
                    self._json(reply, {"error": "scripted"})
                else:
                    self._json(200, {"message": {"role": "assistant", "content": reply}, "done": True})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()
