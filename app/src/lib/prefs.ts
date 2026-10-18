import { useSyncExternalStore } from "react";

/** Small per-viewer conveniences kept in the browser (never needed for correctness, safe if storage is blocked). */
function makeBoolPref(key: string, fallback: boolean) {
  const listeners = new Set<() => void>();
  let cache: boolean | null = null;

  const read = (): boolean => {
    if (cache !== null) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw === null ? fallback : raw === "true";
    } catch {
      cache = fallback;
    }
    return cache;
  };

  const write = (value: boolean) => {
    cache = value;
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* keep the in-memory value */
    }
    listeners.forEach((l) => l());
  };

  return () =>
    [
      useSyncExternalStore(
        (cb) => {
          listeners.add(cb);
          return () => listeners.delete(cb);
        },
        read,
      ),
      write,
    ] as const;
}

/** Whether progress includes self-scored attempts (scored by the learner, not by a model). On by default. */
export const useIncludeSelfScored = makeBoolPref("stats132-include-self-scored", true);
