import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { launchBrowser } from "./browser.mjs";

const OUT = process.argv[2] ?? join(tmpdir(), "studio-e2e-out");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:5173/#";
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
// The opening animation plays once per browser session; the steps below start past it (one step tests it on its own).
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("studio-intro-seen", "1");
  } catch {
    /* storage blocked */
  }
});
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const problems = [];
let expectNetworkFailure = false; // set while a step deliberately blocks a request
page.on("console", (m) => m.type() === "error" && !(expectNetworkFailure && /Failed to load resource/.test(m.text())) && problems.push(`console: ${m.text()}`));
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

let n = 0;
const shot = (name) => page.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name}.png` });
const step = async (name, fn) => {
  try {
    await fn();
    console.log("ok  ", name);
  } catch (e) {
    console.log("FAIL", name, "-", e.message.split("\n")[0]);
    problems.push(`step ${name}: ${e.message.split("\n")[0]}`);
    await shot("FAIL-" + name.replace(/\W+/g, "-")).catch(() => {});
    if (side) await side.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-FAIL-side-${name.replace(/\W+/g, "-")}.png` }).catch(() => {});
  }
  side = null;
};
let side = null; // a second page a step opened, also captured when the step fails
const go = (p) => page.goto(BASE + p).then(() => page.waitForTimeout(250));
const T = "maximum-likelihood-estimation";

const mainInput = () => page.locator("input[type=file]").first();
const apiGet = async (path) => (await page.request.get(`${BASE.split("#")[0]}api/${path}`)).json();

/** A small valid PDF with one line of text per page. */
function makePdf(lines) {
  const objs = [];
  const add = (body) => objs.push(body) && objs.length;
  const pageIds = [];
  add("<</Type/Catalog/Pages 2 0 R>>");
  add("PAGES");
  add("<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"); // object 3
  for (const line of lines) {
    const content = `BT /F1 14 Tf 72 720 Td (${line}) Tj ET`;
    const contentId = add(`<</Length ${content.length}>>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents ${contentId} 0 R/Resources<</Font<</F1 3 0 R>>>>>>`));
  }
  objs[1] = `<</Type/Pages/Kids[${pageIds.map((i) => `${i} 0 R`).join(" ")}]/Count ${pageIds.length}>>`;
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

async function photoOf(html) {
  const tmp = await ctx.newPage();
  await tmp.setContent(`<body style="margin:0;background:#fff"><div style="font:44px Arial;padding:30px;width:1400px;color:#000">${html}</div></body>`);
  const png = await tmp.screenshot({ clip: { x: 0, y: 0, width: 1460, height: 220 } });
  await tmp.close();
  return png;
}

// ---------------------------------------------------------------------------------------------- first-run setup
const ORIGIN_URL = BASE.split("#")[0].replace(/\/$/, "");
const putSlice = async (name, value) => {
  const r = await page.request.put(`${ORIGIN_URL}/api/state/${name}`, { data: value, headers: { Origin: ORIGIN_URL } });
  if (!r.ok()) throw new Error(`PUT ${name} failed: ${r.status()}`);
};
/** A browser context past the intro, as a learner opening the app. */
const opened = async (viewport = { width: 1100, height: 900 }) => {
  const c = await browser.newContext({ viewport });
  await c.addInitScript(() => {
    try {
      sessionStorage.setItem("studio-intro-seen", "1");
    } catch {
      /* storage blocked */
    }
  });
  const p = await c.newPage();
  p.setDefaultTimeout(8000);
  p.on("pageerror", (e) => problems.push(`onboarding pageerror: ${e.message}`));
  side = p;
  return { c, p };
};
const dialogShot = (p, name) => p.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name}.png` });

await step("onboarding: a new learner gets setup, can go without AI, and it does not come back", async () => {
  const { c, p } = await opened({ width: 390, height: 844 });
  await p.goto(BASE + "/");
  await p.waitForSelector("dialog[open] h2:has-text('Welcome')");
  await dialogShot(p, "onboarding-welcome-phone");
  // nothing in the dialog may stick out sideways or need sideways scrolling
  const over = await p.evaluate(() => {
    const out = [];
    if (document.documentElement.scrollWidth - innerWidth > 4) out.push("page");
    for (const e of document.querySelectorAll("dialog[open] *")) {
      const r = e.getBoundingClientRect();
      if (r.width && (r.right > innerWidth + 1 || r.left < -1)) out.push(`${e.tagName}.${e.getAttribute("class")} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return out;
  });
  if (over.length) throw new Error(`setup overflows sideways on a phone: ${over.slice(0, 3).join("; ")}`);
  if (!(await p.locator("dialog[open] >> text=1/5").count())) throw new Error("no step indicator");
  await p.click("dialog[open] button:has-text('Next')");
  await p.check("dialog[open] label:has-text('No AI for now') input");
  await p.click("dialog[open] button:has-text('Next')");
  await p.waitForSelector("dialog[open] h2:has-text('set')");
  await p.waitForSelector("dialog[open] >> text=None for now");
  await p.waitForSelector("dialog[open] >> text=You can change any of this in Settings");
  await p.click("dialog[open] button:has-text('Start')");
  await p.waitForSelector("dialog[open]", { state: "detached" });
  await p.waitForSelector("main a:has-text('Learn')");
  await p.waitForTimeout(700);
  const s = await apiGet("state");
  if (s.state.onboarding?.done !== true || !s.state.onboarding.completedAt) throw new Error("setup was not saved as done: " + JSON.stringify(s.state.onboarding));
  await p.reload();
  await p.waitForSelector("main a:has-text('Learn')");
  await p.waitForTimeout(1000);
  if (await p.locator("dialog[open]").count()) throw new Error("setup came back after it was finished");
  await c.close();
});

await step("onboarding: waits for the opening animation; Esc skips setup and keeps it skipped", async () => {
  await putSlice("onboarding", { done: false });
  const c = await browser.newContext({ viewport: { width: 1100, height: 900 } }); // the intro plays in this one
  const p = await c.newPage();
  side = p;
  await p.goto(BASE + "/");
  await p.waitForSelector(".intro", { timeout: 4000 });
  await p.waitForTimeout(1500);
  if (await p.locator("dialog[open]").count()) throw new Error("setup opened over the opening animation");
  await p.keyboard.press("Escape"); // skips the intro
  await p.waitForSelector(".intro", { state: "detached" });
  await p.waitForSelector("dialog[open] h2:has-text('Welcome')");
  await p.keyboard.press("Tab");
  if (!(await p.evaluate(() => !!document.activeElement?.closest("dialog[open]")))) throw new Error("focus left the setup dialog");
  await p.keyboard.press("Escape");
  await p.waitForSelector("dialog[open]", { state: "detached" });
  await p.waitForTimeout(700);
  if ((await apiGet("state")).state.onboarding?.done !== true) throw new Error("Esc did not mark setup as done");
  await c.close();
});

await step("onboarding: choosing Gemini connects it with a pasted key, and Settings shows it connected", async () => {
  await putSlice("onboarding", { done: false });
  const { c, p } = await opened();
  await p.goto(BASE + "/");
  await p.waitForSelector("dialog[open] h2:has-text('Welcome')");
  await p.click("dialog[open] button:has-text('Next')");
  await p.check("dialog[open] label:has-text('Google Gemini') input");
  await p.click("dialog[open] button:has-text('Next')");
  await p.waitForSelector("dialog[open] h2:has-text('Get a key')");
  await p.waitForSelector("dialog[open] >> text=password-like code");
  await p.waitForSelector("dialog[open] a[href*='aistudio.google.com']");
  if (!(await p.locator("dialog[open] >> text=3/5").count())) throw new Error("the step indicator should show five steps with an AI service chosen");
  await p.click("dialog[open] button:has-text('Next: paste it')");
  await p.waitForSelector("dialog[open] h2:has-text('Paste your key')");
  await p.waitForSelector("dialog[open] summary:has-text('Read the full notice')");
  await p.waitForSelector("dialog[open] >> text=may use them to improve its products");
  if (await p.evaluate(() => { const s = document.querySelector("dialog[open] .ob-slide"); return s.scrollHeight > s.clientHeight + 1; })) throw new Error("the Connect step does not fit without scrolling");
  await p.click("dialog[open] summary:has-text('Read the full notice')");
  await p.waitForSelector("dialog[open] >> text=people may review it", { state: "visible" });
  // Connect stays the obvious way forward: clicking it early says what is missing and moves focus there
  if (!(await p.locator("dialog[open] .field-note").count())) throw new Error("no hand note on the paste step");
  await p.click("dialog[open] button:text-is('Connect')");
  await p.waitForSelector("dialog[open] [role=alert]:has-text('Paste your key first')");
  if ((await p.evaluate(() => document.activeElement?.getAttribute("aria-label"))) !== "API key") throw new Error("focus did not move to the key field");
  await p.fill("dialog[open] input[aria-label='API key']", "good-key-123");
  await p.click("dialog[open] button:text-is('Connect')");
  await p.waitForSelector("dialog[open] [role=alert]:has-text('Tick the box to agree first')");
  if ((await apiGet("ai")).keyStored) throw new Error("a key was stored without agreeing to the notice");
  await p.check("dialog[open] label:has-text('I have read this') input");
  await p.click("dialog[open] button:text-is('Connect')");
  await p.waitForSelector("dialog[open] >> text=Connected to Google Gemini", { timeout: 15000 });
  await dialogShot(p, "onboarding-connected");
  await p.click("dialog[open] button:has-text('Start')");
  await p.waitForSelector("dialog[open]", { state: "detached" });
  await p.click("header a.settings-link");
  await p.waitForSelector("text=Connected to Google Gemini");
  await p.click("button:has-text('Disconnect and forget my key')"); // the AI steps further down start disconnected
  await p.waitForSelector("text=What gets sent");
  await c.close();
});

