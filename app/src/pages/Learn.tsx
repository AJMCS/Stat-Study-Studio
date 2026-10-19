import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey, splitUnit, units, type TopicProgress } from "../lib/journey";
import { topicById } from "../mock/topics";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { JourneyMap, RowCurve, leafSize } from "../components/JourneyMap";

const ACTIVITY_PATH = { tutor: "tutor", tutorial: "tutorial", quiz: "quiz", exam: "exam" } as const;

/** One line of mono state for a topic: not started / score and streak / revisit. */
export function StateLine({ r }: { r: TopicProgress }) {
  if (r.status === "new") return <span className="state">Not started</span>;
  return (
    <span className="state">
      {r.status === "revisit" && <>Revisit · </>}
      {r.status === "strength" && <span aria-hidden="true">✓ </span>}
      Score <b>{r.score}</b> · Streak <b>{r.streak}</b>
    </span>
  );
}

/** A list-row node whose size and fill follow mastery, matching the map. */
export function RowNode({ r, current, uniform }: { r: TopicProgress; current?: boolean; uniform?: boolean }) {
  if (uniform) {
    // One node size; only the fill says how far along the topic is (the mono state text says it exactly).
    const dot = r.status === "strength" ? 12 : r.score !== null || current ? 6 : 0;
    return (
      <span className={`row-node ${r.status}${current ? " current" : ""}`} style={{ width: 18, height: 18 }} aria-hidden="true">
        {dot > 0 && <span className="row-node-dot" style={{ width: dot, height: dot }} />}
      </span>
    );
  }
  const s = leafSize(r);
  const d = Math.max(12, Math.round(s.ring * 1.3));
  return (
    <span className={`row-node ${r.status}${current ? " current" : ""}`} style={{ width: d, height: d }} aria-hidden="true">
      {(s.dot > 0 || current) && <span className="row-node-dot" style={{ width: Math.max(5, Math.round(s.dot * 1.3)), height: Math.max(5, Math.round(s.dot * 1.3)) }} />}
    </span>
  );
}

/** The same journey as an accessible list; on phones it is the journey itself, a vertical curved path. */
export function JourneyList({ rows, current, className }: { rows: TopicProgress[]; current?: string; className?: string }) {
  const curIndex = rows.findIndex((r) => r.topic.id === current);
  const firstOfUnit = (u: string) => rows.findIndex((r) => r.topic.unit === u);
  return (
    <section aria-label="Topics" className={`journey-list${className ? ` ${className}` : ""}`}>
      <ol>
        {units().map((u) => {
          const [num, name] = splitUnit(u);
          const reached = firstOfUnit(u) <= curIndex;
          return (
            <Fragment key={u}>
              <li className={`jl-station${reached ? " passed" : ""}`}>
                <RowCurve state={reached ? "passed" : "none"} />
                <span className="jl-hub" aria-hidden="true" />
                <h2 className="jl-unit">
                  <span className="eyebrow inline">{"// "}{num}</span>
                  <span className="jl-unit-name">{name}</span>
                </h2>
              </li>
              {rows
                .map((r, i) => ({ r, i }))
                .filter(({ r }) => r.topic.unit === u)
                .map(({ r, i }) => (
                  <li key={r.topic.id} className={`${r.status}${i < curIndex ? " passed" : ""}${i === curIndex ? " current" : ""}`}>
                    <RowCurve state={i < curIndex ? "passed" : i === curIndex ? "current" : "none"} />
                    <span className="jl-node"><RowNode r={r} current={i === curIndex} /></span>
                    <Link to={`/topic/${r.topic.id}`} className="topic-link">
                      <span className="jl-title">{r.topic.title}</span>
                      <span className="jl-intro">{r.topic.intro.split(". ")[0]}.</span>
                    </Link>
                    <span className="jl-state">
                      <StateLine r={r} />
                      {i === curIndex && <Note dir="left" className="jl-here">next up</Note>}
                    </span>
                  </li>
                ))}
            </Fragment>
          );
        })}
        <li className="jl-station end">
          <RowCurve state="none" />
          <span className="jl-hub end" aria-hidden="true" />
          <span className="jl-end">the exam</span>
        </li>
      </ol>
    </section>
  );
}

export function Learn() {
  const { data, setSession } = useStore();
  const nav = useNavigate();
  const [includeSelf] = useIncludeSelfScored();
  const [hideResume, setHideResume] = useState(false);
  const rows = journey(data, includeSelf);
  const current = currentTopicId(data, rows);
  const cur = rows.find((r) => r.topic.id === current)!;
  const s = data.session;
  const resumeTopic = s ? topicById(s.topicId) : undefined;
  const done = rows.filter((r) => r.status === "strength").length;

  return (
    <>
      <Eyebrow>
        Learn · {units().length} units · {rows.length} topics · {done} solid
      </Eyebrow>
      <h1>
        Your study <Scribble>journey</Scribble>
      </h1>
      <p className="lede">Each topic is a stop on the way to the exam. The fuller a node, the better you know it.</p>

      <JourneyMap rows={rows} current={current} meta={(r) => <StateLine r={r} />} note="next up" />

      <div className="learn-body">
        <div className="here-row mobile-only-flex">
          <Note dir="down" className="here-note">you are here</Note>
          <Link to={`/topic/${cur.topic.id}`} className="here-link">
            <span className="here-node"><RowNode r={cur} current /></span>
            <span className="here-text">
              <span className="eyebrow">{"// Next up · "}{splitUnit(cur.topic.unit)[0]}</span>
              <span className="jl-title">{cur.topic.title}</span>
              <StateLine r={cur} />
            </span>
          </Link>
        </div>
        {s && resumeTopic && !hideResume ? (
          <section className="panel next-up" aria-label="Resume previous session">
            <div>
              <p className="eyebrow">{"// Pick up where you left off · "}{s.activity} · {new Date(s.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
              <h2>{resumeTopic.title}</h2>
            </div>
            <div className="row">
              <button onClick={() => nav(`/topic/${s.topicId}/${ACTIVITY_PATH[s.activity]}`)}>Resume</button>
              <button
                className="ghost"
                onClick={() => {
                  setHideResume(true);
                  setSession(null);
                }}
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : (
          <section className="panel next-up" aria-label="Next topic">
            <div>
              <p className="eyebrow">{"// Next up · "}{splitUnit(cur.topic.unit)[0]}</p>
              <h2>{cur.topic.title}</h2>
              <p className="muted">{cur.topic.intro.split(". ")[0]}.</p>
            </div>
            <div className="row">
              <Link className="button" to={`/topic/${cur.topic.id}`}>Open topic</Link>
              <Link className="button ghost" to={`/topic/${cur.topic.id}/tutorial`}>Start the tutorial</Link>
            </div>
          </section>
        )}

        <JourneyList rows={rows} current={current} />
      </div>
    </>
  );
}
