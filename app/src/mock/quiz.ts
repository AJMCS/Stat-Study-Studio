import type { QuizQuestion, Topic } from "../types";

/** Assemble exactly 10 quiz questions: authored ones first, then open-ended fillers built from the tutorial steps. */
export function buildQuiz(topic: Topic): QuizQuestion[] {
  const out = [...topic.quiz];
  let i = 0;
  while (out.length < 10) {
    const step = topic.tutorial[i % topic.tutorial.length];
    out.push({
      id: `gen-${topic.id}-${i}`,
      kind: "open",
      concept: step.heading,
      prompt: `Explain "${step.heading}" in your own words, then give a short example of applying it.`,
      explanation: step.body,
      sourceId: step.sourceId,
    });
    i++;
  }
  return out.slice(0, 10);
}

/**
 * Ten questions across every topic, for the quiz on the Practice page. The topics take turns, so each is asked at
 * least once, and `rotation` (how many such quizzes were taken before) moves on to each topic's next questions, so
 * a retake is not the same ten. Each question carries its topic, so its score counts toward that topic.
 */
export function buildCourseQuiz(topics: Topic[], rotation = 0): QuizQuestion[] {
  const pools = topics.filter((t) => t.quiz.length > 0);
  const total = pools.reduce((s, t) => s + t.quiz.length, 0);
  const out: QuizQuestion[] = [];
  for (let k = 0; out.length < Math.min(10, total); k++) {
    const n = rotation * 10 + k;
    const t = pools[n % pools.length];
    const q = t.quiz[Math.floor(n / pools.length) % t.quiz.length];
    if (!out.some((x) => x.id === q.id)) out.push({ ...q, topicId: t.id });
  }
  return out;
}