await step("onboarding: a learner who already has progress never sees it", async () => {
  await putSlice("onboarding", { done: false });
  await putSlice("attempts", [{ id: "pre", topicId: T, at: "2026-10-01T10:00:00.000Z", kind: "quiz", counted: true, composite: 70, criteria: { core: 70, depth: 70, relevance: 70, application: 70 } }]);
  const { c, p } = await opened();
  await p.goto(BASE + "/");
  await p.waitForSelector("main a:has-text('Learn')");
  await p.waitForTimeout(1500);
  if (await p.locator("dialog[open]").count()) throw new Error("setup was shown to a learner with progress");
  if ((await apiGet("state")).state.onboarding?.done !== true) throw new Error("setup should be marked done for an existing learner");
  await c.close();
  await putSlice("attempts", []);
});

await step("updates: newer course materials are offered, installed on request, and used at once", async () => {
  await go("/");
  await page.waitForSelector("text=New course materials are available", { timeout: 20000 });
  await shot("update-banner");
  await page.click("button:has-text('Update now')");
  await page.waitForSelector("text=Course materials updated to version", { timeout: 30000 });
  const hit = (await apiGet("search?q=" + encodeURIComponent("what is a conjugate prior"))).results[0];
  if (!/\(revised\)/.test(hit.title)) throw new Error("the updated library is not in use: " + hit.title);
  await page.click("[role=status] button:has-text('Dismiss')");
  await go("/materials");
  await page.click("button:has-text('Check for updates')");
  await page.waitForSelector("text=You have the latest course materials");
  await page.waitForSelector("text=updated online");
  await shot("update-installed");
});

await step("home offers Learn and Practice; the learn page lists 7 topics", async () => {
  await go("/");
  await page.waitForSelector("main a:has-text('Learn')");
  await page.waitForSelector("main a:has-text('Practice')");
  await shot("home");
  await go("/learn");
  const topics = await page.locator(".journey-list a.topic-link").count();
  if (topics !== 7) throw new Error(`expected 7 topics on the learn page, got ${topics}`);
  await shot("learn");
});

await step("intro: plays once per session, resolves into Learn and Practice, and can be skipped", async () => {
  const c2 = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const p2 = await c2.newPage();
  p2.on("pageerror", (e) => problems.push(`intro pageerror: ${e.message}`));
  await p2.goto(BASE + "/");
  await p2.waitForSelector(".intro", { timeout: 4000 });
  await p2.waitForSelector(".intro", { state: "detached", timeout: 9000 });
  await p2.waitForSelector("main a:has-text('Learn')", { state: "visible" });
  await p2.waitForSelector("main a:has-text('Practice')", { state: "visible" });
  if ((await p2.evaluate(() => document.activeElement?.textContent?.trim())) !== "Learn") throw new Error("focus did not land on Learn after the intro");
  await p2.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-intro-end.png` });
  await p2.reload();
  await p2.waitForSelector("main a:has-text('Learn')", { state: "visible" });
  await p2.waitForTimeout(600);
  if (await p2.locator(".intro").count()) throw new Error("the intro replayed after a reload in the same session");
  await p2.click("main a:has-text('Practice')");
  await p2.waitForURL(/#\/practice$/);
  await c2.close();
  // a new session can skip it straight away with Esc
  const c3 = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const p3 = await c3.newPage();
  await p3.goto(BASE + "/");
  await p3.waitForSelector(".intro-skip", { timeout: 4000 });
  await p3.keyboard.press("Escape");
  await p3.waitForSelector(".intro", { state: "detached", timeout: 1500 });
  await p3.click("main a:has-text('Learn')");
  await p3.waitForURL(/#\/learn$/);
  await c3.close();
});

await step("practice hub offers an exam and a quiz for the chosen topic", async () => {
  await go("/practice");
  await page.click("button:has-text('Change topic')"); // the picker shows the chosen topic; the full list opens on request
  await page.click("label.pick:has-text('Maximum Likelihood Estimation')");
  const exam = await page.locator("a:has-text('Start an exam')").getAttribute("href");
  const quiz = await page.locator("a:has-text('Take a quiz')").getAttribute("href");
  if (!exam.endsWith(`/topic/${T}/exam`) || !quiz.endsWith(`/topic/${T}/quiz`)) throw new Error(`wrong links: ${exam} ${quiz}`);
  await shot("practice");
});

await step("library links to lecture notes and course materials", async () => {
  await go("/library");
  await page.waitForSelector("a.card[href$='/notes']");
  await page.waitForSelector("a.card[href$='/materials']");
});

await step("topic page", async () => {
  await go("/learn");
  await page.locator(".journey-map a.jn-topic", { hasText: "Maximum Likelihood Estimation" }).click(); // the visible map; the list is for screen readers on desktop
  await page.waitForSelector("h1:has-text('Maximum Likelihood Estimation')");
  await shot("topic");
});

const learningState = async () => (await apiGet("state")).state.learning;

await step("tutorial: math renders, a worked example shows its solution only on request, and moving on past an unanswered check is an explicit skip", async () => {
  await go(`/topic/${T}/tutorial`);
  await page.waitForSelector(".katex");
  await shot("tutorial");
  // the step's check is unanswered, so there is no "Next step": the only way forward is the text link
  if (await page.locator(".step-nav button:has-text('Next step')").count()) throw new Error("'Next step' is offered before the step's check is marked");
  await page.waitForSelector(".step-nav button.link:has-text('Skip the check for now')");
  await page.click(".step-nav button.link:has-text('Skip the check for now')");
  await page.waitForSelector("text=Tutorial · step 02 of 04");
  await page.click(".step-nav button.link:has-text('Skip the check for now')");
  await page.waitForSelector("text=Worked example");
  if (await page.locator("[aria-label='Solution to worked example 1']").count()) throw new Error("solution visible before it was asked for");
  await page.click("button:has-text('Show the solution') >> nth=0");
  await page.waitForSelector("[aria-label='Solution to worked example 1'] .katex");
  await shot("tutorial-example");
  await page.click(".step-nav button.link:has-text('Skip the check for now')");
  await page.waitForSelector("text=Tutorial · step 04 of 04");
  // on the last step the skip leads to the checks page, where every skipped step is listed as not answered, to review
  await page.click(".step-nav button.link:has-text('Skip the check for now')");
  await page.waitForSelector("h1:has-text('Comprehension')");
  await page.waitForSelector(".check-summary .result p.bad-text:has-text('(not answered)')");
  if ((await page.locator(".step-list li.review .status:text-is('Not answered')").count()) !== 4) throw new Error("skipped steps are not listed as not answered");
  if ((await page.locator(".step-list li.review a:has-text('Review the step')").count()) !== 4) throw new Error("skipped steps are not among the steps to review");
  await page.waitForTimeout(800);
  const c = (await learningState()).checks[T];
  if (!c || Object.values(c).some((a) => !a.skipped || a.credit !== 0)) throw new Error("skipped checks were not recorded: " + JSON.stringify(c));
  await page.waitForSelector("a:has-text('Next: break down a question')");
  await go(`/topic/${T}`);
  await page.waitForSelector(".tp-step .status:has-text('(not answered)')"); // the topic page names the skipped steps too
});

await step("topic page: the path runs vocabulary, tutorial with checks, breakdown, practice", async () => {
  await go(`/topic/${T}`);
  const titles = await page.locator(".topic-path .tp-body h3").allInnerTexts();
  if (titles.join("|") !== "Vocabulary|Tutorial, with checks|Break down a question|Practice: quiz and exam") throw new Error("unexpected path: " + titles.join("|"));
  await page.waitForSelector(".tp-step.current .card.focal a.button:has-text('Start the vocabulary')");
  if ((await page.locator(".panel.focal, .card.focal").count()) !== 1) throw new Error("more than one raised element on the topic page");
});

await step("vocabulary: a lesson, then a flashcard rated 'got it' is saved and shows as known", async () => {
  await go(`/topic/${T}/vocab`);
  await page.waitForSelector("h1:has-text('Know the words')");
  await page.waitForSelector(".term-card .citations .cite");
  await page.click("button:has-text('Next term')");
  await page.waitForSelector("text=Term 02 of 10");
  await shot("vocab-lesson");
  await page.click(".eyebrow-switch button:has-text('Flashcards')");
  await page.waitForSelector(".flashcard button:has-text('Reveal the definition')");
  if (await page.locator("[aria-label='Definition']").count()) throw new Error("definition visible before it was revealed");
  await page.click("button:has-text('Reveal the definition')");
  await page.waitForSelector("[aria-label='Definition'] .term-plain");
  await shot("vocab-card-revealed");
  await page.click("button:text-is('Got it')");
  await page.waitForSelector("[role=status]:has-text('Saved: got it')");
  await page.click("button:has-text('Reveal the definition')");
  await page.click("button:text-is('Not yet')");
  await page.waitForTimeout(800);
  const v = (await learningState()).vocab[T];
  if (v?.known?.length !== 1 || v?.notYet?.length !== 1) throw new Error("flashcard ratings were not saved: " + JSON.stringify(v));
  await page.click(".eyebrow-switch button:has-text('Glossary')");
  await page.waitForSelector(".g-row .term-word .chip.g-known:has-text('known')"); // the known marker is a chip right after the name
  // in Flashcards and Quiz me nothing above the card names a term (the next unknown term is the answer)
  const names = (await page.locator(".g-row .term-name > span:first-child").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  if (names.length < 6) throw new Error("could not read the topic's term names from the glossary");
  for (const mode of ["cards", "quiz"]) {
    await go(`/topic/${T}/vocab?mode=${mode}`);
    await page.waitForSelector(".term-card");
    const above = await page.evaluate(() => {
      const card = document.querySelector(".term-card");
      let t = "";
      for (const el of document.querySelector("main").children) {
        if (el === card || el.contains(card)) break;
        t += " " + el.textContent;
      }
      return t;
    });
    const leaked = names.filter((n) => new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(above));
    if (leaked.length) throw new Error(`${mode}: a term's name sits above the card: ${leaked.join(", ")}`);
  }
  await go(`/topic/${T}`);
  await page.waitForSelector(".tp-step:first-child .status:has-text('1 of 10 known')");
  // "Quiz me": which term matches this definition? Marked at once, and it updates known terms
  await go(`/topic/${T}/vocab?mode=quiz`);
  await page.waitForSelector(".term-card h2.quiz-ask:has-text('Which term matches this definition?')"); // the card's title size
  if ((await page.locator(".quiz-options input[type=radio]").count()) !== 3) throw new Error("the quiz should offer three terms");
  // the track shows the session's own sequence (definition 1 of 10 lights node 1), not which terms are known; it
  // carries no counter of its own (the card's eyebrow states the position)
  await page.waitForSelector(".step-track[aria-label='Quiz progress'][aria-valuenow='1'][aria-valuemax='10']");
  if (await page.locator(".step-track[aria-label='Quiz progress'] .st-count").count()) throw new Error("the quiz track should not repeat the card's position counter");
  if ((await page.locator(".step-track .ring-node.current").count()) !== 1 || !(await page.locator(".st-track > .ring-node:first-child.current").count()))
    throw new Error("the quiz track should light node 1 for definition 1");
  await page.locator(".quiz-options input[type=radio]").first().check();
  await page.click(".term-card button:has-text('Check my answer')");
  await page.waitForSelector(".term-card .result p:is(.ok-text, .bad-text)");
  if (await page.locator(".quiz-options .term-symbol").count()) throw new Error("the quiz shows a term's symbol, which gives the match away");
  // the markers are chips: ✓ THE MATCH on the matching term, ! YOUR PICK on a wrong pick
  await page.waitForSelector(".quiz-options .is-right .chip.status-note:has-text('✓'):has-text('the match')");
  if ((await page.locator(".quiz-options .is-picked.is-wrong").count()) && !(await page.locator(".quiz-options .is-picked.is-wrong .chip.status-note:has-text('!'):has-text('your pick')").count()))
    throw new Error("the wrong pick in the quiz is not marked with its ! chip");
  await shot("vocab-quiz");
  const gotIt = (await page.locator(".term-card .result p.ok-text").count()) > 0;
  const asked = await page.locator(".quiz-options .choice.is-right").getAttribute("data-term");
  await page.waitForTimeout(800);
  const after = (await learningState()).vocab[T];
  if (!asked || after.known.includes(asked) !== gotIt || after.notYet.includes(asked) === gotIt) throw new Error("the quiz answer was not saved as progress: " + JSON.stringify(after));
});

