import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, hitToSource, personalHitToSource, ServiceRejected, type AskTurn } from "../lib/api";
import { useAi } from "../lib/ai";
import { RichText } from "./Math";
import { Citations } from "./Citation";
import type { SourceRef } from "../types";

/** The document a question is about: a shared course file by its library path, or one of the learner's files. */
export interface AskDoc {
  source?: string;
  fileId?: string;
  title: string;
}

interface Msg extends AskTurn {
  /** The page in view when this was asked, so a later question on another page is marked. */
  page: number;
  sources?: SourceRef[];
}

/**
 * A conversation about the page in view: what a passage means, why a step holds, how it ties to the rest of the
 * course. Each answer is grounded in that page and the course library and cites its pages. A different document
 * starts a new conversation; a different page of the same one carries on, marked on the question.
 */
export function AskPanel({ doc, page, pages }: { doc: AskDoc; page: number; pages?: number }) {
  const ai = useAi();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const key = doc.source ?? doc.fileId ?? "";

  useEffect(() => {
    setMsgs([]);
    setError("");
  }, [key]);
  useEffect(() => {
    if (msgs.length) endRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [msgs.length]);

  /** Send the question with the conversation so far. Nothing changes on screen unless the answer arrives, so a
   * failure never loses what was typed. */
  const send = async () => {
    const question = text.trim();
    if (!question || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await api.aiAsk({ question, source: doc.source, fileId: doc.fileId, page, history: msgs.map((m) => ({ role: m.role, text: m.text })) });
      const sources = r.sources.map((h) => (h.scope === "shared" ? hitToSource(h) : personalHitToSource(h)));
      setMsgs((m) => [...m, { role: "learner", text: question, page }, { role: "guide", text: r.text, page, sources }]);
      setText("");
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : "Couldn't reach the study service. Your question is still in the box.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ask" aria-label="Ask about this page">
      <p className="eyebrow">{"// Ask about this page"}</p>
      {!ai.connected ? (
        <p className="notice warn-box" role="status">
          Asking about a page needs an AI service. <Link to="/settings">Connect one in Settings</Link>; reading works without one.
        </p>
      ) : (
        <>
          <p className="muted small">
            What a passage means, why a step holds, how it ties to another lecture. Answers rest on page <span className="mono">{page}</span>
            {pages ? <> of <span className="mono">{pages}</span></> : null} and the course library, and cite their pages.
          </p>
          <div className="chat ask-chat">
            {msgs.map((m, i) => {
              const earlier = msgs.slice(0, i).reverse().find((x) => x.role === "learner");
              const moved = m.role === "learner" && !!earlier && earlier.page !== m.page;
              return (
                <div key={i} className={`bubble ${m.role === "learner" ? "learner" : "tutor"}`}>
                  <b className="sr-only">{m.role === "learner" ? "You: " : "Guide: "}</b>
                  {moved && <p className="eyebrow">{"// page "}{m.page}</p>}
                  <RichText text={m.text} />
                  {m.sources && m.sources.length > 0 && <Citations sources={m.sources} />}
                </div>
              );
            })}
            {busy && <div className="bubble tutor muted">Reading the page…</div>}
            <div ref={endRef} />
          </div>
          <form
            className="ask-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="field grow">
              <span className="sr-only">Your question about this page</span>
              <textarea
                aria-label="Your question about this page"
                rows={2}
                value={text}
                disabled={busy}
                placeholder="e.g. What does the second formula mean?"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
            </label>
            <button type="submit" disabled={busy || !text.trim()}>{busy ? "Thinking…" : error ? "Try again" : "Ask"}</button>
          </form>
          {error && <p className="notice warn-box" role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}
