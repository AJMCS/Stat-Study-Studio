import { useState } from "react";
import { useStore } from "../lib/store";
import { CRITERIA, CRITERION_LABELS } from "../types";
import { DEFAULT_CONFIG } from "../lib/scoring";
import { ServiceRejected } from "../lib/api";
import { useAi } from "../lib/ai";

function AiPanel() {
  const ai = useAi();
  const info = ai.info;
  const [key, setKey] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [tested, setTested] = useState(false);

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

  const shownModel = model ?? (info.model === info.defaultModel ? "" : info.model);

  return (
    <section className="panel" aria-labelledby="ai-h">
      <h2 id="ai-h">AI service (optional)</h2>
      <p>
        Everything in the app works without an AI service. Connecting one adds the adaptive tutor, automatic scoring on the four criteria,
        and exam questions written around what you want to practice. It uses <strong>your own</strong> {info.providerName} key, so there is no account here and nothing to pay us.
      </p>
      {error && <p className="notice warn-box" role="alert">{error}</p>}

      {info.connected ? (
        <>
          <p role="status">
            Connected to {info.providerName}. Your key is stored {info.keyLocation === "os" ? "in this computer's secure credential store" : "in a private file on this computer"}.
            {tested && " The connection works."}
          </p>
          <label className="field">
            <span>Model</span>
            <input aria-label="Model" placeholder={info.defaultModel} value={shownModel} onChange={(e) => setModel(e.target.value)} />
          </label>
          <p className="muted">Leave blank to use {info.defaultModel}, which Google keeps pointing at its current fast model.</p>
          <div className="row">
            <button className="ghost" disabled={busy} onClick={() => void run(() => ai.setModel(shownModel))}>Save model</button>
            <button className="ghost" disabled={busy} onClick={() => void run(async () => { await ai.test(); setTested(true); })}>Test connection</button>
            <button className="ghost danger" disabled={busy} onClick={() => void run(ai.disconnect)}>Disconnect and forget my key</button>
          </div>
        </>
      ) : (
        <>
          <ol>
            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and sign in with a Google account.</li>
            <li>Choose <em>Create API key</em> and copy it.</li>
            <li>Paste it below. It is checked with Google first, then kept on this computer only.</li>
          </ol>
          {info.keyStored && !info.consented && <p className="notice">The data notice changed since you last accepted it. Please read it again.</p>}
          <label className="field">
            <span>API key</span>
            <input aria-label="API key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} />
          </label>
          <div className="notice" data-testid="ai-notice">
            <strong>What gets sent</strong>
            <p>{info.notice}</p>
            <label>
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} /> I have read this and want to use an AI service
            </label>
          </div>
          <button disabled={busy || !key.trim() || !accept} onClick={() => void run(async () => { await ai.connect(key, accept); setKey(""); })}>
            {busy ? "Checking…" : "Connect"}
          </button>
        </>
      )}
      <p className="muted">
        Hosted requests that use your uploaded files are also controlled per collection in Course materials. Disconnecting removes the key; the app keeps working on its own.
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