await step("comprehension: an answer is marked, every option is explained, its citation opens, and the set is saved as uncounted practice", async () => {
  await go("/");
  await go(`/topic/${T}/tutorial`);
  const first = page.locator(".check").first();
  // the step is open to read; it folds while its check is being answered, reopens on request, and expands for good
  // only once every question of the step's check is marked
  await page.waitForSelector(".step-card:not(.folded) h2");
  await page.waitForSelector(".checks .eyebrow:has-text('not answered')"); // skipped in the tutorial step above, so it says so
  // a wrong option (the options are shuffled, so pick by text, not position)
  await first.locator(".choice:not(:has-text('estimated from the flips alone'))").first().locator("input").check();
  await page.waitForSelector(".step-card.folded button:has-text('Re-read the step')");
  if (await page.locator(".step-card h2").count()) throw new Error("the step body is still visible while its check is being answered");
  await page.click(".step-card.folded button:has-text('Re-read the step')");
  await page.waitForSelector(".step-card:not(.folded) h2");
  await first.locator("button:has-text('Check my answer')").click();
  await page.waitForSelector(".check.marked [role=status]:has-text('Not quite')");
  await page.waitForSelector(".step-card.folded"); // a second question is still open, so the step stays folded
  if (await page.locator(".step-nav button:has-text('Next step')").count()) throw new Error("'Next step' is offered while a question of the check is still open");
  // the reasons wait behind "Why" on the verdict row, so none sits above the next question, and the marked question
  // folds to its stem and verdict while the next one is open: no option text of an earlier question above a later one
  if (await page.locator(".check.marked .why").count()) throw new Error("option explanations are shown before 'Why' is opened");
  if ((await page.locator(".check").count()) !== 2) throw new Error("the step's second question should appear once the first is marked");
  if (!(await page.locator(".check.marked.folded").count()) || (await page.locator(".check.marked .choice").count())) throw new Error("the marked question's options are still shown above the next question");
  await page.click(".check.marked .result button:has-text('Why')");
  if (await page.locator(".check.marked .why").count()) throw new Error("a folded question's options are shown before 'Show the options'");
  await page.click(".check.marked .whys-wrap button:has-text('Show the options')");
  const options = await page.locator(".check.marked .why").count();
  if (options !== 3) throw new Error(`not every option has an explanation: ${options} of 3`);
  // the markers are the system's chips, the same in the opened explanations as in the option list (checked below)
  await page.waitForSelector(".check.marked .choice-wrap.is-right .choice .chip.status-note:has-text('✓'):has-text('right')");
  await page.waitForSelector(".check.marked .choice-wrap.is-picked .choice .chip.status-note:has-text('!'):has-text('your pick')");
  await page.waitForSelector(".check.marked .result .eyebrow:has-text('Result')");
  await shot("check-marked");
  // the verdict is the eyebrow and one sentence; the page that settles the question is cited at the end of "Why"
  if (await page.locator(".check.marked .result .cite, .check.marked .check-foot .cite").count()) throw new Error("a citation chip sits in the verdict block");
  await page.click(".check.marked .why-source .cite");
  await page.waitForSelector("dialog[open] .page-view mark");
  await page.click("dialog button:has-text('Close')");
  const second = page.locator(".check").nth(1);
  await second.locator("textarea").fill("It picks the parameter value that makes the observed data most probable, with no prior.");
  await second.locator("button:has-text('Compare with the reference')").click();
  await second.locator("label:has-text('I got it') input").check();
  await page.waitForSelector("[role=status]:has-text('Saved: I got it')");
  await page.waitForSelector(".step-card:not(.folded) h2"); // the set is done: the step expands and "Next step" appears
  await page.waitForSelector(".step-nav button:has-text('Next step')");
  // ...and the first question unfolds (no later question is open), its options carrying the same chips
  await page.waitForSelector(".check.marked:not(.folded) .choice.is-right .chip.status-note:has-text('✓'):has-text('right')");
  await page.waitForSelector(".check.marked:not(.folded) .choice.is-picked.is-wrong .chip.status-note:has-text('!'):has-text('your pick')");
  await page.waitForTimeout(800);
  const st = (await apiGet("state")).state;
  const c = st.learning.checks[T];
  if (c?.["ml-c1"]?.credit !== 0 || c?.["ml-c2"]?.rating !== "got") throw new Error("check answers were not saved: " + JSON.stringify(c));
  const att = st.attempts.filter((a) => a.note?.startsWith("Comprehension check")).at(-1);
  if (!att || att.counted !== false || att.composite !== 50) throw new Error("the finished set was not saved as uncounted practice: " + JSON.stringify(att));
  // "Try it again" is a learning tool, not a scoring one: the retry (the ✓ option, now known) is marked honestly and
  // its pick saved, but the credit stays the first attempt's miss, no further practice attempt is recorded, and the
  // step stays among the steps to review with the right count unchanged
  await first.locator(".check-foot button:has-text('Try it again')").click();
  await first.locator(".choice:has-text('estimated from the flips alone') input").check();
  await first.locator("button:has-text('Check my answer')").click();
  await first.locator(".result p.ok-text:has-text('Right on the retry. The first attempt is what counts.')").waitFor();
  await page.waitForTimeout(800);
  const st2 = (await apiGet("state")).state;
  const r = st2.learning.checks[T]["ml-c1"];
  if (r?.credit !== 0 || r?.retried !== true || r?.choice === c["ml-c1"].choice) throw new Error("the retry did not keep the first attempt's credit: " + JSON.stringify(r));
  if (st2.attempts.length !== st.attempts.length) throw new Error("a retry was recorded as another practice attempt");
  await go(`/topic/${T}/check`);
  await page.waitForSelector(".step-list li.review:has-text('Review the step')");
  if (!(await page.locator(".step-list li.review:has(.sl-n:text-is('01'))").count())) throw new Error("the retried step is no longer among the steps to review");
  if ((await page.locator(".check-summary .stats b.lead").textContent())?.trim() !== "1") throw new Error("the retry changed the right count"); // ml-c2 only
  await page.waitForSelector(".check-summary .result p.bad-text:has-text('another look')"); // this step and the skipped ones
  await shot("checks-summary");
});

await step("breakdown: try a part, reveal it, go through all five, then the worked solution; completion is saved", async () => {
  await go("/");
  await go(`/topic/${T}/breakdown`);
  await page.waitForSelector("h1:has-text('Break down a')");
  if (await page.locator(".bd-part.revealed").count()) throw new Error("a model answer is visible before any try");
  await page.locator(".bd-part textarea").fill("The MLE of theta, a number");
  await page.click("button:has-text('Reveal the model answer')");
  await page.waitForSelector(".bd-part.revealed .model-answer .katex");
  await page.waitForSelector(".bd-part.revealed .your-answer:has-text('The MLE of theta')");
  for (let k = 1; k < 5; k++) {
    const open = page.locator(".bd-part:not(.revealed)");
    if (await open.locator("input[type=radio]").count()) await open.locator("input[type=radio]").first().check();
    else await open.locator("textarea").fill("my try");
    if (k === 2) await shot("breakdown-part");
    await open.locator("button:has-text('Reveal the model answer')").click();
    await page.waitForFunction((n) => document.querySelectorAll(".bd-part.revealed").length === n, k + 1);
  }
  await page.click("button:has-text('Show the full worked solution')");
  await page.waitForSelector("[aria-label='Worked solution'] .katex");
  await shot("breakdown-done");
  await page.waitForTimeout(800);
  const b = (await learningState()).breakdowns[T]?.["ml-b1"];
  if (!b?.done || b.revealed.length !== 5) throw new Error("breakdown progress not saved: " + JSON.stringify(b));
  await page.click("button:has-text('Next problem')");
  await page.waitForSelector("text=Problem 2 of 3");
  // the mixed set: the tool is the question
  await page.click(".bd-head button[aria-label^='Which tool? 1']");
  await page.waitForSelector(".bd-problem h2:has-text('Website clicks')");
});

