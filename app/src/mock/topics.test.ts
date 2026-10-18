import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TOPICS, sourceById } from "./topics";
import { buildQuiz } from "./quiz";

const LIBRARY = resolve(__dirname, "../../../course-library");

/** Text of one page of a hand or automatic transcript, with the extraction comments removed. */
function transcriptPage(pdf: string, page: number): string | null {
  const file = resolve(LIBRARY, "transcripts", pdf.replace(/\.pdf$/, ".md"));
  if (!existsSync(file)) return null;
  const body = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const parts = body.split(/^<!--\s*page\s+(\d+)\s*-->\s*$/m); // [front, n, text, n, text, ...]
  for (let i = 1; i < parts.length; i += 2) {
    if (Number(parts[i]) === page) return parts[i + 1].replace(/^<!--.*?-->\s*$/gm, "").trim();
  }
  return null;
}

/** Stretches of a page with no math, emphasis, table or list markup, the only text the service highlights. */
function plainRuns(markdown: string): string[] {
  const noMath = markdown.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, "\0");
  return noMath
    .split(/[\0*`|>#\n]|^\s*(?:[-+]|\d+\.)\s/m)
    .map((r) => r.trim())
    .filter(Boolean);
}

const norm = (s: string) => s.replace(/\s+/g, " ");

describe("topic data", () => {
  for (const t of TOPICS) {
    describe(t.title, () => {
      it("cites real pages, and highlights are verbatim plain text on that page", () => {
        for (const s of t.sources) {
          expect(existsSync(resolve(LIBRARY, s.filename!)), s.filename).toBe(true);
          const page = transcriptPage(s.filename!, s.page!);
          expect(page, `${s.id}: no transcript page ${s.filename} p.${s.page}`).not.toBeNull();
          if (s.highlight) {
            const found = plainRuns(page!).some((r) => norm(r).includes(norm(s.highlight!)));
            expect(found, `${s.id}: highlight not found as plain text on p.${s.page}: "${s.highlight}"`).toBe(true);
          }
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
