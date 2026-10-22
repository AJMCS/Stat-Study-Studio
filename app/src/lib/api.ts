import type { AppData, PersonalFile, SourceRef } from "../types";

export type Slice = keyof AppData;

/** Raised when the local study service cannot be reached (not running, blocked, or crashed). */
export class ServiceUnavailable extends Error {
  constructor(message = "The study service is not responding.") {
    super(message);
  }
}

/** An Anthropic workspace a key may be used in. */
export interface Workspace {
  id: string;
  name: string;
}

/** Raised when the service answered but refused the request, with a message fit to show the learner. */
export class ServiceRejected extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** For AI calls: why it failed (invalid_key, rate_limited, offline, ...), so the page can offer the right next step. */
    readonly kind?: string,
    /** For kind "workspace_choice": the workspaces the Anthropic key may use, for the learner to pick one. */
    readonly workspaces?: Workspace[],
  ) {
    super(message);
  }
}

/** The refusal the service answered with, from its status and JSON body (which may be missing or not what we expect). */
export function readRejection(status: number, body: unknown): ServiceRejected {
  let detail = `The study service returned an error (${status}).`;
  let kind: string | undefined;
  let workspaces: Workspace[] | undefined;
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.detail === "string") detail = b.detail;
    if (typeof b.kind === "string") kind = b.kind;
    if (Array.isArray(b.workspaces)) {
      workspaces = b.workspaces
        .filter((w): w is { id: string; name?: unknown } => !!w && typeof w === "object" && typeof (w as { id?: unknown }).id === "string")
        .map((w) => ({ id: w.id, name: typeof w.name === "string" && w.name ? w.name : w.id }));
    }
  }
  return new ServiceRejected(detail, status, kind, workspaces);
}

/**
 * Whether the local service answered the last request. Every call reports here, so the connection monitor learns
 * about a vanished service from the first failed request rather than only from its own periodic probe.
 */
type ServiceListener = (ok: boolean) => void;
const serviceListeners = new Set<ServiceListener>();
export const serviceEvents = {
  on(fn: ServiceListener): () => void {
    serviceListeners.add(fn);
    return () => {
      serviceListeners.delete(fn);
    };
  },
  emit(ok: boolean): void {
    for (const fn of serviceListeners) fn(ok);
  },
};

/** One quick, bounded probe of the service: true when it answered. Does not report to the listeners; the monitor
 * that asked for it decides what the answer means. */
export async function healthProbe(timeoutMs = 3000): Promise<boolean> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/health", { signal: ctl.signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    serviceEvents.emit(false);
    throw new ServiceUnavailable();
  }
  serviceEvents.emit(true); // it answered, even if it said no
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* keep the generic message */
    }
    throw readRejection(res.status, body);
  }
  return res;
}

const json = (value: unknown): RequestInit => ({
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});

export interface Health {
  ok: boolean;
  version: string;
  library: { chunks: number; documents: number; builtAt: string } | null;
}

export interface SearchHit {
  id: string;
  scope: "shared";
  source: string;
  title: string;
  page: number;
  heading: string;
  kind: string;
  text: string;
  score: number;
  verified: boolean;
  lowConfidence: boolean;
  highlight: string | null;
  warning: string | null;
}

export interface PersonalHit {
  id: string;
  scope: "personal";
  fileId: string;
  collectionId: string;
  collection: string;
  filename: string;
  title: string;
  page: number;
  heading: string;
  text: string;
  score: number;
  version: number;
  uploadedAt: string;
  ocr: boolean;
  lowConfidence: boolean;
  warning: string | null;
  highlight: string | null;
}

export interface SearchResponse {
  query: string;
  /** "keyword" when the embedding model is not available yet (for example first run without internet). */
  mode: "semantic" | "keyword";
  /** Passages from the shared course library. */
  results: SearchHit[];
  /** Passages from the learner's own uploads. */
  personal: PersonalHit[];
}