await step("glossary: every term, searchable, linked from Learn and the Library", async () => {
  await go("/learn");
  await page.click("a:has-text('The glossary')");
  await page.waitForSelector("h1:has-text('glossary')");
  const all = await page.locator(".g-row").count();
  if (all < 60) throw new Error(`only ${all} glossary terms`);
  await page.fill("input[aria-label='Search the glossary']", "conjugate");
  await page.waitForSelector(".g-row:has-text('Conjugate prior')");
  if ((await page.locator(".g-row").count()) >= all) throw new Error("search did not filter");
  await page.fill("input[aria-label='Search the glossary']", "θ");
  await page.waitForSelector(".g-row:has-text('Parameter')");
  await go("/library");
  await page.waitForSelector("a.card[href$='/glossary']");
});

await step("tutor: says it needs an AI service and points to what works without one", async () => {
  await go(`/topic/${T}/tutor`);
  await page.waitForSelector("text=needs an AI service");
  await page.waitForSelector("a:has-text('Guided tutorial')");
  if (await page.locator("textarea").count()) throw new Error("a chat box is offered with no AI service connected");
  await shot("tutor-gated");
});

await step("quiz graded flow with unanswered + review + summary", async () => {
  await go(`/topic/${T}/quiz`);
  await page.click("button:has-text('Graded quiz')");
  await page.waitForSelector("text=Question 1 of 10");
  await page.click("input[type=radio] >> nth=1");
  await page.click("button:has-text('Next')");
  await page.click("button:has-text('Back')");
  await page.click("button:has-text('Next')");
  await shot("quiz-q2");
  await page.click("button:has-text('Review') >> nth=-1");
  await page.waitForSelector("text=Review before submitting");
  await shot("quiz-review");
  await page.click("button:has-text('Submit quiz')");
  await page.waitForSelector("text=Quiz summary", { timeout: 20000 });
  await shot("quiz-summary");
});

await step("quiz: written answers are self-scored, labeled, and saved as self-scored", async () => {
  await go("/");
  await go(`/topic/${T}/quiz`);
  await page.click("button:has-text('Graded quiz')");
  for (let k = 0; k < 5; k++) await page.click("button:has-text('Next')");
  await page.waitForSelector("text=Question 6 of 10");
  // the drawing pad takes the theme: a transparent canvas on the theme's input background, near-black ink that dark
  // mode inverts to chalk, and an eraser that removes ink instead of painting white over it
  await page.click("button:has-text('Add a drawing')");
  const box = await page.locator("canvas.canvas").boundingBox();
  // hover onto the canvas and let the pointer settle before pressing; a press straight after a move is dropped
  await page.locator("canvas.canvas").hover({ position: { x: 40, y: 40 } });
  await page.waitForTimeout(100);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 90, { steps: 8 });
  await page.mouse.up();
  const pad = await page.evaluate(() => {
    const c = document.querySelector("canvas.canvas");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let inked = 0, lightInk = 0, opaqueBlank = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      if (d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40) inked++; else if (d[i] > 200) opaqueBlank++; else lightInk++;
    }
    const theme = (name) => {
      document.documentElement.dataset.theme = name;
      const wrap = getComputedStyle(c.parentElement), canvas = getComputedStyle(c);
      return { bg: wrap.backgroundColor, canvasBg: canvas.backgroundColor, filter: canvas.filter };
    };
    const was = document.documentElement.dataset.theme;
    const out = { inked, lightInk, opaqueBlank, dark: theme("dark"), light: theme("light") };
    document.documentElement.dataset.theme = was;
    return out;
  });
  if (pad.inked < 50 || pad.opaqueBlank > 0 || pad.lightInk > 0) throw new Error(`pad ink is wrong: ${JSON.stringify(pad)}`);
  if (pad.dark.bg !== "rgb(18, 18, 18)" || pad.light.bg !== "rgb(250, 250, 250)") throw new Error(`pad background does not follow the theme: ${JSON.stringify(pad)}`);
  if (pad.dark.filter !== "invert(1)" || pad.light.filter !== "none") throw new Error(`dark mode should invert the ink: ${JSON.stringify(pad)}`);
  if (!pad.dark.canvasBg.endsWith(", 0)") && pad.dark.canvasBg !== "transparent") throw new Error(`canvas must stay transparent: ${JSON.stringify(pad)}`);
  // each question has its own drawing: the next one starts blank (with the pad still open), and going back restores this one
  const inkCount = () => page.evaluate(() => { const c = document.querySelector("canvas.canvas"); if (!c) return -1; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  await page.click("button:has-text('Next')");
  await page.waitForSelector("text=Question 7 of 10");
  const nextInk = await inkCount();
  if (nextInk !== 0) throw new Error(`the next question's pad should start blank (and stay open): ink=${nextInk}`);
  await page.click("button:has-text('Back')");
  await page.waitForSelector("text=Question 6 of 10");
  await page.waitForFunction(() => { const c = document.querySelector("canvas.canvas"); if (!c) return false; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true; return false; });
  await page.fill("textarea", "The likelihood is the probability of the data as a function of theta, and the MLE is the value that maximizes it.");
  await page.click("button:has-text('Review') >> nth=-1");
  await page.click("button:has-text('Submit quiz')");
  await page.waitForSelector("text=Score your written answers");
  await page.waitForSelector("text=Reference answer");
  const finish = page.locator("button:has-text('Finish and save')");
  if (!(await finish.isDisabled())) throw new Error("finishing should wait until the answer is rated");
  await page.click("label:has-text('Partly') input");
  await shot("quiz-selfcheck");
  await finish.click();
  await page.waitForSelector("text=Quiz summary");
  await page.waitForSelector("text=self-score");
  await page.waitForTimeout(700); // saves are batched for a moment before they reach the service
  const state = await apiGet("state");
  const last = state.state.attempts.filter((a) => a.kind === "quiz").at(-1);
  if (!last.selfScored) throw new Error("a quiz with a rated written answer must be saved as self-scored");
});

await step("quiz practice mode locks the first response; a retry is saved separately", async () => {
  await go("/");
  await go(`/topic/${T}/quiz`);
  await page.click("button:has-text('Low-stakes practice')");
  await page.click("input[type=radio] >> nth=0");
  await page.click("button:has-text('Check answer')");
  await page.waitForSelector("text=first response, now locked");
  const disabled = await page.locator("input[type=radio]").first().isDisabled();
  if (!disabled) throw new Error("choices not locked after feedback");
  await page.click("button:has-text('Try again')");
  await page.click("input[type=radio] >> nth=1"); // the right option for this question
  await page.click("button:has-text('Check retry')");
  // the retry's own verdict leads; the locked first response is the footnote (a correct retry must not look like the old miss)
  await page.waitForSelector(".feedback .ok-text:has-text('Correct on the retry')");
  await page.waitForSelector(".feedback .muted:has-text('First response: needs work')");
  if (await page.locator(".feedback .bad-text").count()) throw new Error("the first miss still leads the feedback after a correct retry");
  await shot("quiz-practice");
});

await step("exam untimed: focus, hint, source toggle, self-score against the reference, review, history, pdf", async () => {
  await go("/");
  await go(`/topic/${T}/exam`);
  await page.fill("label:has-text('Focus') input", "Uniform edge case");
  await page.click("button:has-text('Start exam')");
  await page.waitForSelector("text=Question 1 of");
  await page.waitForSelector("text=that match your focus");
  await page.click("button:has-text('Hint')");
  await page.waitForSelector("text=Hint:");
  await page.click("button:has-text('Show source material')");
  await page.waitForSelector(".cite");
  await shot("exam-aids");
  for (let i = 0; i < 6; i++) {
    await page.fill("textarea", "Write the log-likelihood, differentiate, set to zero, so theta-hat = sum x / (2n) because it is the maximizer. For example 9/6.");
    if (await page.locator("button:has-text('Submit and score')").count()) break;
    await page.click("button:has-text('Next')");
  }
  await page.click("button:has-text('Submit and score')");
  await page.waitForSelector("text=Score your exam");
  await page.waitForSelector("h3:has-text('Reference solution')");
  await shot("exam-selfcheck");
  await page.locator("fieldset input[type=checkbox]").first().check();
  await page.click("button:has-text('Finish and save')");
  await page.waitForSelector("text=attempt 1", { timeout: 20000 });
  await page.waitForSelector(".chip:has-text('Self-scored')");
  await page.waitForSelector("summary:has-text('Reference solution')");
  await shot("exam-review");
  await go("/exams");
  await page.waitForSelector("text=Download PDF");
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.click("button:has-text('Download PDF')")]);
  console.log("     pdf:", dl.suggestedFilename());
});

await step("exam: a focus that matches nothing says so and gives the full exam", async () => {
  await go("/");
  await go(`/topic/${T}/exam`);
  await page.fill("label:has-text('Focus') input", "chocolate cake recipes");
  await page.click("button:has-text('Start exam')");
  await page.waitForSelector("text=No question matched that focus");
});

await step("exam timed hides aids", async () => {
  await go("/");
  await go(`/topic/${T}/exam`);
  await page.click("input[name=mode] >> nth=1");
  await page.click("button:has-text('Start exam')");
  await page.waitForSelector("[role=timer]");
  if (await page.locator("button:has-text('Hint')").count()) throw new Error("hint visible in timed exam");
  if (await page.locator("button:has-text('source material')").count()) throw new Error("source toggle visible in timed exam");
});

