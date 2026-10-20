import { useCallback } from "react";
import { useStore } from "./store";
import { uniformCriteria } from "./scoring";
import { vocabFor } from "../mock/vocab";
import { checksFor } from "../mock/comprehension";
import { breakdownsFor } from "../mock/breakdown";
import { topicById } from "../mock/topics";
import type { AppData, BreakdownPartKey, CheckAnswer, LearningState, Topic } from "../types";
import { BREAKDOWN_PARTS } from "../types";

/**
 * Progress in the learning activities: vocabulary flashcards, comprehension checks and question breakdowns.
 *
 * Rule for scores: none of this feeds the topic score, the streak or the journey's mastery. Those come only from
 * counted attempts (quiz, exam, recall). Each time a learner finishes all the checks after one tutorial step, that
 * set is also saved as an uncounted practice attempt (`counted: false`, note "Comprehension check · …"), so it shows
 * in the topic's attempt history without changing any analytics.
 */

export type ActivityStatus = "new" | "started" | "done";

export interface ActivityProgress {
  status: ActivityStatus;
  done: number;
  total: number;
}

const status = (done: number, total: number, touched: boolean): ActivityStatus =>
  total > 0 && done >= total ? "done" : done > 0 || touched ? "started" : "new";

export function vocabProgress(l: LearningState, topicId: string): ActivityProgress & { notYet: number } {
  const terms = vocabFor(topicId);
  const v = l.vocab[topicId];
  const ids = new Set(terms.map((t) => t.id));
  const known = (v?.known ?? []).filter((id) => ids.has(id)).length;
  const notYet = (v?.notYet ?? []).filter((id) => ids.has(id)).length;
  return { status: status(known, terms.length, notYet > 0), done: known, total: terms.length, notYet };
}

/** A check with a real answer saved (a skipped check is recorded, but it counts as not answered). */
export const answered = (a: CheckAnswer | undefined): a is CheckAnswer => !!a && !a.skipped;

/**
 * Comprehension checks answered, and which tutorial steps need another look: a step with a wrong or partly-right
 * answer, or one whose check was skipped (`skipped` lists those, so they can be named as not answered).
 */
export function checkProgress(l: LearningState, topic: Topic): ActivityProgress & { review: number[]; skipped: number[]; right: number } {
  const checks = checksFor(topic.id);
  const answers = l.checks[topic.id] ?? {};
  const done = checks.filter((c) => answered(answers[c.id]));
  const skipped = [...new Set(checks.filter((c) => answers[c.id]?.skipped && !answered(answers[c.id])).map((c) => c.step))];
  const review = [...new Set([...done.filter((c) => answers[c.id].credit < 1).map((c) => c.step), ...skipped])].sort((a, b) => a - b);
  const right = done.filter((c) => answers[c.id].credit >= 1).length;
  return { status: status(done.length, checks.length, skipped.length > 0), done: done.length, total: checks.length, review, skipped: skipped.sort((a, b) => a - b), right };
}

export function breakdownProgress(l: LearningState, topicId: string): ActivityProgress {
  const bds = breakdownsFor(topicId);
  const p = l.breakdowns[topicId] ?? {};
  const done = bds.filter((b) => p[b.id]?.done).length;
  const touched = bds.some((b) => (p[b.id]?.revealed.length ?? 0) > 0);
  return { status: status(done, bds.length, touched), done, total: bds.length };
}

/** Quiz and exam: done once there is a counted quiz or exam attempt for the topic. */
export function practiceProgress(d: AppData, topicId: string): ActivityProgress {
  const n = d.attempts.filter((a) => a.topicId === topicId && a.counted && (a.kind === "quiz" || a.kind === "exam")).length;
  return { status: n > 0 ? "done" : "new", done: n, total: 1 };
}

export type PathStep = "vocab" | "tutorial" | "breakdown" | "practice";
export const PATH: PathStep[] = ["vocab", "tutorial", "breakdown", "practice"];

/** The topic's path, in order, with each step's progress, and the first step that is not done. */
export function topicPath(d: AppData, topic: Topic) {
  const steps = {
    vocab: vocabProgress(d.learning, topic.id),
    tutorial: checkProgress(d.learning, topic),
    breakdown: breakdownProgress(d.learning, topic.id),
    practice: practiceProgress(d, topic.id),
  };
  const next = PATH.find((k) => steps[k].status !== "done") ?? "practice";
  return { steps, next };
}

