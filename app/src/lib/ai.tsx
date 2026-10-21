import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, type AiInfo, type ProviderId } from "./api";

/**
 * Whether an AI service is connected. Everything that needs a model (the tutor, rubric scoring, generated exam
 * questions, better handwriting transcription) checks this and otherwise says what it needs, so the app is fully
 * usable without one. Several services can be saved at once; `switchTo` changes which one is in use.
 */
export interface AiStatus {
  connected: boolean;
  /** Kept for callers that word messages differently before AI could be connected; connecting is possible now. */
  comingSoon: false;
  info: AiInfo | null;
  refresh: () => Promise<void>;
  connect: (apiKey: string, accept: boolean, model?: string, provider?: ProviderId, workspace?: string) => Promise<void>;
  /** Forget one saved service (the given one, or the one in use). The others stay saved. */
  disconnect: (provider?: ProviderId) => Promise<void>;
  /** Make another saved service the one in use; no key needed. */
  switchTo: (provider: ProviderId) => Promise<void>;
  setModel: (model: string) => Promise<void>;
  test: () => Promise<void>;
  /** Ask a local model to load now, so the first question does not wait for it. Harmless for hosted services. */
  warm: () => Promise<void>;
}

const Ctx = createContext<AiStatus | null>(null);
const WARM_AGAIN_AFTER = 5 * 60 * 1000;

export function AiProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<AiInfo | null>(null);
  const warmed = useRef<{ model: string; at: number } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setInfo(await api.aiStatus());
    } catch {
      /* the main data load already explains when the service is unreachable */
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AiStatus>(
    () => ({
      connected: info?.connected ?? false,
      comingSoon: false,
      info,
      refresh,
      connect: async (apiKey, accept, model, provider, workspace) => setInfo(await api.aiConnect(apiKey, accept, model, provider, workspace)),
      disconnect: async (provider) => setInfo(await api.aiDisconnect(provider)),
      switchTo: async (provider) => {
        warmed.current = null;
        setInfo(await api.aiSwitch(provider));
      },
      setModel: async (model) => setInfo(await api.aiSetModel(model)),
      test: async () => setInfo(await api.aiTest()),
      warm: async () => {
        if (!info?.connected || !info.local) return;
        const last = warmed.current;
        if (last && last.model === info.model && Date.now() - last.at < WARM_AGAIN_AFTER && info.warm?.state !== "failed") return;
        warmed.current = { model: info.model, at: Date.now() };
        try {
          const r = await api.aiWarm();
          if (r.warming) await refresh(); // so the chip shows "loading" until the model is ready
        } catch {
          /* a warm-up that fails is not worth a message: the first real request explains any problem */
        }
      },
    }),
    [info, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAi(): AiStatus {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAi must be used inside AiProvider");
  return v;
}
