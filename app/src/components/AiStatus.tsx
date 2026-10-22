import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAi } from "../lib/ai";
import type { ProviderId } from "../lib/api";

const WHERE: Record<ProviderId, string> = { gemini: "Google", anthropic: "Anthropic", openai: "OpenAI", ollama: "local" };

/**
 * The small chip fixed in the bottom corner that says which model the AI features use right now ("AI · nemotron",
 * or "AI · off"; where it runs is in the tooltip and the menu's header), and opens a menu of the saved services so
 * the learner can switch between them without going to Settings. It also asks a local model to warm up whenever a topic
 * or a custom path is opened, so the first question does not wait for the model to load, and shows "loading" until it is
 * ready.
 */
export function AiStatus() {
  const ai = useAi();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const info = ai.info;
  const local = !!info?.connected && info.local;
  const warmState = info?.warm?.state;

  // A topic page (tutorial, checks, breakdown, quiz, exam, tutor) and the custom-path pages (building one, following
  // one) are where the AI gets used: load the local model now.
  useEffect(() => {
    if (local && (pathname.startsWith("/topic/") || pathname.startsWith("/paths/"))) void ai.warm();
  }, [local, pathname, ai]);

  // While the local model loads, poll until it reports ready (or failed), so the chip's "loading" goes away.
  useEffect(() => {
    if (warmState !== "loading") return;
    const t = setInterval(() => void ai.refresh(), 2000);
    return () => clearInterval(t);
  }, [warmState, ai]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!info) return null;
  const active = info.accounts.find((a) => a.active);
  // the chip names only the model, so it stays inside the page's right gutter; the provider is in the menu's header
  // and in the chip's tooltip
  const label = active ? active.model || active.name : "off";
  const where = active ? WHERE[active.id] : "";
  const tip = active ? `AI: ${label} (${where}). Click to switch.` : "No AI service is connected. Click to connect one.";

  const switchTo = async (id: ProviderId) => {
    setBusy(true);
    try {
      await ai.switchTo(id);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-status" ref={box}>
      {open && (
        <div className="ai-menu" role="menu" aria-label="AI service">
          <p className="eyebrow">{"// AI service"}{where ? ` · ${where}` : ""}</p>
          {info.accounts.length === 0 && <p className="muted">None connected. Everything works without one.</p>}
          {info.accounts.map((a) => (
            <button key={a.id} type="button" role="menuitemradio" aria-checked={a.active} className="ai-menu-item" disabled={busy || a.active} onClick={() => void switchTo(a.id)}>
              <span className="ai-menu-check" aria-hidden="true">{a.active ? "✓" : ""}</span>
              <span>
                <b>{a.model || a.name}</b> <span className="muted">· {a.local ? "on this computer" : a.name}</span>
              </span>
            </button>
          ))}
          <Link to="/settings" role="menuitem" className="ai-menu-link" onClick={() => setOpen(false)}>
            {info.accounts.length ? "Add or change a service" : "Connect a service in Settings"}
          </Link>
        </div>
      )}
      <button type="button" className="ai-chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} title={tip}>
        {"// AI · "}
        {label}
        {warmState === "loading" ? " · loading…" : ""}
      </button>
    </div>
  );
}
