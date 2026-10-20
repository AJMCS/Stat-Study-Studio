import type { SourceRef } from "../types";

/** Course files in course-library/, cited by page. Their page-aligned transcripts are in course-library/transcripts/. */
export const LEC = {
  1: "lecture-notes/lecture-01-probability-review-and-intro-to-inference.pdf",
  2: "lecture-notes/lecture-02-frequentist-vs-bayesian-inference.pdf",
  3: "lecture-notes/lecture-03-the-posterior-distribution.pdf",
  4: "lecture-notes/lecture-04-loss-functions-and-bayes-estimators.pdf",
  5: "lecture-notes/lecture-05-maximum-likelihood-estimation.pdf",
  6: "lecture-notes/lecture-06-maximum-likelihood-properties.pdf",
  7: "lecture-notes/lecture-07-sampling-distributions.pdf",
} as const;
export const QUIZ2 = "quizzes/quiz-02-bayesian-estimation.pdf";
export const QUIZ3 = "quizzes/quiz-03-mle-and-sampling-distributions.pdf";
export const HW1 = "homework/homework-01.pdf";
export const HW2 = "homework/homework-02.pdf";
export const DISC = {
  1: "discussion-sections/disc-01.pdf",
  2: "discussion-sections/disc-02.pdf",
  3: "discussion-sections/disc-03.pdf",
  4: "discussion-sections/disc-04.pdf",
} as const;

/** A citation into the shared library. `highlight` is verbatim text on that page (checked by the content tests). */
export const src = (id: string, title: string, filename: string, page: number, highlight?: string): SourceRef => ({
  id,
  kind: "Shared",
  title,
  filename,
  page,
  highlight,
});

/** A lecture page: `lec(5, 2, "Lecture 5 · Procedure", "verbatim text")`. */
export const lec = (id: string, n: keyof typeof LEC, page: number, title: string, highlight?: string): SourceRef =>
  src(id, `Lecture ${n} · ${title}`, LEC[n], page, highlight);