await step("citation preview dialog", async () => {
  await go(`/topic/${T}`);
  await page.click(".cite >> nth=0");
  await page.waitForSelector("dialog[open] .page-view mark");
  const hl = await page.locator("dialog[open] .page-view mark").first().innerText();
  if (hl.length < 20) throw new Error("highlight too short to be a real passage: " + hl);
  await page.waitForSelector("dialog[open] iframe.pdf");
  await page.waitForTimeout(800);
  await shot("citation-preview");
  await page.click("dialog button:has-text('Close')");
});

await step("recall: compare with the reference, self-score, and the streak updates", async () => {
  await go("/");
  await go(`/topic/${T}`);
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", "The MLE maximizes the likelihood because it makes the observed data most probable. It matters since it gives a point estimate, for example n=10.");
  await page.click("button:has-text('Compare with the reference')");
  await page.waitForSelector("h3:has-text('Reference solution')");
  for (const box of await page.locator("fieldset input[type=checkbox]").all()) await box.check();
  await page.click("button:has-text('Save my self-score')");
  await page.waitForSelector(".composite");
  await page.waitForSelector("text=Qualifying recall added to your streak");
  await page.waitForSelector(".chip:has-text('Self-scored')");
  await shot("recall");
});

await step("progress: self-scored attempts are labeled and can be hidden", async () => {
  await go("/progress");
  await page.waitForSelector("text=Stats 132 summary");
  await page.waitForSelector("text=Include self-scored attempts");
  await page.click("button:has-text('Inspect criteria and attempts') >> nth=0");
  await page.waitForSelector("td .chip:has-text('Self-scored')");
  await page.waitForSelector("text=need an AI service");
  if (!(await page.locator("button:has-text('Core idea')").first().isDisabled())) throw new Error("criterion trends should be unavailable without automatic scoring");
  await shot("progress");
  const summary = () => page.locator("section[aria-label='Stats 132 summary'] .stats b").first().innerText();
  const withSelf = await summary();
  await page.uncheck("label:has-text('Include self-scored attempts') input");
  await page.waitForFunction((was) => document.querySelector("section[aria-label='Stats 132 summary'] .stats b")?.textContent !== was, withSelf);
  const without = await summary();
  if (without !== "10") throw new Error(`hiding self-scored attempts should leave only the auto-marked quiz (10), got ${without}`);
  await page.check("label:has-text('Include self-scored attempts') input");
  await page.waitForFunction((was) => document.querySelector("section[aria-label='Stats 132 summary'] .stats b")?.textContent === was, withSelf);
});

await step("uploads: unsupported and unreadable files are rejected with a reason and never added", async () => {
  expectNetworkFailure = true; // the browser logs the service's 422 refusals
  await go("/materials");
  await page.waitForSelector("text=Handwriting:");
  if ((await page.locator("input[type=file]").first().getAttribute("accept")).includes(".doc,")) throw new Error(".doc should not be offered");
  await mainInput().setInputFiles({ name: "program.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ not a document") });
  await page.waitForSelector("text=not a supported type");
  await mainInput().setInputFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("this is not a pdf") });
  await page.waitForSelector("text=could not be opened");
  await shot("upload-rejected");
  const files = await apiGet("files");
  if (files.length) throw new Error("a rejected file was added: " + JSON.stringify(files));
  await page.click("button:has-text('Dismiss') >> nth=0");
  expectNetworkFailure = false;
});

await step("uploads: a text file becomes searchable and is cited as Personal with collection, filename and page", async () => {
  await go("/materials");
  await mainInput().setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("The sampling distribution of the maximum likelihood estimator describes variability.\n\nMy own tip: always check that the second derivative is negative at the candidate maximum."),
  });
  await page.waitForSelector("text=it is searchable now");
  await page.fill("input[placeholder*='sampling']", "check the second derivative is negative at the maximum");
  await page.click("button:has-text('Search')");
  await page.waitForSelector(".cite:has-text('Personal · General · notes.txt · p. 1')");
  await page.click(".cite:has-text('notes.txt')");
  await page.waitForSelector("dialog[open] .plain-page mark");
  await shot("personal-preview");
  await page.click("dialog button:has-text('Close')");
});

await step("uploads: a photo of notes is read with OCR, flagged as OCR, and its page picture is shown", async () => {
  await go("/materials");
  const png = await photoOf("Maximum likelihood estimation chooses the parameter<br>that makes the observed data most likely");
  await mainInput().setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });
  await page.waitForSelector("text=Added photo.png");
  await page.waitForSelector("text=read with OCR");
  await page.fill("input[placeholder*='sampling']", "maximum likelihood estimation chooses the parameter that makes the observed data likely");
  await page.click("button:has-text('Search')");
  await page.waitForSelector(".cite:has-text('photo.png')");
  await page.click(".cite:has-text('photo.png')");
  await page.waitForSelector("dialog[open] img.page-image");
  const loaded = await page.locator("dialog[open] img.page-image").evaluate((img) => img.complete && img.naturalWidth > 0);
  if (!loaded) throw new Error("page picture did not load");
  if (!/OCR/.test(await page.locator("dialog[open]").innerText())) throw new Error("no OCR note in the preview");
  await shot("personal-ocr-preview");
  await page.click("dialog button:has-text('Close')");
});

await step("uploads: PDF pages keep their numbers", async () => {
  await go("/materials");
  await mainInput().setInputFiles({
    name: "two-pages.pdf",
    mimeType: "application/pdf",
    buffer: makePdf(["Page one covers conjugate priors", "Page two covers the delta method and asymptotic variance"]),
  });
  await page.waitForSelector("text=Added two-pages.pdf");
  await page.fill("input[placeholder*='sampling']", "delta method asymptotic variance");
  await page.click("button:has-text('Search')");
  await page.waitForSelector(".cite:has-text('two-pages.pdf · p. 2')");
});

await step("uploads: replacing makes version 2 and only the new text is searched", async () => {
  await go("/materials");
  const row = page.locator("section[aria-label='Your collections'] li", { hasText: "notes.txt" }).first();
  await row.locator("button:has-text('Replace')").click();
  await page.setInputFiles("[data-testid=replace-input]", {
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Updated tip: a conjugate prior keeps the posterior in the same family as the prior distribution."),
  });
  await page.waitForSelector("section[aria-label='Your collections'] li:has-text('notes.txt') >> text=v2");
  const hits = (await apiGet("search?q=" + encodeURIComponent("second derivative negative at the candidate maximum"))).personal;
  if (hits.some((h) => /second derivative/.test(h.text))) throw new Error("old version is still searched");
  const fresh = (await apiGet("search?q=" + encodeURIComponent("conjugate prior keeps the posterior in the same family"))).personal;
  if (!fresh.some((h) => h.filename === "notes.txt" && h.version === 2)) throw new Error("new version not found");
});

await step("uploads: removing a file takes it out of search and says what is kept", async () => {
  await go("/materials");
  const row = page.locator("section[aria-label='Your collections'] li", { hasText: "photo.png" }).first();
  await row.locator("button:has-text('Remove')").click();
  await page.click("button:has-text('Remove for good')");
  await page.waitForSelector("text=was removed from search and from this device");
  const files = await apiGet("files");
  const photo = files.find((f) => f.filename === "photo.png");
  if (!photo || !photo.removed) throw new Error("record should be kept, marked removed");
  const hits = (await apiGet("search?q=" + encodeURIComponent("maximum likelihood estimation chooses the parameter"))).personal;
  if (hits.some((h) => h.filename === "photo.png")) throw new Error("removed file still searched");
  if ((await page.request.get(`${BASE.split("#")[0]}api/files/${photo.id}/original`)).status() !== 404) throw new Error("removed original still served");
});

await step("search: real passage, citation, highlight and PDF page", async () => {
  await go("/materials");
  await page.fill("input[placeholder*='sampling']", "what is a conjugate prior");
  await page.click("button:has-text('Search')");
  await page.waitForSelector("ol.excerpts li");
  const first = page.locator("ol.excerpts li").first();
  const txt = await first.innerText();
  if (!/Lecture 3/.test(txt) || !/conjugate/i.test(txt)) throw new Error("top result is not Lecture 3 on conjugate priors: " + txt.slice(0, 120));
  if (!(await first.locator("mark").count())) throw new Error("no highlighted passage in the top result");
  await shot("search-results");
  await page.click(".cite >> nth=0");
  await page.waitForSelector("dialog[open] .page-view mark");
  const title = await page.locator("dialog[open] #src-title").innerText();
  if (!/Lecture 3/.test(title)) throw new Error("preview title: " + title);
  const src = await page.locator("dialog[open] iframe.pdf").getAttribute("src");
  if (!/lecture-03-the-posterior-distribution\.pdf#page=4/.test(src)) throw new Error("PDF not opened at the cited page: " + src);
  await shot("search-preview");
  await page.click("dialog button:has-text('Close')");
});

await step("search: nothing relevant says so and cites nothing", async () => {
  await go("/materials");
  await page.fill("input[placeholder*='sampling']", "zzzzqqqq xxyyzz");
  await page.click("button:has-text('Search')");
  await page.waitForSelector("text=No relevant sources were found");
  if (await page.locator("ol.excerpts li").count()) throw new Error("results shown for nonsense");
});

await step("search: a service failure is explained, not shown as 'no sources'", async () => {
  await go("/materials");
  expectNetworkFailure = true;
  await page.route("**/api/search**", (r) => r.abort());
  await page.fill("input[placeholder*='sampling']", "what is a posterior");
  await page.click("button:has-text('Search')");
  await page.waitForSelector("text=unavailable right now");
  await page.unroute("**/api/search**");
  expectNetworkFailure = false;
});

await step("pages whose math was read automatically carry a warning, in results and in the preview", async () => {
  const q = "probability a normal random variable is within k standard deviations of the mean";
  const api = await (await page.request.get(`${BASE.split("#")[0]}api/search?q=${encodeURIComponent(q)}&k=5`)).json();
  const flagged = api.results.findIndex((r) => r.warning);
  if (flagged < 0) throw new Error("expected at least one automatically-read page in the results");
  await go("/materials");
  await page.fill("input[placeholder*='sampling']", q);
  await page.click("button:has-text('Search')");
  await page.waitForSelector("ol.excerpts li");
  const note = await page.locator(".citations .notice").first().innerText();
  if (!/read automatically/.test(note)) throw new Error("no warning shown with the results: " + note);
  await page.click(`.cite >> nth=${flagged}`);
  await page.waitForSelector("dialog[open] .page-view");
  const warn = await page.locator("dialog[open] .notice.warn-box").first().innerText();
  if (!/read automatically/.test(warn)) throw new Error("no warning in the preview: " + warn);
  await shot("preview-warning");
  await page.click("dialog button:has-text('Close')");
});

await step("quiz answer keys are not offered as sources on the topic page", async () => {
  await go("/topic/posterior-distribution");
  const tags = await page.locator(".citations .cite").count();
  const text = await page.locator("main").innerText();
  if (/quiz/i.test(await page.locator(".citations").innerText())) throw new Error("quiz source listed before the quiz");
  if (tags === 0) throw new Error("no lecture sources listed");
});

await step("lecture notes iframe", async () => {
  await go("/notes");
  await page.waitForSelector("iframe.pdf");
});

await step("settings export + delete", async () => {
  await go("/settings");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("button:has-text('Export my data')")]);
  console.log("     export:", dl.suggestedFilename());
  await page.click("button:has-text('Delete all my data')");
  await page.click("button:has-text('Yes, delete everything')");
  await page.waitForTimeout(500);
  await putSlice("onboarding", { done: true }); // deleting everything starts setup over; the steps below are past it
});

