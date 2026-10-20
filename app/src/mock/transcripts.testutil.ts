// Test-only helpers: read the page-aligned course transcripts and check a citation against them.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SourceRef } from "../types";

export const LIBRARY = resolve(__dirname, "../../../course-library");

/** Text of one page of a hand or automatic transcript, with the extraction comments removed. */
export function transcriptPage(pdf: string, page: number): string | null {
  const file = resolve(LIBRARY, "transcripts", pdf.replace(/\.pdf$/, ".md"));
  if (!existsSync(file)) return null;
  const body = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const parts = body.split(/^<!--\s*page\s+(\d+)\s*-->\s*$/m); // [front, n, text, n, text, ...]
  for (let i = 1; i < parts.length; i += 2) {
    if (Number(parts[i]) === page) return parts[i + 1].replace(/^<!--.*?-->\s*$/gm, "").trim();
  }
  return null;
}

/** Stretches of a page with no math, emphasis, table or list markup, the only text the service highlights. */
export function plainRuns(markdown: string): string[] {
  const noMath = markdown.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, "\0");
  return noMath
    .split(/[\0*`|>#\n]|^\s*(?:[-+]|\d+\.)\s/m)
    .map((r) => r.trim())
    .filter(Boolean);
}

const norm = (s: string) => s.replace(/\s+/g, " ");

/** Problems with a citation: the file or page does not exist, or the highlight is not verbatim plain text there. */
export function citationProblems(s: SourceRef): string[] {
  const out: string[] = [];
  if (s.kind !== "Shared" || !s.filename || !s.page) return [`${s.id}: not a shared page citation`];
  if (!existsSync(resolve(LIBRARY, s.filename))) out.push(`${s.id}: no file ${s.filename}`);
  const page = transcriptPage(s.filename, s.page);
  if (page === null) return [...out, `${s.id}: no transcript page ${s.filename} p.${s.page}`];
  if (s.highlight && !plainRuns(page).some((r) => norm(r).includes(norm(s.highlight!)))) {
    out.push(`${s.id}: highlight not found as plain text on ${s.filename} p.${s.page}: "${s.highlight}"`);
  }
  return out;
}
