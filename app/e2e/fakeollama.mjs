// A stand-in for a local Ollama so the browser tests can drive the "model on this computer" option.
// GET /__log returns every chat request. A learner text containing FAILME makes it answer 500. Like most local models
// it is text-only: a request that carries a picture gets Ollama's 400, and the app asks again without it.
import { createServer } from "node:http";

const scores = () => ({
  core: { score: 75, feedback: "The local model saw the central idea.", suggestion: "Be more specific." },
  depth: { score: 70, feedback: "Some reasoning was given.", suggestion: "Explain why." },
  relevance: { score: 72, feedback: "Purpose was mentioned.", suggestion: "Say what it lets you decide." },
  application: { score: 68, feedback: "An example would help.", suggestion: "Add one." },
});

export function startFakeOllama() {
  const log = [];
  const server = createServer((req, res) => {
    const send = (code, obj) => {
      const body = JSON.stringify(obj);
      res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
      res.end(body);
    };
    if (req.url === "/__log") return send(200, log);
    if (req.method === "GET") return send(200, { models: [{ name: "llama3.2:latest" }, { name: "qwen2.5:7b" }] });
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw);
      log.push(body);
      if (body.messages.some((m) => m.images?.length)) return send(400, { error: `${body.model} does not support images` });
      const last = body.messages.at(-1)?.content ?? "";
      if (last.includes("FAILME")) return send(500, { error: "boom" });
      send(200, { message: { role: "assistant", content: JSON.stringify(scores()) }, done: true });
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })),
  );
}
