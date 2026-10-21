import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, ServiceRejected, type AiInfo, type ProviderId, type Workspace } from "../lib/api";
import { useAi } from "../lib/ai";
import { Note } from "./Hand";

/** Where to get a key for each online service. */
export const KEY_PAGES: Record<Exclude<ProviderId, "ollama">, { url: string; label: string }> = {
  gemini: { url: "https://aistudio.google.com/apikey", label: "aistudio.google.com/apikey" },
  anthropic: { url: "https://console.anthropic.com/settings/keys", label: "console.anthropic.com/settings/keys" },
  openai: { url: "https://platform.openai.com/api-keys", label: "platform.openai.com/api-keys" },
};

/** One line on cost and privacy for each choice, used next to its radio button. */
export const BLURB: Record<ProviderId, string> = {
  gemini: "Online with your own key; the free tier is the easiest start.",
  anthropic: "Online with your own API key; pay per use.",
  openai: "Online with your own API key; pay per use.",
  ollama: "Runs on this computer; nothing leaves it, works offline.",
};

export const SERVICE_UNREACHABLE = "Couldn't reach the study service. Check that it is still running, then try again.";

/**
 * Connecting one AI service: the steps to get a key (or, for Ollama, a model on this computer), the key field, the
 * service's own data notice with the required consent box, and Connect, which checks the key with the service before
 * anything is kept. Used by Settings and by first-run setup, so both say and do exactly the same thing.
 */
const PLAIN_NAME: Record<ProviderId, string> = { gemini: "Google Gemini", anthropic: "Anthropic Claude", openai: "OpenAI", ollama: "Ollama" };

/** Two-line versions of each service's data notice, for first-run setup; the full notice is one click away. */
const SUMMARY: Record<ProviderId, string> = {
  gemini: "Your typed answers and a few matching course excerpts go to Google; on the free tier Google may use them to improve its products. Your key stays on this computer.",
  anthropic: "Your typed answers and a few matching course excerpts go to Anthropic, using your API credit. Your key stays on this computer.",
  openai: "Your typed answers and a few matching course excerpts go to OpenAI, using your API credit. Your key stays on this computer.",
  ollama: "Your typed answers and course excerpts go only to Ollama on this computer; nothing is sent over the internet.",
};

