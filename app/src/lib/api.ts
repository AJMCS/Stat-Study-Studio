import type { AppData, PersonalFile, SourceRef } from "../types";

export type Slice = keyof AppData;

/** Raised when the local study service cannot be reached (not running, blocked, or crashed). */
export class ServiceUnavailable extends Error {
  constructor(message = "The study service is not responding.") {
    super(message);
  }
}

/** Raised when the service answered but refused the request, with a message fit to show the learner. */
export class ServiceRejected extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ServiceUnavailable();
  }
  if (!res.ok) {
    let detail = `The study service returned an error (${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* keep the generic message */
    }
    throw new ServiceRejected(detail, res.status);
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

export const api = {
  health: async (): Promise<Health> => (await call("/api/health")).json(),
  search: async (q: string, k = 5, collections: string[] = []): Promise<SearchResponse> => {
    const extra = collections.map((c) => `&collection=${encodeURIComponent(c)}`).join("");
    return (await call(`/api/search?q=${encodeURIComponent(q)}&k=${k}${extra}`)).json();
  },
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
