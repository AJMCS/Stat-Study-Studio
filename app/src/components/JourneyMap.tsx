import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { splitUnit, units, type TopicProgress } from "../lib/journey";
import { Note } from "./Hand";

/*
 * The course drawn in the node-and-curve language of the reference: each unit is a large ringed hub (with one small
 * dot per topic inside, filled when that topic is solid) on a horizontal route to the exam; its topics fan out of the
 * hub on S-curves to leaf nodes whose size and fill encode mastery. Exactly one route, to the current topic, is orange.
 * Labels sit to the right of each leaf, in the open column before the next hub, never on a line.
 */

const W = 1200;
// Leaf labels are at most two title lines plus one meta line (about 80px tall), so leaves are spaced at least 95px
// apart and the topmost label still clears the top edge. Unit names live in their own band above the map.
const H = 365;
const MID = 210;
const HUB_R = 34;
const HUB_X = [56, 416, 776];
const LEAF_DX = 130;
const END_X = 1150;
const FAN: Record<number, number[]> = { 1: [-95], 2: [-95, 95], 3: [-163, -72, 110], 4: [-163, -72, 110, 190] };

/**
 * One node vocabulary: a ring with a single inner fill whose size encodes mastery. Topics share one ring size; the
 * fill grows from nothing (not started) to nearly filling the ring (90+). Hubs are the same node, larger.
 */
const fillFor = (score: number | null, ring: number) => {
  if (score === null) return 0;
  const m = Math.min(1, Math.max(0, (score - 40) / 52));
  return Math.round(ring * (0.22 + m * 0.6));
};
export function leafSize(r: TopicProgress) {
  return { ring: 16, dot: fillFor(r.score, 16) };
}

export function JourneyMap({
  rows,
  current,
  meta,
  note,
  label,
}: {
  rows: TopicProgress[];
  /** The topic the orange route leads to; omit for a map without a route. */
  current?: string;
  /** The mono line under each label. */
  meta: (r: TopicProgress) => ReactNode;
  /** A hand-lettered note beside the current topic. */
  note?: string;
  label?: string;
}) {
  const us = units();
  const layout = us.map((u, k) => {
    const hx = HUB_X[k] ?? 40 + k * 360;
    const topics = rows.filter((r) => r.topic.unit === u);
    const fan = FAN[topics.length] ?? topics.map((_, j) => -160 + (j * 320) / Math.max(1, topics.length - 1));
    return { u, k, hx, nodes: topics.map((r, j) => ({ r, x: hx + LEAF_DX, y: MID + fan[j], size: leafSize(r) })) };
  });
  const pos = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
  const fanPath = (hx: number, x: number, y: number, ring: number) =>
    `M${hx + HUB_R} ${MID} C${hx + 95} ${MID}, ${x - 80} ${y}, ${x - ring} ${y}`;

  return (
    <div className="journey" aria-hidden="true" data-label={label}>
    <div className="jn-band">
      {layout.map((l) => {
        const [num, name] = splitUnit(l.u);
        return (
          <span key={l.u} className="jn-unit" style={{ left: `${((l.hx - HUB_R) / W) * 100}%` }}>
            {num}: {name.toLowerCase()}
          </span>
        );
      })}
    </div>
    <div className="journey-map">
      <svg viewBox={`0 0 ${W} ${H}`} className="journey-svg">
        {/* the route: hub to hub to the exam */}
        {layout.map((l) => {
          const nx = l.k + 1 < layout.length ? (HUB_X[l.k + 1] ?? l.hx + 360) : END_X;
          const nr = l.k + 1 < layout.length ? HUB_R : 18;
          return <line key={l.u} x1={l.hx + HUB_R} y1={MID} x2={nx - nr} y2={MID} className="path" />;
        })}
        {/* fans: grey first, then the one orange branch on top */}
        {layout.map((l) => l.nodes.map((n) => <path key={n.r.topic.id} d={fanPath(l.hx, n.x, n.y, n.size.ring)} className="path" />))}
        {layout.map((l) =>
          l.nodes.filter((n) => n.r.topic.id === current).map((n) => <path key="cur" d={fanPath(l.hx, n.x, n.y, n.size.ring)} className="path active" />),
        )}
        {/* hubs */}
        {layout.map((l) => (
          <g key={l.u} className="hub">
            <circle cx={l.hx} cy={MID} r={HUB_R} className="ring" />
            {(() => {
              const scored = l.nodes.filter((n) => n.r.score !== null);
              const avg = scored.length ? scored.reduce((t, n) => t + n.r.score!, 0) / scored.length : null;
              const d = fillFor(avg, HUB_R);
              return d > 0 ? <circle cx={l.hx} cy={MID} r={d} className="dot" /> : null;
            })()}
          </g>
        ))}
        <g className="hub end">
          <circle cx={END_X} cy={MID} r={20} className="ring" />
          <circle cx={END_X} cy={MID} r={5} className="dot" />
        </g>
        {/* leaves */}
        {layout.map((l) =>
          l.nodes.map((n) => {
            const cur = n.r.topic.id === current;
            return (
              <g key={n.r.topic.id} className={`leaf ${n.r.status}${cur ? " current" : ""}`}>
                {cur && <circle cx={n.x} cy={n.y} r={n.size.ring + 7} className="halo" />}
                <circle cx={n.x} cy={n.y} r={n.size.ring} className="ring" />
                {(n.size.dot > 0 || cur) && <circle cx={n.x} cy={n.y} r={Math.max(n.size.dot, 4)} className="dot" />}
              </g>
            );
          }),
        )}
      </svg>

      <span className="jn-exam" style={pos(END_X, MID + 22)}>the exam</span>

      {layout.map((l) =>
        l.nodes.map((n) => {
          const cur = n.r.topic.id === current;
          return (
            <Link key={n.r.topic.id} to={`/topic/${n.r.topic.id}`} tabIndex={-1} className={`jn-topic${cur ? " current" : ""}`} style={pos(n.x + n.size.ring + 22, n.y)}>
              <span className="jn-title" title={n.r.topic.title}>{n.r.topic.title}</span>
              <span className="jn-meta">
                {meta(n.r)}
                {cur && note && <Note dir="left" className="jn-here">{note}</Note>}
              </span>
            </Link>
          );
        }),
      )}
    </div>
    </div>
  );
}

/** A short vertical S-curve segment for list rows (top edge to bottom edge, through the node at the middle). */
export function RowCurve({ state }: { state: "none" | "passed" | "current" }) {
  return (
    <svg className="row-curve" viewBox="0 0 32 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M16 0 C 27 18, 27 32, 16 50" className={state === "current" ? "path active" : "path"} />
      <path d="M16 50 C 5 68, 5 82, 16 100" className="path" />
    </svg>
  );
}
