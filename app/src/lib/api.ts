import type { AppData, SourceRef } from "../types";

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

export interface SearchResponse {
  query: string;
  /** "keyword" when the embedding model is not available yet (for example first run without internet). */
  mode: "semantic" | "keyword";
  results: SearchHit[];
}

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
  search: async (q: string, k = 5): Promise<SearchResponse> =>
    (await call(`/api/search?q=${encodeURIComponent(q)}&k=${k}`)).json(),
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
