import { useCallback, useEffect, useRef, useState } from "react";
import { api, ServiceRejected, ServiceUnavailable } from "./api";
import { GENERAL_ID, useStore } from "./store";
import type { PersonalFile } from "../types";

/** What the upload pipeline reads: documents, scans and photos. */
export const ACCEPTED_FILES = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.webp";
const POLL_MS = 400;

export type FileRead =
  | { state: "reading"; filename: string; progress: number; total: number }
  | { state: "read"; file: PersonalFile }
  | { state: "failed"; filename: string; error: string };

const reason = (e: unknown) => (e instanceof ServiceRejected || e instanceof ServiceUnavailable ? e.message : "It could not be read.");

/**
 * One file through the ordinary upload pipeline (parsed and OCR'd like any upload, saved in Your files), and whether
 * it has been read yet. `fileId` is set once it is, for a request that bases an exam, a quiz or a path on it.
 */
export function useFileRead() {
  const { refreshFiles } = useStore();
  const [reading, setReading] = useState<FileRead | null>(null);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  const addFile = useCallback(
    async (file: File) => {
      setReading({ state: "reading", filename: file.name, progress: 0, total: 0 });
      try {
        let job = await api.uploadFile(file, GENERAL_ID);
        while (alive.current && job.status !== "ready" && job.status !== "failed") {
          await new Promise((r) => setTimeout(r, POLL_MS));
          job = await api.uploadStatus(job.uploadId);
          if (alive.current) setReading({ state: "reading", filename: file.name, progress: job.progress, total: job.total });
        }
        if (!alive.current) return;
        if (job.status === "failed" || !job.file) {
          setReading({ state: "failed", filename: file.name, error: job.error ?? "It could not be read." });
          return;
        }
        await refreshFiles().catch(() => {});
        if (alive.current) setReading({ state: "read", file: job.file });
      } catch (e) {
        if (alive.current) setReading({ state: "failed", filename: file.name, error: reason(e) });
      }
    },
    [refreshFiles],
  );
  const reset = useCallback(() => setReading(null), []);

  return { reading, addFile, reset, fileId: reading?.state === "read" ? reading.file.id : null };
}
