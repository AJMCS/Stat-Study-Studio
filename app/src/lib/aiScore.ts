import { api, ServiceRejected, type AiScoreRequest } from "./api";
import { composite } from "./scoring";
import { CRITERION_WHY, type CriterionFeedback, type CriterionScores, type ScoringConfig } from "../types";

export interface AiScored {
  criteria: CriterionScores;
  feedback: CriterionFeedback[];
  composite: number;
  /** What a tutor would say first, in plain sentences; the criteria are the score sheet beneath it. */
  note: string;
  /** The model could not read the pad's drawing, so only the typed text was scored. */
  drawingIgnored: boolean;
}

/** Ask the connected AI service to score one written answer on the four criteria. */
export async function aiScore(req: AiScoreRequest, cfg: ScoringConfig): Promise<AiScored> {
  const res = await api.aiScore(req);
  const criteria: CriterionScores = { ...res.criteria };
  return {
    criteria,
    composite: composite(criteria, cfg),
    feedback: res.feedback.map((f) => ({ criterion: f.criterion, score: f.score, why: CRITERION_WHY[f.criterion], comment: f.feedback, suggestion: f.suggestion })),
    note: res.note ?? "",
    drawingIgnored: res.drawingIgnored ?? false,
  };
}

/** A sentence for the learner when scoring failed. Their answer is never lost; they can retry or score it themselves. */
export function aiFailure(e: unknown): string {
  if (e instanceof ServiceRejected) return e.message;
  return "Couldn't reach the study service to score this. Your answer is kept; try again or score it yourself.";
}
