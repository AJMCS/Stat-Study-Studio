import { useState } from "react";
import { Link } from "react-router-dom";
import { TOPICS } from "../mock/topics";
import { useStore } from "../lib/store";
import { analyticsAttempts, classify, historicalPeak, recencyWeighted, trend } from "../lib/scoring";
import { Trend } from "../components/Trend";
import { StreakIndicator } from "../components/Score";
import { CRITERIA, CRITERION_LABELS, type Criterion } from "../types";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey } from "../lib/journey";
import { JourneyMap } from "../components/JourneyMap";
import { JourneyList, StateLine } from "./Learn";
import { Eyebrow, Note, Scribble } from "../components/Hand";

export function Progress() {
  const { data, deleteAttempt } = useStore();
  const cfg = data.config;
  const [open, setOpen] = useState<string | null>(null);
  const [crit, setCrit] = useState<Criterion | "composite">("composite");
  const [includeSelf, setIncludeSelf] = useIncludeSelfScored();
  const selfCount = data.attempts.filter((a) => a.selfScored && a.counted).length;

  const rows = TOPICS.map((t) => {
    const at = analyticsAttempts(data.attempts, t.id, includeSelf);
    return { t, at, score: recencyWeighted(at, cfg.recencyWindow), peak: historicalPeak(at), tr: trend(at, cfg.recencyWindow) };
  });
  const scored = rows.filter((r) => r.score !== null);
  const overall = scored.length ? Math.round(scored.reduce((s, r) => s + r.score!, 0) / scored.length) : null;
  const overallPeak = scored.length ? Math.round(scored.reduce((s, r) => s + r.peak!, 0) / scored.length) : null;
  const strengths = scored.filter((r) => classify(r.score, cfg) === "strength");
  const gaps = scored.filter((r) => classify(r.score, cfg) === "gap");

  const jrows = journey(data, includeSelf);
  const jcur = currentTopicId(data, jrows);

  return (
    <>
      <Eyebrow>Progress · recency window {cfg.recencyWindow} attempts</Eyebrow>
      <h1>How it is <Scribble>going</Scribble></h1>
      <p className="lede">Your Stats 132 summary, weighted toward your most recent attempts.</p>

      <section className="summary" aria-label="Stats 132 summary">
        <div className="summary-row">
        {overall === null ? (
          <div className="empty">
            <p className="muted">No saved attempts yet. Try a tutorial, quiz, exam or recall and your progress will appear here.{!includeSelf && selfCount > 0 ? " Self-scored attempts are hidden right now." : ""}</p>
            <div className="row">
              <Link className="button" to="/practice">Take a quiz or exam</Link>
              <Note dir="left">your first score starts the map</Note>
            </div>
          </div>
        ) : (
          <div className="stat-block">
            <div className="stats headline-stats">
              <div><b className="lead">{overall}</b><span>Current (recency-weighted)</span></div>
              <div><b>{overallPeak}</b><span>Historical peak</span></div>
              <div><b>{strengths.length}</b><span>Strengths</span></div>
              <div><b>{gaps.length}</b><span>Gaps</span></div>
            </div>
            <Note dir="left" className="stat-note">recent attempts count more than old ones</Note>
          </div>
        )}

        {rows.some((r) => r.tr === "improving" || r.tr === "declining") && (
          <ul className="trend-list">
            {rows.filter((r) => r.tr === "improving" || r.tr === "declining").map((r) => (
              <li key={r.t.id}><span>{r.t.title}</span> <span className="state">{r.tr === "improving" ? "↑ improving" : "↓ declining"}</span></li>
            ))}
          </ul>
        )}
        </div>
      </section>

      {selfCount > 0 && (
        <label className="choice">
          <input type="checkbox" checked={includeSelf} onChange={(e) => setIncludeSelf(e.target.checked)} />
          <span>Include self-scored attempts <span className="chip">{selfCount}</span> These are scored by you against a reference answer, so they can be generous. Turn this off to see only attempts scored automatically.</span>
        </label>
      )}

      {scored.length > 0 && <h2>Topics</h2>}
      <div className="topic-panels">
      {scored.map(({ t, at, score, peak, tr }) => {
        const state = data.topicState[t.id];
        const modelAt = at.filter((a) => a.aiScored); // only an AI rubric produces a real per-criterion breakdown
        const apps = data.attempts.filter((a) => a.topicId === t.id && a.aiScored && a.criteria.application >= cfg.criterionCutoffs.application).length;
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
                <div className="stats topic-stats">
                  <div><b>{score}</b><span>Current</span></div>
                  <div><b>{peak}</b><span>Historical peak</span></div>
                  <div><span className={`chip ${cls === "strength" ? "ok" : "flag"}`}>{cls === "strength" ? "Strength" : "Gap"}</span><span>{tr === "improving" ? "↑ Improving" : tr === "declining" ? "↓ Declining" : "Steady"}</span></div>
                </div>
                <Trend attempts={crit === "composite" ? at : modelAt} cutoff={crit === "composite" ? cfg.compositeCutoff : cfg.criterionCutoffs[crit]} pick={pick} label={`${t.title} ${crit} trend`} />
                <p className="eyebrow">
                  {"// "}{modelAt.length > 0 ? `${apps} successful application${apps === 1 ? "" : "s"} · ` : ""}{state?.recallHistory.filter((r) => r.qualified).length ?? 0} qualifying recalls · {state?.misses ?? 0} misses
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
                        <button
                          key={c}
                          className={crit === c ? "btn-sm on" : "ghost btn-sm"}
                          aria-pressed={crit === c}
                          disabled={c !== "composite" && modelAt.length === 0}
                          title={c !== "composite" && modelAt.length === 0 ? "Criterion-level trends need an AI service to score your explanations" : undefined}
                          onClick={() => setCrit(c)}
                        >
                          {c === "composite" ? "Composite" : CRITERION_LABELS[c]}
                        </button>
                      ))}
                    </div>
                    {modelAt.length === 0 && <p className="muted">Criterion-level trends (core idea, depth, relevance, application) need an AI service to score your explanations. Your self-scored attempts only have an overall score.</p>}
                    <table>
                      <thead><tr><th>Date</th><th>Type</th><th>Composite</th><th>Counts</th><th /></tr></thead>
                      <tbody>
                        {[...all].reverse().map((a) => (
                          <tr key={a.id}>
                            <td className="mono">{new Date(a.at).toLocaleDateString()}</td>
                            <td>{a.note ?? a.kind}</td>
                            <td><span className="mono">{a.composite}</span>{a.selfScored && <span className="chip">Self-scored</span>}</td>
                            <td>{a.counted ? "Yes" : "Retry (not counted)"}</td>
                            <td>
                              <button className="ghost btn-sm" onClick={() => confirm("Delete this attempt? It will no longer affect your trend or historical peak.") && deleteAttempt(a.id)}>
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
      </div>

      <section className="where" aria-label="Where each topic stands">
        <h2>Where each topic stands</h2>
        <JourneyMap rows={jrows} current={jcur} meta={(r) => <StateLine r={r} />} note="next up" />
        <JourneyList rows={jrows} current={jcur} className="mobile-only" />
      </section>
    </>
  );
}
