import { describe, expect, it } from "vitest";
import { selectExam } from "./exam";
import { TOPICS, topicById } from "../mock/topics";
import { analyticsAttempts, applyRecall, selfScore, uniformCriteria } from "./scoring";
import type { Attempt } from "../types";

const mle = topicById("maximum-likelihood-estimation")!;

describe("exam selection without a model", () => {
  it("asks the whole bank when there is no focus", () => {
    const d = selectExam(mle, "  ");
    expect(d.questions).toHaveLength(mle.examBank.length);
    expect(d.focusMatched).toBeNull();
  });

  it("uses a focus only to choose existing questions, best match first", () => {
    const d = selectExam(mle, "edge case on the boundary of the support");
    expect(d.focusMatched).toBe(true);
    expect(d.questions[0].id).toBe("ml-e1");
    expect(d.questions.every((q) => mle.examBank.some((b) => b.id === q.id))).toBe(true); // nothing invented
  });

  it("says so and falls back to the full exam when nothing matches", () => {
    const d = selectExam(mle, "chocolate cake recipes");
    expect(d.focusMatched).toBe(false);
    expect(d.questions).toHaveLength(mle.examBank.length);
  });
});

describe("reference material", () => {
  for (const t of TOPICS) {
    it(`${t.title} has a recall prompt, exam solutions and valid worked examples`, () => {
      expect(t.recall.prompt.length).toBeGreaterThan(20);
      expect(t.recall.reference.length).toBeGreaterThan(40);
      expect(t.recall.keyPoints.length).toBeGreaterThanOrEqual(2);
      for (const q of t.examBank) {
        expect(q.solution, q.id).toBeTruthy();
        expect(q.solution.length, q.id).toBeGreaterThan(40);
        expect(q.keyPoints.length, q.id).toBeGreaterThanOrEqual(2);
      }
      const examples = t.tutorial.flatMap((s) => s.examples ?? []);
      expect(examples.length).toBeGreaterThan(0);
      for (const e of examples) {
        expect(e.prompt.length).toBeGreaterThan(20);
        expect(e.solution.length).toBeGreaterThan(30);
      }
    });
  }
});

describe("self-scoring", () => {
  it("scores the share of key points ticked", () => {
    expect(selfScore([true, true, false, false])).toBe(50);
    expect(selfScore([])).toBe(0);
    expect(selfScore([true, true, true])).toBe(100);
  });

  const att = (id: string, composite: number, selfScored?: boolean): Attempt => ({
    id,
    topicId: "t",
    at: `2026-01-0${id}T00:00:00Z`,
    kind: "quiz",
    counted: true,
    composite,
    criteria: uniformCriteria(composite),
    selfScored,
  });

  it("can hide self-scored attempts from analytics", () => {
    const all = [att("1", 90, true), att("2", 60), att("3", 70, true)];
    expect(analyticsAttempts(all, "t").map((a) => a.id)).toEqual(["1", "2", "3"]);
    expect(analyticsAttempts(all, "t", false).map((a) => a.id)).toEqual(["2"]);
  });

  it("a self-scored recall counts for the streak but never raises per-criterion warnings", () => {
    const s = applyRecall(undefined, "2026-01-01", uniformCriteria(85), undefined, true);
    expect(s.streak).toBe(1);
    expect(s.warnCriteria).toEqual([]);
    const miss = applyRecall(s, "2026-02-01", uniformCriteria(40), undefined, true);
    expect(miss.streak).toBe(1);
    expect(miss.misses).toBe(1);
    expect(miss.flagged).toBe(true);
    expect(miss.warnCriteria).toEqual([]);
  });
});
