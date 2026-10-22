import type { SourceRef } from "../types";

/** Where to read a cited page with the guide beside it (the Reader at /read), or null when the source has no page. */
export const readLink = (s: SourceRef): string | null => {
  const page = s.page ?? 1;
  if (s.kind === "Shared" && s.filename) return `/read?source=${encodeURIComponent(s.filename)}&page=${page}`;
  if (s.kind === "Personal" && s.fileId) return `/read?file=${encodeURIComponent(s.fileId)}&page=${page}`;
  return null;
};