export interface UploadReport {
  pages: number;
  ocrPages: number;
  flaggedPages: { page: number; warning: string }[];
  lowConfidence: boolean;
  /** Set by "Improve with AI" runs. */
  improved?: number[];
  failed?: number[];
  unclear?: Record<string, string[]>;
  stopped?: string | null;
  skipped?: number;
}

export interface ImproveInfo {
  pages: number[];
  count: number;
  willSend: number;
  limit: number;
  connected: boolean;
  providerName: string;
  local: boolean;
  model: string;
}

export interface UploadJob {
  uploadId: string;
  filename: string;
  status: "queued" | "processing" | "ready" | "failed";
  progress: number;
  total: number;
  error: string | null;
  file: PersonalFile | null;
  report: UploadReport | null;
}

export interface PersonalPageInfo {
  scope: "personal";
  fileId: string;
  filename: string;
  collection: string;
  version: number;
  uploadedAt: string;
  page: number;
  pages: number;
  text: string;
  method: string;
  confidence: number;
  lowConfidence: boolean;
  warning: string | null;
  hasImage: boolean;
  available: boolean;
}

export interface LibraryStatus {
  /** False when this copy of the app has no update location set. */
  configured: boolean;
  installed: { version: number; builtAt: string | null; source: "bundled" | "update" };
  state: "idle" | "checking" | "downloading";
  /** Unix seconds of the last successful check. */
  checkedAt: number | null;
  error: string | null;
  available: { version: number; builtAt: string | null; files: number; bytes: number } | null;
  progress: { done: number; total: number };
  justUpdated: boolean;
}

export const personalHitToSource = (h: PersonalHit): SourceRef => ({
  id: h.id,
  kind: "Personal",
  title: h.filename,
  collection: h.collection,
  filename: h.filename,
  page: h.page,
  version: h.version,
  uploadedAt: h.uploadedAt,
  excerpt: h.text,
  highlight: h.highlight ?? undefined,
  ocr: h.ocr,
  lowConfidence: h.lowConfidence,
  warning: h.warning,
  fileId: h.fileId,
});

export interface PageInfo {
  source: string;
  title: string;
  page: number;
  pages: number;
  kind: string;
  text: string;
  verified: boolean;
  lowConfidence: boolean;
  warning: string | null;
}

export const hitToSource = (h: SearchHit): SourceRef => ({
  id: h.id,
  kind: "Shared",
  title: h.title,
  filename: h.source,
  page: h.page,
  excerpt: h.text,
  highlight: h.highlight ?? undefined,
  lowConfidence: h.lowConfidence,
  warning: h.warning,
});

export type ProviderId = "gemini" | "anthropic" | "openai" | "ollama";

/** A service the learner has connected and that is ready to use (key stored, or a local model chosen). */
export interface AiAccount {
  id: ProviderId;
  name: string;
  model: string;
  local: boolean;
  /** The one every AI feature uses right now. */
  active: boolean;
}

export interface AiInfo {
  /** The service these fields describe: the active one, or the one being previewed in Settings. */
  provider: ProviderId;
  providerName: string;
  providers: { id: ProviderId; name: string; local: boolean }[];
  /** The service in use, or null when none is. */
  active: ProviderId | null;
  /** Every saved, ready service; the learner can switch between them without a key. */
  accounts: AiAccount[];
  /** The local model's warm-up, when one is active and has been asked to load. */
  warm: { state: "loading" | "ready" | "failed" } | null;
  /** Needs a pasted API key (everything except a model on this computer). */
  needsKey: boolean;
  /** The model runs on this computer, so nothing is sent over the internet. */
  local: boolean;
  connected: boolean;
  keyStored: boolean;
  /** "os" = the operating system's credential store, "file" = a private file in the app's data folder. */
  keyLocation: "os" | "file";
  consented: boolean;
  consentedAt: string | null;
  model: string;
  defaultModel: string;
  /** Anthropic only: the workspace a key made for the whole organisation was told to use (null for a key scoped to
   * one workspace, and for every other service). */
  workspace: string | null;
  workspaceName: string | null;
  /** The exact data notice the learner agrees to; shown verbatim. */
  notice: string;
  noticeVersion: number;
}

