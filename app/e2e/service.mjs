import { readFile } from "node:fs/promises";
import { launchBrowser } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN ?? "http://127.0.0.1:8765";
const BASE = `${ORIGIN}/#`;
const browser = await launchBrowser();
const problems = [];

const step = async (name, fn) => {
  try {
    await fn();
    console.log("ok  ", name);
  } catch (e) {
    console.log("FAIL", name, "-", e.message.split("\n")[0]);
    problems.push(`${name}: ${e.message.split("\n")[0]}`);
  }
};
const newPage = async (ctx) => {
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  if (process.env.TRACE) {
    const t0 = Date.now();
    page.on("response", (r) => r.request().method() !== "GET" && console.log(`     [${Date.now() - t0}ms] ${r.request().method()} ${r.url().split("/api/")[1]} ${r.status()}`));
  }
  return page;
};

/** Recall flow: write, compare with the reference, tick everything, save. */
const recall = async (page, text) => {
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", text);
  await page.click("button:has-text('Compare with the reference')");
  await page.waitForSelector("h3:has-text('Reference solution')");
  for (const box of await page.locator("fieldset input[type=checkbox]").all()) await box.check();
  await page.click("button:has-text('Save my self-score')");
  await page.waitForSelector(".composite");
};
const state = async (page) => (await page.request.get(`${ORIGIN}/api/state`)).json();

const legacy = {
  attempts: [{ id: "old1", topicId: "maximum-likelihood-estimation", at: "2026-10-01T10:00:00.000Z", kind: "quiz", counted: true, composite: 66, criteria: { core: 66, depth: 66, relevance: 66, application: 66 }, note: "graded quiz" }],
  quizzes: [], exams: [], topicState: {}, session: null,
  collections: [{ id: "general", name: "General", consent: false, searchByDefault: true }],
  files: [], hostedDisclosureAck: false, chats: {},
};

// ---- 1. one-time migration from the old browser storage
const ctx1 = await browser.newContext({ viewport: { width: 1100, height: 900 } });
await step("migration: old browser data moves into the service", async () => {
  await ctx1.addInitScript((blob) => {
    if (!localStorage.getItem("stats132-studio-v1") && !localStorage.getItem("seeded")) {
      localStorage.setItem("stats132-studio-v1", JSON.stringify(blob));
      localStorage.setItem("seeded", "1");
    }
  }, legacy);
  const page = await newPage(ctx1);
  await page.goto(BASE + "/");
  await page.waitForSelector("text=moved into the study service");
  const s = await state(page);
  if (!s.initialized || s.state.attempts.length !== 1 || s.state.attempts[0].id !== "old1") throw new Error("service did not receive the old attempt");
  const keys = await page.evaluate(() => [localStorage.getItem("stats132-studio-v1"), localStorage.getItem("stats132-studio-v1-backup-before-service")]);
  if (keys[0] !== null || keys[1] === null) throw new Error("legacy key was not retired with a backup");
  await page.goto(BASE + "/progress");
  await page.waitForSelector("text=Stats 132 summary");
  await page.waitForSelector("text=Not started", { state: "attached" }).catch(() => {});
});

// ---- 2. progress survives clearing browser storage (and a brand-new browser profile)
await step("progress survives wiping browser storage", async () => {
  const page = ctx1.pages()[0];
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();
  await page.goto(BASE + "/progress");
  await page.waitForSelector("text=Maximum Likelihood Estimation");
  const text = await page.locator("main").innerText();
  if (text.includes("No saved attempts yet")) throw new Error("progress was lost");
});
await step("progress is visible from a brand-new browser profile", async () => {
  const ctx = await browser.newContext();
  const page = await newPage(ctx);
  await page.goto(BASE + "/progress");
  await page.waitForSelector("text=Stats 132 summary");
  const text = await page.locator("main").innerText();
  if (text.includes("No saved attempts yet")) throw new Error("new profile did not see saved progress");
  await ctx.close();
});

// ---- 3. new work is saved to the service
await step("a recall attempt is saved to the service", async () => {
  const page = ctx1.pages()[0];
  await page.goto(BASE + "/topic/maximum-likelihood-estimation");
  await recall(page, "The MLE maximizes the likelihood because it makes the observed data most probable, for example with n=10.");
  await page.waitForTimeout(600);
  const s = await state(page);
  if (s.state.attempts.length !== 2) throw new Error(`expected 2 attempts saved, got ${s.state.attempts.length}`);
  if (!s.state.topicState["maximum-likelihood-estimation"]) throw new Error("topic state not saved");
});

// ---- 4. service unreachable
await step("unreachable service shows a clear screen and recovers", async () => {
  const page = ctx1.pages()[0];
  await page.route("**/api/**", (r) => r.abort());
  await page.reload();
  await page.waitForSelector("text=Can't reach the study service");
  await page.unroute("**/api/**");
  await page.click("button:has-text('Try again')");
  await page.waitForSelector("nav");
});

// ---- 5. failed save is surfaced, nothing is lost, retry works
await step("failed save shows a banner and retry succeeds", async () => {
  const page = ctx1.pages()[0];
  await page.goto(BASE + "/");
  await page.waitForSelector("nav");
  await page.route("**/api/state/**", (r) => r.abort());
  await page.goto(BASE + "/topic/frequentist-vs-bayesian");
  await recall(page, "A likelihood is the data's probability as a function of the parameter because the data are fixed.");
  await page.waitForSelector("text=Try saving again");
  await page.unroute("**/api/state/**");
  await page.click("button:has-text('Try saving again')");
  await page.waitForSelector("text=Try saving again", { state: "detached" });
  const s = await state(page);
  if (s.state.attempts.length !== 3) throw new Error(`expected 3 attempts after retry, got ${s.state.attempts.length}`);
});

// ---- 6. export and delete go through the service
await step("export contains saved data; delete empties the service", async () => {
  const page = ctx1.pages()[0];
  await page.goto(BASE + "/settings");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("button:has-text('Export my data')")]);
  const body = JSON.parse(await readFile(await dl.path(), "utf8"));
  if (body.data.attempts.length !== 3) throw new Error("export missing attempts");
  await page.click("button:has-text('Delete all my data')");
  await page.click("button:has-text('Yes, delete everything')");
  await page.waitForTimeout(500);
  const s = await state(page);
  if (s.initialized || s.state.attempts.length !== 0) throw new Error("service still holds data after delete");
});

// ---- 7. foreign pages cannot touch the service
await step("another website cannot read or change study data", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("about:blank");
  await page.setContent("<html><body>evil</body></html>");
  const result = await page.evaluate(async (origin) => {
    const out = {};
    try {
      const r = await fetch(`${origin}/api/state`, { mode: "cors" });
      out.read = r.status;
    } catch (e) {
      out.read = "blocked";
    }
    try {
      const r = await fetch(`${origin}/api/data`, { method: "DELETE", mode: "cors" });
      out.delete = r.status;
    } catch (e) {
      out.delete = "blocked";
    }
    return out;
  }, ORIGIN);
  console.log("     from a foreign page:", JSON.stringify(result));
  if (result.read !== "blocked" || result.delete === 200) throw new Error("foreign page could reach the service");
  await ctx.close();
});

console.log("\nPROBLEMS:", problems.length ? "\n" + problems.join("\n") : "none");
await browser.close();
process.exit(problems.length ? 1 : 0);
