// Renders the app for design review: screenshots of pages in dark and light mode at desktop and phone widths, and a
// filmstrip of the opening animation.
//
//   node e2e/shots.mjs <outDir> [routes...]        e.g. node e2e/shots.mjs ../design/shots/round1 / /learn /practice
//   node e2e/shots.mjs <outDir> --intro            filmstrip of the intro, both themes
//   node e2e/shots.mjs <outDir> --onboarding       first-run setup, both themes
//   node e2e/shots.mjs <outDir> --onboarding --empty --connect   ...plus a refused key and the connected last slide
//   node e2e/shots.mjs <outDir> [routes...] --paths    ...plus custom learning paths, desktop only: Learn with two
//                                                    saved paths (one half done) and with no AI service, the new-path
//                                                    screen empty, with a text ask and a read file, with the proposed
//                                                    path, and with a photo read by OCR, and a path 2 of 5 done and
//                                                    fully done (the latter also with no AI service)
//   node e2e/shots.mjs <outDir> [routes...] --states   ...plus the learning activities' key states: a revealed
//                                                    flashcard, a marked quiz definition, a marked comprehension check
//                                                    (and its "Why"), a step with its first question marked and the
//                                                    rest pending, a step whose check was skipped, the checks summary
//                                                    and the whole checks page, a revealed breakdown, and the "Which
//                                                    tool?" problems before and after the tool step (each of the
//                                                    three revealed through its plan, as a full page)
//
// It starts the real service on a throwaway data folder (port 8797), so nothing on this machine is touched.
// Contract with the app: localStorage "studio-theme" = "dark" | "light"; sessionStorage "studio-intro-seen" = "1" skips
// the intro; PUT /api/state/onboarding {"done": true} marks first-run setup as finished.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { launchBrowser } from "./browser.mjs";
import { GOOD_KEY, MLE_PATH, startFakeGemini } from "./fakegemini.mjs";
import { HOMEWORK_NAME, HOMEWORK_PDF, HOMEWORK_PHOTO_NAME, renderPhoto } from "./fixtures.mjs";

const root = resolve(import.meta.dirname, "../..");
const python = join(root, "venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const port = 8797;
const origin = `http://127.0.0.1:${port}`;
const [outDir, ...rest] = process.argv.slice(2);
if (!outDir) throw new Error("usage: node e2e/shots.mjs <outDir> [routes...|--intro|--onboarding]");
mkdirSync(outDir, { recursive: true });
const dataDir = mkdtempSync(join(tmpdir(), "studio-shots-"));
// --connect (with --onboarding) also films the Connect slide with a refused key and the last slide after connecting,
// against a stand-in for Gemini so no real key or network is needed.
const connectShots = rest.includes("--connect");
// --paths builds a path against the same stand-in, so it needs it too
const pathShots = rest.includes("--paths");
const gemini = connectShots || pathShots ? await startFakeGemini() : null;
const server = spawn(python, ["-m", "studio.server", "--no-browser", "--port", String(port)], {
  cwd: join(root, "backend"),
  env: { ...process.env, STUDIO_DATA_DIR: dataDir, STUDIO_AUTOCHECK: "0", STUDIO_KEYSTORE: "file", ...(gemini ? { STUDIO_GEMINI_BASE: gemini.url } : {}) },
  stdio: "ignore",
});
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(`${origin}/api/health`)).ok) break;
  } catch {
    /* starting */
  }
  await new Promise((r) => setTimeout(r, 500));
}

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const browser = await launchBrowser();
const slug = (r) => (r === "/" ? "home" : r.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-"));

async function newPage(theme, vp, { intro = false } = {}) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], reducedMotion: "no-preference" });
  await ctx.addInitScript(
    ([t, skip]) => {
      try {
        localStorage.setItem("studio-theme", t);
        if (skip) sessionStorage.setItem("studio-intro-seen", "1");
        sessionStorage.setItem("studio-shuffle", "1"); // flashcard and quiz decks are shuffled per session; keep the order repeatable
      } catch {
        /* storage blocked */
      }
    },
    [theme, !intro],
  );
  return { ctx, page: await ctx.newPage() };
}

const setOnboarding = (done) =>
  fetch(`${origin}/api/state/onboarding`, { method: "PUT", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ done }) }).catch(() => {});

