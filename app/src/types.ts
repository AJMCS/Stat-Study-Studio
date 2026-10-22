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
  /** What the AI service said about this particular answer (absent for generic feedback). */
  comment?: string;
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
  /** In a quiz across the course: the section this question came from, so its score counts toward that section. */
  topicId?: string;
  /** Written by an AI service around the learner's own ask, not authored; its explanation can contain mistakes. */
  aiWritten?: boolean;
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
  /** Written by an AI service for this exam, not authored; its solution can contain mistakes. */
  aiWritten?: boolean;
  /** In an exam across the course: the section this question came from, so its score counts toward that section. */
  topicId?: string;
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
    /** Scored by an AI service on the four criteria; the details are kept for the summary. */
    aiScored?: boolean;
    criteria?: CriterionScores;
    aiFeedback?: CriterionFeedback[];
    /** In a quiz across the course: the section the question came from. */
    topicId?: string;
    /** The question was written by an AI service for this quiz. */
    aiWritten?: boolean;
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
    /** The question was written by an AI service for this exam. */
    aiWritten?: boolean;
    /** When an AI service scored this answer: its criterion scores and comments. */
    criteria?: CriterionScores;
    aiFeedback?: CriterionFeedback[];
    /** In an exam across the course: the section the question came from. */
    topicId?: string;
  }[];
  sources: SourceRef[];
  selfScored?: boolean;
  /** At least one answer was scored by an AI service, so the criteria are a real breakdown. */
  aiScored?: boolean;
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
  activity: "tutor" | "tutorial" | "quiz" | "exam" | "vocab" | "breakdown" | "check";
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
  /** At least one page was re-read by an AI model from its image. */
  aiRead?: boolean;
}

/** First-run setup. Kept by the service, so it survives clearing the browser's storage. */
export interface OnboardingState {
  done: boolean;
  completedAt?: string;
}

/* ------------------------------------------------------------------ learning activities (vocabulary, checks, breakdowns) */

/** One term of a topic's vocabulary, written from the lecture notes and cited to the page it comes from. */
export interface VocabTerm {
  id: string;
  term: string;
  /** The notation, as inline LaTeX (no dollar signs). */
  symbol?: string;
  /** A plain-words definition. May contain $inline$ LaTeX. */
  plain: string;
  /** The notes' formal definition or notation, Markdown with LaTeX. Only where the notes give one. */
  formal?: string;
  /** "You'll see it as…": a tiny example of the term in use. Markdown with LaTeX. */
  seeIt: string;
  source: SourceRef;
}

export interface CheckChoice {
  text: string;
  correct?: boolean;
  /** Why this option is right or wrong. */
  why: string;
  /** The page that settles it, when it is not the question's own source. */
  source?: SourceRef;
}

/** A comprehension check placed after a tutorial step: about the idea, not computation. */
export interface CheckQuestion {
  id: string;
  /** The tutorial step it follows (0-based). */
  step: number;
  kind: "mc" | "explain";
  prompt: string;
  /** Multiple choice: exactly one is correct. */
  choices?: CheckChoice[];
  /** Explain-in-a-sentence: the reference the learner compares with. May contain $inline$ LaTeX. */
  reference?: string;
  source: SourceRef;
}

export const BREAKDOWN_PARTS = ["ask", "given", "tool", "plan", "pitfalls"] as const;
export type BreakdownPartKey = (typeof BREAKDOWN_PARTS)[number];

export interface BreakdownPart {
  /** When present the learner picks one of these before revealing; otherwise they write a short answer. */
  options?: string[];
  answer?: number;
  /** The model answer for this part. Markdown with LaTeX. */
  model: string;
}

/** An exam-style problem taken apart into the same five parts every time. */
export interface Breakdown {
  id: string;
  title: string;
  prompt: string;
  /** The exam-bank question it is adapted from, if any. */
  examId?: string;
  /** The full worked solution. Markdown with LaTeX. */
  solution: string;
  parts: Record<BreakdownPartKey, BreakdownPart>;
  sources: SourceRef[];
}

export type SelfRating = "got" | "partly" | "missed";

/** The latest answer to one comprehension check. */
export interface CheckAnswer {
  /** 1 right, 0 wrong; self-rated explanations give 1, 0.5 or 0. */
  credit: number;
  choice?: number;
  rating?: SelfRating;
  /** The learner moved on without answering (the tutorial's "Skip the check for now"): recorded as not answered. */
  skipped?: boolean;
  /**
   * Answered again after "Try it again". The choice or rating is the retry's, but `credit` stays the first attempt's:
   * a retry is a learning tool, not a scoring one, so a miss cannot be converted into a right by re-picking the ✓.
   */
  retried?: boolean;
  at: string;
}

export interface BreakdownProgress {
  revealed: BreakdownPartKey[];
  done: boolean;
  at: string;
}

/** Progress in the learning activities. Kept by the service. These never feed scores or mastery. */
export interface LearningState {
  /** Flashcard self-ratings per topic: term ids rated "got it" and "not yet". */
  vocab: Record<string, { known: string[]; notYet: string[] }>;
  /** Comprehension checks per topic, by check id. */
  checks: Record<string, Record<string, CheckAnswer>>;
  /** Question breakdowns per topic, by breakdown id. */
  breakdowns: Record<string, Record<string, BreakdownProgress>>;
}

/* ------------------------------------------------------------------ custom learning paths */

export const PATH_STEP_KINDS = ["tutorial", "vocab", "example", "breakdown", "quiz", "tutor", "explain"] as const;
export type PathStepKind = (typeof PATH_STEP_KINDS)[number];

/** One stop on a custom path: an activity that exists in the app (by its catalogue id), or an explanation the model
 * wrote because nothing in the app fitted (kind "explain", with its text and the course pages it cites). */
export interface CustomPathStep {
  kind: PathStepKind;
  /** The catalogue id of the activity ("" for an explanation). */
  ref: string;
  title: string;
  /** One sentence on why this stop is on the path. */
  why: string;
  /** Explanations only: Markdown with LaTeX. */
  text?: string;
  sources: SourceRef[];
  done: boolean;
  doneAt?: string;
}

/** A path the learner asked for: their own words (and the file they handed in), the model's title, goal and
 * concepts, and the steps with their progress. */
export interface CustomPath {
  id: string;
  title: string;
  goal: string;
  /** What the path takes on ("This path covers …") and what it leaves out and why ("It leaves out …"). */
  covers?: string;
  leavesOut?: string;
  ask: string;
  concepts: string[];
  fileId?: string;
  filename?: string;
  steps: CustomPathStep[];
  createdAt: string;
  openedAt: string;
}

/** Every custom path, newest first. Kept by the service. Progress here never feeds scores. */
export interface PathsState {
  items: CustomPath[];
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
  onboarding: OnboardingState;
  learning: LearningState;
  paths: PathsState;
}