await step("mobile layout no horizontal overflow", async () => {
  await page.setViewportSize({ width: 380, height: 800 });
  for (const p of ["/", "/learn", "/practice", "/library", `/topic/${T}`, "/progress", `/topic/${T}/quiz`, "/materials", "/settings", `/topic/${T}/vocab`, `/topic/${T}/tutorial`, `/topic/${T}/check`, `/topic/${T}/breakdown`, "/glossary"]) {
    await go(p);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 4) throw new Error(`horizontal overflow ${over}px on ${p}`);
  }
  await shot("mobile");
});

await step("piece D at 390px: every route and state fits, and no text runs past its card", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  /** The page's horizontal overflow, and every visible text node that ends past its card's (or the page's) right edge. */
  const misfits = () =>
    page.evaluate(() => {
      const vw = window.innerWidth;
      const out = [];
      const over = document.documentElement.scrollWidth - vw;
      if (over > 1) out.push(`page scrolls sideways by ${over}px`);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        const el = node.parentElement;
        if (!text || !el || el.closest(".sr-only, script, style, option, textarea, svg, .katex-display, .katex-mathml")) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        const card = el.closest(".panel, .card, main");
        const limit = Math.min(vw, card ? card.getBoundingClientRect().right : vw) + 1;
        if (r.right > limit) out.push(`"${text.slice(0, 40)}" ends at ${Math.round(r.right)}px, past ${Math.round(limit)}px`);
      }
      return out;
    });
  const fits = async (what) => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const bad = await misfits();
    if (bad.length) throw new Error(`${what}: ${bad.slice(0, 3).join("; ")}`);
  };
  await putSlice("learning", { vocab: {}, checks: {}, breakdowns: {} });
  await go(`/topic/${T}/vocab`);
  await page.waitForSelector(".term-card");
  await fits("vocab lesson");
  await page.click("button:has-text('Next term')");
  await fits("vocab lesson, term 2");
  await go(`/topic/${T}/vocab?mode=cards`);
  await page.click("button:has-text('Reveal the definition')");
  await page.waitForSelector("[aria-label='Definition']");
  await fits("flashcard revealed");
  await go(`/topic/${T}/vocab?mode=quiz`);
  await page.waitForSelector(".quiz-options");
  await fits("quiz definition");
  await page.locator(".quiz-options input[type=radio]").nth(1).check();
  await page.click(".term-card button:has-text('Check my answer')");
  await page.waitForSelector(".term-card .result");
  await fits("quiz marked");
  await go(`/topic/${T}/vocab?mode=list`);
  await page.waitForSelector(".g-row");
  await fits("topic glossary");
  await go(`/topic/${T}/tutorial?step=2`);
  await page.waitForSelector(".step-card");
  await fits("tutorial step");
  const q = page.locator(".check").first();
  await q.locator(".choice:has-text('has the same maximum value') input").check();
  await page.waitForSelector(".step-card.folded");
  await fits("tutorial step folded");
  await q.locator("button:has-text('Check my answer')").click();
  await page.waitForSelector(".check.marked .result");
  await fits("check marked");
  await page.click(".check.marked .result button:has-text('Why')");
  await page.click(".check.marked .whys-wrap button:has-text('Show the options')");
  await page.waitForSelector(".check.marked .why");
  await fits("check why");
  await go(`/topic/${T}/check`);
  await page.waitForSelector(".check-summary");
  await fits("checks summary");
  await go(`/topic/${T}/breakdown`);
  await page.waitForSelector(".bd-problem");
  await fits("breakdown");
  for (let k = 0; k < 5; k++) {
    const open = page.locator(".bd-part:not(.revealed)").first();
    if (await open.locator("input[type=radio]").count()) await open.locator("input[type=radio]").first().check();
    else await open.locator("textarea").fill("a try");
    await open.locator("button:has-text('Reveal the model answer')").click();
    await page.waitForFunction((n) => document.querySelectorAll(".bd-part.revealed").length === n, k + 1);
    await fits(`breakdown part ${k + 1} revealed`);
  }
  await page.click("button:has-text('Show the full worked solution')");
  await page.waitForSelector("[aria-label='Worked solution']");
  await fits("breakdown worked solution");
  await go(`/topic/${T}/breakdown?q=4`);
  await page.waitForSelector(".bd-problem h2:has-text('Website clicks')");
  await fits("which tool? problem");
  await go("/glossary");
  await page.waitForSelector(".g-row");
  await fits("glossary");
  await go("/library");
  await page.waitForSelector(".library-grid");
  await fits("library");
  await putSlice("learning", { vocab: {}, checks: {}, breakdowns: {} });
});

// ---------------------------------------------------------------------------------------------- AI service (fake Gemini)
await page.setViewportSize({ width: 1100, height: 900 });
// A same-address hash change does not remount the page, so go through the overview first for a fresh screen.
const fresh = async (p) => {
  await go("/");
  await go(p);
};
expectNetworkFailure = true; // the tests below deliberately send a wrong key and trigger rate limits
const FAKE = process.env.FAKE_GEMINI;
const GOOD_KEY = "good-key-123";
const geminiLog = async () => (await fetch(`${FAKE}/__log`)).json();
const settleSaves = () => page.waitForTimeout(800);
const lastAttempt = async (kind) => (await apiGet("state")).state.attempts.filter((a) => a.kind === kind).at(-1);
const WRITTEN = "The MLE maximizes the likelihood because it makes the observed data most probable. It matters since it gives a point estimate, for example n=10.";

await step("ai: connecting needs the data notice accepted; a wrong key is refused in plain words; a good key connects", async () => {
  await go("/settings");
  await page.waitForSelector("text=What gets sent");
  await page.waitForSelector("text=may use what is sent to improve its products");
  await page.fill("input[aria-label='API key']", "wrong-key");
  if (!(await page.locator("button:has-text('Connect')").isDisabled())) throw new Error("Connect must wait for the notice to be accepted");
  await page.check("label:has-text('I have read this') input");
  await page.click("button:has-text('Connect')");
  await page.waitForSelector("[role=alert]:has-text('did not accept your key')");
  if ((await apiGet("ai")).keyStored) throw new Error("a refused key must not be stored");
  await page.fill("input[aria-label='API key']", GOOD_KEY);
  await page.click("button:has-text('Connect')");
  await page.waitForSelector("text=Connected to Google Gemini");
  await shot("ai-connected");
  const body = await page.evaluate(() => document.body.innerText);
  if (body.includes(GOOD_KEY)) throw new Error("the key is shown on the page after connecting");
  const exported = await (await page.request.get(`${BASE.split("#")[0]}api/export`)).text();
  if (exported.includes(GOOD_KEY)) throw new Error("the key leaked into the data export");
});

await step("ai: a recall is scored on four criteria, with comments, and saved as AI-scored", async () => {
  await fresh(`/topic/${T}`);
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", WRITTEN);
  await page.click("button:has-text('Score with AI')");
  await page.waitForSelector(".criteria li", { timeout: 15000 });
  await page.waitForSelector("text=You named the central idea clearly.");
  await page.waitForSelector("text=Qualifying recall added to your streak");
  if ((await page.locator(".chip:has-text('Self-scored')").count()) > 0) throw new Error("an AI-scored recall must not be labeled self-scored");
  await shot("ai-recall");
  await settleSaves();
  const a = await lastAttempt("recall");
  if (!a.aiScored || a.selfScored) throw new Error("attempt flags wrong: " + JSON.stringify(a));
  if (new Set(Object.values(a.criteria)).size < 2) throw new Error("an AI score must keep four different criterion scores");
  const sent = JSON.stringify((await geminiLog()).at(-1));
  if (sent.includes(GOOD_KEY)) throw new Error("key sent in the body");
});

await step("ai: when scoring fails the answer is kept, the reason is plain, and self-scoring still works", async () => {
  await fresh(`/topic/${T}`);
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", "FAILME " + WRITTEN);
  await page.click("button:has-text('Score with AI')");
  await page.waitForSelector("[role=alert]:has-text('free allowance')");
  if (!(await page.inputValue("textarea")).startsWith("FAILME")) throw new Error("the answer was lost");
  await page.waitForSelector("button:has-text('Retry AI scoring')");
  await page.click("button:has-text('Score it myself instead')");
  await page.waitForSelector("h3:has-text('Reference solution')");
});