// A plausible mid-semester learner, so diagrams sized by mastery show real variety. Pass --empty to skip it.
const put = (slice, value) =>
  fetch(`${origin}/api/state/${slice}`, { method: "PUT", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(value) });
async function seed() {
  const crit = (n) => ({ core: n, depth: n, relevance: n, application: n });
  const day = (d) => new Date(Date.UTC(2026, 9, d, 15)).toISOString();
  const plan = [
    ["probability-review-and-inference", [78, 88, 92], false],
    ["frequentist-vs-bayesian", [70, 84], false],
    ["posterior-distribution", [55, 68], false],
    ["loss-functions-bayes-estimators", [62, 48], true],
  ];
  const attempts = [];
  const topicState = {};
  let n = 0;
  for (const [topicId, scores, flagged] of plan) {
    scores.forEach((c, i) => attempts.push({ id: `seed-${n++}`, topicId, at: day(3 + n), kind: i === 0 ? "quiz" : "recall", counted: true, composite: c, criteria: crit(c) }));
    topicState[topicId] = { streak: flagged ? 0 : scores.filter((c) => c >= 80).length, flagged, misses: flagged ? 1 : 0, warnCriteria: [], recallHistory: [], strengths: [], gaps: [] };
  }
  await put("attempts", attempts);
  await put("topicState", topicState);
  await put("session", { topicId: "maximum-likelihood-estimation", activity: "tutorial", at: day(17) });
  // learning activities: the MLE vocabulary part known, the earlier topics' fully known, a few checks answered
  const known = (prefix, ids) => ({ known: ids.map((x) => `${prefix}-${x}`), notYet: [] });
  await put("learning", {
    vocab: {
      "maximum-likelihood-estimation": { known: ["ml-fixed", "ml-mle", "ml-log-likelihood", "ml-monotone", "ml-candidate", "ml-second-derivative"], notYet: ["ml-argmax", "ml-edge"] },
      "posterior-distribution": known("po", ["posterior", "posterior-variance", "bayes-theorem", "marginal", "proportional", "recognize", "conjugate", "beta-bernoulli", "gamma-poisson", "normal-update", "sample-size-effect", "prior-variance-effect"]),
    },
    checks: {},
    breakdowns: {},
  });
}
if (!rest.includes("--empty")) await seed();
const stateShots = rest.includes("--states");
const restArgs = rest.filter((r) => r !== "--empty" && r !== "--connect" && r !== "--states" && r !== "--paths");
rest.length = 0;
rest.push(...restArgs);

