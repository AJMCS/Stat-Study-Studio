import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { CRITERIA, CRITERION_LABELS } from "../types";
import { DEFAULT_CONFIG } from "../lib/scoring";
import { api, ServiceRejected, type AiInfo } from "../lib/api";
import { useAi } from "../lib/ai";

function AiPanel() {
  const ai = useAi();
  const info = ai.info;
  const [choice, setChoice] = useState<"gemini" | "ollama" | null>(null);
  const [preview, setPreview] = useState<AiInfo | null>(null);
  const [key, setKey] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [tested, setTested] = useState(false);
  const [local, setLocal] = useState<{ running: boolean; models: string[] } | null>(null);
  const [localModel, setLocalModel] = useState("");

  const selected = choice ?? info?.provider ?? "gemini";

  // The notice shown must be the one for the service being set up, so fetch it when the choice changes.
  useEffect(() => {
    if (!info) return;
    setAccept(false);
    setError("");
    if (selected === info.provider) {
      setPreview(info);
      return;
    }
    let live = true;
    api.aiStatus(selected).then((p) => live && setPreview(p)).catch(() => {});
    return () => { live = false; };
  }, [selected, info]);

  const findModels = async () => {
    try {
      const r = await api.aiLocalModels();
      setLocal(r);
      setLocalModel((m) => (r.models.includes(m) ? m : r.models[0] ?? ""));
    } catch {
      setLocal({ running: false, models: [] });
    }
  };
  useEffect(() => {
    if (selected === "ollama" && info && !(info.connected && info.provider === "ollama")) void findModels();
  }, [selected, info?.connected]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setTested(false);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : "Couldn't reach the study service. Check that it is still running, then try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!info) return <section className="panel"><h2>AI service</h2><p className="muted">Loading…</p></section>;

  const connectedHere = info.connected && selected === info.provider;
  const shownModel = model ?? (info.model === info.defaultModel ? "" : info.model);
  const notice = preview?.notice ?? info.notice;
  const noticeBox = (
    <div className="notice" data-testid="ai-notice">
      <strong>What gets sent</strong>
      <p>{notice}</p>
      <label>
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} /> I have read this and want to use {selected === "ollama" ? "a model on this computer" : "an AI service"}
      </label>
    </div>
  );

  return (
    <section className="panel" aria-labelledby="ai-h">
      <h2 id="ai-h">AI service (optional)</h2>
      <p>
        Everything in the app works without an AI service. Connecting one adds the adaptive tutor, automatic scoring on the four criteria,
        and exam questions written around what you want to practice. Choose where the model runs:
      </p>
      <fieldset>
        <legend className="sr-only">Where the AI model runs</legend>
        <label className="choice"><input type="radio" name="provider" checked={selected === "gemini"} onChange={() => setChoice("gemini")} /> <span><b>Google Gemini</b> (online): uses your own free key; no account here and nothing to pay us.</span></label>
        <label className="choice"><input type="radio" name="provider" checked={selected === "ollama"} onChange={() => setChoice("ollama")} /> <span><b>Ollama</b> (on this computer): runs a model you install yourself. Nothing leaves your computer, and it works offline.</span></label>
      </fieldset>
      {error && <p className="notice warn-box" role="alert">{error}</p>}
      {info.connected && !connectedHere && <p className="muted">You are connected to {info.providerName}. Connecting this one replaces it.</p>}

      {connectedHere ? (
        <>
          <p role="status">
            Connected to {info.providerName}.{" "}
            {info.local ? "It runs on this computer, so nothing is sent over the internet." : `Your key is stored ${info.keyLocation === "os" ? "in this computer's secure credential store" : "in a private file on this computer"}.`}
            {tested && " The connection works."}
          </p>
          <label className="field">
            <span>Model</span>
            <input aria-label="Model" placeholder={info.defaultModel} value={info.local ? (model ?? info.model) : shownModel} onChange={(e) => setModel(e.target.value)} />
          </label>
          {!info.local && <p className="muted">Leave blank to use {info.defaultModel}, which Google keeps pointing at its current fast model.</p>}
          {info.local && <p className="muted">Bigger models score more consistently; smaller ones answer faster. Install another with <code>ollama pull &lt;name&gt;</code>, then type its name here.</p>}
          <div className="row">
            <button className="ghost" disabled={busy} onClick={() => void run(() => ai.setModel(info.local ? (model ?? info.model) : shownModel))}>Save model</button>
            <button className="ghost" disabled={busy} onClick={() => void run(async () => { await ai.test(); setTested(true); })}>Test connection</button>
            <button className="ghost danger" disabled={busy} onClick={() => void run(ai.disconnect)}>Disconnect{info.local ? "" : " and forget my key"}</button>
          </div>
        </>
      ) : selected === "gemini" ? (
        <>
          <ol>
            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and sign in with a Google account.</li>
            <li>Choose <em>Create API key</em> and copy it.</li>
            <li>Paste it below. It is checked with Google first, then kept on this computer only.</li>
          </ol>
          {info.keyStored && !info.consented && info.provider === "gemini" && <p className="notice">The data notice changed since you last accepted it. Please read it again.</p>}
          <label className="field">
            <span>API key</span>
            <input aria-label="API key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} />
          </label>
          {noticeBox}
          <button disabled={busy || !key.trim() || !accept} onClick={() => void run(async () => { await ai.connect(key, accept, undefined, "gemini"); setKey(""); })}>
            {busy ? "Checking…" : "Connect"}
          </button>
        </>
      ) : (
        <>
          <ol>
            <li>Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com/download</a> and open it.</li>
            <li>Install a model, for example by running <code>ollama pull llama3.2</code> in a terminal. Any chat model works; larger ones are better at scoring and slower.</li>
            <li>Come back here and choose the model below.</li>
          </ol>
          {local && !local.running && <p className="notice" role="status">Ollama does not seem to be running on this computer yet. Open the Ollama app, then check again.</p>}
          {local?.running && local.models.length === 0 && <p className="notice" role="status">Ollama is running but has no models yet. Install one (step 2), then check again.</p>}
          <label className="field">
            <span>Model</span>
            <select aria-label="Ollama model" value={localModel} onChange={(e) => setLocalModel(e.target.value)} disabled={!local?.models.length}>
              {!local?.models.length && <option value="">No models found</option>}
              {local?.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <div className="row">
            <button className="ghost" disabled={busy} onClick={() => void findModels()}>Check again</button>
          </div>
          {noticeBox}
          <button disabled={busy || !localModel || !accept} onClick={() => void run(() => ai.connect("", accept, localModel, "ollama"))}>
            {busy ? "Checking…" : "Connect"}
          </button>
        </>
      )}
      <p className="muted">
        {info.local ? "Because the model runs on this computer, all your collections can be used to ground answers." : "Hosted requests that use your uploaded files are also controlled per collection in Course materials."} Disconnecting removes the connection; the app keeps working on its own.
      </p>
    </section>
  );
}

export function Settings() {
  const { data, update, exportData, deleteAll } = useStore();
  const cfg = data.config;
  const [confirm, setConfirm] = useState(false);

  const [exportError, setExportError] = useState("");

  const download = async () => {
    let text: string;
    try {
      text = await exportData();
    } catch {
      setExportError("Couldn't export right now. Check that the study app is still running, then try again.");
      return;
    }
    setExportError("");
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats132-study-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const num = (v: string) => Math.max(0, Math.min(100, Number(v) || 0));

  return (
    <>
      <h1>Settings</h1>

      <section className="panel">
        <h2>Scoring</h2>
        <p className="muted">Composite is the weighted average of four criteria (equal weights by default).</p>
        <label className="field">
          <span>Composite cutoff</span>
          <input type="number" min={0} max={100} value={cfg.compositeCutoff} onChange={(e) => update((d) => ({ ...d, config: { ...d.config, compositeCutoff: num(e.target.value) } }))} />
        </label>
        <table>
          <thead><tr><th>Criterion</th><th>Weight</th><th>Cutoff</th></tr></thead>
          <tbody>
            {CRITERIA.map((k) => (
              <tr key={k}>
                <td>{CRITERION_LABELS[k]}</td>
                <td><input aria-label={`${CRITERION_LABELS[k]} weight`} type="number" min={0} value={cfg.weights[k]} onChange={(e) => update((d) => ({ ...d, config: { ...d.config, weights: { ...d.config.weights, [k]: Math.max(0, Number(e.target.value) || 0) } } }))} /></td>
                <td><input aria-label={`${CRITERION_LABELS[k]} cutoff`} type="number" min={0} max={100} value={cfg.criterionCutoffs[k]} onChange={(e) => update((d) => ({ ...d, config: { ...d.config, criterionCutoffs: { ...d.config.criterionCutoffs, [k]: num(e.target.value) } } }))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="ghost" onClick={() => update((d) => ({ ...d, config: DEFAULT_CONFIG }))}>Reset to defaults</button>
      </section>

      <AiPanel />

      <section className="panel">
        <h2>Your data</h2>
        <p>Progress, settings, and history are kept on this device. Syncing is optional and off.</p>
        {exportError && <p className="notice warn-box" role="alert">{exportError}</p>}
        <div className="row">
          <button onClick={() => void download()}>Export my data</button>
          {!confirm ? (
            <button className="ghost danger" onClick={() => setConfirm(true)}>Delete all my data</button>
          ) : (
            <>
              <span role="alert">This permanently erases progress, history, and uploaded files.</span>
              <button className="danger" onClick={async () => { await deleteAll(); setConfirm(false); }}>Yes, delete everything</button>
              <button className="ghost" onClick={() => setConfirm(false)}>Cancel</button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