export interface AiScoreRequest {
  topic: string;
  question: string;
  answer: string;
  /** The drawing pad's PNG as a data URL: part of the answer, sent with the typed text. */
  drawing?: string;
  reference?: string;
  keyPoints?: string[];
  stage?: "conceptual" | "formal";
}

export interface AiScoreResponse {
  criteria: Record<"core" | "depth" | "relevance" | "application", number>;
  feedback: { criterion: "core" | "depth" | "relevance" | "application"; score: number; feedback: string; suggestion: string }[];
  /** What a tutor would say about this answer, in a few plain sentences; "" when the model gave none. */
  note: string;
  /** True when the model could not read the drawing, so only the typed text was scored. */
  drawingIgnored?: boolean;
  model: string;
}

export type TutorStage = "probe" | "diagnose" | "plan" | "build" | "bridge" | "done";

export interface TutorTurn {
  role: "tutor" | "learner";
  text: string;
  /** The pad's drawing (a PNG data URL) that goes with the learner's latest message. */
  drawing?: string;
}

export interface TutorReply {
  text: string;
  stage: TutorStage;
  plan: string[] | null;
  assess: Record<"core" | "depth" | "relevance" | "application", number> | null;
  strengths: string[];
  gaps: string[];
  /** The course pages (or allowed personal excerpts) the reply relied on. */
  sources: (SearchHit | PersonalHit)[];
  /** True when the model could not read the drawing sent with the message, so only the typed text was read. */
  drawingIgnored?: boolean;
}

/** One activity the app can offer as a path step, as sent to the model (built by lib/paths.ts). */
export interface CatalogueItem {
  id: string;
  kind: "tutorial" | "vocab" | "example" | "breakdown" | "quiz" | "tutor";
  topic: string;
  title: string;
  summary: string;
}

export interface AiPathStep {
  kind: "tutorial" | "vocab" | "example" | "breakdown" | "quiz" | "tutor" | "explain";
  ref: string;
  title: string;
  why: string;
  text: string;
  sources: (SearchHit | PersonalHit)[];
}

/** A proposed custom path, before the learner starts (and so saves) it. */
export interface AiPathProposal {
  title: string;
  goal: string;
  /** What the path takes on, completing "This path covers …", and what it leaves out and why, completing "It
   * leaves out …" ("" when nothing is). */
  covers: string;
  leavesOut: string;
  concepts: string[];
  steps: AiPathStep[];
  fileId: string | null;
  filename: string | null;
  model: string;
}

export interface AiExamQuestion {
  concept: string;
  prompt: string;
  solution: string;
  hint: string;
  keyPoints: string[];
  sources: (SearchHit | PersonalHit)[];
}

