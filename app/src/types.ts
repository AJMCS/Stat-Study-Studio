export const CRITERIA = ["core", "depth", "relevance", "application"] as const;
export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABELS: Record<Criterion, string> = {
  core: "Core idea",
  depth: "Depth of reasoning",
  relevance: "Relevance / why it matters",
  application: "Conceptual application",
};

export const CRITERION_WHY: Record<Criterion, string> = {
  core: "Shows you grasp the central concept the topic is built on.",
  depth: "Explaining why or how an idea works is what lets you handle new problems.",
  relevance: "Knowing why an idea matters helps you pick it when it is needed.",
  application: "Applying the idea to a fresh situation is the real test of understanding.",
};

export type CriterionScores = Record<Criterion, number>;

export interface CriterionFeedback {
  criterion: Criterion;
  score: number;
  why: string;
  suggestion: string;
}

export interface ScoringConfig {
  weights: CriterionScores;
  compositeCutoff: number;
  criterionCutoffs: CriterionScores;
  recencyWindow: number;
}

/** Where a piece of content came from. Shared = repo library, Personal = learner upload. */
export interface SourceRef {
  id: string;
  kind: "Shared" | "Personal";
  title: string;
  collection?: string;
  filename?: string;
  page?: number;
  version?: number;
  uploadedAt?: string;
  /** Passage text. Shared sources load the real page from the service instead. */
  excerpt?: string;
  /** A passage that appears verbatim on the cited page. Only set when it can be located reliably. */
  highlight?: string;
  lowConfidence?: boolean;
  warning?: string | null;
  /** Personal sources: the file on this device, for the preview and "open the original". */
  fileId?: string;
  /** True when a past activity cites a version that has since been replaced; its upload date is then shown. */
  olderVersion?: boolean;
  ocr?: boolean;
  ocrConfidence?: number;
  unavailable?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  unit: string;
  intro: string;
  willStudy: string[];
  tutorial: TutorialStep[];
  quiz: QuizQuestion[];
  /** Extra questions for the exam bank. */
  examBank: ExamQuestion[];
  /** A from-memory prompt with a reference answer, used for revisits and recall. */
  recall: Recall;
  sources: SourceRef[];
}

export interface Recall {
  prompt: string;
  /** Markdown with LaTeX. */
  reference: string;
  keyPoints: string[];
}

export interface TutorialStep {
  heading: string;
  body: string;
  /** Worked examples shown under this step: try it first, then reveal the solution. */
  examples?: { prompt: string; solution: string }[];
  /** LaTeX, shown in display mode. */
  formula?: string;
  sourceId?: string;
}

export interface QuizQuestion {
  id: string;
  kind: "mc" | "open";
  prompt: string;
  choices?: string[];
  answer?: number;
  explanation: string;
  sourceId?: string;
  concept: string;
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  /** Full reference solution (Markdown with LaTeX), shown after the learner has written their own. */
  solution: string;
  hint: string;
  concept: string;
  sourceIds: string[];
  keyPoints: string[];
}

export interface Attempt {
  id: string;
  topicId: string;
  at: string;
  kind: "tutor" | "quiz" | "exam" | "recall";
  /** Only the first response of a low-stakes practice counts toward analytics. */
  counted: boolean;
  composite: number;
  /** For a self-scored attempt every criterion equals the composite and must not be shown as a breakdown. */
  criteria: CriterionScores;
  note?: string;
  /** Scored by the learner against a reference answer, not by a model. */
  selfScored?: boolean;
  /** Scored by an AI rubric on the four criteria. Only these have a real per-criterion breakdown. */
  aiScored?: boolean;
}

export interface QuizResult {
  id: string;
  topicId: string;
  at: string;
  score: number;
  total: number;
  items: {
    questionId: string;
    prompt: string;
    answer: string;
    correct: boolean | null;
    partial?: number;
    feedback: string;
    concept: string;
    sourceId?: string;
    unanswered?: boolean;
    /** Scored by the learner against the reference answer. */
    selfScored?: boolean;
  }[];
  flaggedConcepts: string[];
  selfScored?: boolean;
}

export interface ExamRecord {
  id: string;
  topicId: string;
  at: string;
  timed: boolean;
  focus: string;
  attempt: number;
  composite: number;
  criteria: CriterionScores;
  items: {
    questionId: string;
    prompt: string;
    answer: string;
    feedback: string;
    sourceIds: string[];
    composite: number;
    /** Reference solution and the key points the learner ticked, for the self-scored review. */
    solution?: string;
    keyPoints?: { text: string; got: boolean }[];
  }[];
  sources: SourceRef[];
  selfScored?: boolean;
}

export interface ChatMessage {
  role: "tutor" | "learner";
  text: string;
}

export interface TopicState {
  streak: number;
  flagged: boolean;
  misses: number;
  /** Criteria currently below cutoff on the latest streak-qualifying/any attempt. */
  warnCriteria: Criterion[];
  recallHistory: { at: string; composite: number; qualified: boolean }[];
  strengths: string[];
  gaps: string[];
}

export interface SessionInfo {
  topicId: string;
  activity: "tutor" | "tutorial" | "quiz" | "exam";
  at: string;
}

export interface Collection {
  id: string;
  name: string;
  consent: boolean;
  searchByDefault: boolean;
}

export interface PersonalFile {
  id: string;
  collectionId: string;
  filename: string;
  version: number;
  uploadedAt: string;
  pages: number;
  ocr: boolean;
  ocrConfidence?: number;
  removed: boolean;
  supersedes?: string;
  linkBroken?: boolean;
  size?: number;
  /** Pages that may be missing symbols or were read with low confidence. */
  flaggedPages?: number;
  lowConfidence?: boolean;
}

export interface AppData {
  attempts: Attempt[];
  quizzes: QuizResult[];
  exams: ExamRecord[];
  topicState: Record<string, TopicState>;
  session: SessionInfo | null;
  collections: Collection[];
  files: PersonalFile[];
  config: ScoringConfig;
  hostedDisclosureAck: boolean;
  chats: Record<string, ChatMessage[]>;
}