export function AiConnect({
  provider,
  onConnected,
  headingLevel = 3,
  compact = false,
  connectSlot = null,
}: {
  provider: ProviderId;
  onConnected?: () => void;
  headingLevel?: 3 | 4;
  /** First-run setup: short steps and a two-line consent summary, so the whole step fits on one screen. */
  compact?: boolean;
  /** Where to draw the Connect button instead of under the form (first-run setup puts it in the dialog's footer). */
  connectSlot?: HTMLElement | null;
}) {
  const ai = useAi();
  const info = ai.info;
  const [preview, setPreview] = useState<AiInfo | null>(null);
  const [key, setKey] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState<{ running: boolean; models: string[] } | null>(null);
  const [localModel, setLocalModel] = useState("");
  // Anthropic: a key made for every workspace of the organisation must say which one to use. After the first Connect
  // the service either lists them (the learner picks one) or, when the account may not list them, asks for the ID to
  // be pasted. The key stays in its field meanwhile; Connect sends it again with the workspace.
  const [ask, setAsk] = useState<{ kind: "choose"; list: Workspace[] } | { kind: "paste" } | null>(null);
  const [workspace, setWorkspace] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const clearAsk = () => {
    setAsk(null);
    setWorkspace("");
    setWorkspaceError("");
  };

  // The notice shown must be the one for the service being set up, so fetch it when the choice changes.
  useEffect(() => {
    if (!info) return;
    setAccept(false);
    setError("");
    setAsk(null);
    setWorkspace("");
    setWorkspaceError("");
    if (provider === info.provider) {
      setPreview(info);
      return;
    }
    let live = true;
    api.aiStatus(provider).then((p) => live && setPreview(p)).catch(() => {});
    return () => {
      live = false;
    };
  }, [provider, info]);

  const findModels = async () => {
    try {
      const r = await api.aiLocalModels();
      setLocal(r);
      setLocalModel((m) => (r.models.includes(m) ? m : (r.models[0] ?? "")));
    } catch {
      setLocal({ running: false, models: [] });
    }
  };
  useEffect(() => {
    if (provider === "ollama") void findModels();
  }, [provider]);

  const keyField = useRef<HTMLInputElement>(null);
  const modelField = useRef<HTMLSelectElement>(null);
  const agreeBox = useRef<HTMLInputElement>(null);
  const workspaceField = useRef<HTMLInputElement>(null);
  const [missing, setMissing] = useState(false);

  const connect = async (apiKey: string, model?: string) => {
    // first-run setup keeps Connect clickable and says what is missing instead
    if (compact) {
      const lack =
        provider === "ollama"
          ? !model && { msg: "Choose a model first.", el: modelField.current }
          : !apiKey.trim() && { msg: "Paste your key first.", el: keyField.current };
      const why =
        lack ||
        (!accept && { msg: "Tick the box to agree first.", el: agreeBox.current }) ||
        (ask && !workspace.trim() && { msg: ask.kind === "choose" ? "Choose a workspace first." : "Paste the workspace ID first.", el: workspaceField.current });
      if (why) {
        setMissing(true);
        setError(why.msg);
        why.el?.focus();
        return;
      }
    }
    setBusy(true);
    setError("");
    setMissing(false);
    try {
      await ai.connect(apiKey, accept, model, provider, workspace.trim() || undefined);
      setKey("");
      clearAsk();
      onConnected?.();
    } catch (e) {
      if (e instanceof ServiceRejected && e.kind === "workspace_choice" && e.workspaces?.length) {
        setAsk({ kind: "choose", list: e.workspaces });
        setWorkspace("");
        setWorkspaceError("");
        return;
      }
      if (e instanceof ServiceRejected && e.kind === "workspace_needed") {
        setAsk({ kind: "paste" });
        setWorkspaceError("");
        return;
      }
      if (e instanceof ServiceRejected && e.kind === "workspace_invalid") {
        setAsk((a) => a ?? { kind: "paste" });
        setWorkspaceError(e.message);
        return;
      }
      let msg = e instanceof ServiceRejected ? e.message : SERVICE_UNREACHABLE;
      if (compact && e instanceof ServiceRejected && e.kind === "invalid_key") {
        msg = `The AI service did not accept your key. Check it's a ${PLAIN_NAME[provider]} key, copied in full.`;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };


  if (!info) return <p className="muted">Loading…</p>;

  const H = `h${headingLevel}` as const;
  const notice = preview?.notice ?? info.notice;
  const name = preview?.providerName ?? PLAIN_NAME[provider];
  const consent = (
    <label className="choice consent">
      <input ref={agreeBox} type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
      <span>I have read this and want to use {provider === "ollama" ? "a model on this computer" : compact ? name : "an AI service"}</span>
    </label>
  );
  // full form (Settings): the whole notice in a box with the consent inside it.
  // compact form (first-run setup): a two-line summary, the full notice one click away, then the consent.
  const noticeBox = compact ? (
    <div className="consent-block" data-testid="ai-notice">
      <p className="consent-summary">{SUMMARY[provider]}</p>
      <details className="full-notice">
        <summary>Read the full notice</summary>
        <p>{notice}</p>
      </details>
      {consent}
    </div>
  ) : (
    <div className="notice warn-box" data-testid="ai-notice">
      <H className="notice-title">What gets sent</H>
      <p>{notice}</p>
      {consent}
    </div>
  );
  // errors are worded and marked with "!", never another box
  const errorLine = error && (
    <p className="err-line" role="alert">
      <span className="warn" aria-hidden="true">!</span>
      <span className="err-text">{error}</span>
    </p>
  );
  // Anthropic: the workspace question, between the notice and Connect (where the eye is after clicking Connect).
  const workspaceAsk = ask && (
    <div className="workspace-ask" data-testid="workspace-ask">
      {ask.kind === "choose" ? (
        <>
          <p className="prompt" id="workspace-q">
            This key can work in several workspaces. Which one should the app use?
          </p>
          <fieldset aria-labelledby="workspace-q">
            {ask.list.map((w) => (
              <label key={w.id} className="choice opt-row">
                <input
                  type="radio"
                  name="workspace"
                  value={w.id}
                  checked={workspace === w.id}
                  onChange={() => {
                    setWorkspace(w.id);
                    setWorkspaceError("");
                  }}
                />
                <span className="opt">
                  <b>{w.name}</b>
                  <span className="opt-desc mono">{w.id}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </>
      ) : (
        <>
          <label className="field">
            <span className="field-label">Workspace ID</span>
            <input
              ref={workspaceField}
              aria-label="Workspace ID"
              className="mono"
              placeholder="wrkspc_…"
              autoComplete="off"
              spellCheck={false}
              value={workspace}
              onChange={(e) => {
                setWorkspace(e.target.value);
                setWorkspaceError("");
              }}
            />
          </label>
          <p className="muted ws-help">
            This key is not tied to one workspace. Paste the ID from the Console's Workspaces page (
            <a href="https://platform.claude.com/settings/workspaces" target="_blank" rel="noreferrer">platform.claude.com/settings/workspaces</a>, the ID column), or create a key scoped to a
            workspace at <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">platform.claude.com/settings/keys</a>.
          </p>
        </>
      )}
      {workspaceError && (
        <p className="err-line" role="alert">
          <span className="warn" aria-hidden="true">!</span>
          <span className="err-text">{workspaceError}</span>
        </p>
      )}
    </div>
  );
  const reopen =
    compact && error && !missing && provider !== "ollama" ? (
      <p className="err-help">
        <a href={KEY_PAGES[provider].url} target="_blank" rel="noreferrer">
          Open the key page again
        </a>
      </p>
    ) : null;
  const connectRow = (disabled: boolean, onClick: () => void) => {
    const button = (
      <button type="button" className="connect-btn" disabled={compact ? busy : disabled} onClick={onClick}>
        {busy ? "Checking…" : "Connect"}
      </button>
    );
    if (compact) {
      // the button lives in the footer (where Next was on the earlier steps); what went wrong stays here, by the field
      return (
        <>
          {connectSlot && createPortal(button, connectSlot)}
          {(errorLine || reopen) && (
            <div className="connect-row">
              {errorLine}
              {reopen}
            </div>
          )}
        </>
      );
    }
    return (
      <div className="connect-row">
        {button}
        {errorLine}
        {reopen}
      </div>
    );
  };
  const status = (
    <>
      {local && !local.running && (
        <p className="notice warn-box" role="status">
          Ollama does not seem to be running on this computer yet. Open the Ollama app, then check again.
        </p>
      )}
      {local?.running && local.models.length === 0 && (
        <p className="notice warn-box" role="status">
          Ollama is running but has no models yet. Install one, then check again.
        </p>
      )}
    </>
  );

  if (provider !== "ollama") {
    const page = KEY_PAGES[provider];
    return (
      <div className={`ai-connect${compact ? " compact" : ""}`}>
        {!compact && (
          <div className="ac-block">
            <ol className="key-steps">
              <li>
                Go to <a href={page.url} target="_blank" rel="noreferrer">{page.label}</a> and sign in.
              </li>
              <li>
                Choose <em>Create API key</em> and copy it.
              </li>
              <li>Paste it below. It is checked with {preview?.providerName ?? "the service"} first, then kept on this computer only.</li>
            </ol>
            {provider !== "gemini" && (
              <p className="muted">
                This uses your API credit, billed per use, so add a little credit on their site first. A Claude or ChatGPT chat subscription is separate and does not include
                API credit.
              </p>
            )}
            <p className="muted">Stuck? Ask any AI chatbot to walk you through it.</p>
          </div>
        )}
        <div className="ac-block">
          {info.keyStored && !info.consented && info.provider === provider && <p className="notice warn-box">The data notice changed since you last accepted it. Please read it again.</p>}
          <label className="field">
            <span className="field-label">
              API key
              {compact && <Note dir="left" className="field-note">stays on this computer</Note>}
            </span>
            <input
              ref={keyField}
              aria-label="API key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (ask) clearAsk(); // a different key may not need a workspace, or may need a different one
              }}
            />
          </label>
          {noticeBox}
          {workspaceAsk}
          {connectRow(busy || !key.trim() || !accept || (!!ask && !workspace.trim()), () => void connect(key))}
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-connect${compact ? " compact" : ""}`}>
      {!compact && (
        <div className="ac-block">
          <ol className="key-steps">
            <li>
              Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com/download</a> and open it.
            </li>
            <li>
              Install a model, for example by running <code>ollama pull llama3.2</code> in a terminal. Any chat model works; larger ones are better at scoring and slower.
            </li>
            <li>Come back here and choose the model below.</li>
          </ol>
          {status}
        </div>
      )}
      <div className="ac-block">
        {compact && status}
        <div className="row model-row">
          <label className="field grow">
            <span className="field-label">
              Model
              {compact && <Note dir="left" className="field-note">runs on this computer</Note>}
            </span>
            <select ref={modelField} aria-label="Ollama model" value={localModel} onChange={(e) => setLocalModel(e.target.value)} disabled={!local?.models.length}>
              {!local?.models.length && <option value="">No models found</option>}
              {local?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost" disabled={busy} onClick={() => void findModels()}>
            Check again
          </button>
        </div>
        {noticeBox}
        {connectRow(busy || !localModel || !accept, () => void connect("", localModel))}
      </div>
    </div>
  );
}

/** What a key is and how to get one (or, for Ollama, how to install it), for the first of the two setup steps. */
export function KeyGuide({ provider }: { provider: ProviderId }) {
  if (provider === "ollama") {
    return (
      <div className="key-guide">
        <p>Ollama runs an AI model on this computer, so there is no key and nothing to pay. It needs a fairly fast computer.</p>
        <ol className="key-steps">
          <li>
            Install it from <a href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com/download</a> and open it.
          </li>
          <li className="with-note">
            <span>
              In a terminal, run <code>ollama pull llama3.2</code>
            </span>
            <Note dir="left" className="steps-note">a few minutes</Note>
          </li>
        </ol>
        <p className="muted">Stuck? Ask any AI chatbot for help.</p>
      </div>
    );
  }
  const page = KEY_PAGES[provider];
  const who = { gemini: "Google Gemini", anthropic: "Anthropic", openai: "OpenAI" }[provider];
  const cost = {
    gemini: "It is free with a Google account.",
    anthropic: "It needs a little prepaid API credit; a Claude chat subscription does not include it.",
    openai: "It needs a little prepaid API credit; a ChatGPT subscription does not include it.",
  }[provider];
  return (
    <div className="key-guide">
      <p>
        An API key is a password-like code that lets this app use your {who} account. {cost}
      </p>
      <ol className="key-steps">
        <li>
          Open <a href={page.url} target="_blank" rel="noreferrer">{page.label}</a>
        </li>
        <li>
          Choose <em>Create API key</em>.
        </li>
        <li className="with-note">
          <span>Copy the key.</span>
          <Note dir="left" className="steps-note">about a minute</Note>
        </li>
      </ol>
      <p className="muted">Stuck? Ask any AI chatbot for help.</p>
    </div>
  );
}
