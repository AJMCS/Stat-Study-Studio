import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { TOPICS } from "../mock/topics";
import { useStore } from "../lib/store";
import { analyticsAttempts, classify, courseTimeline, historicalPeak, recencyWeighted, topicChange, trend } from "../lib/scoring";
import { MetricChart, TopicChangeChart } from "../components/ComprehensionCharts";
import { StreakIndicator } from "../components/Score";
import { CRITERIA, CRITERION_LABELS, type Attempt, type Criterion, type ScoringConfig } from "../types";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey } from "../lib/journey";
import { JourneyMap } from "../components/JourneyMap";
import { JourneyList, StateLine } from "./Learn";
import { Eyebrow, Note, Scribble } from "../components/Hand";

export function Progress() {
  const { data, deleteAttempt } = useStore();
  const cfg = data.config;
  const [includeSelf, setIncludeSelf] = useIncludeSelfScored();
  const selfCount = data.attempts.filter((a) => a.selfScored && a.counted).length;
  // the charts' own filters: a time range and what to plot (the course, or one topic); they scope both charts
  const [range, setRange] = useState<"all" | "30" | "7">("all");
  const [show, setShow] = useState<string>("course");
  const since = range === "all" ? null : new Date(Date.now() - Number(range) * 24 * 3600 * 1000).toISOString();
  const charted = analyticsAttempts(data.attempts, undefined, includeSelf).filter((a) => !since || a.at >= since);
  const timeline = courseTimeline(charted, cfg.recencyWindow, show === "course" ? undefined : show);
  const topicNames = Object.fromEntries(TOPICS.map((t) => [t.id, t.title]));
  const changes = TOPICS.flatMap((t) => {
    if (show !== "course" && show !== t.id) return [];
    const c = topicChange(charted.filter((a) => a.topicId === t.id), cfg.recencyWindow);
    return c ? [{ id: t.id, title: t.title, change: c }] : [];
  });
  const started = TOPICS.filter((t) => data.attempts.some((a) => a.counted && a.topicId === t.id));

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

      {overall !== null && (
        <section className="comprehension" aria-label="Comprehension over time">
          <h2>Comprehension over time</h2>
          <p className="muted">Whether your understanding is growing or slipping: the score after every counted attempt, and how far each topic has moved.</p>
          <div className="chart-filters" role="group" aria-label="Chart filters">
            <ul className="crit-tabs" role="tablist" aria-label="Time range">
              {([["all", "All"], ["30", "30 days"], ["7", "7 days"]] as const).map(([v, name]) => (
                <li key={v} role="presentation">
                  <button role="tab" aria-selected={range === v} onClick={() => setRange(v)}>{name}</button>
                </li>
              ))}
            </ul>
            <label className="field inline">
              <span>Show</span>
              <select aria-label="What to plot" value={show} onChange={(e) => setShow(e.target.value)}>
                <option value="course">Whole course</option>
                {started.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="chart-hint">Hover a point or a row, or use the arrow keys, to read it; each chart can also be shown as a table.</p>
          <MetricChart key={`${show}-${range}-${includeSelf}`} points={timeline} cutoff={cfg.compositeCutoff} label={show === "course" ? "Course score" : topicNames[show]} topicNames={topicNames} />
          <TopicChangeChart rows={changes} window={cfg.recencyWindow} />
        </section>
      )}

      {scored.length > 0 && <h2>Topics</h2>}
      <div className="topic-panels">
      {scored.map(({ t, at, score, peak, tr }) => {
        const state = data.topicState[t.id];
        const modelAt = at.filter((a) => a.aiScored); // only an AI rubric produces a real per-criterion breakdown
        // the pathway's counts, from the same counted attempts its table lists, each against the cutoff it is held to
        const recalls = at.filter((a) => a.kind === "recall");
        const recallsOver = recalls.filter((a) => a.composite >= cfg.compositeCutoff).length;
        const apps = modelAt.filter((a) => a.criteria.application >= cfg.criterionCutoffs.application).length;
        const all = data.attempts.filter((a) => a.topicId === t.id).sort((a, b) => a.at.localeCompare(b.at));
        const cls = classify(score, cfg);
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
                <PathwayChart topic={t} attempts={at} modelAttempts={modelAt} all={all} cfg={cfg} topicNames={topicNames} onDelete={deleteAttempt}>
                  <p className="eyebrow">
                    {"// "}{recalls.length === 0 ? "no recalls yet" : `${recalls.length} recall${recalls.length === 1 ? "" : "s"}, ${recallsOver} of them ${cfg.compositeCutoff}+`}
                    {modelAt.length > 0 && ` · application ${cfg.criterionCutoffs.application}+ on ${apps} of ${modelAt.length} attempt${modelAt.length === 1 ? "" : "s"}`}
                  </p>
                  {state && (state.strengths.length > 0 || state.gaps.length > 0) && (
                    <p className="muted">
                      {state.strengths.length > 0 && <>Strong: {state.strengths.join(", ")}. </>}
                      {state.gaps.length > 0 && <>Working on: {state.gaps.join(", ")}.</>}
                    </p>
                  )}
                </PathwayChart>
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

/**
 * A pathway's chart space: one tab row and one frame. The composite alone (with a link to inspect), or the composite
 * beside the four criteria (each tab carrying its own trend) and the attempts table, all in the same space, so
 * switching changes only the line. The pathway-level notes (children) belong to the composite view.
 */
/** The criterion tabs' short names; the chart's own caption carries the full label. */
const TAB_LABELS: Record<Criterion, string> = { core: "Core idea", depth: "Depth", relevance: "Relevance", application: "Application" };
type Tab = "composite" | Criterion | "attempts";

/** Where a metric stands: its recency-weighted value now, how it moved, and the direction that reads as. */
function standing(attempts: Attempt[], window: number, pick: (a: Attempt) => number) {
  const now = recencyWeighted(attempts, window, pick);
  const change = topicChange(attempts.map((a) => ({ ...a, composite: pick(a) })), window);
  const dir = change === null ? "new" : change.delta >= 3 ? "improving" : change.delta <= -3 ? "declining" : "steady";
  const glyph = dir === "improving" ? "↑" : dir === "declining" ? "↓" : dir === "steady" ? "→" : "";
  return { now, change, dir, glyph };
}

function PathwayChart({
  topic,
  attempts,
  modelAttempts,
  all,
  cfg,
  topicNames,
  onDelete,
  children,
}: {
  topic: { id: string; title: string };
  attempts: Attempt[];
  modelAttempts: Attempt[];
  all: Attempt[];
  cfg: ScoringConfig;
  topicNames: Record<string, string>;
  onDelete: (id: string) => void;
  children?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("composite");
  const noModel = modelAttempts.length === 0;
  const composite = tab === "composite"; // the composite view: its tab alone, with the link that opens the rest
  const crit: Criterion = composite || tab === "attempts" ? "core" : tab;
  // what is in the chart space: the composite, or one criterion; each with the same one-line summary beneath
  const metricAttempts = composite ? attempts : modelAttempts;
  const metricPick = composite ? (a: Attempt) => a.composite : (a: Attempt) => a.criteria[crit];
  const points = courseTimeline(metricAttempts, cfg.recencyWindow, topic.id, metricPick);
  const { now, change } = standing(metricAttempts, cfg.recencyWindow, metricPick);
  const cutoff = composite ? cfg.compositeCutoff : cfg.criterionCutoffs[crit];
  const name = composite ? "Composite" : TAB_LABELS[crit];
  // the value and how far it moved; the direction word lives on the tab (a criterion) or in the panel's header (the
  // composite), so the line does not repeat it
  const summary = now !== null && (
    <p className="crit-stat" role="status">
      <b className="mono">{now}</b> recency-weighted {name.toLowerCase()}
      {change && (
        <>
          {" · "}
          <span className="mono">{change.delta > 0 ? "+" : ""}{change.delta}</span> since {change.basis === "window" ? `before the last ${Math.min(cfg.recencyWindow, change.attempts)} attempts` : "your first attempt"}
        </>
      )}
      {" · "}
      {now >= cutoff ? "at or above" : "below"} the cutoff of <span className="mono">{cutoff}</span>
    </p>
  );
  const tabButton = (t: Tab, label: string, glyph = "") => {
    const locked = t !== "composite" && t !== "attempts" && noModel; // a criterion needs AI-scored attempts
    return (
      <li key={t} role="presentation">
        <button role="tab" aria-selected={tab === t} disabled={locked} title={locked ? "Criterion-level trends need an AI service to score your explanations" : undefined} onClick={() => setTab(t)}>
          {label}
          {glyph && <span className="trend">{glyph}</span>}
        </button>
      </li>
    );
  };
  return (
    <div className="pathway-chart">
      {/* one row in both views, so the chart space below never moves: the composite alone, or with the criteria and the attempts */}
      <div className="crit-row">
        <ul className="crit-tabs" role="tablist" aria-label="Metric">
          {tabButton("composite", "Composite")}
          {!composite && CRITERIA.map((c) => tabButton(c, TAB_LABELS[c], noModel ? "" : standing(modelAttempts, cfg.recencyWindow, (a) => a.criteria[c]).glyph))}
          {!composite && tabButton("attempts", "Attempts")}
        </ul>
        {composite && (
          <button className="link mono-link" onClick={() => setTab(noModel ? "attempts" : "core")}>
            Inspect criteria and attempts<span className="go" aria-hidden="true">→</span>
          </button>
        )}
      </div>
      {tab === "attempts" ? (
        <>
          {noModel && <p className="muted">Criterion-level trends (core idea, depth, relevance, application) need an AI service to score your explanations. Your self-scored attempts only have an overall score.</p>}
          {/* the panel's table, in the panel's width: a short date, the attempt (with whether it counts) and its scores */}
          <div className="table-scroll attempts-table">
            <table>
              <thead><tr><th>Date</th><th>Attempt</th>{!noModel && CRITERIA.map((c) => <th key={c}>{TAB_LABELS[c]}</th>)}<th>Composite</th><th /></tr></thead>
              <tbody>
                {[...all].reverse().map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                    <td>
                      {a.note ?? a.kind}
                      {a.selfScored && <span className="chip">Self-scored</span>}
                      {!a.counted && <span className="muted"> · {a.note?.startsWith("Comprehension check") ? "practice" : "retry"}, not counted</span>}
                    </td>
                    {!noModel && CRITERIA.map((c) => <td key={c} className="mono">{a.aiScored ? a.criteria[c] : "—"}</td>)}
                    <td className="mono">{a.composite}</td>
                    <td>
                      {/* destructive, so it is worded and marked (§1): the app's "!" danger form, at the row's size */}
                      <button className="danger btn-sm" onClick={() => confirm("Delete this attempt? It will no longer affect your trend or historical peak.") && onDelete(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <MetricChart key={`${tab}`} points={points} cutoff={cutoff} label={name} caption={composite ? "recency-weighted, per counted attempt" : "recency-weighted, AI-scored attempts"} topicNames={topicNames} metric={metricPick} noTable />
          {summary}
          {composite && children}
        </>
      )}
    </div>
  );
}
