import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { TimelinePoint, TopicChange } from "../lib/scoring";
import type { Attempt } from "../types";
import type React from "react";

/*
 * One chart shell for every "how is it going" line in the app: the course score, a pathway's composite, and each
 * criterion underneath it. Feed it points and a cutoff and it draws the same frame every time (0–100, the same
 * ticks, the same height), so the eye compares series rather than frames. It is drawn in the app's own ink: one
 * series in ink, the current point in the orange accent, hairline grid, labels only on the current value and the
 * extremes. On mount the line draws on from the left and the marks appear as the line reaches them (CSS, with
 * reduced motion showing the end state). Hover or arrow keys read any point; a table twin carries every value.
 */

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const dayYear = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
/** An attempt's kind as it reads in a sentence ("after a quiz on ..."). */
const KIND_WORDS: Record<Attempt["kind"], string> = { tutor: "a tutor session", quiz: "a quiz", exam: "an exam", recall: "a recall" };

/** The draw-on: the line takes DRAW_MS to travel from its left end with the intro's ease-out (CSS uses the same
 * figure and curve). */
export const DRAW_MS = 800;

/** When, as a fraction of DRAW_MS, the eased line has drawn fraction `f` of its length: the inverse of the CSS
 * ease-out curve, cubic-bezier(0, 0, .58, 1), used by the draw, found by bisection on the curve. */
function easeTime(f: number): number {
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  const bez = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bez(0, 1, mid) < f) lo = mid;
    else hi = mid;
  }
  return bez(0, 0.58, (lo + hi) / 2);
}

/** The element's rendered width in CSS pixels (640 until measured), so the plot is drawn at its true size and its
 * type never scales down with the viewport. */
