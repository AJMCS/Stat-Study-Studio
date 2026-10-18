// A stand-in for the Gemini API so the browser tests can exercise the AI features without a real key or network.
// GET /__log returns every generateContent request it has received. A learner text containing FAILME makes it answer 429.
import { createServer } from "node:http";

export const GOOD_KEY = "good-key-123";

const rubric = () => ({
  core: { score: 90, feedback: "You named the central idea clearly.", suggestion: "Say what is being maximized in the first sentence." },
  depth: { score: 85, feedback: "You gave a reason, not only a definition.", suggestion: "Add one more because-step." },
  relevance: { score: 82, feedback: "You said why it matters.", suggestion: "Connect it to a decision." },
  application: { score: 88, feedback: "Your example was apt.", suggestion: "Try a second example." },
});

export function startFakeGemini(handlers = {}) {
  const log = [];
  const server = createServer((req, res) => {
    const send = (code, obj) => {
      const body = JSON.stringify(obj);
      res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
      res.end(body);
    };
    if (req.url === "/__log") return send(200, log);
    if (req.headers["x-goog-api-key"] !== GOOD_KEY) return send(400, { error: { code: 400, message: "API key not valid. Please pass a valid API key." } });
    if (req.method === "GET") return send(200, { models: [{ name: "models/gemini-flash-latest" }] });
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw);
      log.push(body);
      const system = body.systemInstruction?.parts?.[0]?.text ?? "";
      const lastUser = [...body.contents].reverse().find((c) => c.role === "user")?.parts?.[0]?.text ?? "";
      if (lastUser.includes("FAILME")) return send(429, { error: { code: 429, message: "quota" } });
      let text;
      for (const [needle, make] of Object.entries(handlers)) if (system.includes(needle)) text = make(body, lastUser);
      if (text === undefined && system.includes("You score a student")) text = JSON.stringify(rubric());
      if (text === undefined) return send(500, { error: { code: 500, message: "fake has no script for this prompt" } });
      send(200, { candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }] });
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })),
  );
}
