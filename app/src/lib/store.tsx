import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { del as idbDel, clear as idbClear } from "idb-keyval";
import type { AppData, Attempt, CriterionScores, ExamRecord, QuizResult, SessionInfo } from "../types";
import { applyRecall, composite, DEFAULT_CONFIG } from "./scoring";

const KEY = "stats132-studio-v1";

export const GENERAL_ID = "general";

const initial = (): AppData => ({
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
});

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch {
    /* fall through to a fresh state */
  }
  return initial();
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface Store {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  setSession: (s: SessionInfo | null) => void;
  /** Record a scored explanation. `counted` false = retry/practice, excluded from analytics. */
  recordAttempt: (a: Omit<Attempt, "id" | "at" | "composite"> & { criteria: CriterionScores }) => Attempt;
  deleteAttempt: (id: string) => void;
  saveQuiz: (q: QuizResult) => void;
  saveExam: (e: ExamRecord) => void;
  exportData: () => string;
  deleteAll: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable; keep working in memory */
    }
  }, [data]);

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
              ? { ...d.topicState, [a.topicId]: applyRecall(d.topicState[a.topicId], attempt.at, a.criteria, d.config) }
              : d.topicState,
        }));
        return attempt;
      },
      deleteAttempt: (id) => update((d) => ({ ...d, attempts: d.attempts.filter((a) => a.id !== id) })),
      saveQuiz: (q) => update((d) => ({ ...d, quizzes: [q, ...d.quizzes] })),
      saveExam: (e) => update((d) => ({ ...d, exams: [e, ...d.exams] })),
      exportData: () => JSON.stringify(data, null, 2),
      deleteAll: async () => {
        await idbClear();
        localStorage.removeItem(KEY);
        setData(initial());
      },
    }),
    [data, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

export { idbDel };
