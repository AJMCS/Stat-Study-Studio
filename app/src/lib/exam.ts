import type { ExamQuestion, Topic } from "../types";

export interface DraftExam {
  title: string;
  questions: ExamQuestion[];
  /** Set when a focus was typed: whether any question matched it. */
  focusMatched: boolean | null;
}

const STOP = new Set("the and for are but not you all any can how its let may who why what when where which that this with from into over than then them they their there about also does did have has find show give make use using like each some such only same other both between".split(" "));

const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);
const terms = (s: string) =>
  new Set(
    (s.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? []).filter((w) => !STOP.has(w)).map(stem),
  );

/**
 * Builds an exam from the question bank. Without a model nothing is invented: a focus prompt only chooses which
 * existing questions to ask, by matching its words against each question's concept, text and key points.
 */
export function selectExam(topic: Topic, focus: string): DraftExam {
  const title = `${topic.title} exam`;
  const wanted = terms(focus);
  if (wanted.size === 0) return { title, questions: [...topic.examBank], focusMatched: null };

  const scored = topic.examBank
    .map((q) => {
      const have = terms(`${q.concept} ${q.prompt} ${q.keyPoints.join(" ")}`);
      return { q, hits: [...wanted].filter((w) => have.has(w)).length };
    })
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (scored.length === 0) return { title, questions: [...topic.examBank], focusMatched: false };
  return { title: `${title}: ${focus.trim()}`, questions: scored.map((r) => r.q), focusMatched: true };
}