await step("ai: practice quiz scores a written answer with the AI and locks the first response", async () => {
  await fresh(`/topic/${T}/quiz`);
  await page.click("button:has-text('Low-stakes practice')");
  for (let k = 0; k < 5; k++) await page.click("button:has-text('Next')");
  await page.waitForSelector("text=Question 6 of 10");
  await page.fill("textarea", WRITTEN);
  await page.click("button:has-text('Check answer')");
  await page.waitForSelector(".chip:has-text('AI-scored')", { timeout: 15000 });
  await page.waitForSelector(".criteria li");
  await shot("ai-quiz-practice");
});

await step("ai: a graded quiz is scored on submit without asking the learner to self-rate", async () => {
  await fresh(`/topic/${T}/quiz`);
  await page.click("button:has-text('Graded quiz')");
  for (let k = 0; k < 5; k++) await page.click("button:has-text('Next')");
  await page.fill("textarea", WRITTEN);
  await page.click("button:has-text('Review') >> nth=-1");
  await page.click("button:has-text('Submit quiz')");
  await page.waitForSelector("text=Quiz summary", { timeout: 20000 });
  await page.waitForSelector(".chip:has-text('AI-scored')");
  await settleSaves();
  const a = await lastAttempt("quiz");
  if (!a.aiScored || a.selfScored) throw new Error("quiz attempt flags wrong: " + JSON.stringify(a));
  await shot("ai-quiz-summary");
});

await step("ai: a graded quiz whose scoring fails falls back to self-rating without losing answers", async () => {
  await fresh(`/topic/${T}/quiz`);
  await page.click("button:has-text('Graded quiz')");
  for (let k = 0; k < 5; k++) await page.click("button:has-text('Next')");
  await page.fill("textarea", "FAILME " + WRITTEN);
  await page.click("button:has-text('Review') >> nth=-1");
  await page.click("button:has-text('Submit quiz')");
  await page.waitForSelector("text=Score your written answers");
  await page.waitForSelector("[role=alert]:has-text('free allowance')");
  await page.waitForSelector("button:has-text('Retry AI scoring')");
  await page.click("label:has-text('Partly') input");
  await page.click("button:has-text('Finish and save')");
  await page.waitForSelector("text=Quiz summary");
});

await step("ai: an exam is scored by the AI on request and the review shows its comments", async () => {
  await fresh(`/topic/${T}/exam`);
  await page.click("button:has-text('Start exam')");
  await page.waitForSelector("text=Question 1 of");
  for (let i = 0; i < 8; i++) {
    await page.fill("textarea", "Write the log-likelihood, differentiate, set to zero, so theta-hat = sum x / (2n) because it is the maximizer. For example 9/6.");
    if (await page.locator("button:has-text('Submit and score')").count()) break;
    await page.click("button:has-text('Next')");
  }
  await page.click("button:has-text('Submit and score')");
  await page.waitForSelector("text=Score your exam");
  await page.click("button:has-text('Score my answers with AI')");
  await page.waitForSelector("button:has-text('All answers scored')", { timeout: 30000 });
  await shot("ai-exam-check");
  await page.click("button:has-text('Finish and save')");
  await page.waitForSelector("text=attempt", { timeout: 20000 });
  await page.waitForSelector("text=You named the central idea clearly.");
  if ((await page.locator(".chip:has-text('Self-scored')").count()) > 0) throw new Error("a fully AI-scored exam must not be labeled self-scored");
  await shot("ai-exam-review");
});

await step("ai: the tutor talks, proposes a plan, builds with a cited course page, and saves a session", async () => {
  await fresh(`/topic/${T}/tutor`);
  await page.waitForSelector("text=Let's start with what you already know");
  const say = async (text, wait) => {
    await page.fill("textarea", text);
    await page.click("button:has-text('Send')");
    await page.waitForSelector(wait, { timeout: 15000 });
  };
  await say("It picks the parameter that makes the data most likely.", "text=What exactly is being maximized");
  await say("The likelihood of theta.", "text=Proposed plan");
  await shot("ai-tutor-plan");
  await page.click("button:has-text('Accept plan')");
  await page.waitForSelector("text=Imagine two classmates");
  await page.waitForSelector(".bubble.tutor .cite", { timeout: 10000 }); // the page it relied on is cited
  await say("The data are fixed and theta varies, so we compare how likely the data are at each theta.", "text=Now write the formal statement");
  await say("L(theta) = prod f(x_i | theta) and theta-hat = argmax L", "text=Session saved");
  await shot("ai-tutor-done");
  await settleSaves();
  const a = await lastAttempt("tutor");
  if (!a.aiScored || a.composite < 70 || a.composite > 80) throw new Error("tutor attempt wrong: " + JSON.stringify(a));
  const st = (await apiGet("state")).state.topicState[T];
  if (!st.strengths.includes("Core idea") || !st.gaps.includes("Applying it to a new case")) throw new Error("strengths and gaps were not kept: " + JSON.stringify(st));
});

await step("ai: when the tutor cannot answer, the message stays in the box and the learner can retry", async () => {
  await fresh(`/topic/${T}/tutor`);
  await page.fill("textarea", "FAILME I think it picks theta");
  await page.click("button:has-text('Send')");
  await page.waitForSelector("[role=alert]:has-text('free allowance')");
  if (!(await page.inputValue("textarea")).startsWith("FAILME")) throw new Error("the message was lost");
  await page.waitForSelector("button:has-text('Try again')");
  await page.waitForSelector("a:has-text('The tutorial')");
});

await step("ai: an exam is written around the focus, marked as AI-written, cites course pages, and can be scored and reviewed", async () => {
  await fresh(`/topic/${T}/exam`);
  await page.fill("label:has-text('Focus') input", "Uniform edge case");
  await page.check("label:has-text('Written for me by your AI service') input");
  await page.selectOption("select", "3");
  await page.click("button:has-text('Write my exam')");
  await page.waitForSelector("text=Generated question 1", { timeout: 15000 });
  await page.waitForSelector(".chip:has-text('AI-written')");
  const asked = JSON.stringify((await geminiLog()).at(-1));
  if (!asked.includes("Uniform edge case") || !asked.includes("Number of questions: 3")) throw new Error("the focus and count were not sent");
  await page.click("button:has-text('Hint')");
  await page.waitForSelector("text=Generated hint 1");
  await page.click("button:has-text('Show source material')");
  await page.waitForSelector(".cite");
  await shot("ai-exam-generated");
  for (let i = 0; i < 6; i++) {
    await page.fill("textarea", "Write the log-likelihood, differentiate, set to zero and solve because that is the maximizer. For example n=10.");
    if (await page.locator("button:has-text('Submit and score')").count()) break;
    await page.click("button:has-text('Next')");
  }
  await page.click("button:has-text('Submit and score')");
  await page.waitForSelector("text=Score your exam");
  await page.click("button:has-text('Score my answers with AI')");
  await page.waitForSelector("button:has-text('All answers scored')", { timeout: 30000 });
  await page.click("button:has-text('Finish and save')");
  await page.waitForSelector("text=attempt", { timeout: 20000 });
  await page.waitForSelector(".chip:has-text('AI-written')");
  await page.waitForSelector("summary:has-text('Reference solution')");
  await page.waitForSelector(".cite");
  await shot("ai-exam-generated-review");
  await go("/exams");
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.click("button:has-text('Download PDF') >> nth=0")]);
  console.log("     pdf:", dl.suggestedFilename());
});

await step("ai: if writing the exam fails the focus is kept and the question bank is one click away", async () => {
  await fresh(`/topic/${T}/exam`);
  await page.fill("label:has-text('Focus') input", "FAILME edge case");
  await page.check("label:has-text('Written for me by your AI service') input");
  await page.click("button:has-text('Write my exam')");
  await page.waitForSelector("[role=alert]:has-text('free allowance')");
  if (!(await page.inputValue("label:has-text('Focus') input")).startsWith("FAILME")) throw new Error("the focus was lost");
  await page.click("button:has-text('Use the question bank instead')");
  await page.waitForSelector("text=Question 1 of");
  if ((await page.locator(".chip:has-text('AI-written')").count()) > 0) throw new Error("a bank exam must not be marked AI-written");
});

await step("ai: Improve with AI asks every time, sends the page picture, re-reads handwriting with math, and can be undone", async () => {
  const origin = BASE.split("#")[0].replace(/\/$/, "");
  await fresh("/materials");
  const png = await photoOf("Maximum likelihood estimation chooses the parameter<br>that makes the observed data most likely");
  await mainInput().setInputFiles({ name: "my-handwriting.png", mimeType: "image/png", buffer: png });
  await page.waitForSelector("text=Added my-handwriting.png", { timeout: 30000 });
  const row = page.locator("li.row:has-text('my-handwriting.png')");
  await row.locator("button:has-text('Improve with AI')").click();
  await page.waitForSelector("dialog[open] >> text=a picture of each page");
  await page.waitForSelector("dialog[open] >> text=page images themselves");
  const send = page.locator("dialog[open] button:has-text('Send')");
  if (!(await send.isDisabled())) throw new Error("Send must wait for the learner to agree");
  const before = (await geminiLog()).length;
  await shot("ai-improve-dialog");
  await page.check("dialog[open] label:has-text('I understand') input");
  await send.click();
  await page.waitForSelector("dialog[open] >> text=Improved 1 page", { timeout: 30000 });
  const sent = (await geminiLog()).slice(before);
  if (sent.length !== 1 || !sent[0].contents[0].parts[0].inlineData?.data) throw new Error("the page picture was not sent exactly once");
  await shot("ai-improve-done");
  await page.click("dialog[open] button:has-text('Done')");
  await page.waitForSelector("li.row:has-text('my-handwriting.png') .chip:has-text('AI-read')");
  await page.fill("input[placeholder*='sampling']", "nebulous quokka identity posterior likelihood prior");
  await page.click("button:has-text('Search')");
  await page.waitForSelector(".cite:has-text('my-handwriting.png')");
  await page.click(".cite:has-text('my-handwriting.png')");
  await page.waitForSelector("dialog[open] .katex");
  if (!/AI model/.test(await page.locator("dialog[open]").innerText())) throw new Error("no AI-read warning in the preview");
  await shot("ai-improve-preview");
  await page.click("dialog button:has-text('Close')");
  // asking again starts from "not agreed": consent is per use
  await row.locator("button:has-text('Improve with AI')").click();
  await page.waitForSelector("dialog[open] >> text=Which pages?");
  if (await page.locator("dialog[open] label:has-text('I understand') input").isChecked()) throw new Error("consent must not be remembered");
  await page.click("dialog[open] button:has-text('Cancel')");
  await row.locator("button:has-text('Use automatic reading')").click();
  await page.waitForSelector("text=is back to its automatic reading");
  if ((await row.locator(".chip:has-text('AI-read')").count()) > 0) throw new Error("still marked AI-read");
  const hits = await apiGet("search?q=" + encodeURIComponent("nebulous quokka identity"));
  if (hits.personal.some((h) => h.filename === "my-handwriting.png" && /quokka/.test(h.text))) throw new Error("the AI reading is still searchable after restoring");
});