export const api = {
  improveInfo: async (fileId: string, scope: "flagged" | "all"): Promise<ImproveInfo> => (await call(`/api/files/${fileId}/improve-info?scope=${scope}`)).json(),
  improveFile: async (fileId: string, accept: boolean, scope: "flagged" | "all"): Promise<UploadJob> =>
    (await call(`/api/files/${fileId}/improve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accept, scope }) })).json(),
  restoreReading: async (fileId: string): Promise<void> => {
    await call(`/api/files/${fileId}/restore-reading`, { method: "POST" });
  },
  aiExam: async (topic: string, focus: string, count: number, examples: { concept: string; prompt: string }[]): Promise<{ questions: AiExamQuestion[] }> =>
    (await call("/api/ai/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, focus, count, examples }) })).json(),
  aiTutor: async (topic: string, stage: TutorStage, history: TutorTurn[], focus = ""): Promise<TutorReply> =>
    (await call("/api/ai/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, stage, history, focus }) })).json(),
  aiPath: async (ask: string, fileId: string | null, catalogue: CatalogueItem[]): Promise<AiPathProposal> =>
    (await call("/api/ai/path", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ask, fileId, catalogue }) })).json(),
  aiScore: async (req: AiScoreRequest): Promise<AiScoreResponse> =>
    (await call("/api/ai/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) })).json(),
  aiStatus: async (provider?: string): Promise<AiInfo> => (await call(`/api/ai${provider ? `?provider=${provider}` : ""}`)).json(),
  aiLocalModels: async (): Promise<{ running: boolean; models: string[] }> => (await call("/api/ai/local-models")).json(),
  /** `workspace` is for Anthropic only: a key made for the whole organisation must say which workspace to use. Without
   * it the service answers 409 workspace_choice (with the list to pick from) or workspace_needed (paste the ID). */
  aiConnect: async (apiKey: string, accept: boolean, model?: string, provider: ProviderId = "gemini", workspace?: string): Promise<AiInfo> =>
    (await call("/api/ai/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, accept, model: model || null, provider, workspace: workspace || null }) })).json(),
  aiTest: async (): Promise<AiInfo> => (await call("/api/ai/test", { method: "POST" })).json(),
  aiSetModel: async (model: string): Promise<AiInfo> => (await call("/api/ai/model", json({ model: model || null }))).json(),
  aiDisconnect: async (provider?: ProviderId): Promise<AiInfo> => (await call(`/api/ai${provider ? `?provider=${provider}` : ""}`, { method: "DELETE" })).json(),
  aiSwitch: async (provider: ProviderId): Promise<AiInfo> =>
    (await call("/api/ai/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) })).json(),
  aiWarm: async (): Promise<{ warming: boolean; state: "loading" | "ready" | "failed" | null }> => (await call("/api/ai/warm", { method: "POST" })).json(),
  health: async (): Promise<Health> => (await call("/api/health")).json(),
  search: async (q: string, k = 5, collections: string[] = []): Promise<SearchResponse> => {
    const extra = collections.map((c) => `&collection=${encodeURIComponent(c)}`).join("");
    return (await call(`/api/search?q=${encodeURIComponent(q)}&k=${k}${extra}`)).json();
  },
  libraryStatus: async (): Promise<LibraryStatus> => (await call("/api/library")).json(),
  libraryCheck: async (): Promise<LibraryStatus> => (await call("/api/library/check", { method: "POST" })).json(),
  libraryUpdate: async (): Promise<LibraryStatus> => (await call("/api/library/update", { method: "POST" })).json(),
  listFiles: async (): Promise<PersonalFile[]> => (await call("/api/files")).json(),
  uploadFile: async (file: File, collectionId: string, replaceId?: string): Promise<UploadJob> => {
    const form = new FormData();
    form.append("file", file);
    form.append("collectionId", collectionId);
    if (replaceId) form.append("replaceId", replaceId);
    return (await call("/api/uploads", { method: "POST", body: form })).json();
  },
  uploadStatus: async (id: string): Promise<UploadJob> => (await call(`/api/uploads/${id}`)).json(),
  removeFile: async (id: string): Promise<void> => {
    await call(`/api/files/${id}`, { method: "DELETE" });
  },
  reconnectFile: async (id: string, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await call(`/api/files/${id}/reconnect`, { method: "POST", body: form });
  },
  personalPage: async (fileId: string, page: number): Promise<PersonalPageInfo> =>
    (await call(`/api/files/${fileId}/pages/${page}`)).json(),
  page: async (source: string, page: number): Promise<PageInfo> =>
    (await call(`/api/page?source=${encodeURIComponent(source)}&page=${page}`)).json(),
  getState: async (): Promise<{ initialized: boolean; state: Partial<AppData> }> => (await call("/api/state")).json(),
  putSlice: async (name: Slice, value: unknown): Promise<void> => {
    await call(`/api/state/${name}`, json(value));
  },
  importState: async (state: unknown, overwrite = false): Promise<void> => {
    await call(`/api/import${overwrite ? "?overwrite=true" : ""}`, { ...json(state), method: "POST" });
  },
  exportText: async (): Promise<string> => (await call("/api/export")).text(),
  deleteAll: async (): Promise<void> => {
    await call("/api/data", { method: "DELETE" });
  },
};
