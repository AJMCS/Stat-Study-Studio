import { TOPICS } from "../mock/topics";
import { analyticsAttempts, classify, recencyWeighted } from "./scoring";
import type { AppData, Topic } from "../types";

export type TopicStatus = "new" | "started" | "strength" | "revisit";

export interface TopicProgress {
  topic: Topic;
  score: number | null;
  streak: number;
  status: TopicStatus;
}

/** Where each topic stands, in course order. */
export function journey(data: AppData, includeSelf: boolean): TopicProgress[] {
  return TOPICS.map((topic) => {
    const at = analyticsAttempts(data.attempts, topic.id, includeSelf);
    const score = recencyWeighted(at, data.config.recencyWindow);
    const st = data.topicState[topic.id];
    const cls = classify(score, data.config);
    const status: TopicStatus = st?.flagged ? "revisit" : score === null ? "new" : cls === "strength" ? "strength" : "started";
    return { topic, score, streak: st?.streak ?? 0, status };
  });
}

/** The learner's current topic: the one they were last working on, else the first one that is not yet a strength. */
export function currentTopicId(data: AppData, rows: TopicProgress[]): string {
  if (data.session && rows.some((r) => r.topic.id === data.session!.topicId)) return data.session.topicId;
  return (rows.find((r) => r.status !== "strength") ?? rows[rows.length - 1]).topic.id;
}

export const units = () => [...new Set(TOPICS.map((t) => t.unit))];

/** "Unit 3 · Frequentist estimation" -> ["Unit 3", "Frequentist estimation"] */
export const splitUnit = (u: string): [string, string] => {
  const [a, ...b] = u.split(" · ");
  return [a, b.join(" · ")];
};
