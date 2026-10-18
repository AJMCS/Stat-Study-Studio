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
