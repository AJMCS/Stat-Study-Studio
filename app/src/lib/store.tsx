import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clear as idbClear } from "idb-keyval";
import type { AppData, Attempt, CriterionScores, ExamRecord, QuizResult, SessionInfo } from "../types";
import { applyRecall, composite, DEFAULT_CONFIG } from "./scoring";
import { api, ServiceRejected, ServiceUnavailable, type Slice } from "./api";

/** Browser-storage key used before the local service existed. Read once, then moved into the service. */
const LEGACY_KEY = "stats132-studio-v1";
const LEGACY_BACKUP_KEY = "stats132-studio-v1-backup-before-service";

export const GENERAL_ID = "general";

// `files` is deliberately not here: the service owns uploaded files and the app only reads them.
const SLICES: Slice[] = ["attempts", "quizzes", "exams", "topicState", "session", "collections", "config", "hostedDisclosureAck", "chats", "onboarding", "learning", "paths"];
const SAVE_DELAY_MS = 150;

const empty = (): AppData => ({
  attempts: [],
  quizzes: [],
  exams: [],
  topicState: {},
  session: null,
  collections: [{ id: GENERAL_ID, name: "General", consent: false, searchByDefault: true }],
  files: [],
  config: DEFAULT_CONFIG,
  hostedDisclosureAck: false,
  chats: {},
  onboarding: { done: false },
  learning: { vocab: {}, checks: {}, breakdowns: {} },
  paths: { items: [] },
});

/** Fill anything the service left empty so pages can rely on a complete AppData. */
function complete(partial: Partial<AppData>): AppData {
  const base = empty();
  return {
    ...base,
    ...partial,
    config: partial.config ?? base.config,
    collections: partial.collections?.length ? partial.collections : base.collections,
    chats: partial.chats ?? base.chats,
    hostedDisclosureAck: partial.hostedDisclosureAck ?? base.hostedDisclosureAck,
    session: partial.session ?? null,
    onboarding: partial.onboarding ?? base.onboarding,
    learning: { ...base.learning, ...partial.learning },
    paths: partial.paths?.items ? partial.paths : base.paths,
  };
}

function readLegacy(): Partial<AppData> | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const out: Record<string, unknown> = {};
    for (const k of SLICES) if (k in parsed) out[k] = parsed[k];
    return out as Partial<AppData>;
  } catch {
    return null;
  }
}

function retireLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) localStorage.setItem(LEGACY_BACKUP_KEY, raw);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage unavailable; nothing to retire */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

type Status = { kind: "loading" } | { kind: "ready" } | { kind: "offline"; message: string };

interface Store {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  setSession: (s: SessionInfo | null) => void;
  /** Record a scored explanation. `counted` false = retry/practice, excluded from analytics. */
  recordAttempt: (a: Omit<Attempt, "id" | "at" | "composite"> & { criteria: CriterionScores }) => Attempt;
  deleteAttempt: (id: string) => void;
  saveQuiz: (q: QuizResult) => void;
  saveExam: (e: ExamRecord) => void;
  /** Reload the list of uploaded files from the service (after an upload, replace, remove or reconnect). */
  refreshFiles: () => Promise<void>;
  exportData: () => Promise<string>;
  deleteAll: () => Promise<void>;
  /** Set when the last attempt to save failed. Cleared by a successful save or `retrySave`. */
  saveError: string | null;
  retrySave: () => void;
  /** One-time messages, for example about moving old browser data into the service. */
  notice: string | null;
  dismissNotice: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(empty);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** What the service is known to hold, per slice. A slice is saved when its object identity changes. */
  const saved = useRef<AppData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef(data);
  latest.current = data;

