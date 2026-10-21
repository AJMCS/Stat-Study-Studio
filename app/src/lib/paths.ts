import { useCallback } from "react";
import { TOPICS, topicById } from "../mock/topics";
import { vocabFor } from "../mock/vocab";
import { breakdownsFor, MIXED, MIXED_ID } from "../mock/breakdown";
import { hitToSource, personalHitToSource, type AiPathProposal, type CatalogueItem } from "./api";
import { uid, useStore } from "./store";
import type { CustomPath, CustomPathStep, PathStepKind, PathsState } from "../types";

/**
 * Custom learning paths. The model builds one from the learner's own ask (and the homework they hand in), choosing
 * its stops from the catalogue of what the app already has: each topic's vocabulary, tutorial steps, worked examples,
 * breakdowns, quiz and tutor session. The catalogue is built here from the same content the pages render, so every
 * ref a path can hold is an activity that exists, and a saved path keeps working without any AI service.
 */

/** The "Which tool?" problems are shown on every topic's breakdown page; a path opens them from this one. */
const MIXED_HOME = "maximum-likelihood-estimation";

export const two = (n: number | string) => String(n).padStart(2, "0");

/** A sentence the model wrote, with its full stop (it completes "This path covers …" on screen). */
export const sentence = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Plain words for a catalogue line: maths stays as LaTeX, mono runs lose their brackets, the length is capped. */
export const brief = (text: string, max = 140) => {
  const t = text.replace(/‹([^›]+)›/g, "$1").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

/** What the app can offer as a path step: ids, kinds, topics, titles and one-line summaries, built from the content. */
export function buildCatalogue(): CatalogueItem[] {
  const out: CatalogueItem[] = [];
  for (const t of TOPICS) {
    const terms = vocabFor(t.id);
    out.push({ id: `vocab:${t.id}`, kind: "vocab", topic: t.title, title: `Vocabulary: ${t.title}`, summary: brief(terms.map((x) => x.term).join(", ")) });
    t.tutorial.forEach((s, i) => {
      out.push({ id: `tutorial:${t.id}:${i + 1}`, kind: "tutorial", topic: t.title, title: `Tutorial step ${i + 1}: ${s.heading}`, summary: brief(s.body.split(". ")[0]) });
      (s.examples ?? []).forEach((e, n) =>
        out.push({ id: `example:${t.id}:${i + 1}:${n + 1}`, kind: "example", topic: t.title, title: `Worked example under step ${i + 1} (${s.heading})`, summary: brief(e.prompt) }),
      );
    });
    for (const b of breakdownsFor(t.id)) out.push({ id: `breakdown:${t.id}:${b.id}`, kind: "breakdown", topic: t.title, title: `Break down a question: ${b.title}`, summary: brief(b.prompt) });
    out.push({ id: `quiz:${t.id}`, kind: "quiz", topic: t.title, title: `Quiz: ${t.title}`, summary: "Ten questions, marked; written answers are compared with a reference." });
    out.push({ id: `tutor:${t.id}`, kind: "tutor", topic: t.title, title: `Tutor session: ${t.title}`, summary: "A conversation with the adaptive tutor, aimed at the student's own goal." });
  }
  for (const b of MIXED) out.push({ id: `breakdown:${MIXED_ID}:${b.id}`, kind: "breakdown", topic: "Across the course", title: `Which tool? ${b.title}`, summary: brief(b.prompt) });
  return out;
}

export const KIND_LABEL: Record<PathStepKind, string> = {
  tutorial: "Tutorial step",
  vocab: "Vocabulary",
  example: "Worked example",
  breakdown: "Break down a question",
  quiz: "Quiz",
  tutor: "Tutor session",
  explain: "Explanation",
};

export interface StepLink {
  to: string;
  label: string;
}

/** Where a step opens in the app, or null for an explanation (shown inline) or a ref the app no longer has. */
export function stepLink(step: Pick<CustomPathStep, "kind" | "ref">, focus: { goal: string; pathId?: string }): StepLink | null {
  const [, topicId, ...rest] = step.ref.split(":");
  if (step.kind === "explain" || !topicId) return null;
  if (step.kind === "breakdown") {
    const home = topicId === MIXED_ID ? MIXED_HOME : topicId;
    if (!topicById(home)) return null;
    const own = breakdownsFor(home);
    const idx = topicId === MIXED_ID ? own.length + MIXED.findIndex((b) => b.id === rest[0]) : own.findIndex((b) => b.id === rest[0]);
    if (idx < 0 || (topicId === MIXED_ID && idx < own.length)) return null;
    return { to: `/topic/${home}/breakdown?q=${idx + 1}`, label: "Open the breakdown" };
  }
  const topic = topicById(topicId);
  if (!topic) return null;
  switch (step.kind) {
    case "vocab":
      return { to: `/topic/${topicId}/vocab`, label: "Open the vocabulary" };
    case "tutorial": {
      const n = Number(rest[0]);
      if (!(n >= 1 && n <= topic.tutorial.length)) return null;
      return { to: `/topic/${topicId}/tutorial?step=${n}`, label: `Open tutorial step ${two(n)}` };
    }
    case "example": {
      const n = Number(rest[0]);
      if (!(n >= 1 && n <= topic.tutorial.length)) return null;
      return { to: `/topic/${topicId}/tutorial?step=${n}`, label: `Open the worked example (tutorial step ${two(n)})` };
    }
    case "quiz":
      return { to: `/topic/${topicId}/quiz`, label: "Take the quiz" };
    case "tutor": {
      const q = new URLSearchParams({ focus: focus.goal });
      if (focus.pathId) q.set("path", focus.pathId);
      return { to: `/topic/${topicId}/tutor?${q}`, label: "Talk it through with the tutor" };
    }
    default:
      return null;
  }
}

/** Steps done, steps in all, and the current step: the first one not done (-1 once every step is done). */
export function pathProgress(p: Pick<CustomPath, "steps">) {
  const done = p.steps.filter((s) => s.done).length;
  const current = p.steps.findIndex((s) => !s.done);
  return { done, total: p.steps.length, current };
}

/** A proposed path becomes a saved one when the learner starts it. */
export function fromProposal(p: AiPathProposal, ask: string): CustomPath {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: p.title,
    goal: p.goal,
    ...(p.covers ? { covers: p.covers } : {}),
    ...(p.leavesOut ? { leavesOut: p.leavesOut } : {}),
    ask,
    concepts: p.concepts,
    ...(p.fileId ? { fileId: p.fileId } : {}),
    ...(p.filename ? { filename: p.filename } : {}),
    steps: p.steps.map((s) => ({
      kind: s.kind,
      ref: s.ref,
      title: s.title,
      why: s.why,
      ...(s.kind === "explain" ? { text: s.text } : {}),
      sources: s.sources.map((h) => (h.scope === "shared" ? hitToSource(h) : personalHitToSource(h))),
      done: false,
    })),
    createdAt: now,
    openedAt: now,
  };
}

