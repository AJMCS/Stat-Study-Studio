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
page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
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

await step("tutorial renders math and steps through", async () => {
  await go(`/topic/${T}/tutorial`);
  await page.waitForSelector(".katex");
  await shot("tutorial");
  while (await page.locator("button:has-text('Next')").count()) await page.click("button:has-text('Next')");
  await page.waitForSelector("text=Talk it through with the tutor");
});

await step("tutor full flow", async () => {
  await go(`/topic/${T}/tutor`);
  const send = async (txt) => {
    await page.fill("textarea", txt);
    await page.click("button:has-text('Send')");
    await page.waitForTimeout(900);
  };
  await send("The MLE is the value of the parameter that makes the observed data most likely, because the likelihood measures how well each value explains the data.");
  await send("It matters because we need one best guess for the parameter, for example from a sample of size 10.");
  await page.waitForSelector("text=Proposed plan");
  await page.click("button:has-text('Accept plan')");
  await page.waitForTimeout(900);
  await send("The two classmates got different estimates because samples vary.");
  await send("$\\hat{\\theta} = \\arg\\max_\\theta L(\\theta)$ because logs are increasing, so the likelihood maximizer is the log-likelihood maximizer.");
  await page.waitForSelector("text=Session saved", { timeout: 5000 });
  await shot("tutor-done");
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

await step("quiz practice mode locks first response", async () => {
  await go("/");
  await go(`/topic/${T}/quiz`);
  await page.click("button:has-text('Low-stakes practice')");
  await page.click("input[type=radio] >> nth=0");
  await page.click("button:has-text('Check answer')");
  await page.waitForSelector("text=first response, now locked");
  const disabled = await page.locator("input[type=radio]").first().isDisabled();
  if (!disabled) throw new Error("choices not locked after feedback");
  await shot("quiz-practice");
});

await step("exam untimed: hint, source toggle, submit, review, history, pdf", async () => {
  await go(`/topic/${T}/exam`);
  await page.fill("input[placeholder*='Focus'], label:has-text('Focus') input", "Uniform edge case");
  await page.click("button:has-text('Start exam')");
  await page.waitForSelector("text=Question 1 of");
  await page.click("button:has-text('Hint')");
  await page.waitForSelector("text=Hint:");
  await page.click("button:has-text('Show source material')");
  await page.waitForSelector(".cite");
  await shot("exam-aids");
  for (let i = 0; i < 6; i++) {
    await page.fill("textarea", "Write the log-likelihood, differentiate, set to zero, so theta-hat = sum x / (2n) because it is the maximizer. For example 9/6.");
    if (await page.locator("button:has-text('Submit exam')").count()) break;
    await page.click("button:has-text('Next')");
  }
  await page.click("button:has-text('Submit exam')");
  await page.waitForSelector("text=attempt 1", { timeout: 20000 });
  await shot("exam-review");
  await go("/exams");
  await page.waitForSelector("text=Download PDF");
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.click("button:has-text('Download PDF')")]);
  console.log("     pdf:", dl.suggestedFilename());
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
  await page.waitForSelector("dialog[open] mark");
  await page.waitForTimeout(800);
  await shot("citation-preview");
  await page.click("dialog button:has-text('Close')");
});

await step("recall on topic page updates streak", async () => {
  await go(`/topic/${T}`);
  await page.click("button:has-text('Try a recall')");
  await page.fill("textarea", "The MLE maximizes the likelihood because it makes the observed data most probable. It matters since it gives a point estimate, for example n=10. Consistent and invariant.");
  await page.click("button:has-text('Score my recall')");
  await page.waitForSelector("text=composite", { timeout: 8000 });
  await shot("recall");
});

await step("progress page", async () => {
  await go("/progress");
  await page.waitForSelector("text=Stats 132 summary");
  await page.click("button:has-text('Inspect criteria and attempts') >> nth=0").catch(() => {});
  await shot("progress");
});

await step("materials: reject bad file, upload txt, search with consent", async () => {
  await go("/materials");
  writeFileSync(`${OUT}/bad.xyz`, "nope");
  writeFileSync(`${OUT}/notes.txt`, "The sampling distribution of the maximum likelihood estimator describes variability.\n\nMy own tip: always check the second derivative.");
  await page.setInputFiles("input[type=file]", `${OUT}/bad.xyz`).catch(() => {});
  await page.waitForTimeout(400);
  await page.setInputFiles("input[type=file]", `${OUT}/notes.txt`);
  await page.waitForSelector("text=notes.txt");
  await page.fill("input[placeholder*='sampling']", "second derivative maximum likelihood");
  await page.click("button:has-text('Search')");
  await page.waitForSelector("dialog[open] >> text=Send to a hosted model?");
  await shot("consent");
  await page.click("dialog button:has-text('Allow')");
  await page.waitForSelector(".cite");
  await shot("materials-results");
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

console.log("\nPROBLEMS:", problems.length ? "\n" + problems.join("\n") : "none");
await browser.close();
process.exit(problems.length ? 1 : 0);
