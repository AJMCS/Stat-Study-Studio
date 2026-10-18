import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { launchBrowser } from "./browser.mjs";

const OUT = process.argv[2] ?? join(tmpdir(), "studio-e2e-out");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:5173/#";
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
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
  }
};
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

await step("overview lists 7 topics", async () => {
  await go("/");
  const cards = await page.locator("a.card").count();
  if (cards !== 7) throw new Error(`expected 7 topic cards, got ${cards}`);
  await shot("overview");
});

await step("topic page", async () => {
  await page.locator("a.card", { hasText: "Maximum Likelihood Estimation" }).click();
  await page.waitForSelector("h1:has-text('Maximum Likelihood Estimation')");
  await shot("topic");
});

await step("tutorial: math renders and a worked example shows its solution only on request", async () => {
  await go(`/topic/${T}/tutorial`);
  await page.waitForSelector(".katex");
  await shot("tutorial");
  await page.click("button:has-text('Next')");
  await page.click("button:has-text('Next')");
  await page.waitForSelector("text=Worked example 1: try it first");
  if (await page.locator("[aria-label='Solution to worked example 1']").count()) throw new Error("solution visible before it was asked for");
  await page.click("button:has-text('Show the solution') >> nth=0");
  await page.waitForSelector("[aria-label='Solution to worked example 1'] .katex");
  await shot("tutorial-example");
  while (await page.locator("button:has-text('Next')").count()) await page.click("button:has-text('Next')");
  await page.waitForSelector("text=Take the quiz");
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
  await page.click("input[type=radio] >> nth=1");
  await page.click("button:has-text('Check retry')");
  await page.waitForSelector("text=does not change your first-attempt score");
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
});

await step("mobile layout no horizontal overflow", async () => {
  await page.setViewportSize({ width: 380, height: 800 });
  for (const p of ["/", `/topic/${T}`, "/progress", `/topic/${T}/quiz`]) {
    await go(p);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 4) throw new Error(`horizontal overflow ${over}px on ${p}`);
  }
  await shot("mobile");
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
