import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TOPICS } from "./topics";
import { VOCAB } from "./vocab";
import { CHECKS } from "./comprehension";
import { BREAKDOWNS, METHOD, MIXED } from "./breakdown";
import { stableOrder } from "../lib/shuffle";
import { citationProblems } from "./transcripts.testutil";
import { BREAKDOWN_PARTS, type SourceRef } from "../types";

/** Every citation in the vocabulary, the comprehension checks and the breakdowns of one topic. */
function citations(topicId: string): SourceRef[] {
  return [
    ...(VOCAB[topicId] ?? []).map((v) => v.source),
    ...(CHECKS[topicId] ?? []).flatMap((c) => [c.source, ...(c.choices ?? []).flatMap((o) => (o.source ? [o.source] : []))]),
    ...(BREAKDOWNS[topicId] ?? []).flatMap((b) => b.sources),
  ];
}

const allIds = (xs: { id: string }[]) => {
  const seen = new Set<string>();
  const dup = xs.map((x) => x.id).filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  return dup;
};

/**
 * Every piece of copy the app sets from these files, as [where, text]: the checks (stems, options, their reasons,
 * reference answers), the breakdowns (titles, statements, every part's model answer and options, worked solutions),
 * the vocabulary, the method, and the topics' overview and tutorial text (intro, study list, step headings and
 * bodies, worked examples, recall prompts with their reference and key points, exam reference solutions).
 */
function copy(): [string, string][] {
  const texts: [string, string][] = [];
  for (const cs of Object.values(CHECKS))
    for (const c of cs) {
      texts.push([`${c.id} prompt`, c.prompt]);
      if (c.reference) texts.push([`${c.id} reference`, c.reference]);
      for (const [i, o] of (c.choices ?? []).entries()) texts.push([`${c.id} option ${i}`, o.text], [`${c.id} why ${i}`, o.why]);
    }
  for (const b of [...Object.values(BREAKDOWNS).flat(), ...MIXED]) {
    texts.push([`${b.id} title`, b.title], [`${b.id} prompt`, b.prompt], [`${b.id} solution`, b.solution]);
    for (const k of BREAKDOWN_PARTS) {
      texts.push([`${b.id} ${k} model`, b.parts[k].model]);
      for (const [i, o] of (b.parts[k].options ?? []).entries()) texts.push([`${b.id} ${k} option ${i}`, o]);
    }
  }
  for (const v of Object.values(VOCAB).flat()) texts.push([`${v.id} term`, v.term], [`${v.id} plain`, v.plain], [`${v.id} formal`, v.formal ?? ""], [`${v.id} seeIt`, v.seeIt]);
  for (const m of METHOD) texts.push([`method ${m.key}`, `${m.title} ${m.ask}`]);
  for (const t of TOPICS) {
    texts.push([`${t.id} intro`, t.intro]);
    for (const [i, w] of t.willStudy.entries()) texts.push([`${t.id} willStudy ${i}`, w]);
    for (const [i, s] of t.tutorial.entries()) {
      texts.push([`${t.id} step ${i} heading`, s.heading], [`${t.id} step ${i} body`, s.body]);
      for (const [j, e] of (s.examples ?? []).entries()) texts.push([`${t.id} step ${i} example ${j} prompt`, e.prompt], [`${t.id} step ${i} example ${j} solution`, e.solution]);
    }
    texts.push([`${t.id} recall prompt`, t.recall.prompt], [`${t.id} recall reference`, t.recall.reference]);
    for (const [i, k] of t.recall.keyPoints.entries()) texts.push([`${t.id} recall keyPoint ${i}`, k]);
    for (const q of t.examBank) texts.push([`${q.id} solution`, q.solution]);
  }
  return texts;
}

/** The prose of a text once its maths ($…$, $$…$$) and its mono runs (‹L07›, ‹1.4›) are taken out. */
const prose = (s: string) => s.replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g, " ").replace(/‹[^›]*›/g, " ");

