import { useState } from "react";
import { useStore } from "../lib/store";
import { CRITERIA, CRITERION_LABELS } from "../types";
import { DEFAULT_CONFIG } from "../lib/scoring";

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

      <section className="panel">
        <h2>AI and privacy</h2>
        <p>
          Everything you do here is stored on this device. On-device models are preferred; any hosted-model use is disclosed and needs your consent before learner data is sent. Hosted requests using personal materials are controlled per collection in Course materials.
        </p>
        <p className="muted">Current build uses built-in sample responses; no data leaves your device.</p>
      </section>

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