/** The learning activities in the states a critic needs to see: each scrolled so the state is in view. */
async function learningStates() {
  const T = "maximum-likelihood-estimation";
  // `sel` is scrolled into view only as far as needed (its bottom clear of the viewport edge), so the top of the page
  // stays when it already fits; the wait lets the heading's hand underline finish drawing (about a second)
  const snap = async (page, name, theme, vp, sel) => {
    if (sel) {
      await page.locator(sel).first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > window.innerHeight - 40 || r.top < 100) el.scrollIntoView({ block: "end" });
        if (el.getBoundingClientRect().bottom > window.innerHeight - 40) window.scrollBy(0, 40);
      });
    }
    await page.waitForTimeout(1300);
    await page.screenshot({ path: join(outDir, `state-${name}-${theme}-${vp}.png`) });
  };
  /** Scrolls so `sel` sits just under the sticky top bar (its hand note and all), then snaps. */
  const snapFrom = async (page, name, theme, vp, sel) => {
    await page.locator(sel).first().evaluate((el) => {
      const bar = document.querySelector("header.top")?.getBoundingClientRect().bottom ?? 0;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - bar - 4);
    });
    await page.waitForTimeout(1300);
    await page.screenshot({ path: join(outDir, `state-${name}-${theme}-${vp}.png`) });
  };
  for (const theme of ["dark", "light"]) {
    for (const vp of ["desktop", "mobile"]) {
      const { ctx, page } = await newPage(theme, vp);
      // a flashcard with its definition revealed
      await page.goto(`${origin}/#/topic/${T}/vocab?mode=cards`);
      await page.click("button:has-text('Reveal the definition')");
      await snap(page, "flashcard-revealed", theme, vp, ".flashcard .rate"); // the "Did you have it?" buttons in view
      // "Quiz me": which term matches this definition? answered with a wrong pick and marked, the verdict in view
      // (the deck is shuffled, so try the first three definitions until a pick is wrong)
      await page.goto(`${origin}/#/topic/${T}/vocab?mode=quiz`);
      for (let k = 0; k < 3; k++) {
        await page.waitForSelector(".quiz-options input[type=radio]");
        await page.locator(".quiz-options input[type=radio]").nth(k % 3).check();
        await page.click(".term-card button:has-text('Check my answer')");
        await page.waitForSelector(".term-card .result");
        if (await page.locator(".term-card .result p.bad-text").count()) break;
        await page.click(".term-card button:has-text('Next definition')");
      }
      await snap(page, "vocab-quiz", theme, vp, ".term-card .result");
      // tutorial step 2 with its check being answered: the step folds behind "Re-read the step"; the track's note
      // ("you are here") sits under the top bar and the step's only forward control, the skip link, is at the foot
      await page.goto(`${origin}/#/topic/${T}/tutorial?step=2`);
      await page.waitForTimeout(600);
      const q = page.locator(".check").first();
      await q.locator("input[type=radio]").first().focus(); // tabbing or clicking into the check starts answering
      await page.waitForSelector(".step-card.folded");
      await page.waitForSelector(".step-nav button.link:has-text('Skip the check for now')");
      await snapFrom(page, "tutorial-step", theme, vp, ".st-track");
      // ...then marked with a wrong answer (so every option is explained), the verdict in view
      await q.locator(".choice:has-text('has the same maximum value')").locator("input").check(); // a wrong option
      await q.locator("button:has-text('Check my answer')").click();
      await snap(page, "check-marked", theme, vp, ".check.marked .result");
      // ...and its reasons, opened from the verdict row (the question is folded under the next one, so its options
      // wait behind "Show the options" inside the disclosure)
      await q.locator(".result button:has-text('Why')").click();
      await q.locator(".whys-wrap button:has-text('Show the options')").click();
      await snap(page, "check-why", theme, vp, ".check.marked fieldset");
      // the checks page with that step partly answered: its first question marked, the second pending, and the
      // group still headed by its number ("Step 02 of 04"), since the title could answer a pending question
      await page.goto(`${origin}/#/topic/${T}/check`);
      await page.waitForSelector("section[aria-label^='Step 02 of'] .check.marked");
      await snapFrom(page, "check-partial", theme, vp, "section[aria-label^='Step 02 of']");
      // a step skipped from the tutorial ("Skip the check for now" on step 3)...
      await page.goto(`${origin}/#/topic/${T}/tutorial?step=3`);
      await page.waitForSelector(".step-nav button.link:has-text('Skip the check for now')");
      await page.click(".step-nav button.link:has-text('Skip the check for now')");
      await page.waitForSelector("text=Tutorial · step 04 of 04");
      // ...is listed on the checks page as not answered, among the steps to review
      await page.goto(`${origin}/#/topic/${T}/check`);
      await page.waitForSelector(".step-list li.review .status:text-is('Not answered')");
      await snapFrom(page, "check-skipped", theme, vp, ".check-summary");
      // every check answered (two steps with a miss), so the checks page shows its end-of-checks results
      const at = new Date().toISOString();
      const learning = (await (await fetch(`${origin}/api/state`)).json()).state.learning;
      const ok = (choice) => ({ credit: 1, choice, at });
      learning.checks[T] = {
        "ml-c1": ok(0), "ml-c2": { credit: 1, rating: "got", at }, "ml-c3": { credit: 0, choice: 1, at }, "ml-c4": ok(0),
        "ml-c5": ok(0), "ml-c6": { credit: 0, choice: 2, at }, "ml-c7": ok(0), "ml-c8": { credit: 0.5, rating: "partly", at },
      };
      await put("learning", learning);
      await page.goto(`${origin}/#/`);
      await page.goto(`${origin}/#/topic/${T}/check`);
      await page.reload();
      await page.waitForTimeout(800);
      await snap(page, "checks-summary", theme, vp);
      // ...and the whole checks page: every question answered, every option visible, each "Why" closed
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(outDir, `state-checks-all-${theme}-${vp}-full.png`), fullPage: true });
      // a whole breakdown, every part tried and revealed (tool choice, plan and pitfalls included), full page
      const tries = {
        ask: "One number for theta, and what it says about the mean",
        given: "Exponential data 3, 1.5, 2.1; no prior",
        plan: "Write L, take logs, differentiate, solve, check the sign",
        pitfalls: "theta is a rate, so expect 1/x-bar, not x-bar",
      };
      const revealAll = async (choose) => {
        for (let k = 0; k < 5; k++) {
          const open = page.locator(".bd-part:not(.revealed)").first();
          if (await open.locator("input[type=radio]").count()) await open.locator(`.choice:has-text('${choose}') input`).check();
          else await open.locator("textarea").fill([tries.ask, tries.given, "", tries.plan, tries.pitfalls][k]);
          await open.locator("button:has-text('Reveal the model answer')").click();
          await page.waitForTimeout(150);
        }
      };
      await page.goto(`${origin}/#/topic/${T}/breakdown`);
      await revealAll("Maximize the likelihood");
      await page.evaluate(() => window.scrollTo(0, 0)); // a full-page capture of a scrolled page repeats the sticky top bar mid-page
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(outDir, `state-breakdown-revealed-${theme}-${vp}.png`), fullPage: true });
      // the three mixed "Which tool?" problems: each statement in view, nothing revealed (the tool is unnamed, and
      // the lecture pages, which would name it, are not cited until the tool step is revealed)...
      for (const [n, title] of [[4, "Website clicks"], [5, "Light bulb lifetimes"], [6, "Battery voltages"]]) {
        await page.goto(`${origin}/#/topic/${T}/breakdown?q=${n}`);
        await page.waitForSelector(`.bd-problem h2:has-text('${title}')`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await snap(page, n === 4 ? "which-tool-problem" : `which-tool-problem-${n - 3}`, theme, vp, ".bd-problem");
      }
      await page.goto(`${origin}/#/topic/${T}/breakdown?q=4`);
      await page.waitForSelector(".bd-problem h2:has-text('Website clicks')");
      // ...then tried and revealed through the tool step
      for (const t of ["One number for the click rate", "Counts 3, 5, 4, 8 and a Gamma(2, 1) from a colleague"]) {
        const open = page.locator(".bd-part:not(.revealed)").first();
        await open.locator("textarea").fill(t);
        await open.locator("button:has-text('Reveal the model answer')").click();
        await page.waitForTimeout(150);
      }
      const tool = page.locator(".bd-part:not(.revealed)").first();
      await tool.locator(".choice:has-text('Maximize the likelihood') input").check(); // a tempting wrong pick
      await tool.locator("button:has-text('Reveal the model answer')").click();
      await page.waitForSelector(".bd-part.revealed .tool-answer .citations .cite"); // the lecture pages arrive with the tool
      await page.locator(".bd-part.revealed").nth(2).scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 120));
      await snap(page, "which-tool-revealed", theme, vp, vp === "mobile" ? ".tool-note-narrow" : ".tool-answer .beside");
      // ...and the plan revealed too (posterior Gamma(22, 5), mean 4.4), as a full page
      const plan = page.locator(".bd-part:not(.revealed)").first();
      await plan.locator("textarea").fill("Gamma-Poisson update, then the posterior mean");
      await plan.locator("button:has-text('Reveal the model answer')").click();
      await page.waitForFunction(() => document.querySelectorAll(".bd-part.revealed").length === 4);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(outDir, `state-which-tool-revealed-${theme}-${vp}-full.png`), fullPage: true });
      // problems 2 and 3 revealed through the plan step too (the MLE 1/3; P(|Z| > 1) ≈ 0.317), as full pages
      const more = [
        [5, "Light bulb lifetimes", "Maximize the likelihood", ["One value of theta, the rate", "Exponential model; five lifetimes 2, 4, 1, 3, 5; nothing else is given", "Write L, take logs, differentiate, solve, check the sign"]],
        [6, "Battery voltages", "Find the posterior", ["A probability about the average of 16 readings", "Normal with variance 0.04; mu = 1.5 if the maker is right; n = 16", "Sampling distribution of the mean, standardize, two-sided"]],
      ];
      for (const [n, title, choose, texts] of more) {
        await page.goto(`${origin}/#/topic/${T}/breakdown?q=${n}`);
        await page.waitForSelector(`.bd-problem h2:has-text('${title}')`);
        for (const t of texts.slice(0, 2)) {
          const open = page.locator(".bd-part:not(.revealed)").first();
          await open.locator("textarea").fill(t);
          await open.locator("button:has-text('Reveal the model answer')").click();
          await page.waitForTimeout(150);
        }
        const tl = page.locator(".bd-part:not(.revealed)").first();
        await tl.locator(`.choice:has-text('${choose}') input`).check();
        await tl.locator("button:has-text('Reveal the model answer')").click();
        await page.waitForSelector(".bd-part.revealed .tool-answer .citations .cite");
        const pl = page.locator(".bd-part:not(.revealed)").first();
        await pl.locator("textarea").fill(texts[2]);
        await pl.locator("button:has-text('Reveal the model answer')").click();
        await page.waitForFunction(() => document.querySelectorAll(".bd-part.revealed").length === 4);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(outDir, `state-which-tool-revealed-${n - 3}-${theme}-${vp}-full.png`), fullPage: true });
      }
      await ctx.close();
      // reset the learning progress so the next theme starts from the same place
      await put("learning", { vocab: {}, checks: {}, breakdowns: {} });
      await put("attempts", []);
      await seed();
    }
  }
}

