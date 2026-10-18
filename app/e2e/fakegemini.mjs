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

// The tutor script: reply n of a conversation. The conversation so far is (synthetic opener, tutor opening, learner 1, ...).
const tutorScript = (body) => {
  const n = (body.contents.length - 1) / 2;
  const say = (stage, text, extra = {}) => JSON.stringify({ reply: text, stage, plan: null, assessment: null, strengths: [], gaps: [], cites: [], ...extra });
  switch (n) {
    case 1: return say("diagnose", "Thanks. What exactly is being maximized in the likelihood?");
    case 2: return say("plan", "Here is what I found. You have the idea but not the notation yet.", { plan: ["Build intuition with a scenario", "Connect it to the lecture notation", "Write the formal statement"] });
    case 3: return say("build", "Imagine two classmates who each collect a sample. The likelihood in the notes treats the data as fixed.", { cites: [1] });
    case 4: return say("bridge", "Now write the formal statement using the lecture notation.");
    default: return say("done", "Nice work. Next, try the quiz.", { assessment: { core: 90, depth: 80, relevance: 70, application: 60 }, strengths: ["Core idea"], gaps: ["Applying it to a new case"] });
  }
};

const examScript = (_body, lastUser) => {
  const n = Number(/Number of questions: (\d+)/.exec(lastUser)?.[1] ?? 2);
  return JSON.stringify({
    questions: Array.from({ length: n }, (_, i) => ({
      concept: `Generated concept ${i + 1}`,
      prompt: `Generated question ${i + 1}: compute the MLE for a sample with $\\theta$ unknown.`,
      solution: `Generated solution ${i + 1}: write the log-likelihood, differentiate, solve.`,
      hint: `Generated hint ${i + 1}: start from the log-likelihood.`,
      keyPoints: ["Writes the log-likelihood", "Differentiates and solves", "Checks it is a maximum"],
      cites: [1],
    })),
  });
};

export function startFakeGemini(handlers = { "adaptive tutor": tutorScript, "written-solution exam questions": examScript }) {
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
