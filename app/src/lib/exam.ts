import { TOPICS, topicById } from "../mock/topics";
import type { ExamQuestion, SourceRef, Topic } from "../types";

/** The id an exam or quiz across every topic is saved under. No topic has it. */
export const COURSE_ID = "course";
export const COURSE_TITLE = "Across the course";

/** What an exam or quiz is about: one topic, or every topic of the course. */
export interface Scope {
  id: string;
  title: string;
  /** For the eyebrow: the topic's unit, or "every topic". */
  unit: string;
  general: boolean;
  topics: Topic[];
}

/** The scope a route names: no topic id means the whole course; an unknown id means nothing. */
export function scopeFor(id: string | undefined): Scope | null {
  if (!id) return { id: COURSE_ID, title: COURSE_TITLE, unit: "every topic", general: true, topics: TOPICS };
  const t = topicById(id);
  return t ? { id: t.id, title: t.title, unit: t.unit, general: false, topics: [t] } : null;
}

/** What a saved exam or quiz was about, from the id it was saved under. */
export const scopeTitle = (topicId: string) => (topicId === COURSE_ID ? COURSE_TITLE : (topicById(topicId)?.title ?? topicId));

/** The topic a question came from, for the eyebrow of an exam across the course; "" when it carries none. */
export const sectionTitle = (topicId: string | undefined) => (topicId ? (topicById(topicId)?.title ?? "") : "");

export const examTitle = (scope: Scope) => (scope.general ? "Exam across the course" : `${scope.title} exam`);

/** A focus across the whole course could match most of the bank; this keeps the exam the length of a real paper. */
export const COURSE_EXAM_MAX = 8;

export interface DraftExam {
  title: string;
  questions: ExamQuestion[];
  /** Set when a focus was typed: whether any question matched it. */
  focusMatched: boolean | null;
  /** Sources cited by AI-written questions (not in the authored topic data). */
  sources?: SourceRef[];
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
 *
 * Across the course the paper is one question from every topic, like the real exam; `rotation` (how many such exams
 * were sat before) moves every topic on to its next question, so a retake is not the same paper. Each question
 * carries its topic, so its score counts toward that topic.
 */
export function selectExam(scope: Scope, focus: string, rotation = 0): DraftExam {
  const title = examTitle(scope);
  const bank: ExamQuestion[] = scope.general
    ? scope.topics.flatMap((t) => t.examBank.map((q) => ({ ...q, topicId: t.id })))
    : [...scope.topics[0].examBank];
  const paper: ExamQuestion[] = scope.general
    ? scope.topics.filter((t) => t.examBank.length > 0).map((t) => ({ ...t.examBank[rotation % t.examBank.length], topicId: t.id }))
    : bank;
  const wanted = terms(focus);
  if (wanted.size === 0) return { title, questions: paper, focusMatched: null };

  const scored = bank
    .map((q) => {
      const have = terms(`${q.concept} ${q.prompt} ${q.keyPoints.join(" ")}`);
      return { q, hits: [...wanted].filter((w) => have.has(w)).length };
    })
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (scored.length === 0) return { title, questions: paper, focusMatched: false };
  const chosen = scored.map((r) => r.q);
  return { title: `${title}: ${focus.trim()}`, questions: scope.general ? chosen.slice(0, COURSE_EXAM_MAX) : chosen, focusMatched: true };
}
