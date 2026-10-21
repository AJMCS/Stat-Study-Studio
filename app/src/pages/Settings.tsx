import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { CRITERIA, CRITERION_LABELS } from "../types";
import { DEFAULT_CONFIG } from "../lib/scoring";
import { ServiceRejected, type ProviderId } from "../lib/api";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { AiConnect, BLURB, SERVICE_UNREACHABLE } from "../components/AiConnect";
import { useAi } from "../lib/ai";
import { useTheme } from "../lib/theme";
import { useConnection } from "../lib/connection";

function AiPanel() {
  const ai = useAi();
  const info = ai.info;
  const [choice, setChoice] = useState<ProviderId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [tested, setTested] = useState(false);

  const selected: ProviderId = choice ?? info?.provider ?? "gemini";
  useEffect(() => setError(""), [selected]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setTested(false);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : SERVICE_UNREACHABLE);
    } finally {
      setBusy(false);
    }
  };

  if (!info) return <section className="panel"><h2>AI service</h2><p className="muted">Loading…</p></section>;

  const connectedHere = info.connected && selected === info.provider;
  const shownModel = model ?? (info.model === info.defaultModel ? "" : info.model);
  /** The chosen service is saved and ready but not the one in use: offer to switch rather than ask for its key again. */
  const savedHere = info.accounts.find((a) => a.id === selected && !a.active);
  const others = info.accounts.filter((a) => a.id !== selected);

  return (
    <section className="panel" aria-labelledby="ai-h">
      <h2 id="ai-h">AI service (optional)</h2>
      <p className="muted">
        Everything in the app works without an AI service. Connecting one adds the adaptive tutor, automatic scoring on the four criteria,
        and exam questions written around what you want to practice. Choose where the model runs:
      </p>
      <fieldset className="provider-list">
        <legend className="sr-only">Where the AI model runs</legend>
        <Note dir="left" className="focal-note settings-note">start here</Note>
        {info.providers.map((p) => (
          <label key={p.id} className={`choice opt-row${selected === p.id ? " on" : ""}`}>
            <input type="radio" name="provider" checked={selected === p.id} onChange={() => setChoice(p.id)} /> <span className="opt"><b>{p.name}</b><span className="opt-desc">{BLURB[p.id]}</span></span>
          </label>
        ))}
      </fieldset>
      {error && <p className="notice warn-box" role="alert">{error}</p>}
      {others.length > 0 && !savedHere && !connectedHere && (
        <p className="muted">
          {others.map((a) => a.name).join(" and ")} {others.length === 1 ? "stays" : "stay"} saved. Connecting this one adds it and makes it the one in use; the corner chip switches between them.
        </p>
      )}

      {savedHere ? (
        <>
          <p role="status">
            {savedHere.name} is saved{savedHere.local ? "" : " with its key"} and ready, using <b className="mono">{savedHere.model}</b>. {info.connected ? `${info.providerName} is the one in use.` : "Nothing is in use right now."}
          </p>
          <div className="row">
            <button disabled={busy} onClick={() => void run(() => ai.switchTo(savedHere.id))}>Use this service</button>
            <button className="ghost danger" disabled={busy} onClick={() => void run(() => ai.disconnect(savedHere.id))}>Forget it{savedHere.local ? "" : " and its key"}</button>
          </div>
        </>
      ) : connectedHere ? (
        <>
          <p role="status">
            Connected to {info.providerName}.{" "}
            {info.local ? "It runs on this computer, so nothing is sent over the internet." : `Your key is stored ${info.keyLocation === "os" ? "in this computer's secure credential store" : "in a private file on this computer"}.`}
            {tested && " The connection works."}
          </p>
          <label className="field">
            <span>Model</span>
            <input aria-label="Model" placeholder={info.defaultModel} value={info.local || !info.defaultModel ? (model ?? info.model) : shownModel} onChange={(e) => setModel(e.target.value)} />
          </label>
          {info.provider === "gemini" && <p className="muted">Leave blank to use {info.defaultModel}, which Google keeps pointing at its current fast model.</p>}
          {info.provider !== "gemini" && !info.local && <p className="muted">This model was chosen from the ones your account can use. Type another model name to change it.</p>}
          {info.local && <p className="muted">Bigger models score more consistently; smaller ones answer faster. Install another with <code>ollama pull &lt;name&gt;</code>, then type its name here.</p>}
          <div className="row">
            <button className="ghost" disabled={busy} onClick={() => void run(() => ai.setModel(info.local || !info.defaultModel ? (model ?? info.model) : shownModel))}>Save model</button>
            <button className="ghost" disabled={busy} onClick={() => void run(async () => { await ai.test(); setTested(true); })}>Test connection</button>
            <button className="ghost danger" disabled={busy} onClick={() => void run(ai.disconnect)}>Disconnect{info.local ? "" : " and forget my key"}</button>
          </div>
        </>
      ) : (
        <AiConnect key={selected} provider={selected} />
      )}
      <p className="muted">
        {info.local ? "Because the model runs on this computer, all your collections can be used to ground answers." : "Hosted requests that use your uploaded files are also controlled per collection in Course materials."} Disconnecting removes the connection; the app keeps working on its own.
      </p>
      {info.accounts.length > 1 && (
        <>
          <p className="eyebrow">{"// Saved services"}</p>
          <ul className="saved-services">
            {info.accounts.map((a) => (
              <li key={a.id}>
                <span>
                  <b>{a.name}</b> <span className="muted">· {a.model}{a.active ? " · in use" : ""}</span>
                </span>
                {!a.active && (
                  <span className="row">
                    <button className="ghost btn-sm" disabled={busy} onClick={() => void run(() => ai.switchTo(a.id))}>Use this</button>
                    <button className="ghost btn-sm danger" disabled={busy} onClick={() => void run(() => ai.disconnect(a.id))}>Forget</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="muted">Switch any time from the chip in the bottom corner of the screen, too.</p>
        </>
      )}
    </section>
  );
}

/** The study service on this computer: whether this page can reach it, and a button to check. */
function ServicePanel() {
  const link = useConnection();
  const [result, setResult] = useState<"" | "ok" | "no">("");
  const check = async () => setResult((await link.reconnect()) ? "ok" : "no");
  const lost = link.state === "lost";
  return (
    <section className="panel" aria-labelledby="service-h">
      <h2 id="service-h">The study service</h2>
      <p className="muted">
        This page talks to a small program on this computer that keeps your progress and runs the AI features. It is the black window that opens with the app.
      </p>
      <p role="status">
        {lost ? "Lost connection: the service is not answering." : "Connected."} Address: <span className="mono">{window.location.origin}</span>
      </p>
      {lost && <p>Your work on this page is kept. If you closed the app's window, start Stats Study Studio again; this page reconnects by itself, or press the button.</p>}
      <div className="row">
        <button disabled={link.checking} onClick={() => void check()}>{link.checking ? "Checking…" : lost ? "Reconnect now" : "Check the service"}</button>
        {result === "ok" && <span>The service answered.</span>}
        {result === "no" && <span>Still no answer.</span>}
      </div>
    </section>
  );
}

/** Dark or light: the same switch as the theme button in the top bar. */
function Appearance() {
  const [theme, setTheme] = useTheme();
  return (
    <section className="panel" aria-labelledby="appearance-h">
      <h2 id="appearance-h">Appearance</h2>
      <p className="muted">Dark is the default. The top bar has the same switch.</p>
      <fieldset>
        <legend className="sr-only">Theme</legend>
        {(["dark", "light"] as const).map((t) => (
          <label key={t} className={`choice opt-row${theme === t ? " on" : ""}`}>
            <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t)} />
            <span className="opt"><b>{t === "dark" ? "Dark" : "Light"}</b><span className="opt-desc">{t === "dark" ? "Chalk on a dark graph-paper canvas." : "Ink on white graph paper."}</span></span>
          </label>
        ))}
      </fieldset>
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
      <Eyebrow>Settings</Eyebrow>
      <h1>Your <Scribble>settings</Scribble></h1>
      <div className="settings">
      <AiPanel />

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

      <Appearance />

      <ServicePanel />

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
      </div>
    </>
  );
}
