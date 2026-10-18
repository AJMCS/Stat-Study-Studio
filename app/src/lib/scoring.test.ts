import { describe, expect, it } from "vitest";
import { applyRecall, composite, historicalPeak, recencyWeighted, trend, criteriaBelowCutoff } from "./scoring";
import type { Attempt } from "../types";

const att = (composite: number, i: number): Attempt => ({
  id: String(i),
  topicId: "t",
  at: new Date(2026, 0, i + 1).toISOString(),
  kind: "quiz",
  counted: true,
  composite,
  criteria: { core: composite, depth: composite, relevance: composite, application: composite },
});

describe("scoring", () => {
  it("composite is equal-weight average", () => {
    expect(composite({ core: 100, depth: 80, relevance: 60, application: 80 })).toBe(80);
  });

  it("recency weighting favors newer attempts", () => {
    const a = [50, 50, 50, 50, 100].map(att);
    expect(recencyWeighted(a)).toBeGreaterThan(60);
    expect(recencyWeighted(a)).toBe(Math.round((50 * 1 + 50 * 2 + 50 * 3 + 50 * 4 + 100 * 5) / 15));
  });

  it("uses only the five latest attempts", () => {
    const a = [0, 90, 90, 90, 90, 90].map(att);
    expect(recencyWeighted(a)).toBe(90);
  });

  it("peak ignores nothing but supplied attempts", () => {
    expect(historicalPeak([60, 95, 70].map(att))).toBe(95);
    expect(historicalPeak([])).toBeNull();
  });

  it("detects trend", () => {
    expect(trend([60, 60, 90].map(att))).toBe("improving");
    expect(trend([90, 90, 50].map(att))).toBe("declining");
  });

  it("qualifying composite extends streak even with a weak criterion", () => {
    const c = { core: 100, depth: 100, relevance: 100, application: 50 };
    const s = applyRecall(undefined, "2026-01-01", c);
    expect(s.streak).toBe(1);
    expect(s.warnCriteria).toEqual(["application"]);
  });

  it("a miss preserves streak, records miss, flags topic", () => {
    const good = { core: 90, depth: 90, relevance: 90, application: 90 };
    const bad = { core: 40, depth: 40, relevance: 40, application: 40 };
    let s = applyRecall(undefined, "2026-01-01", good);
    s = applyRecall(s, "2026-02-01", bad);
    expect(s.streak).toBe(1);
    expect(s.misses).toBe(1);
    expect(s.flagged).toBe(true);
    expect(criteriaBelowCutoff(bad)).toHaveLength(4);
  });
});
