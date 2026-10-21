// A stand-in for the Gemini API so the browser tests can exercise the AI features without a real key or network.
// GET /__log returns every generateContent request it has received. A learner text containing FAILME makes it answer 429.
import { createServer } from "node:http";

export const GOOD_KEY = "good-key-123";

const rubric = () => ({
  note: "You have the heart of it: the likelihood is the data seen as a function of the parameter, and the MLE is where it peaks. Next time, say in one sentence why that peak is a sensible estimate.",
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

// The path the fake builds for the MLE ask ("I can follow the steps but don't see why the answer is one over the
// mean, or how to get its standard error"): it does not re-teach the steps, says what it covers and leaves out, and
// its concepts are the vocabulary's own terms. The design shots seed the same path (e2e/shots.mjs), so the two agree.
export const MLE_PATH = {
  title: "The MLE of an exponential rate",
  fileTitle: "From your homework: the MLE of a rate",
  goal: "You will be able to find the MLE of an exponential rate from a sample of waiting times, check it is a maximum, and say why it comes out as one over the mean.",
  covers: "why the rate's MLE comes out as one over the mean and how to check it is a maximum; it takes your word that you can run the four steps, so it does not go over them again.",
  leavesOut: "the standard error of that estimator: it needs the sampling-distribution ideas from two topics on and would double the path, so build a second path for it once this one holds.",
  concepts: ["Log likelihood", "Candidate MLE", "Second-derivative check"],
  steps: [
    ["vocab", "vocab:maximum-likelihood-estimation", "Check the words you will lean on", "A quick pass, not a lesson: you can run the steps, so just make sure log likelihood, candidate MLE and the second-derivative check mean what you think before the path leans on them."],
    ["tutorial", "tutorial:maximum-likelihood-estimation:3", "The worked patterns, exponential among them", "You can run the procedure, so this skips it and goes straight to the patterns: the exponential's answer is n over the sum, which is the thing you want to see through."],
    ["explain", "", "Why a rate comes out as one over the mean", "Lecture 6 asks exactly this about wait times and leaves the solution blank, so here it is in words."],
    ["example", "example:maximum-likelihood-estimation:4:2", "Try the exponential example yourself", "Now do one with numbers, on paper, before you look at the solution."],
    ["quiz", "quiz:maximum-likelihood-estimation", "Prove it with the quiz", "Ten questions, marked for you, so you know it rather than recognise it."],
  ],
  explanation:
    "For waiting times $x_1,\\dots,x_n$ from an exponential with rate $\\lambda$, the log-likelihood is $\\ell(\\lambda)=n\\log\\lambda-\\lambda\\sum x_i$. Setting $\\ell'(\\lambda)=0$ gives $\\hat\\lambda = n/\\sum x_i = 1/\\bar x$: a long average wait means a small rate, which is exactly what a rate is. The second derivative, $-n/\\lambda^2$, is negative everywhere, so this is the maximum, and by invariance the MLE of the average wait is $1/\\hat\\lambda=\\bar x$.",
};

// The path builder: uses the catalogue ids the system prompt lists (so every ref exists in the app), writes one
// explanation that cites the course excerpt from a lecture on maximum likelihood (the first excerpt if none is), and
// ends with the quiz. A file that was read gets a title saying so.
const pathScript = (body) => {
  const system = body.systemInstruction?.parts?.[0]?.text ?? "";
  const user = [...body.contents].reverse().find((c) => c.role === "user")?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const ids = new Set([...system.matchAll(/^- ([a-z]+:[^ |]+) \| /gm)].map((m) => m[1]));
  const excerpts = [...system.matchAll(/^\[S(\d+)\] ([^\n]*)/gm)].map((m) => ({ n: Number(m[1]), head: m[2] }));
  const cite = excerpts.find((x) => /^Lecture \d+: Maximum Likelihood/i.test(x.head))?.n ?? excerpts[0]?.n;
  const file = /Text read from the student's file "([^"]+)"/.exec(user)?.[1];
  return JSON.stringify({
    title: file ? MLE_PATH.fileTitle : MLE_PATH.title,
    goal: MLE_PATH.goal,
    covers: MLE_PATH.covers,
    leavesOut: MLE_PATH.leavesOut,
    concepts: MLE_PATH.concepts,
    steps: MLE_PATH.steps.map(([kind, ref, title, why]) => ({
      kind,
      ref: kind === "explain" ? "" : ids.has(ref) ? ref : ([...ids].find((x) => x.startsWith(`${kind}:`)) ?? ref),
      title,
      why,
      text: kind === "explain" ? MLE_PATH.explanation : "",
      cites: kind === "explain" && cite ? [cite] : [],
    })),
  });
};

const transcribeScript = () =>
  JSON.stringify({
    text: "Nebulous quokka identity: the posterior is proportional to the likelihood times the prior, $p(\\theta \\mid x) \\propto p(x \\mid \\theta)\\,p(\\theta)$.",
    unclear: ["a smudged subscript"],
  });

export function startFakeGemini(handlers = { "adaptive tutor": tutorScript, "written-solution exam questions": examScript, "transcribe one page": transcribeScript, "custom learning path": pathScript }) {
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
