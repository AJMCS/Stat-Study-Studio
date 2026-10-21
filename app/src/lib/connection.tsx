import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { healthProbe, serviceEvents } from "./api";
import { useStore } from "./store";
import { useAi } from "./ai";

/**
 * Watches the local study service. The app is a page in the browser talking to a small program on this computer;
 * if that program is closed (its window shut, the computer slept) the page keeps everything the learner was doing
 * and says so, keeps checking, and when the program is started again it reconnects on its own, retries anything
 * that could not be saved and refreshes the AI status. A page cannot start the program itself.
 *
 * One failed request is not proof: a request can be cancelled by a navigation or blocked on its own. A failure only
 * triggers a health probe, and the service counts as lost when the probe gets no answer either.
 */
export type LinkState = "ok" | "lost" | "restored";

export interface Connection {
  state: LinkState;
  /** When the service was last seen to vanish, for the message. */
  lostAt: number | null;
  checking: boolean;
  /** Probe right now; true when the service answered. */
  reconnect: () => Promise<boolean>;
}

const Ctx = createContext<Connection | null>(null);
const PROBE_OK = 20_000; // a quiet heartbeat while everything works
const PROBE_LOST = 3_000; // eager while it is gone, so the page picks the service up as soon as it is back
const RESTORED_FOR = 5_000;

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { retrySave } = useStore();
  const ai = useAi();
  const [state, setState] = useState<LinkState>("ok");
  const [lostAt, setLostAt] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const current = useRef(state);
  current.current = state;
  const probing = useRef<Promise<boolean> | null>(null);
  const restoredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ retrySave, refreshAi: ai.refresh });
  latest.current = { retrySave, refreshAi: ai.refresh };

  const markLost = useCallback(() => {
    if (current.current === "lost") return;
    setState("lost");
    setLostAt(Date.now());
  }, []);

  const markOk = useCallback(() => {
    if (current.current !== "lost") return;
    setState("restored");
    latest.current.retrySave();
    void latest.current.refreshAi();
    if (restoredTimer.current) clearTimeout(restoredTimer.current);
    restoredTimer.current = setTimeout(() => setState((s) => (s === "restored" ? "ok" : s)), RESTORED_FOR);
  }, []);

  /** One probe at a time; its answer settles the state. */
  const probe = useCallback(async () => {
    if (probing.current) return probing.current;
    const run = healthProbe()
      .then((ok) => {
        if (ok) markOk();
        else markLost();
        return ok;
      })
      .finally(() => {
        probing.current = null;
      });
    probing.current = run;
    return run;
  }, [markLost, markOk]);

  // every call reports: an answer means the service is there; a failure is checked with a probe before it counts
  useEffect(() => serviceEvents.on((ok) => (ok ? markOk() : void probe())), [markOk, probe]);

  useEffect(() => {
    const t = setInterval(() => void probe(), state === "lost" ? PROBE_LOST : PROBE_OK);
    return () => clearInterval(t);
  }, [state, probe]);

  useEffect(
    () => () => {
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
    },
    [],
  );

  const reconnect = useCallback(async () => {
    setChecking(true);
    try {
      return await probe();
    } finally {
      setChecking(false);
    }
  }, [probe]);

  const value = useMemo<Connection>(() => ({ state, lostAt, checking, reconnect }), [state, lostAt, checking, reconnect]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConnection(): Connection {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConnection must be used inside ConnectionProvider");
  return v;
}