/** Reading and writing the learner's paths through the store (saved to the service like every other slice). */
export function usePaths() {
  const { data, update } = useStore();
  const setPaths = useCallback((fn: (p: PathsState) => PathsState) => update((d) => ({ ...d, paths: fn(d.paths) })), [update]);
  const patch = (id: string, fn: (p: CustomPath) => CustomPath) => setPaths((x) => ({ items: x.items.map((p) => (p.id === id ? fn(p) : p)) }));
  return {
    paths: data.paths.items,
    add: (p: CustomPath) => setPaths((x) => ({ items: [p, ...x.items.filter((q) => q.id !== p.id)] })),
    remove: (id: string) => setPaths((x) => ({ items: x.items.filter((p) => p.id !== id) })),
    /** Remember when a path was last opened (the list on Learn shows it). */
    touch: (id: string) => patch(id, (p) => ({ ...p, openedAt: new Date().toISOString() })),
    setDone: (id: string, i: number, done: boolean) =>
      patch(id, (p) => ({
        ...p,
        steps: p.steps.map((s, k) => (k === i ? (done ? { ...s, done: true, doneAt: new Date().toISOString() } : { kind: s.kind, ref: s.ref, title: s.title, why: s.why, ...(s.text !== undefined ? { text: s.text } : {}), sources: s.sources, done: false }) : s)),
      })),
  };
}
