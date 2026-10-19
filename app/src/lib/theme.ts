import { useSyncExternalStore } from "react";

/** Dark is the default. The choice is a per-viewer convenience kept in the browser; index.html applies it before the
 * first paint so there is no flash, and this module keeps <html data-theme> and storage in step afterwards. */
export type Theme = "dark" | "light";
export const THEME_KEY = "studio-theme";

const listeners = new Set<() => void>();

const current = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

export function setTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* storage blocked: the theme still applies for this visit */
  }
  listeners.forEach((l) => l());
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
    () => "dark" as Theme,
  );
  return [theme, setTheme];
}
