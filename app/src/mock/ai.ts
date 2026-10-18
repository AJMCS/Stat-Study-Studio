import {
  CRITERIA,
  CRITERION_LABELS,
  CRITERION_WHY,
  type CriterionFeedback,
  type CriterionScores,
  type ExamQuestion,
  type Topic,
} from "../types";
import { clamp } from "../lib/scoring";

/**
 * Mock AI layer. Every function here is a stand-in for a model call that the backend phase will replace.
 * Signatures are async so swapping in a real on-device or hosted model does not change callers.
 */

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

const SIGNALS: Record<keyof CriterionScores, RegExp> = {
  core: /(distribution|mean|statistic|sample|population|parameter|interval|varies|variation|standard error|estimate)/gi,
  depth: /(because|since|therefore|so that|which means|as a result|why|how|divid|square root|variance)/gi,
  relevance: /(matters|important|lets us|allows|helps|so we can|useful|inference|decision|uncertain)/gi,
  application: /(for example|for instance|e\.g\.|suppose|imagine|if we|in this case|a sample of|n\s*=)/gi,
};

const SUGGESTIONS: Record<keyof CriterionScores, string> = {
  core: "Name the central object directly (for example, what exactly is being measured or varying) in your first sentence.",
  depth: "Add a 'because' step: say why or how the idea works, not only what it is.",
  relevance: "Finish with one sentence on what this lets us do or decide that we could not otherwise.",
  application: "Try a quick concrete case, such as a sample size or a short scenario, and apply the idea to it.",
};

/** Heuristic stand-in for rubric scoring. Longer, more reasoned explanations score higher. */
export async function scoreExplanation(text: string): Promise<{
  criteria: CriterionScores;
  feedback: CriterionFeedback[];
}> {
  await delay();
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lengthBoost = Math.min(30, words * 0.9);
  const criteria = {} as CriterionScores;
  for (const k of CRITERIA) {
    const hits = (text.match(SIGNALS[k]) ?? []).length;
    criteria[k] = words === 0 ? 0 : clamp(30 + lengthBoost + Math.min(hits, 4) * 9);
  }
  const feedback = CRITERIA.map((k) => ({
    criterion: k,
    score: criteria[k],
    why: CRITERION_WHY[k],
    suggestion: SUGGESTIONS[k],
  }));
  return { criteria, feedback };
}

export function criterionName(k: keyof CriterionScores) {
  return CRITERION_LABELS[k];
}

export type TutorStage = "probe" | "diagnose" | "plan" | "build" | "bridge" | "done";

export interface TutorTurn {
  text: string;
  stage: TutorStage;
  plan?: string[];
  assess?: CriterionScores;
}

export function tutorOpening(topic: Topic): TutorTurn {
  return {
    stage: "probe",
    text: `Let's start with what you already know. In your own words, what is "${topic.title.toLowerCase()}" about? Informal answers are perfect here, and a quick sketch is welcome too.`,
  };
}

/** Scripted adaptive flow: probe -> diagnose -> plan -> build -> bridge. */
export async function tutorReply(topic: Topic, stage: TutorStage, learnerText: string, step = 0): Promise<TutorTurn> {
  await delay();
  switch (stage) {
    case "probe": {
      const { criteria } = await scoreExplanation(learnerText);
      const weakest = [...CRITERIA].sort((a, b) => criteria[a] - criteria[b])[0];
      return {
        stage: "diagnose",
        assess: criteria,
        text: `Thanks, that helps. The sound part is your grasp of the basic idea. I see the most room in "${CRITERION_LABELS[weakest].toLowerCase()}". One quick follow-up: ${
          weakest === "application"
            ? "can you picture a concrete situation where this idea would change what you do?"
            : weakest === "depth"
              ? "why do you think it works that way?"
              : weakest === "relevance"
                ? "why would a statistician care about this?"
                : "what is the single central thing this topic measures or describes?"
        }`,
      };
    }
    case "diagnose":
      return {
        stage: "plan",
        plan: [
          "Build intuition with a small scenario",
          "Connect it to the lecture-notes definition",
          "Write the formal statement and try one example",
        ],
        text: "Here is a short plan based on what I saw. Accept it or adjust the steps.",
      };
    case "plan":
      return {
        stage: "build",
        text: `Scenario: imagine two classmates each draw their own sample on this topic. Their results differ even though they follow the same procedure. What does that tell you about "${topic.title.toLowerCase()}"? (If this scenario does not click, say so and I will explain it directly.)`,
      };
    case "build": {
      const stuck = /(don't|dont|no idea|not sure|confus|unclear)/i.test(learnerText);
      if (stuck) {
        return {
          stage: "build",
          text: `No problem, here is the direct explanation: ${topic.tutorial[step % topic.tutorial.length].body} What part of that is still unclear? If it is a prerequisite idea, we can revisit that first.`,
        };
      }
      return {
        stage: "bridge",
        text: `Good, that is the right instinct. Now let's make it formal using the lecture notation. ${
          topic.tutorial.find((s) => s.formula)?.body ?? ""
        } Write the formal statement below (typed LaTeX or a drawing both work).`,
      };
    }
    case "bridge": {
      const { criteria } = await scoreExplanation(learnerText + " because therefore for example important");
      return {
        stage: "done",
        assess: criteria,
        text: "Nice work bridging from intuition to the formal statement. I saved this to your progress. You can revisit later to build a retention streak.",
      };
    }
    default:
      return { stage: "done", text: "We're all set for this topic. Pick another activity whenever you like." };
  }
}

export interface DraftExam {
  title: string;
  questions: ExamQuestion[];
  adapted: boolean;
}

/** Draw from the topic's uploaded/bank questions; add model-created ones when a focus is given. */
export async function generateExam(topic: Topic, focus: string): Promise<DraftExam> {
  await delay(700);
  const questions = [...topic.examBank];
  const f = focus.trim();
  if (f) {
    questions.push({
      id: `gen-${Date.now()}`,
      prompt: `Focused question (${f}): Using the lecture notation, set up and solve a problem on this area, then explain why each setup choice is appropriate.`,
      hint: "Write down what is given and what you want, then pick the formula from the notes that connects them.",
      concept: f,
      sourceIds: topic.sources.map((s) => s.id),
      keyPoints: ["identifies given quantities", "chooses appropriate formula", "justifies the setup"],
    });
  }
  return { title: `${topic.title} exam`, questions, adapted: !!f };
}

/** Grade a multi-step written solution on setup choices and reasoning, not just the final answer. */
export async function gradeExamAnswer(q: ExamQuestion, answer: string) {
  const { criteria, feedback } = await scoreExplanation(answer);
  const covered = q.keyPoints.filter((kp) => answer.toLowerCase().includes(kp.toLowerCase().split(" ")[0])).length;
  return {
    criteria,
    feedback: feedback.map((f) => f.suggestion).join(" "),
    keyPointNote: `Key points expected: ${q.keyPoints.join("; ")}. Matched about ${covered} of ${q.keyPoints.length}.`,
  };
}

/** Assemble exactly 10 quiz questions: authored ones first, then model-generated open-ended fillers. */
export function buildQuiz(topic: Topic): import("../types").QuizQuestion[] {
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