export const PATH_ROUTE: Record<PathStep, string> = { vocab: "vocab", tutorial: "tutorial", breakdown: "breakdown", practice: "quiz" };

/** Reading and writing learning progress through the store (saved to the service like every other slice). */
export function useLearning() {
  const { data, update, recordAttempt } = useStore();
  const l = data.learning;

  const setLearning = useCallback((fn: (l: LearningState) => LearningState) => update((d) => ({ ...d, learning: fn(d.learning) })), [update]);

  /** Flashcard self-rating: "got it" moves a term to known, "not yet" to not-yet. */
  const rateTerm = (topicId: string, termId: string, known: boolean) =>
    setLearning((x) => {
      const v = x.vocab[topicId] ?? { known: [], notYet: [] };
      const without = (xs: string[]) => xs.filter((id) => id !== termId);
      return {
        ...x,
        vocab: {
          ...x.vocab,
          [topicId]: known ? { known: [...without(v.known), termId], notYet: without(v.notYet) } : { known: without(v.known), notYet: [...without(v.notYet), termId] },
        },
      };
    });

  const resetVocab = (topicId: string) => setLearning((x) => ({ ...x, vocab: { ...x.vocab, [topicId]: { known: [], notYet: [] } } }));

  /**
   * Save an answer to a comprehension check. When it completes its step's set, record an uncounted practice attempt.
   * A retry ("Try it again", saved with `retried` and the first attempt's credit) records nothing: it is a learning
   * tool, not a scoring one.
   */
  const answerCheck = (topicId: string, checkId: string, a: Omit<CheckAnswer, "at">) => {
    const topic = topicById(topicId);
    const checks = checksFor(topicId);
    const q = checks.find((c) => c.id === checkId);
    if (!topic || !q) return;
    const answers = { ...(l.checks[topicId] ?? {}), [checkId]: { ...a, at: new Date().toISOString() } };
    setLearning((x) => ({ ...x, checks: { ...x.checks, [topicId]: { ...(x.checks[topicId] ?? {}), [checkId]: answers[checkId] } } }));
    const set = checks.filter((c) => c.step === q.step);
    if (!a.retried && set.every((c) => answered(answers[c.id]))) {
      const credit = set.reduce((s, c) => s + answers[c.id].credit, 0) / set.length;
      recordAttempt({
        topicId,
        kind: "quiz",
        counted: false,
        selfScored: set.some((c) => c.kind === "explain"),
        criteria: uniformCriteria(Math.round(credit * 100)),
        note: `Comprehension check · step ${q.step + 1}: ${topic.tutorial[q.step].heading}`,
      });
    }
  };

  /**
   * Move past a tutorial step without answering its check: every check of the step still unanswered is recorded as
   * skipped (not answered), so the step is listed among the steps to review until it is answered.
   */
  const skipChecks = (topicId: string, step: number) => {
    const at = new Date().toISOString();
    setLearning((x) => {
      const mine = { ...(x.checks[topicId] ?? {}) };
      for (const c of checksFor(topicId)) if (c.step === step && !answered(mine[c.id])) mine[c.id] = { credit: 0, skipped: true, at };
      return { ...x, checks: { ...x.checks, [topicId]: mine } };
    });
  };

  /** Reveal one part of a breakdown; once all five are revealed it is done. */
  const revealPart = (topicId: string, bdId: string, part: BreakdownPartKey) =>
    setLearning((x) => {
      const cur = x.breakdowns[topicId]?.[bdId] ?? { revealed: [], done: false, at: "" };
      const revealed = BREAKDOWN_PARTS.filter((k) => k === part || cur.revealed.includes(k));
      return {
        ...x,
        breakdowns: {
          ...x.breakdowns,
          [topicId]: { ...(x.breakdowns[topicId] ?? {}), [bdId]: { revealed, done: cur.done || revealed.length === BREAKDOWN_PARTS.length, at: new Date().toISOString() } },
        },
      };
    });

  const restartBreakdown = (topicId: string, bdId: string) =>
    setLearning((x) => ({
      ...x,
      breakdowns: { ...x.breakdowns, [topicId]: { ...(x.breakdowns[topicId] ?? {}), [bdId]: { revealed: [], done: x.breakdowns[topicId]?.[bdId]?.done ?? false, at: new Date().toISOString() } } },
    }));

  return { learning: l, rateTerm, resetVocab, answerCheck, skipChecks, revealPart, restartBreakdown };
}
