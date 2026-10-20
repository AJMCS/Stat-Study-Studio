import { describe, expect, it } from "vitest";
import { TOPICS, sourceById } from "./topics";
import { buildQuiz } from "./quiz";
import { citationProblems } from "./transcripts.testutil";

describe("topic data", () => {
  for (const t of TOPICS) {
    describe(t.title, () => {
      it("cites real pages, and highlights are verbatim plain text on that page", () => {
        expect(t.sources.flatMap(citationProblems)).toEqual([]);
      });
      it("has valid quiz and exam references", () => {
        const ids = new Set(t.sources.map((s) => s.id));
        for (const q of t.quiz) {
          if (q.sourceId) expect(sourceById(q.sourceId), `${q.id} -> ${q.sourceId}`).toBeDefined();
          if (q.kind === "mc") expect(q.answer! >= 0 && q.answer! < q.choices!.length).toBe(true);
        }
        for (const e of t.examBank) for (const id of e.sourceIds) expect(sourceById(id), `${e.id} -> ${id}`).toBeDefined();
        for (const s of t.tutorial) if (s.sourceId) expect(ids.has(s.sourceId), s.sourceId).toBe(true);
      });
      it("builds a 10-question quiz", () => expect(buildQuiz(t)).toHaveLength(10));
    });
  }
});
