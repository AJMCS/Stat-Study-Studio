// Renders the app for design review: screenshots of pages in dark and light mode at desktop and phone widths, and a
// filmstrip of the opening animation.
//
//   node e2e/shots.mjs <outDir> [routes...]        e.g. node e2e/shots.mjs ../design/shots/round1 / /learn /practice
//   node e2e/shots.mjs <outDir> --intro            filmstrip of the intro, both themes
//   node e2e/shots.mjs <outDir> --onboarding       first-run setup, both themes
//   node e2e/shots.mjs <outDir> --onboarding --empty --connect   ...plus a refused key and the connected last slide
//
// It starts the real service on a throwaway data folder (port 8797), so nothing on this machine is touched.
// Contract with the app: localStorage "studio-theme" = "dark" | "light"; sessionStorage "studio-intro-seen" = "1" skips
// the intro; PUT /api/state/onboarding {"done": true} marks first-run setup as finished.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { launchBrowser } from "./browser.mjs";
import { GOOD_KEY, startFakeGemini } from "./fakegemini.mjs";

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
const gemini = connectShots ? await startFakeGemini() : null;
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
}
if (!rest.includes("--empty")) await seed();
const restArgs = rest.filter((r) => r !== "--empty" && r !== "--connect");
rest.length = 0;
rest.push(...restArgs);

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
          await page.waitForTimeout(1200);
          await page.screenshot({ path: join(outDir, `${slug(r)}-${theme}-${vp}.png`) });
          if (vp === "desktop") await page.screenshot({ path: join(outDir, `${slug(r)}-${theme}-${vp}-full.png`), fullPage: true });
          await ctx.close();
        }
      }
    }
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