/** Two saved paths for the Learn list and the path page: one 2 of 5 done, one every step done. Every ref is an
 * activity the app has (lib/paths.ts builds the same ids), so the pages open without any AI service. The half-done
 * path is the very path the stand-in proposes for the same ask with the homework attached (fakegemini.mjs), title
 * and file included, down to the page its explanation cites: the lecture 6 wait-times example, the course page the
 * grounding search puts first among the lectures on maximum likelihood for this ask. */
const PATHS = (() => {
  const P = "posterior-distribution";
  const at = (d, h) => new Date(Date.UTC(2026, 9, d, h)).toISOString();
  const st = (kind, ref, title, why, extra = {}) => ({ kind, ref, title, why, sources: [], done: false, ...extra });
  const done = (d) => ({ done: true, doneAt: at(d, 16) });
  const lecture6 = { id: "lecture-06-maximum-likelihood-properties#p2-1", kind: "Shared", title: "Lecture 6: Maximum Likelihood Properties", filename: "lecture-notes/lecture-06-maximum-likelihood-properties.pdf", page: 2 };
  return {
    items: [
      {
        id: "p-half",
        title: MLE_PATH.fileTitle,
        goal: MLE_PATH.goal,
        covers: MLE_PATH.covers,
        leavesOut: MLE_PATH.leavesOut,
        ask: "I can follow the MLE steps for an exponential rate but I don't see why the answer is one over the mean, or how to get its standard error",
        filename: HOMEWORK_NAME,
        concepts: MLE_PATH.concepts,
        steps: MLE_PATH.steps.map(([kind, ref, title, why], i) =>
          st(kind, ref, title, why, { ...(kind === "explain" ? { text: MLE_PATH.explanation, sources: [lecture6] } : {}), ...(i < 2 ? done(19 + i) : {}) }),
        ),
        createdAt: at(19, 15),
        openedAt: at(20, 17),
      },
      {
        id: "p-done",
        title: "Updating a prior with data",
        goal: "You will be able to take a Beta or Gamma prior, update it with a sample, and read the posterior mean as a weighted average of the prior mean and the data.",
        covers: "why the posterior mean lands where it does, as a weighted average of the prior mean and the data; it uses the Beta-Bernoulli update you can already do as the worked case rather than teaching it again.",
        leavesOut: "",
        ask: "What actually happens to the prior when the data come in? I can do the Beta-Bernoulli update but I don't see why the posterior mean lands where it does.",
        concepts: ["Conjugate prior", "Posterior mean", "Weighted average"],
        steps: [
          st("tutorial", `tutorial:${P}:2`, "Recognize the family: conjugate priors", "Start with why the posterior stays in the same family; the update is then one line.", done(17)),
          st("example", `example:${P}:3:1`, "A Beta-Bernoulli update with numbers", "Do the update once with real numbers so the weights become visible.", done(17)),
          st("breakdown", `breakdown:${P}:po-b1`, "Break down: calorie labels", "An exam-style problem taken apart the same five ways, so the plan comes before the arithmetic.", done(18)),
          st("tutor", `tutor:${P}`, "Talk it through with the tutor", "Explain in your own words why the posterior mean is a weighted average; the tutor will push until it holds.", done(18)),
        ],
        createdAt: at(17, 10),
        openedAt: at(18, 19),
      },
    ],
  };
})();

