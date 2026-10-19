import { useEffect, useState } from "react";
import { api, ServiceRejected, type AiInfo, type ProviderId } from "../lib/api";
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
}: {
  provider: ProviderId;
  onConnected?: () => void;
  headingLevel?: 3 | 4;
  /** First-run setup: short steps and a two-line consent summary, so the whole step fits on one screen. */
  compact?: boolean;
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

  // The notice shown must be the one for the service being set up, so fetch it when the choice changes.
  useEffect(() => {
    if (!info) return;
    setAccept(false);
    setError("");
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

  const connect = async (apiKey: string, model?: string) => {
    setBusy(true);
    setError("");
    try {
      await ai.connect(apiKey, accept, model, provider);
      setKey("");
      onConnected?.();
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : SERVICE_UNREACHABLE);
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
      <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
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
  const connectRow = (disabled: boolean, onClick: () => void) => (
    <div className="connect-row">
      <button disabled={disabled} onClick={onClick}>
        {busy ? "Checking…" : "Connect"}
      </button>
      {errorLine}
    </div>
  );

  if (provider !== "ollama") {
    const page = KEY_PAGES[provider];
    return (
      <div className={`ai-connect${compact ? " compact" : ""}`}>
        {compact ? (
          <ol className="key-steps">
            <li>
              Open <a href={page.url} target="_blank" rel="noreferrer">{page.label}</a>
            </li>
            <li>
              Choose <em>Create API key</em> and copy it.
            </li>
            <li className="with-note">
              <span>Paste it below.</span>
              <Note dir="left" className="steps-note">about a minute</Note>
            </li>
          </ol>
        ) : (
          <ol className="key-steps">
            <li>
              Go to <a href={page.url} target="_blank" rel="noreferrer">{page.label}</a> and sign in.
            </li>
            <li>
              Choose <em>Create API key</em> and copy it.
            </li>
            <li>Paste it below. It is checked with {preview?.providerName ?? "the service"} first, then kept on this computer only.</li>
          </ol>
        )}
        {provider !== "gemini" &&
          (compact ? (
            <p className="muted">Needs a little API credit on their site; a chat subscription does not include it.</p>
          ) : (
            <p className="muted">
              This uses your API credit, billed per use, so add a little credit on their site first. A Claude or ChatGPT chat subscription is separate and does not include API
              credit.
            </p>
          ))}
        <p className="muted">Stuck? Ask any AI chatbot to walk you through it.</p>
        {info.keyStored && !info.consented && info.provider === provider && <p className="notice warn-box">The data notice changed since you last accepted it. Please read it again.</p>}
        <label className="field">
          <span>API key</span>
          <input aria-label="API key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} />
        </label>
        {noticeBox}
        {connectRow(busy || !key.trim() || !accept, () => void connect(key))}
      </div>
    );
  }

  return (
    <div className={`ai-connect${compact ? " compact" : ""}`}>
      <ol className="key-steps">
        <li>
          Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com/download</a> and open it.
        </li>
        {compact ? (
          <li>
            Get a model: run <code>ollama pull llama3.2</code> in a terminal.
          </li>
        ) : (
          <li>
            Install a model, for example by running <code>ollama pull llama3.2</code> in a terminal. Any chat model works; larger ones are better at scoring and slower.
          </li>
        )}
        <li className="with-note">
          <span>{compact ? "Choose it below." : "Come back here and choose the model below."}</span>
          {compact && <Note dir="left" className="steps-note">a few minutes</Note>}
        </li>
      </ol>
      {local && !local.running && (
        <p className="notice warn-box" role="status">
          Ollama does not seem to be running on this computer yet. Open the Ollama app, then check again.
        </p>
      )}
      {local?.running && local.models.length === 0 && (
        <p className="notice warn-box" role="status">
          Ollama is running but has no models yet. Install one (step 2), then check again.
        </p>
      )}
      <div className="row model-row">
        <label className="field grow">
          <span>Model</span>
          <select aria-label="Ollama model" value={localModel} onChange={(e) => setLocalModel(e.target.value)} disabled={!local?.models.length}>
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
  );
}
