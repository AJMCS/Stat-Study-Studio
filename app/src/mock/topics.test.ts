import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { TOPICS, sourceById } from "./topics";
import { buildQuiz } from "./ai";

describe("topic data", () => {
  for (const t of TOPICS) {
    describe(t.title, () => {
      it("cites real files and reliable highlights", () => {
        for (const s of t.sources) {
          expect(existsSync(resolve(__dirname, "../../../course-library", s.filename!)), s.filename).toBe(true);
          if (s.highlight) expect(s.excerpt.includes(s.highlight), `${s.id} highlight`).toBe(true);
        }
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
