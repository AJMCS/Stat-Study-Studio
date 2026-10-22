import { describe, expect, it } from "vitest";
import { COURSE_EXAM_MAX, COURSE_ID, COURSE_TITLE, scopeFor, scopeTitle, selectExam } from "./exam";
import { buildCourseQuiz } from "../mock/quiz";
import { TOPICS, topicById } from "../mock/topics";
import { analyticsAttempts, applyRecall, selfScore, uniformCriteria } from "./scoring";
import type { Attempt } from "../types";

const mle = topicById("maximum-likelihood-estimation")!;
const one = scopeFor(mle.id)!;
const course = scopeFor(undefined)!;

describe("exam selection without a model", () => {
  it("asks the whole bank when there is no focus", () => {
    const d = selectExam(one, "  ");
    expect(d.questions).toHaveLength(mle.examBank.length);
    expect(d.focusMatched).toBeNull();
  });

  it("uses a focus only to choose existing questions, best match first", () => {
    const d = selectExam(one, "edge case on the boundary of the support");
    expect(d.focusMatched).toBe(true);
    expect(d.questions[0].id).toBe("ml-e1");
    expect(d.questions.every((q) => mle.examBank.some((b) => b.id === q.id))).toBe(true); // nothing invented
  });

  it("says so and falls back to the full exam when nothing matches", () => {
    const d = selectExam(one, "chocolate cake recipes");
    expect(d.focusMatched).toBe(false);
    expect(d.questions).toHaveLength(mle.examBank.length);
  });
});

describe("an exam across the course", () => {
  it("is one question from every topic, each carrying its topic", () => {
    const d = selectExam(course, "");
    expect(d.title).toBe("Exam across the course");
    expect(d.questions).toHaveLength(TOPICS.length);
    expect(d.questions.map((q) => q.topicId)).toEqual(TOPICS.map((t) => t.id));
    for (const q of d.questions) expect(topicById(q.topicId!)!.examBank.some((b) => b.id === q.id)).toBe(true);
  });

  it("moves every topic on to its next question for the next sitting, and wraps round", () => {
    const first = selectExam(course, "", 0).questions.map((q) => q.id);
    const second = selectExam(course, "", 1).questions.map((q) => q.id);
    expect(second).not.toEqual(first);
    // every topic is back at its first question once the sitting count is a multiple of every bank's size
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const cycle = TOPICS.map((t) => t.examBank.length).reduce((a, b) => (a * b) / gcd(a, b));
    const wrapped = selectExam(course, "", cycle).questions.map((q) => q.id);
    expect(wrapped).toEqual(first);
  });

  it("a focus chooses across every topic's bank, kept to the length of a real paper", () => {
    const d = selectExam(course, "likelihood");
    expect(d.focusMatched).toBe(true);
    expect(d.questions.length).toBeGreaterThan(1);
    expect(d.questions.length).toBeLessThanOrEqual(COURSE_EXAM_MAX);
    expect(new Set(d.questions.map((q) => q.topicId)).size).toBeGreaterThan(1);
    expect(d.questions.every((q) => !!q.topicId)).toBe(true);
  });

  it("is saved under its own id and named for what it is", () => {
    expect(course.id).toBe(COURSE_ID);
    expect(TOPICS.some((t) => t.id === COURSE_ID)).toBe(false);
    expect(scopeTitle(COURSE_ID)).toBe(COURSE_TITLE);
    expect(scopeTitle(mle.id)).toBe(mle.title);
    expect(scopeFor("no-such-topic")).toBeNull();
  });
});

describe("a quiz across the course", () => {
  it("is ten authored questions with the topics taking turns", () => {
    const qs = buildCourseQuiz(TOPICS);
    expect(qs).toHaveLength(10);
    expect(new Set(qs.map((q) => q.id)).size).toBe(10);
    expect(qs.slice(0, TOPICS.length).map((q) => q.topicId)).toEqual(TOPICS.map((t) => t.id));
    for (const q of qs) expect(topicById(q.topicId!)!.quiz.some((b) => b.id === q.id)).toBe(true);
  });

  it("asks different questions at the next sitting", () => {
    const a = buildCourseQuiz(TOPICS, 0).map((q) => q.id);
    const b = buildCourseQuiz(TOPICS, 1).map((q) => q.id);
    expect(b).toHaveLength(10);
    expect(b.filter((id) => a.includes(id)).length).toBeLessThan(a.length);
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
