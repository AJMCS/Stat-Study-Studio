import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type AiInfo, type ProviderId } from "./api";

/**
 * Whether an AI service is connected. Everything that needs a model (the tutor, rubric scoring, generated exam
 * questions, better handwriting transcription) checks this and otherwise says what it needs, so the app is fully
 * usable without one.
 */
export interface AiStatus {
  connected: boolean;
  /** Kept for callers that word messages differently before AI could be connected; connecting is possible now. */
  comingSoon: false;
  info: AiInfo | null;
  refresh: () => Promise<void>;
  connect: (apiKey: string, accept: boolean, model?: string, provider?: ProviderId) => Promise<void>;
  disconnect: () => Promise<void>;
  setModel: (model: string) => Promise<void>;
  test: () => Promise<void>;
}

const Ctx = createContext<AiStatus | null>(null);

export function AiProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<AiInfo | null>(null);

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
      connect: async (apiKey, accept, model, provider) => setInfo(await api.aiConnect(apiKey, accept, model, provider)),
      disconnect: async () => setInfo(await api.aiDisconnect()),
      setModel: async (model) => setInfo(await api.aiSetModel(model)),
      test: async () => setInfo(await api.aiTest()),
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
