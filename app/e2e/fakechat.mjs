// A stand-in for the Anthropic and OpenAI APIs (told apart by how the key is sent) for the browser tests.
import { createServer } from "node:http";

export const CHAT_KEY = "sk-good-key";

const scores = () => ({
  core: { score: 80, feedback: "The hosted model saw the central idea.", suggestion: "Be specific." },
  depth: { score: 78, feedback: "Reasoning was given.", suggestion: "Add a step." },
  relevance: { score: 76, feedback: "Purpose was mentioned.", suggestion: "Say what it decides." },
  application: { score: 74, feedback: "An example helped.", suggestion: "Add another." },
});

export function startFakeChat() {
  const log = [];
  const server = createServer((req, res) => {
    const send = (code, obj) => {
      const body = JSON.stringify(obj);
      res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
      res.end(body);
    };
    if (req.url === "/__log") return send(200, log);
    const anthropic = req.headers["x-api-key"] !== undefined;
    const key = anthropic ? req.headers["x-api-key"] : (req.headers.authorization ?? "").replace("Bearer ", "");
    if (key !== CHAT_KEY) return send(401, { error: { message: "invalid key", code: "invalid_api_key" } });
    if (req.method === "GET") {
      return send(200, { data: (anthropic ? ["claude-opus-5-5", "claude-haiku-4-5"] : ["gpt-5.4-mini", "gpt-5.5"]).map((id) => ({ id })) });
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      log.push({ kind: anthropic ? "anthropic" : "openai", ...JSON.parse(raw) });
      const text = JSON.stringify(scores());
      send(200, anthropic ? { content: [{ type: "text", text }], stop_reason: "end_turn" } : { choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }] });
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })),
  );
}