/** Custom learning paths, desktop only: Learn with saved paths (with and without an AI service), the new-path
 * screen in its three states, and a path half done and fully done. */
async function pathStates() {
  const hdr = { "Content-Type": "application/json", Origin: origin };
  const connect = () => fetch(`${origin}/api/ai/connect`, { method: "POST", headers: hdr, body: JSON.stringify({ apiKey: GOOD_KEY, accept: true, provider: "gemini" }) });
  const disconnect = () => fetch(`${origin}/api/ai`, { method: "DELETE", headers: { Origin: origin } }).catch(() => {});
  /** The homework (and its photo) uploaded for the filled screens is removed again, so the next theme uploads afresh. */
  const dropHomework = async () => {
    const files = await (await fetch(`${origin}/api/files`)).json();
    for (const f of files.filter((x) => (x.filename === HOMEWORK_NAME || x.filename === HOMEWORK_PHOTO_NAME) && !x.removed)) {
      await fetch(`${origin}/api/files/${f.id}`, { method: "DELETE", headers: { Origin: origin } });
    }
  };
  const snap = async (page, name, theme, full = true) => {
    await page.waitForTimeout(1300);
    await page.screenshot({ path: join(outDir, `${name}-${theme}-desktop.png`) });
    if (!full) return;
    await page.evaluate(() => window.scrollTo(0, 0)); // a full-page capture of a scrolled page repeats the sticky top bar mid-page
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(outDir, `${name}-${theme}-desktop-full.png`), fullPage: true });
  };
  const vp = "desktop";
  for (const theme of ["dark", "light"]) {
    await put("paths", PATHS);
    await connect();
    const { ctx, page } = await newPage(theme, vp);
    // Learn with two saved paths, one half done
    await page.goto(`${origin}/#/learn`);
    await page.waitForSelector(".path-row");
    await snap(page, "learn-paths", theme);
    // the new-path screen, empty
    await page.goto(`${origin}/#/paths/new`);
    await page.waitForSelector("textarea");
    await snap(page, "paths-new-empty", theme);
    // ...with a text ask and a read file shown
    await page.fill("textarea", PATHS.items[0].ask);
    await page.locator("input[type=file]").setInputFiles({ name: HOMEWORK_NAME, mimeType: "application/pdf", buffer: HOMEWORK_PDF });
    await page.waitForSelector(".file-read .file-preview", { timeout: 30000 });
    await snap(page, "paths-new-filled", theme);
    // ...with the proposed path
    await page.click("button:has-text('Build my path')");
    await page.waitForSelector("section[aria-label='Proposed path']", { timeout: 15000 });
    await snap(page, "paths-new-proposed", theme);
    // ...and with a photo of the homework, read with OCR (a fresh screen: the route must change for the form to reset)
    await page.goto(`${origin}/#/learn`);
    await page.goto(`${origin}/#/paths/new`);
    await page.waitForSelector("textarea");
    await page.locator("input[type=file]").setInputFiles({ name: HOMEWORK_PHOTO_NAME, mimeType: "image/png", buffer: await renderPhoto(ctx) });
    await page.waitForSelector(".file-read .preview-label:has-text('OCR')", { timeout: 60000 });
    await snap(page, "paths-new-photo", theme);
    // a path with 2 of 5 steps done (it opens at the top; step 3 is the raised card), and one every step of which is done
    await page.goto(`${origin}/#/paths/p-half`);
    await page.waitForSelector(".path-step.current .card.focal");
    await snap(page, "path-half", theme);
    await page.goto(`${origin}/#/paths/p-done`);
    await page.waitForSelector(".path-wrap");
    await snap(page, "path-done", theme);
    await ctx.close();
    // with no AI service: the Learn entry explains, the saved paths still open, and a finished path whose check was
    // a tutor session leads with the quiz instead
    await disconnect();
    const noai = await newPage(theme, vp);
    await noai.page.goto(`${origin}/#/learn`);
    await noai.page.waitForSelector(".own-path:has-text('needs an AI service')");
    await snap(noai.page, "learn-paths-noai", theme);
    await noai.page.goto(`${origin}/#/paths/p-done`);
    await noai.page.waitForSelector(".path-wrap a.button:has-text('Take the quiz')");
    await snap(noai.page, "path-done-noai", theme);
    await noai.ctx.close();
    await dropHomework();
  }
  await put("paths", { items: [] });
}