await step("ai: disconnecting removes the key and the AI-only controls", async () => {
  await go("/settings");
  await page.click("button:has-text('Disconnect and forget my key')");
  await page.waitForSelector("text=What gets sent");
  const s = await apiGet("ai");
  if (s.keyStored || s.connected) throw new Error("still connected after disconnecting");
  await fresh(`/topic/${T}`);
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", WRITTEN);
  if ((await page.locator("button:has-text('Score with AI')").count()) > 0) throw new Error("AI scoring offered while disconnected");
});

await step("ai: a model on this computer (Ollama) can be chosen, says nothing leaves the computer, and scores a recall", async () => {
  await fresh("/settings");
  await page.check("label:has-text('Ollama') input");
  await page.waitForSelector("text=nothing is sent over the internet");
  await page.waitForSelector("select[aria-label='Ollama model'] option:has-text('qwen2.5:7b')", { state: "attached" });
  await shot("ai-ollama-setup");
  if (!(await page.locator("button:has-text('Connect')").isDisabled())) throw new Error("Connect must wait for the notice to be accepted");
  await page.selectOption("select[aria-label='Ollama model']", "qwen2.5:7b");
  await page.check("label:has-text('I have read this') input");
  const geminiBefore = (await geminiLog()).length;
  await page.click("button:has-text('Connect')");
  await page.waitForSelector("text=Connected to Ollama");
  await page.waitForSelector("text=It runs on this computer");
  await fresh(`/topic/${T}`);
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", WRITTEN);
  await page.click("button:has-text('Score with AI')");
  await page.waitForSelector("text=The local model saw the central idea.", { timeout: 15000 });
  const sent = await (await fetch(`${process.env.FAKE_OLLAMA}/__log`)).json();
  if (!sent.length || sent.at(-1).model !== "qwen2.5:7b" || sent.at(-1).format !== "json") throw new Error("the request did not go to the chosen local model");
  if ((await geminiLog()).length !== geminiBefore) throw new Error("something was sent to the hosted service");
  await shot("ai-ollama-recall");
  await fresh("/settings");
  await page.click("button:has-text('Disconnect')");
  await page.waitForSelector("text=What gets sent");
  if ((await apiGet("ai")).connected) throw new Error("still connected");
});

await step("ai: several services stay saved; the corner chip shows the one in use, switches between them, and opening a topic warms the local model", async () => {
  await fresh("/settings");
  await page.check("label:has-text('Ollama') input");
  await page.waitForSelector("select[aria-label='Ollama model'] option:has-text('qwen2.5:7b')", { state: "attached" });
  await page.selectOption("select[aria-label='Ollama model']", "qwen2.5:7b");
  await page.check("label:has-text('I have read this') input");
  await page.click("button:has-text('Connect')");
  await page.waitForSelector("text=Connected to Ollama");
  // a hosted service on top: both stay saved, the newest becomes the one in use
  await page.check("label:has-text('Google Gemini') input");
  await page.waitForSelector("text=stays saved");
  await page.fill("input[aria-label='API key']", GOOD_KEY);
  await page.check("label:has-text('I have read this') input");
  await page.click("button:has-text('Connect')");
  await page.waitForSelector("text=Connected to Google Gemini");
  let s = await apiGet("ai");
  if (s.active !== "gemini" || s.accounts.map((a) => a.id).join() !== "gemini,ollama") throw new Error("both services should be saved with Gemini in use: " + JSON.stringify(s.accounts));
  await page.waitForSelector(".saved-services li:has-text('Ollama') button:has-text('Use this')");
  await shot("ai-saved-services");
  // the corner chip names the model in use and switches to another saved service without a key
  const chip = page.locator(".ai-chip");
  if (!(await chip.textContent()).includes("gemini-flash-latest · Google")) throw new Error("chip reads: " + (await chip.textContent()));
  await chip.click();
  if ((await page.locator("[role=menu] [role=menuitemradio]").count()) !== 2) throw new Error("the menu should list both saved services");
  await shot("ai-chip-menu");
  await page.click("[role=menuitemradio]:has-text('qwen2.5:7b')");
  await page.waitForFunction(() => (document.querySelector(".ai-chip")?.textContent ?? "").includes("qwen2.5:7b · local"));
  if ((await apiGet("ai")).active !== "ollama") throw new Error("the switch did not take");
  if (await page.locator("[role=menu]").count()) throw new Error("the menu should close after switching");
  // opening a topic asks Ollama to load the model now and keep it loaded for the session
  const before = (await (await fetch(`${process.env.FAKE_OLLAMA}/__log`)).json()).length;
  const aiCalls = [];
  const onReq = (r) => { if (r.url().includes("/api/ai")) aiCalls.push(`${r.method()} ${r.url().split("/api/")[1]}`); };
  page.on("request", onReq);
  await go(`/topic/${T}`);
  let warm = null;
  for (let i = 0; i < 100 && !warm; i++) {
    const log = await (await fetch(`${process.env.FAKE_OLLAMA}/__log`)).json();
    warm = log.slice(before).find((r) => Array.isArray(r.messages) && r.messages.length === 0);
    if (!warm) await page.waitForTimeout(100);
  }
  page.off("request", onReq);
  if (!warm || warm.model !== "qwen2.5:7b" || warm.keep_alive !== "30m") {
    const st = await apiGet("ai");
    throw new Error(`the local model was not warmed on opening a topic: ${JSON.stringify(warm)}; chip="${await chip.textContent()}"; status active=${st.active} local=${st.local} warm=${JSON.stringify(st.warm)}; ai calls=${aiCalls.join(", ")}; url=${page.url()}`);
  }
  await page.waitForFunction(() => !(document.querySelector(".ai-chip")?.textContent ?? "").includes("loading"));
  // forgetting one service keeps the other; forgetting the one in use leaves none in use
  await fresh("/settings");
  await page.click(".saved-services li:has-text('Google Gemini') button:has-text('Forget')");
  await page.waitForFunction(() => !document.querySelector(".saved-services"));
  s = await apiGet("ai");
  if (s.accounts.map((a) => a.id).join() !== "ollama" || s.active !== "ollama") throw new Error("forgetting Gemini should keep Ollama in use: " + JSON.stringify(s));
  await page.click("button:has-text('Disconnect')");
  await page.waitForSelector("text=What gets sent");
  s = await apiGet("ai");
  if (s.connected || s.accounts.length) throw new Error("something is still saved: " + JSON.stringify(s));
  if (!(await chip.textContent()).includes("off")) throw new Error("the chip should say off: " + (await chip.textContent()));
});
for (const id of ["gemini", "ollama"]) await page.request.delete(`${BASE.split("#")[0]}api/ai?provider=${id}`).catch(() => {}); // in case the step failed midway

for (const [id, label, model, kind] of [["anthropic", "Anthropic Claude", "claude-haiku-4-5", "anthropic"], ["openai", "OpenAI", "gpt-5.4-mini", "openai"]]) {
  await step(`ai: ${label} connects with a pasted key, picks a model the account has, warns about API credit, and scores a recall`, async () => {
    await fresh("/settings");
    await page.check(`label:has-text('${label}') input`);
    await page.waitForSelector("text=does not include API credit");
    await page.fill("input[aria-label='API key']", "bad-key");
    await page.check("label:has-text('I have read this') input");
    await page.click("button:has-text('Connect')");
    await page.waitForSelector("[role=alert]:has-text('did not accept your key')");
    await page.fill("input[aria-label='API key']", "sk-good-key");
    await page.click("button:has-text('Connect')");
    await page.waitForSelector(`text=Connected to ${label}`);
    if ((await page.inputValue("input[aria-label='Model']")) !== model) throw new Error("the model was not chosen from the account's list");
    await fresh(`/topic/${T}`);
    await page.click("button:has-text('Try a recall')");
    await page.fill("textarea", WRITTEN);
    await page.click("button:has-text('Score with AI')");
    await page.waitForSelector("text=The hosted model saw the central idea.", { timeout: 15000 });
    const sent = (await (await fetch(`${process.env.FAKE_CHAT}/__log`)).json()).filter((r) => r.kind === kind).at(-1);
    if (!sent || sent.model !== model) throw new Error("the request did not use the chosen model");
    await shot(`ai-${id}`);
    await fresh("/settings");
    await page.click("button:has-text('Disconnect')");
    await page.waitForSelector("text=What gets sent");
  });
}

expectNetworkFailure = false;
await step("ai: leave the service empty for the next test file", async () => {
  await go("/settings");
  await page.click("button:has-text('Delete all my data')");
  await page.click("button:has-text('Yes, delete everything')");
  await page.waitForTimeout(500);
  if ((await apiGet("state")).state.attempts?.length) throw new Error("data was not cleared");
});

console.log("\nPROBLEMS:", problems.length ? "\n" + problems.join("\n") : "none");
await browser.close();
process.exit(problems.length ? 1 : 0);
