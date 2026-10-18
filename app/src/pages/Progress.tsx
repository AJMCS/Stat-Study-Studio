import { useState } from "react";
import { Link } from "react-router-dom";
import { TOPICS } from "../mock/topics";
import { useStore } from "../lib/store";
import { analyticsAttempts, classify, historicalPeak, recencyWeighted, trend } from "../lib/scoring";
import { Trend } from "../components/Trend";
import { StreakIndicator } from "../components/Score";
import { CRITERIA, CRITERION_LABELS, type Criterion } from "../types";

export function Progress() {
  const { data, deleteAttempt } = useStore();
  const cfg = data.config;
  const [open, setOpen] = useState<string | null>(null);
  const [crit, setCrit] = useState<Criterion | "composite">("composite");

  const rows = TOPICS.map((t) => {
    const at = analyticsAttempts(data.attempts, t.id);
    return { t, at, score: recencyWeighted(at, cfg.recencyWindow), peak: historicalPeak(at), tr: trend(at, cfg.recencyWindow) };
  });
  const scored = rows.filter((r) => r.score !== null);
  const overall = scored.length ? Math.round(scored.reduce((s, r) => s + r.score!, 0) / scored.length) : null;
  const overallPeak = scored.length ? Math.round(scored.reduce((s, r) => s + r.peak!, 0) / scored.length) : null;
  const strengths = scored.filter((r) => classify(r.score, cfg) === "strength");
  const gaps = scored.filter((r) => classify(r.score, cfg) === "gap");

  return (
    <>
      <h1>Progress</h1>
      <p className="lede">Per-topic history rolls up into a Stats 132 summary. Scores use a recency-weighted average of your latest {cfg.recencyWindow} saved attempts.</p>

      <section className="panel" aria-label="Stats 132 summary">
        <h2>Stats 132 summary</h2>
        {overall === null ? (
          <p className="notice">No saved attempts yet. Try a tutor session, quiz, or exam and your progress will appear here.</p>
        ) : (
          <div className="stats">
            <div><b>{overall}</b><span>Current (recency-weighted)</span></div>
            <div><b>{overallPeak}</b><span>Historical peak</span></div>
            <div><b>{strengths.length}</b><span>Strengths</span></div>
            <div><b>{gaps.length}</b><span>Gaps</span></div>
          </div>
        )}
        {rows.some((r) => r.tr === "improving" || r.tr === "declining") && (
          <ul>
            {rows.filter((r) => r.tr === "improving" || r.tr === "declining").map((r) => (
              <li key={r.t.id}>{r.t.title}: {r.tr === "improving" ? "↑ improving" : "↓ declining"}</li>
            ))}
          </ul>
        )}
      </section>

      <h2>Topics</h2>
      {rows.map(({ t, at, score, peak, tr }) => {
        const state = data.topicState[t.id];
        const apps = data.attempts.filter((a) => a.topicId === t.id && a.criteria.application >= cfg.criterionCutoffs.application).length;
        const all = data.attempts.filter((a) => a.topicId === t.id).sort((a, b) => a.at.localeCompare(b.at));
        const cls = classify(score, cfg);
        const pick = crit === "composite" ? undefined : (a: (typeof at)[number]) => a.criteria[crit];
        return (
          <section key={t.id} className="panel">
            <div className="row between">
              <h3><Link to={`/topic/${t.id}`}>{t.title}</Link></h3>
              {state && <StreakIndicator streak={state.streak} warn={state.warnCriteria.map((c) => CRITERION_LABELS[c])} flagged={state.flagged} />}
            </div>
            {score === null ? (
              <p className="muted">Not started.</p>
            ) : (
              <>
                <div className="stats">
                  <div><b>{score}</b><span>Current</span></div>
                  <div><b>{peak}</b><span>Historical peak</span></div>
                  <div><span className={`chip ${cls === "strength" ? "ok" : "flag"}`}>{cls === "strength" ? "Strength" : "Gap"}</span><span>{tr === "improving" ? "↑ Improving" : tr === "declining" ? "↓ Declining" : "Steady"}</span></div>
                </div>
                <Trend attempts={at} cutoff={crit === "composite" ? cfg.compositeCutoff : cfg.criterionCutoffs[crit]} pick={pick} label={`${t.title} ${crit} trend`} />
                <p className="muted">
                  Supporting signals: {apps} successful application{apps === 1 ? "" : "s"} · {state?.recallHistory.filter((r) => r.qualified).length ?? 0} qualifying recalls · {state?.misses ?? 0} misses
                </p>
                {state && (state.strengths.length > 0 || state.gaps.length > 0) && (
                  <p className="muted">
                    {state.strengths.length > 0 && <>Strong: {state.strengths.join(", ")}. </>}
                    {state.gaps.length > 0 && <>Working on: {state.gaps.join(", ")}.</>}
                  </p>
                )}
                <button className="ghost" aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)}>
                  {open === t.id ? "Hide details" : "Inspect criteria and attempts"}
                </button>
                {open === t.id && (
                  <>
                    <div className="row" role="group" aria-label="Trend metric">
                      {(["composite", ...CRITERIA] as const).map((c) => (
                        <button key={c} className={crit === c ? "" : "ghost"} aria-pressed={crit === c} onClick={() => setCrit(c)}>
                          {c === "composite" ? "Composite" : CRITERION_LABELS[c]}
                        </button>
                      ))}
                    </div>
                    <table>
                      <thead><tr><th>Date</th><th>Type</th><th>Composite</th><th>Counts</th><th /></tr></thead>
                      <tbody>
                        {[...all].reverse().map((a) => (
                          <tr key={a.id}>
                            <td>{new Date(a.at).toLocaleDateString()}</td>
                            <td>{a.note ?? a.kind}</td>
                            <td>{a.composite}</td>
                            <td>{a.counted ? "Yes" : "Retry (not counted)"}</td>
                            <td>
                              <button className="ghost" onClick={() => confirm("Delete this attempt? It will no longer affect your trend or historical peak.") && deleteAttempt(a.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </section>
        );
      })}
    </>
  );
}
