import { describe, expect, it } from "vitest";
import { checkProgress } from "./learning";
import { topicById } from "../mock/topics";
import { checksFor } from "../mock/comprehension";
import type { LearningState } from "../types";

const mle = topicById("maximum-likelihood-estimation")!;
const empty = (): LearningState => ({ vocab: {}, checks: {}, breakdowns: {} });

describe("comprehension check progress", () => {
  it("keeps a retried check at its first attempt's credit: the step stays to review and the right count does not change", () => {
    const c = checksFor(mle.id).find((x) => x.kind === "mc")!;
    const right = c.choices!.findIndex((o) => o.correct);
    const wrong = c.choices!.findIndex((o) => !o.correct);
    const l = empty();
    l.checks[mle.id] = { [c.id]: { credit: 0, choice: wrong, at: "x" } };
    const first = checkProgress(l, mle);
    expect(first.review).toContain(c.step);
    expect(first.right).toBe(0);
    // "Try it again": the ✓ option is picked and saved with `retried`, but the credit is the first attempt's
    l.checks[mle.id] = { [c.id]: { credit: 0, choice: right, retried: true, at: "y" } };
    const retried = checkProgress(l, mle);
    expect(retried.review).toEqual(first.review);
    expect(retried.right).toBe(first.right);
    expect(retried.done).toBe(1);
  });
});
