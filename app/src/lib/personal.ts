import { get, set, del } from "idb-keyval";
import type { PersonalFile, SourceRef } from "../types";

/**
 * On-device personal materials. Original bytes and extracted chunks live in IndexedDB only.
 * Real PDF/Word/OCR extraction arrives with the backend phase; here .txt is parsed for real and the
 * other accepted types are validated by extension and stored with a placeholder extraction.
 */

export const ACCEPTED = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"];
const IMAGE = /\.(png|jpe?g|tiff?|bmp|webp)$/i;

export interface Chunk {
  page: number;
  text: string;
}

export interface ParseResult {
  ok: boolean;
  reason?: string;
  chunks?: Chunk[];
  pages?: number;
  ocr?: boolean;
  ocrConfidence?: number;
}

export async function parseUpload(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  if (!ACCEPTED.some((e) => name.endsWith(e))) {
    return {
      ok: false,
      reason: `"${file.name}" is not a supported type. Upload PDF, Word (.doc/.docx), .txt, or an image (PNG, JPG, TIFF, BMP, WebP).`,
    };
  }
  if (file.size === 0) return { ok: false, reason: `"${file.name}" is empty, so there is nothing to index.` };

  if (name.endsWith(".txt")) {
    const text = (await file.text()).trim();
    if (!text) return { ok: false, reason: `"${file.name}" has no readable text.` };
    const chunks = text
      .split(/\n{2,}/)
      .filter((p) => p.trim())
      .map((p, i) => ({ page: Math.floor(i / 6) + 1, text: p.trim() }));
    return { ok: true, chunks, pages: chunks[chunks.length - 1].page, ocr: false };
  }

  if (IMAGE.test(name)) {
    // Placeholder OCR: the real engine reports a confidence we surface as a warning when low.
    return {
      ok: true,
      chunks: [{ page: 1, text: `[OCR placeholder for ${file.name}] Extracted text will appear here once OCR is connected.` }],
      pages: 1,
      ocr: true,
      ocrConfidence: 0.55,
    };
  }

  return {
    ok: true,
    chunks: [{ page: 1, text: `[Extraction placeholder for ${file.name}] Text extraction is connected in the backend phase.` }],
    pages: 1,
    ocr: false,
  };
}

const chunkKey = (fileId: string) => `chunks:${fileId}`;
const blobKey = (fileId: string) => `blob:${fileId}`;

export async function storeFile(id: string, file: File, chunks: Chunk[]) {
  await set(chunkKey(id), chunks);
  await set(blobKey(id), file);
}

export async function removeIndexed(id: string) {
  await del(chunkKey(id));
}

export async function getBlob(id: string): Promise<File | undefined> {
  return get(blobKey(id));
}

const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);

/** Keyword scoring stand-in for the vector index. Skips removed, superseded, and broken-link files. */
export async function searchPersonal(
  query: string,
  files: PersonalFile[],
  collectionNames: Record<string, string>,
  allowedCollections: Set<string>,
): Promise<SourceRef[]> {
  const q = new Set(tokens(query));
  const superseded = new Set(files.map((f) => f.supersedes).filter(Boolean) as string[]);
  const live = files.filter((f) => !f.removed && !f.linkBroken && !superseded.has(f.id) && allowedCollections.has(f.collectionId));
  const out: (SourceRef & { score: number })[] = [];
  for (const f of live) {
    const chunks: Chunk[] = (await get(chunkKey(f.id))) ?? [];
    for (const c of chunks) {
      const score = tokens(c.text).filter((t) => q.has(t)).length;
      if (score > 0) {
        out.push({
          id: `${f.id}-${c.page}-${out.length}`,
          kind: "Personal",
          title: f.filename,
          collection: collectionNames[f.collectionId],
          filename: f.filename,
          page: c.page,
          version: f.version,
          uploadedAt: f.uploadedAt,
          excerpt: c.text,
          ocr: f.ocr,
          ocrConfidence: f.ocrConfidence,
          score,
        });
      }
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}
