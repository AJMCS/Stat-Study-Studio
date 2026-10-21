import { describe, expect, it } from "vitest";
import { brief, buildCatalogue, fromProposal, pathProgress, sentence, stepLink } from "./paths";
import { TOPICS } from "../mock/topics";
import { MIXED } from "../mock/breakdown";
import type { CustomPath } from "../types";

const catalogue = buildCatalogue();

describe("the catalogue of activities a path can use", () => {
  it("has a unique id per entry, in the id:topic:… form the service checks", () => {
    const ids = catalogue.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+:[A-Za-z0-9_.:-]+$/);
  });

  it("covers every topic's vocabulary, tutorial steps, worked examples, breakdowns, quiz and tutor session", () => {
    for (const t of TOPICS) {
      expect(catalogue.find((c) => c.id === `vocab:${t.id}`)?.kind).toBe("vocab");
      expect(catalogue.filter((c) => c.kind === "tutorial" && c.id.startsWith(`tutorial:${t.id}:`))).toHaveLength(t.tutorial.length);
      const examples = t.tutorial.reduce((n, s) => n + (s.examples?.length ?? 0), 0);
      expect(catalogue.filter((c) => c.kind === "example" && c.id.startsWith(`example:${t.id}:`))).toHaveLength(examples);
      expect(catalogue.find((c) => c.id === `quiz:${t.id}`)?.topic).toBe(t.title);
      expect(catalogue.find((c) => c.id === `tutor:${t.id}`)?.kind).toBe("tutor");
    }
    expect(catalogue.filter((c) => c.id.startsWith("breakdown:which-tool:"))).toHaveLength(MIXED.length);
  });

  it("keeps every line short and within what the service accepts", () => {
    for (const c of catalogue) {
      expect(c.title.length).toBeLessThanOrEqual(200);
      expect(c.summary.length).toBeLessThanOrEqual(400);
      expect(c.summary).not.toContain("‹");
    }
    expect(catalogue.length).toBeLessThanOrEqual(400);
    expect(brief("a ‹L05› reference that is far too long to keep", 20)).toBe("a L05 reference tha…");
  });

  it("resolves every catalogue entry to a route in the app", () => {
    for (const c of catalogue) {
      const link = stepLink({ kind: c.kind, ref: c.id }, { goal: "the MLE of a rate", pathId: "p1" });
      expect(link, c.id).not.toBeNull();
      expect(link!.to.startsWith("/topic/")).toBe(true);
    }
    const tutor = stepLink({ kind: "tutor", ref: "tutor:maximum-likelihood-estimation" }, { goal: "the MLE of a rate", pathId: "p1" })!;
    expect(tutor.to).toBe("/topic/maximum-likelihood-estimation/tutor?focus=the+MLE+of+a+rate&path=p1");
    expect(stepLink({ kind: "tutorial", ref: "tutorial:maximum-likelihood-estimation:2" }, { goal: "" })!.to).toBe("/topic/maximum-likelihood-estimation/tutorial?step=2");
    const which = catalogue.find((c) => c.id.startsWith("breakdown:which-tool:"))!;
    expect(stepLink({ kind: which.kind, ref: which.id }, { goal: "" })!.to).toMatch(/^\/topic\/maximum-likelihood-estimation\/breakdown\?q=\d+$/);
  });

  it("gives no link for an explanation or for a ref the app no longer has", () => {
    expect(stepLink({ kind: "explain", ref: "" }, { goal: "" })).toBeNull();
    expect(stepLink({ kind: "tutorial", ref: "tutorial:no-such-topic:1" }, { goal: "" })).toBeNull();
    expect(stepLink({ kind: "tutorial", ref: "tutorial:maximum-likelihood-estimation:99" }, { goal: "" })).toBeNull();
    expect(stepLink({ kind: "breakdown", ref: "breakdown:maximum-likelihood-estimation:nope" }, { goal: "" })).toBeNull();
  });
});

describe("a path's progress", () => {
  const path = (done: boolean[]): CustomPath => ({
    id: "p",
    title: "t",
    goal: "g",
    ask: "a",
    concepts: [],
    steps: done.map((d, i) => ({ kind: "tutorial", ref: `tutorial:maximum-likelihood-estimation:${i + 1}`, title: `s${i}`, why: "w", sources: [], done: d })),
    createdAt: "x",
    openedAt: "x",
  });

  it("the current step is the first not done, and there is none once every step is done", () => {
    expect(pathProgress(path([true, true, false, false, true]))).toEqual({ done: 3, total: 5, current: 2 });
    expect(pathProgress(path([false, false]))).toEqual({ done: 0, total: 2, current: 0 });
    expect(pathProgress(path([true, true]))).toEqual({ done: 2, total: 2, current: -1 });
  });

  it("a proposal becomes a saved path with nothing done, its file remembered and its sources as citations", () => {
    const p = fromProposal(
      {
        title: "T",
        goal: "G",
        covers: "c",
        leavesOut: "",
        concepts: ["a"],
        fileId: "f1",
        filename: "hw.pdf",
        model: "m",
        steps: [
          { kind: "tutorial", ref: "tutorial:maximum-likelihood-estimation:1", title: "s", why: "w", text: "", sources: [] },
          {
            kind: "explain",
            ref: "",
            title: "e",
            why: "w",
            text: "$x$",
            sources: [{ id: "h", scope: "shared", source: "lecture-notes/l5.pdf", title: "Lecture 5", page: 2, heading: "", kind: "lecture", text: "…", score: 1, verified: true, lowConfidence: false, highlight: null, warning: null }],
          },
        ],
      },
      "my ask",
    );
    expect(p.fileId).toBe("f1");
    expect(p.ask).toBe("my ask");
    expect(p.covers).toBe("c");
    expect(p).not.toHaveProperty("leavesOut"); // nothing left out: the key is not saved
    expect(sentence("the rate")).toBe("the rate.");
    expect(sentence("the rate. ")).toBe("the rate.");
    expect(p.steps.map((s) => s.done)).toEqual([false, false]);
    expect(p.steps[0]).not.toHaveProperty("text");
    expect(p.steps[1].text).toBe("$x$");
    expect(p.steps[1].sources[0]).toMatchObject({ kind: "Shared", filename: "lecture-notes/l5.pdf", page: 2 });
  });
});
