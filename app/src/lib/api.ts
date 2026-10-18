import type { AppData } from "../types";

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

export const api = {
  health: async (): Promise<Health> => (await call("/api/health")).json(),
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