try {
  if (rest[0] === "--intro") {
    await setOnboarding(true);
    for (const theme of ["dark", "light"]) {
      const vp = process.env.INTRO_VP === "mobile" ? "mobile" : "desktop"; // INTRO_VP=mobile films the phone layout
      const { ctx, page } = await newPage(theme, vp, { intro: true });
      const t0 = Date.now();
      await page.goto(`${origin}/#/`);
      // every 400ms, so a critic can see whether any movement is shorter than that
      for (const at of [...Array.from({ length: 20 }, (_, i) => 200 + i * 400), 9000]) {
        await page.waitForTimeout(Math.max(0, at - (Date.now() - t0)));
        await page.screenshot({ path: join(outDir, `intro-${vp === "mobile" ? "mobile-" : ""}${theme}-${String(at).padStart(5, "0")}ms.png`) });
      }
      await ctx.close();
    }
  } else if (rest[0] === "--onboarding") {
    await setOnboarding(false);
    for (const theme of ["dark", "light"]) {
      for (const vp of ["desktop", "mobile"]) {
        const { ctx, page } = await newPage(theme, vp);
        await page.goto(`${origin}/#/`);
        await page.waitForTimeout(1200);
        for (let n = 1; n <= 6; n++) {
          await page.screenshot({ path: join(outDir, `onboarding-${theme}-${vp}-${n}.png`) });
          const next = page.locator("dialog[open] button:has-text('Next'), dialog[open] button:has-text('Skip this step'), dialog[open] button:has-text('Continue')").first();
          if (!(await next.count())) break;
          await next.click().catch(() => {});
          await page.waitForTimeout(500);
        }
        await ctx.close();
      }
    }
    if (connectShots) {
      const disconnect = () => fetch(`${origin}/api/ai`, { method: "DELETE", headers: { Origin: origin } }).catch(() => {});
      for (const theme of ["dark", "light"]) {
        for (const vp of ["desktop", "mobile"]) {
          await setOnboarding(false);
          await disconnect();
          const { ctx, page } = await newPage(theme, vp);
          await page.goto(`${origin}/#/`);
          await page.click("dialog[open] button:has-text('Next')");
          await page.click("dialog[open] button:has-text('Next')");
          await page.click("dialog[open] button:has-text('Next: paste it')");
          await page.fill("dialog[open] input[aria-label='API key']", "wrong-key");
          await page.check("dialog[open] label:has-text('I have read this') input");
          await page.click("dialog[open] button:text-is('Connect')");
          await page.waitForSelector("dialog[open] [role=alert]");
          await page.locator("dialog[open] [role=alert]").scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
          await page.screenshot({ path: join(outDir, `onboarding-${theme}-${vp}-connect-error.png`) });
          await page.fill("dialog[open] input[aria-label='API key']", GOOD_KEY);
          await page.click("dialog[open] button:text-is('Connect')");
          await page.waitForSelector("dialog[open] h2:has-text('set')");
          await page.waitForTimeout(1200);
          await page.screenshot({ path: join(outDir, `onboarding-${theme}-${vp}-done-connected.png`) });
          await ctx.close();
        }
      }
      await disconnect();
    }
  } else {
    await setOnboarding(true);
    // routes may be given without the leading slash (Git Bash rewrites "/x" into a Windows path); "home" means "/"
    const routes = (rest.length ? rest : ["/", "/learn", "/practice"]).map((r) => (r === "home" ? "/" : r.startsWith("/") ? r : `/${r}`));
    for (const theme of ["dark", "light"]) {
      for (const vp of ["desktop", "mobile"]) {
        for (const r of routes) {
          const { ctx, page } = await newPage(theme, vp);
          await page.goto(`${origin}/#${r}`);
          await page.waitForTimeout(2000); // the heading's hand underline finishes drawing about a second after mount
          await page.screenshot({ path: join(outDir, `${slug(r)}-${theme}-${vp}.png`) });
          if (vp === "desktop") await page.screenshot({ path: join(outDir, `${slug(r)}-${theme}-${vp}-full.png`), fullPage: true });
          await ctx.close();
        }
      }
    }
    if (stateShots) await learningStates();
    if (pathShots) await pathStates();
  }
  console.log("shots written to", outDir);
} finally {
  await browser.close();
  server.kill();
  gemini?.close();
  await new Promise((r) => setTimeout(r, 800));
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* windows may still hold the db for a moment */
  }
}