describe("learning activities", () => {
  it("has content for exactly the course's topics", () => {
    const ids = TOPICS.map((t) => t.id).sort();
    expect(Object.keys(VOCAB).sort()).toEqual(ids);
    expect(Object.keys(CHECKS).sort()).toEqual(ids);
    expect(Object.keys(BREAKDOWNS).sort()).toEqual(ids);
  });

  it("uses unique ids for terms, checks, breakdowns and their citations", () => {
    expect(allIds(Object.values(VOCAB).flat())).toEqual([]);
    expect(allIds(Object.values(CHECKS).flat())).toEqual([]);
    expect(allIds(Object.values(BREAKDOWNS).flat())).toEqual([]);
    expect(allIds(TOPICS.flatMap((t) => citations(t.id)))).toEqual([]);
  });

  it("teaches the same five breakdown parts every time", () => {
    expect(METHOD.map((p) => p.key)).toEqual([...BREAKDOWN_PARTS]);
  });

  it("never names the method in a breakdown's title", () => {
    const method = /mle|likelihood|bayes|posterior|prior|conjugate|sampling|estimat|loss|invariance|bias/i;
    for (const b of [...Object.values(BREAKDOWNS).flat(), ...MIXED]) expect(b.title, b.id).not.toMatch(method);
  });

  it("has a mixed 'Which tool?' set that needs all three tools, with cited pages", () => {
    expect(MIXED.length).toBeGreaterThanOrEqual(3);
    expect(new Set(MIXED.map((b) => b.parts.tool.answer)).size).toBe(3);
    expect(MIXED.flatMap((b) => b.sources).flatMap(citationProblems)).toEqual([]);
    for (const b of MIXED) {
      expect(b.sources.length, b.id).toBeGreaterThan(0);
      expect(b.parts.tool.options?.length, b.id).toBe(3);
      for (const k of BREAKDOWN_PARTS) expect(b.parts[k].model.trim(), `${b.id}.${k}`).not.toBe("");
    }
  });

  it("keeps the mixed problems' Given answers to the facts: the deciding observation waits for the Tool step", () => {
    for (const b of MIXED) {
      expect(b.parts.given.model, `${b.id} given`).not.toMatch(/notice what is/i);
      expect(b.parts.tool.model, `${b.id} tool`).toMatch(/^Notice what is (missing|given)/);
    }
  });

  it("never cites the same page twice on one problem", () => {
    const twice = [...Object.values(BREAKDOWNS).flat(), ...MIXED].filter((b) => new Set(b.sources.map((s) => `${s.filename}#${s.page}`)).size < b.sources.length);
    expect(twice.map((b) => b.id)).toEqual([]);
  });

  it("gives every multiple-choice check three options", () => {
    const mcs = Object.values(CHECKS).flat().filter((c) => c.kind === "mc");
    expect(mcs.filter((c) => c.choices!.length !== 3).map((c) => c.id)).toEqual([]);
  });

  it("does not give the answer away by option shape: similar lengths, and the correct one rarely the longest", () => {
    /** Visible length: math markup and commands count as one character each. */
    const len = (s: string) => s.replace(/\\[a-zA-Z]+/g, "x").replace(/[${}^_\\]/g, "").length;
    const mcs = Object.values(CHECKS).flat().filter((c) => c.kind === "mc");
    const uneven = mcs.filter((c) => {
      const ls = c.choices!.map((o) => len(o.text));
      return Math.max(...ls) > 1.6 * Math.min(...ls);
    });
    expect(uneven.map((c) => c.id)).toEqual([]);
    const longestRight = mcs.filter((c) => {
      const ls = c.choices!.map((o) => len(o.text));
      return ls[c.choices!.findIndex((o) => o.correct)] === Math.max(...ls);
    });
    expect(longestRight.length / mcs.length, longestRight.map((c) => c.id).join(" ")).toBeLessThan(0.4);
    // no absolute words in a distractor unless the right option has one too (a test-wise elimination tell)
    const absolute = /\b(always|every|never|must)\b/i;
    const tells = mcs.filter((c) => !absolute.test(c.choices!.find((o) => o.correct)!.text) && c.choices!.some((o) => !o.correct && absolute.test(o.text)));
    expect(tells.map((c) => c.id)).toEqual([]);
  });

  it("never lets a correct option echo its step or its stem: no run of four words shared", () => {
    /** Lower-case words with the maths taken out, so only the prose is compared. */
    const words = (s: string) =>
      s
        .toLowerCase()
        .replace(/\$[^$]*\$/g, " ")
        .replace(/[^a-z0-9'’]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const runs = (ws: string[]) => new Set(ws.slice(3).map((_, i) => ws.slice(i, i + 4).join(" ")));
    const bad: string[] = [];
    for (const t of TOPICS) {
      for (const c of CHECKS[t.id]) {
        if (c.kind !== "mc") continue;
        const step = t.tutorial[c.step];
        const against = new Set([...runs(words(step.heading)), ...runs(words(step.body)), ...runs(words(c.prompt))]);
        const right = c.choices!.find((o) => o.correct)!;
        for (const r of runs(words(right.text))) if (against.has(r)) bad.push(`${c.id}: "${r}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("sets every variable through KaTeX: no bare single-letter variable or interval outside $…$", () => {
    const outside = (s: string) =>
      prose(s)
        .replace(/\b(?:e\.g\.|i\.e\.|i\.i\.d\.|vs\.)/g, " ")
        .replace(/\((?:[a-d]|i{1,3}|iv)\)/g, " "); // part labels: (a), (b)… and (i), (ii)…
    /** A single letter standing alone (not "a", "A" or "I" as English words), an interval, or "n − 1"-style arithmetic. */
    const BARE = /(?:^|[^A-Za-z0-9'’\\])([b-zB-HJ-Z])(?=$|[^A-Za-z0-9'’(])|\[\s*0,\s*(?:1|θ)\s*\]|\b[a-zA-Z]\s*[−=<>≥≤]\s*\d|\b[a-z]\(1\s*[−-]\s*[a-z]\)/;
    const bad = copy()
      .map(([where, s]) => [where, outside(s)] as const)
      .filter(([, s]) => BARE.test(s))
      .map(([where, s]) => `${where}: …${s.match(new RegExp(`.{0,24}(?:${BARE.source}).{0,24}`))?.[0]}…`);
    expect(bad).toEqual([]);
  });

  it("sets every data value in a data voice: no bare number in sans anywhere in the app's copy (a computed value is KaTeX, a course reference a ‹chip› or a ‹mono› numeral)", () => {
    /** The prose once the maths and the mono runs are taken out, with Markdown's own list markers ("1. ") dropped. */
    const outside = (s: string) => prose(s).replace(/^\s*\d+\.\s+/gm, " ");
    const bad = copy()
      .map(([where, s]) => [where, outside(s)] as const)
      .filter(([, s]) => /\d/.test(s))
      .map(([where, s]) => `${where}: …${s.match(/.{0,24}\d[\d.,/]*.{0,24}/)?.[0]}…`);
    expect(bad).toEqual([]);
  });

  it("writes every mono run as a course reference in the chip's code or a bare numeral", () => {
    const RUN = /^(?:(?:L|HW)\d{2}(?: · P\d+)?|\d+(?:\.\d+)?)$/;
    const bad = copy().flatMap(([where, s]) => [...s.matchAll(/‹([^›]*)›/g)].filter((m) => !RUN.test(m[1])).map((m) => `${where}: ‹${m[1]}›`));
    expect(bad).toEqual([]);
  });

  it("never wraps a course-reference chip in literal parentheses: the pill is its own bracket, so '(‹L07›)' renders as ((L07))", () => {
    // a bare numeral ("Theorem ‹2.1›") is plain mono text, so it may sit in parentheses; only the chip may not
    const WRAPPED = /\(‹(?:L|HW)\d{2}(?: · P\d+)?›|‹(?:L|HW)\d{2}(?: · P\d+)?›\)/;
    const bad = copy()
      .filter(([, s]) => WRAPPED.test(s))
      .map(([where, s]) => `${where}: ${s.match(new RegExp(`.{0,24}(?:${WRAPPED.source}).{0,24}`))?.[0]}`);
    expect(bad).toEqual([]);
  });

  it("sets every piece of maths through KaTeX: no Unicode maths outside $…$ anywhere in the app's copy", () => {
    /** Characters that mean maths was typed as text instead of LaTeX (Greek letters, hats and bars, sub/superscripts, relations). */
    const MATHY = /[θℓΣλμσαβπδγΘ∝≤≥≠→∞ᵢₙⁿ²√̂̄]/;
    /** Deliberate exceptions: none. (A named distribution with arguments is one math run, "$\mathrm{Gamma}(2,\,1)$".) */
    const ALLOWED: string[] = [];
    const bad = copy().filter(([where, s]) => !ALLOWED.includes(where) && MATHY.test(prose(s))).map(([where, s]) => `${where}: ${prose(s).match(new RegExp(`.{0,20}${MATHY.source}.{0,20}`))?.[0]}`);
    expect(bad).toEqual([]);
  });

  it("sets a distribution and its arguments as one math run: never a sans name followed by KaTeX or bare arguments", () => {
    const NAME = String.raw`\b(?:Gamma|Beta|Poisson|Uniform|Exponential|Normal|N|Binomial|Bernoulli)`;
    /** The name outside math, its arguments inside: "Gamma$(\alpha,\beta)$", "Uniform$[0,\theta]$", "Beta($a,b$)". */
    const SPLIT = new RegExp(`${NAME}(?:\\$[(\\[]|\\(\\$)`);
    /** The name and arguments both bare: "Gamma(22, 5)", "Poisson(λ)", "Beta(1, 1)". */
    const BARE_ARGS = new RegExp(`${NAME}\\((?=[^)]*[0-9,\\u0370-\\u03ff])[^)]*\\)`);
    const bad = copy()
      .map(([where, s]) => [where, s.match(SPLIT)?.[0] ?? prose(s).match(BARE_ARGS)?.[0]] as const)
      .filter(([, hit]) => hit)
      .map(([where, hit]) => `${where}: ${hit}`);
    expect(bad).toEqual([]);
  });

  it("never puts a LaTeX escape in a plain quoted string: maths with backslashes must be an m`` raw template", () => {
    // a double-quoted "$\theta$" renders as a tab plus "heta"; only `m\`...\`` keeps the backslash
    const files = readdirSync(__dirname).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.includes("testutil"));
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(resolve(__dirname, f), "utf8")
        .replace(/`(?:[^`\\]|\\.)*`/g, "``") // template literals are allowed to hold backslashes
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const m of src.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)) {
        if (/(?<!\\)(?:\\\\)*\\[a-zA-Z]/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 80)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("shows the correct option first for only a minority of questions (stable shuffle)", () => {
    const mcs = Object.values(CHECKS).flat().filter((c) => c.kind === "mc");
    const first = mcs.filter((c) => c.choices![stableOrder(c.id, c.choices!.length)[0]].correct).length;
    expect(first / mcs.length).toBeLessThan(0.45);
    expect(stableOrder("x", 4)).toEqual(stableOrder("x", 4));
    const tools = [...Object.values(BREAKDOWNS).flat(), ...MIXED].filter((b) => b.parts.tool.options);
    const toolFirst = tools.filter((b) => stableOrder(`${b.id}-tool`, b.parts.tool.options!.length)[0] === b.parts.tool.answer).length;
    expect(toolFirst / tools.length).toBeLessThan(0.5);
  });

  for (const t of TOPICS) {
    describe(t.title, () => {
      it("cites real pages, and every highlight is verbatim plain text on the cited page", () => {
        expect(citations(t.id).flatMap(citationProblems)).toEqual([]);
      });

      it("has 6-14 vocabulary terms, each with a definition and an example", () => {
        const terms = VOCAB[t.id];
        expect(terms.length).toBeGreaterThanOrEqual(6);
        expect(terms.length).toBeLessThanOrEqual(14);
        for (const v of terms) {
          expect(v.term.trim(), v.id).not.toBe("");
          expect(v.plain.trim(), v.id).not.toBe("");
          expect(v.seeIt.trim(), v.id).not.toBe("");
        }
      });

      it("places checks after real tutorial steps: one correct option each, every option explained, and an explain item", () => {
        const checks = CHECKS[t.id];
        for (const c of checks) {
          expect(c.step >= 0 && c.step < t.tutorial.length, `${c.id} step ${c.step}`).toBe(true);
          if (c.kind === "mc") {
            expect(c.choices!.filter((o) => o.correct).length, c.id).toBe(1);
            for (const o of c.choices!) expect(o.why.trim(), `${c.id}: ${o.text}`).not.toBe("");
          } else {
            expect(c.reference?.trim(), c.id).toBeTruthy();
          }
        }
        // every tutorial step has at least one check, and the topic has one or two explain items
        for (let s = 0; s < t.tutorial.length; s++) expect(checks.some((c) => c.step === s), `step ${s}`).toBe(true);
        const explains = checks.filter((c) => c.kind === "explain").length;
        expect(explains >= 1 && explains <= 2, `${explains} explain items`).toBe(true);
        expect(checks.filter((c) => c.kind === "mc").length).toBeGreaterThan(explains);
      });

      it("has 2-3 breakdowns with all five parts and a worked solution", () => {
        const bds = BREAKDOWNS[t.id];
        expect(bds.length >= 2 && bds.length <= 3).toBe(true);
        for (const b of bds) {
          expect(b.solution?.trim(), b.id).toBeTruthy();
          if (b.examId) expect(t.examBank.some((q) => q.id === b.examId), `${b.id} -> ${b.examId}`).toBe(true);
          for (const k of BREAKDOWN_PARTS) {
            const p = b.parts[k];
            expect(p.model.trim(), `${b.id}.${k}`).not.toBe("");
            if (p.options) expect(p.answer! >= 0 && p.answer! < p.options.length, `${b.id}.${k}`).toBe(true);
          }
        }
      });
    });
  }
});
