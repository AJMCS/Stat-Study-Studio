import {
  CRITERIA,
  type Attempt,
  type Criterion,
  type CriterionScores,
  type ScoringConfig,
  type TopicState,
} from "../types";

export const DEFAULT_CONFIG: ScoringConfig = {
  weights: { core: 1, depth: 1, relevance: 1, application: 1 },
  compositeCutoff: 80,
  criterionCutoffs: { core: 80, depth: 80, relevance: 80, application: 80 },
  recencyWindow: 5,
};

export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Weighted average of the four criteria. Equal weights by default. */
export function composite(c: CriterionScores, cfg: ScoringConfig = DEFAULT_CONFIG): number {
  const total = CRITERIA.reduce((s, k) => s + cfg.weights[k], 0);
  if (total <= 0) return 0;
  return clamp(CRITERIA.reduce((s, k) => s + c[k] * cfg.weights[k], 0) / total);
}

export function criteriaBelowCutoff(c: CriterionScores, cfg: ScoringConfig = DEFAULT_CONFIG): Criterion[] {
  return CRITERIA.filter((k) => c[k] < cfg.criterionCutoffs[k]);
}

/**
 * Only counted, non-deleted attempts feed analytics. Sorted oldest -> newest.
 * Self-scored attempts (scored by the learner against a reference answer) are included unless the learner hides them.
 */
export function analyticsAttempts(attempts: Attempt[], topicId?: string, includeSelfScored = true): Attempt[] {
  return attempts
    .filter((a) => a.counted && (!topicId || a.topicId === topicId) && (includeSelfScored || !a.selfScored))
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** A score from a self-check: every criterion gets the same number, flagged so the UI never shows it as a breakdown. */
export const uniformCriteria = (score: number): CriterionScores => {
  const n = clamp(score);
  return { core: n, depth: n, relevance: n, application: n };
};

/** Percentage of reference key points a learner says their answer covered. */
export const selfScore = (got: boolean[]): number => (got.length ? clamp((100 * got.filter(Boolean).length) / got.length) : 0);

/**
 * Recency-weighted average of the latest `window` attempts.
 * Newest gets weight `window`, next `window-1`, ... down to 1.
 */
export function recencyWeighted(attempts: Attempt[], window = 5, pick: (a: Attempt) => number = (a) => a.composite): number | null {
  const latest = attempts.slice(-window);
  if (!latest.length) return null;
  let num = 0;
  let den = 0;
  latest.forEach((a, i) => {
    const w = i + 1; // oldest of the window = 1, newest = latest.length
    num += pick(a) * w;
    den += w;
  });
  return Math.round(num / den);
}

export function historicalPeak(attempts: Attempt[]): number | null {
  return attempts.length ? Math.max(...attempts.map((a) => a.composite)) : null;
}

export type Trend = "improving" | "declining" | "steady" | "new";

/** Compare the recency-weighted score now against the one before the latest attempt. */
export function trend(attempts: Attempt[], window = 5): Trend {
  if (attempts.length < 2) return "new";
  const now = recencyWeighted(attempts, window)!;
  const before = recencyWeighted(attempts.slice(0, -1), window)!;
  if (now - before >= 3) return "improving";
  if (before - now >= 3) return "declining";
  return "steady";
}

export const EMPTY_TOPIC_STATE: TopicState = {
  streak: 0,
  flagged: false,
  misses: 0,
  warnCriteria: [],
  recallHistory: [],
  strengths: [],
  gaps: [],
};

/**
 * Apply a recall attempt. A qualifying composite extends the streak regardless of elapsed time or
 * weak individual criteria. A miss keeps the streak and prior progress, records the miss and flags the topic.
 */
export function applyRecall(
  prev: TopicState | undefined,
  at: string,
  criteria: CriterionScores,
  cfg: ScoringConfig = DEFAULT_CONFIG,
  selfScored = false,
): TopicState {
  const state = prev ?? EMPTY_TOPIC_STATE;
  const comp = composite(criteria, cfg);
  const qualified = comp >= cfg.compositeCutoff;
  return {
    ...state,
    streak: qualified ? state.streak + 1 : state.streak,
    misses: qualified ? state.misses : state.misses + 1,
    flagged: qualified ? false : true,
    // A self-score has one number, not four, so there is no per-criterion warning to show.
    warnCriteria: selfScored ? [] : criteriaBelowCutoff(criteria, cfg),
    recallHistory: [...state.recallHistory, { at, composite: comp, qualified }],
  };
}

export function classify(score: number | null, cfg: ScoringConfig = DEFAULT_CONFIG): "strength" | "gap" | "none" {
  if (score === null) return "none";
  return score >= cfg.compositeCutoff ? "strength" : "gap";
}
