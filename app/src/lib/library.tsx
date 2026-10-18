import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type LibraryStatus } from "./api";

interface LibraryCtx {
  status: LibraryStatus | null;
  /** Ask the update server now. Resolves to the new status. */
  check: () => Promise<LibraryStatus | null>;
  /** Install the newer course materials; progress shows up in `status`. */
  update: () => Promise<void>;
  /** True when a newer version is available and the learner has not said "later" for it. */
  showBanner: boolean;
  later: () => void;
  dismissUpdated: () => void;
  checking: boolean;
}

const Ctx = createContext<LibraryCtx | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LibraryStatus | null>(null);
  const [laterFor, setLaterFor] = useState<number | null>(null);
  const [updatedSeen, setUpdatedSeen] = useState(false);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.libraryStatus());
    } catch {
      /* the main data load already explains when the service is unreachable */
    }
  }, []);

  // The service looks for updates by itself when it starts; pick up its answer shortly after the app opens.
  useEffect(() => {
    void refresh();
    const timers = [1500, 5000, 12000].map((ms) => setTimeout(() => void refresh(), ms));
    return () => timers.forEach(clearTimeout);
  }, [refresh]);

  const busy = status?.state === "downloading" || status?.state === "checking";
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => void refresh(), 700);
    return () => clearInterval(t);
  }, [busy, refresh]);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const s = await api.libraryCheck();
      setStatus(s);
      return s;
    } catch {
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const update = useCallback(async () => {
    setUpdatedSeen(false);
    try {
      setStatus(await api.libraryUpdate());
    } catch {
      /* the next refresh shows the outcome */
    }
  }, []);

  const value = useMemo<LibraryCtx>(
    () => ({
      status,
      check,
      update,
      checking,
      showBanner: !!status?.available && status.available.version !== laterFor,
      later: () => setLaterFor(status?.available?.version ?? null),
      dismissUpdated: () => setUpdatedSeen(true),
    }),
    [status, check, update, checking, laterFor],
  );

  // "Just updated" is a one-time message per update.
  const ctx = { ...value, status: status && updatedSeen ? { ...status, justUpdated: false } : status };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useLibrary() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLibrary outside LibraryProvider");
  return c;
}

export const megabytes = (bytes: number) => (bytes < 100 * 1024 ? "under 0.1 MB" : `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`);