function useWidth<T extends HTMLElement>(fallback = 640): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    setW(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ------------------------------------------------------------------ the shell */

export function MetricChart({
  points,
  cutoff,
  label,
  topicNames,
  caption,
  empty = "No counted attempts in this range yet.",
  metric,
  noTable = false,
}: {
  points: TimelinePoint[];
  cutoff: number;
  /** What is plotted ("Course score", "Depth"); used in the readout and the table. */
  label: string;
  topicNames: Record<string, string>;
  /** The caption after the label; defaults to the recency-weighted wording. */
  caption?: string;
  empty?: string;
  /** The attempt's own value on this metric (its composite by default; a criterion's score on a criterion chart). */
  metric?: (a: Attempt) => number;
  /** Without the table twin: for a chart whose panel has its own table (the pathway's attempts). */
  noTable?: boolean;
}) {
  const attemptValue = metric ?? ((q: Attempt) => q.composite);
  const [frame, W] = useWidth<HTMLDivElement>();
  const narrow = W < 480; // a phone: the readout docks under the plot instead of floating on it
  // one plot height for every chart (224, on the 8px grid; between a third and a half of any width the shell is
  // drawn at), with a 16px head above it and a 32px axis band below, so the whole drawing is 272 tall; the left
  // gutter holds the ticks and the cutoff's label
  const pad = { top: 16, right: 48, bottom: 32, left: 76 };
  const innerH = 224;
  const H = innerH + pad.top + pad.bottom;
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const id = useId();

  const t0 = points.length ? Date.parse(points[0].at) : 0;
  const t1 = points.length ? Date.parse(points[points.length - 1].at) : 0;
  const span = Math.max(t1 - t0, 1);
  const byTime = t1 - t0 > 36 * 3600 * 1000; // more than a day and a half apart: space the points by date
  const innerW = W - pad.left - pad.right;
  const x = (i: number) => {
    if (points.length === 1) return pad.left + innerW / 2;
    if (!byTime) return pad.left + (i * innerW) / (points.length - 1);
    return pad.left + ((Date.parse(points[i].at) - t0) / span) * innerW;
  };
  // one frame for every series: the full 0–100 scale, ticks every 20
  const y = (v: number) => pad.top + (1 - v / 100) * innerH;
  const crisp = (v: number) => Math.round(y(v)) + 0.5; // a 1px rule drawn on a whole pixel row
  const ticks = [0, 20, 40, 60, 80, 100];
  const last = points.length - 1;
  const hi = points.reduce((b, p, i) => (p.score > points[b].score ? i : b), 0);
  const lowest = points.reduce((b, p, i) => (p.score < points[b].score ? i : b), 0);
  // the length of the line up to each point, as a fraction of its whole length: the draw-on dashes the path by
  // length, so this (not the x position) is where the tip is when it reaches the point
  const along = points.reduce<number[]>((acc, p, i) => {
    if (i === 0) return [0];
    const q = points[i - 1];
    return [...acc, acc[i - 1] + Math.hypot(x(i) - x(i - 1), y(p.score) - y(q.score))];
  }, []);
  const reach = (i: number) => (along[last] ? along[i] / along[last] : 0);
  // a high (or low) that equals the current value on a flat run to the end would label the same number twice
  const flatToEnd = (i: number) => points.slice(i).every((p) => p.score === points[last].score);

  if (points.length === 0) return <p className="muted">{empty}</p>;

  // a label on the first point would sit in the axis labels, so it hangs to the right of it instead
  const anchor = (i: number) => (i === 0 ? "start" : i === last ? "end" : "middle");
  const lx = (i: number) => (i === 0 ? x(i) + 8 : i === last ? x(i) - 8 : x(i));
  const nearest = (clientX: number, svg: SVGSVGElement) => {
    const r = svg.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    return best;
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => setActive(nearest(e.clientX, e.currentTarget));
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(last, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? points.length) - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };
  const a = active === null ? null : points[active];
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const summary = `${label}: ${points.map((p) => `${day(p.at)} ${p.score}`).join(", ")}; cutoff ${cutoff}`;
  const dateTicks = points.length > 2 && x(last) - x(0) > 200 ? [0, Math.floor(last / 2), last] : points.length > 1 ? [0, last] : [0];
  // each mark fades in the moment the eased draw reaches its point, never before; the end marker and value get a
  // 40ms lead, where the ease-out has all but stopped the tip, so they land with the line rather than after it
  const delay = (i: number) => ({ animationDelay: `${Math.round(easeTime(reach(i)) * DRAW_MS) - (i === last ? 40 : 0)}ms` });
  const lowAbove = y(points[lowest].score) > H - pad.bottom - 24;
  // the readout sits beside its point, on the side away from the plot's near edge, just above the point when it is
  // in the lower half of the plot and just below when in the upper half; "just" means clear of the series where
  // the card will lie, so a flat line is not covered, and it never reaches the axis band or the top of the plot
  const when = (p: TimelinePoint) => `${dayYear(p.at)} · after ${p.attempt.note ?? KIND_WORDS[p.attempt.kind]} on ${topicNames[p.attempt.topicId] ?? p.attempt.topicId}`;
  const tipPlace = (i: number) => {
    const side = x(i) > W / 2 ? "left" : "right";
    const cardW = Math.min(300, W / 2 - 24); // the card's width (CSS caps it at half the plot)
    const cardH = when(points[i]).length * 6.6 > cardW - 20 ? 74 : 56; // and its height (one more line when the when-line wraps)
    // the card's near corner sits 12px past the point, so a leader dropped from the point meets its edge
    const xs = side === "right" ? [x(i) - 12, x(i) - 12 + cardW] : [x(i) + 12 - cardW, x(i) + 12];
    const yAt = (px: number) => {
      // the series' height at px, interpolated along its segment
      const j = points.findIndex((_, k) => k < last && x(k) <= px && px <= x(k + 1));
      if (j < 0) return y(points[px < x(0) ? 0 : last].score);
      const f = (px - x(j)) / (x(j + 1) - x(j) || 1);
      return y(points[j].score) + f * (y(points[j + 1].score) - y(points[j].score));
    };
    const inSpan = (k: number) => x(k) >= xs[0] && x(k) <= xs[1];
    const ys = [yAt(xs[0]), yAt(xs[1]), ...points.filter((_, k) => inSpan(k)).map((p) => y(p.score))];
    // the high and low labels hang off their points; the card clears them too
    const lowY = Math.max(...ys) + (inSpan(lowest) && !lowAbove ? 18 : 0);
    const highY = Math.min(...ys) - (inSpan(hi) ? 14 : 0);
    const py = y(points[i].score);
    const fitsBelow = pad.top + innerH - lowY - 10 >= cardH;
    const fitsAbove = highY - pad.top - 10 >= cardH;
    // the side that keeps the card nearest its point, with a nudge toward the emptier half of the plot
    const costAbove = py - highY + (py > pad.top + innerH / 2 ? 0 : 12);
    const costBelow = lowY - py + (py > pad.top + innerH / 2 ? 12 : 0);
    const above = fitsAbove && (!fitsBelow || costAbove <= costBelow);
    // the card's near edge (its bottom when above, its top when below) is 10px past highY or lowY (CSS); a leader
    // from the point to that edge shows which point it reads whenever the card cannot sit within 12px of it
    const edge = above ? highY - 10 : lowY + 10;
    return { side, v: above ? "above" : "below", edge, leader: Math.abs(edge - py) > 12, style: { left: `${x(i)}px`, top: `${above ? highY : lowY}px` } };
  };
  const tip = a && !narrow ? tipPlace(active!) : null;
  // the point being read carries its own card, so its high/low label gives way to it (and to the leader)
  const unlessRead = (i: number): React.CSSProperties => (active === i ? { visibility: "hidden" } : {});

  return (
    <figure className="chart timeline" ref={frame}>
      <div className="chart-head">
        <figcaption>
          <b>{label}</b> <span className="muted">· {caption ?? "recency-weighted score after each counted attempt"}</span>
        </figcaption>
        {!noTable && (
          <button className="link" aria-pressed={table} onClick={() => setTable(!table)}>
            {table ? "Chart" : "Show as a table"}
          </button>
        )}
      </div>
      {table ? (
        <table className="chart-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Attempt</th>
              <th className="num">Attempt score</th>
              <th className="num">{label} after it</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.attempt.id}>
                <td className="mono">{dayYear(p.at)}</td>
                <td>
                  {topicNames[p.attempt.topicId] ?? p.attempt.topicId} · {p.attempt.note ?? p.attempt.kind}
                </td>
                <td className="num mono">{attemptValue(p.attempt)}</td>
                <td className="num mono">{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="chart-plot" tabIndex={0} role="img" aria-label={summary} aria-describedby={a ? `${id}-tip` : undefined} onKeyDown={onKey} onBlur={() => setActive(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} onPointerMove={onMove} onPointerLeave={() => setActive(null)} aria-hidden="true">
            {ticks.map((v) => (
              <g key={v}>
                <line className={v === 0 ? "baseline" : "grid"} x1={pad.left} x2={W - pad.right} y1={crisp(v)} y2={crisp(v)} />
                {Math.abs(v - cutoff) > 6 && (
                  <text className="axis" x={pad.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle">
                    {v}
                  </text>
                )}
              </g>
            ))}
            {/* the cutoff is labelled in the axis gutter, like a tick, so it never meets the series */}
            <line className="cutoff" x1={pad.left} x2={W - pad.right} y1={crisp(cutoff)} y2={crisp(cutoff)} />
            <text className="axis" x={pad.left - 8} y={y(cutoff)} textAnchor="end" dominantBaseline="middle">
              cutoff {cutoff}
            </text>
            {dateTicks.map((i) => (
              <text key={i} className="axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}>
                {byTime ? day(points[i].at) : `attempt ${i + 1}${i === 0 ? ` · ${day(points[i].at)}` : ""}`}
              </text>
            ))}
            <path className="series draw-line" d={path} fill="none" pathLength={1} />
            {/* the point being read: a solid ink dot the size of the orange end dot, and a leader to its card */}
            {tip?.leader && <line className="leader" x1={Math.round(x(active!)) + 0.5} x2={Math.round(x(active!)) + 0.5} y1={y(a!.score)} y2={tip.edge} />}
            {a && active !== last && <circle className="marker active" cx={x(active!)} cy={y(a.score)} r={5} />}
            <circle className={`marker current draw-pop${active === last ? " active" : ""}`} cx={x(last)} cy={y(points[last].score)} r={5} style={delay(last)} />
            {hi !== last && hi !== lowest && points.length > 2 && !flatToEnd(hi) && (
              <text className="value draw-pop" x={lx(hi)} y={y(points[hi].score) - 10} textAnchor={anchor(hi)} style={{ ...delay(hi), ...unlessRead(hi) }}>
                {points[hi].score}
              </text>
            )}
            {lowest !== last && lowest !== hi && points.length > 2 && !flatToEnd(lowest) && (
              <text className="value draw-pop" x={lx(lowest)} y={y(points[lowest].score) + (lowAbove ? -10 : 18)} textAnchor={anchor(lowest)} style={{ ...delay(lowest), ...unlessRead(lowest) }}>
                {points[lowest].score}
              </text>
            )}
            <text className="value end draw-pop" x={x(last) + 10} y={y(points[last].score)} dominantBaseline="middle" style={delay(last)}>
              {points[last].score}
            </text>
          </svg>
          {a && (
            <div
              className={`chart-tip${narrow ? " docked" : ""}`}
              id={`${id}-tip`}
              role="status"
              style={tip?.style}
              data-side={tip?.side}
              data-v={tip?.v}
            >
              <b className="mono">{a.score}</b> <span>{label.toLowerCase()}</span>
              <span className="tip-when">{when(a)}</span>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ change by topic */

export interface ChangeRow {
  id: string;
  title: string;
  change: TopicChange;
}

/** How far each topic has moved: a bar to the right for growth, to the left for decline, from a shared zero. Rows
 * are HTML so the names and figures keep their size on a phone; only the bar is drawn. */
export function TopicChangeChart({ rows, window: win }: { rows: ChangeRow[]; window: number }) {
  const [active, setActive] = useState<string | null>(null);
  const [table, setTable] = useState(false);
  const id = useId();
  const sorted = useMemo(() => [...rows].sort((p, q) => q.change.delta - p.change.delta), [rows]);
  if (sorted.length === 0) return <p className="muted">Change needs at least two counted attempts on a topic.</p>;

  const max = Math.max(10, ...sorted.map((r) => Math.abs(r.change.delta)));
  const summary = `Change by topic over the last ${win} attempts: ${sorted.map((r) => `${r.title} ${signed(r.change.delta)}`).join(", ")}`;
  const a = sorted.find((r) => r.id === active) ?? null;
  const basisText = (c: TopicChange) => (c.basis === "window" ? `from ${c.before} before the last ${Math.min(win, c.attempts)} attempts to ${c.now} now` : `from ${c.before} on the first attempt to ${c.now} now, over ${c.attempts} attempts`);

  return (
    <figure className="chart change">
      <div className="chart-head">
        <figcaption>
          <b>Change by topic</b> <span className="muted">· current score against the score before the latest attempts</span>
        </figcaption>
        <button className="link" aria-pressed={table} onClick={() => setTable(!table)}>
          {table ? "Chart" : "Show as a table"}
        </button>
      </div>
      {table ? (
        <table className="chart-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th className="num">Before</th>
              <th className="num">Now</th>
              <th className="num">Change</th>
              <th className="num">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td className="num mono">{r.change.before}</td>
                <td className="num mono">{r.change.now}</td>
                <td className="num mono">{signed(r.change.delta)}</td>
                <td className="num mono">{r.change.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="change-rows" role="img" aria-label={summary} aria-describedby={a ? `${id}-tip` : undefined} onPointerLeave={() => setActive(null)}>
          {sorted.map((r, i) => {
            const d = r.change.delta;
            const w = (Math.abs(d) / max) * 50; // percent of the track, from the middle
            return (
              <div key={r.id} className={`change-row${active === r.id ? " active" : ""}`} tabIndex={0} onPointerMove={() => setActive(r.id)} onFocus={() => setActive(r.id)} onBlur={() => setActive(null)}>
                <span className="row-label">{r.title}</span>
                <span className="value mono draw-pop" style={{ animationDelay: `${i * 60 + 400}ms` }}>
                  {d > 0 ? "↑ " : d < 0 ? "↓ " : ""}
                  {signed(d)}
                </span>
                <span className="track" aria-hidden="true">
                  <span className="zero" />
                  <span className={`dbar ${d > 0 ? "up" : d < 0 ? "down" : "flat"}`} style={{ width: `${w}%`, [d < 0 ? "right" : "left"]: "50%", animationDelay: `${i * 60}ms` }} />
                </span>
                {active === r.id && (
                  <div className="chart-tip above" id={`${id}-tip`} role="status">
                    <b className="mono">{signed(d)}</b> <span>{r.title}</span>
                    <span className="tip-what">{basisText(r.change)}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div className="change-axis" aria-hidden="true">
            <span className="axis-row">
              <span className="axis">−{max}</span>
              <span className="axis">0</span>
              <span className="axis">+{max}</span>
            </span>
          </div>
        </div>
      )}
    </figure>
  );
}