  const load = useCallback(async () => {
    setStatus({ kind: "loading" });
    try {
      let { initialized, state } = await api.getState();
      if (!initialized) {
        const legacy = readLegacy();
        if (legacy && (legacy.attempts?.length || legacy.exams?.length || legacy.quizzes?.length || legacy.files?.length)) {
          try {
            await api.importState(legacy);
            retireLegacy();
            ({ state } = await api.getState());
            setNotice("Your earlier study progress was moved into the study service on this device.");
          } catch (e) {
            const why = e instanceof ServiceRejected ? e.message : "an unexpected problem";
            setNotice(`We couldn't move your earlier study progress (${why}). It is still in this browser and nothing was deleted.`);
          }
        }
      }
      const full = complete(state);
      saved.current = full;
      setData(full);
      setStatus({ kind: "ready" });
    } catch (e) {
      setStatus({ kind: "offline", message: e instanceof ServiceUnavailable ? e.message : "Could not load your study data." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Send every slice that changed since the last successful save, one at a time and in order. */
  const flush = useCallback(() => {
    queue.current = queue.current.then(async () => {
      const base = saved.current;
      if (!base) return;
      const next = latest.current;
      const changed = SLICES.filter((k) => next[k] !== base[k]);
      for (const k of changed) {
        try {
          await api.putSlice(k, next[k]);
          saved.current = { ...(saved.current as AppData), [k]: next[k] };
        } catch (e) {
          setSaveError(e instanceof ServiceRejected ? e.message : "Your latest changes could not be saved. Is the study app still running?");
          return;
        }
      }
      setSaveError(null);
    });
  }, []);

  useEffect(() => {
    if (status.kind !== "ready" || !saved.current) return;
    if (SLICES.every((k) => data[k] === saved.current![k])) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, status.kind, flush]);

  // Don't lose the last edit if the tab is closed right after it.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const store = useMemo<Store>(
    () => ({
      data,
      update,
      setSession: (session) => update((d) => ({ ...d, session })),
      recordAttempt: (a) => {
        const attempt: Attempt = {
          ...a,
          id: uid(),
          at: new Date().toISOString(),
          composite: composite(a.criteria, data.config),
        };
        update((d) => ({
          ...d,
          attempts: [...d.attempts, attempt],
          // Only recall (revisit) attempts drive the retention streak.
          topicState:
            a.kind === "recall"
              ? { ...d.topicState, [a.topicId]: applyRecall(d.topicState[a.topicId], attempt.at, a.criteria, d.config, !!a.selfScored) }
              : d.topicState,
        }));
        return attempt;
      },
      deleteAttempt: (id) => update((d) => ({ ...d, attempts: d.attempts.filter((a) => a.id !== id) })),
      saveQuiz: (q) => update((d) => ({ ...d, quizzes: [q, ...d.quizzes] })),
      saveExam: (e) => update((d) => ({ ...d, exams: [e, ...d.exams] })),
      refreshFiles: async () => {
        const files = await api.listFiles();
        if (saved.current) saved.current = { ...saved.current, files };
        setData((d) => ({ ...d, files }));
      },
      exportData: () => api.exportText(),
      deleteAll: async () => {
        await api.deleteAll();
        try {
          await idbClear();
          localStorage.removeItem(LEGACY_KEY);
          localStorage.removeItem(LEGACY_BACKUP_KEY);
        } catch {
          /* browser storage unavailable */
        }
        const { state } = await api.getState();
        const full = complete(state);
        saved.current = full;
        setData(full);
      },
      saveError,
      retrySave: flush,
      notice,
      dismissNotice: () => setNotice(null),
    }),
    [data, update, saveError, notice, flush],
  );

  if (status.kind === "loading") return <p className="gate" role="status">Loading your study data…</p>;
  if (status.kind === "offline") {
    return (
      <div className="gate" role="alert">
        <h1>Can't reach the study service</h1>
        <p>{status.message} The app saves your progress to a service that runs on this computer. If you closed its window, open the Stats 132 Study Studio app again, then try below.</p>
        <button onClick={() => void load()}>Try again</button>
      </div>
    );
  }
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
