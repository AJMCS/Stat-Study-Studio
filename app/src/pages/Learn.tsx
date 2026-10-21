import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey, splitUnit, units, type TopicProgress } from "../lib/journey";
import { topicById } from "../mock/topics";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { JourneyMap, RowCurve, leafSize } from "../components/JourneyMap";
import { HArc, Ring } from "../components/Rail";
import { PATH_ROUTE, topicPath, type PathStep } from "../lib/learning";
import { pathProgress, usePaths } from "../lib/paths";
import { useAi } from "../lib/ai";
import type { CustomPath } from "../types";

const ACTIVITY_PATH = { tutor: "tutor", tutorial: "tutorial", quiz: "quiz", exam: "exam", vocab: "vocab", breakdown: "breakdown", check: "check" } as const;
const NEXT_LABEL: Record<PathStep, string> = { vocab: "Start with the vocabulary", tutorial: "Continue: the tutorial", breakdown: "Continue: break down a question", practice: "Continue: take the quiz" };

/** One line of mono state for a topic: not started / score and streak / revisit. */
export function StateLine({ r }: { r: TopicProgress }) {
  if (r.status === "new") return <span className="state">{r.touched ? "In progress" : "Not started"}</span>;
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

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** A saved path's node: the same ring as the list rows, its fill growing with the steps done. */
function PathNode({ done, total }: { done: number; total: number }) {
  const cls = done >= total ? "strength" : done > 0 ? "started" : "new";
  const dot = done >= total ? 12 : done > 0 ? 6 : 0;
  return (
    <span className={`row-node ${cls}`} style={{ width: 18, height: 18 }} aria-hidden="true">
      {dot > 0 && <span className="row-node-dot" style={{ width: dot, height: dot }} />}
    </span>
  );
}

/**
 * Where a learner's own question becomes a path: a short line in the journey's node-and-curve language (an ask, a
 * few stops, mastery), and the paths already built, each with its progress and a way back in.
 */
function OwnPaths() {
  const ai = useAi();
  const { paths, remove } = usePaths();
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <>
      <section className="own-path" aria-labelledby="own-h">
        <div className="own-copy">
          <p className="eyebrow">{"// Your own path"}</p>
          <h2 id="own-h">Start from your own question</h2>
          <p className="muted">
            A problem you can't do, an idea that won't settle, or the whole homework: say what you want to be able to do, or hand the file over, and your AI service draws a short path to it through this course.
          </p>
          {ai.connected ? (
            <p className="own-go">
              <Link className="button" to="/paths/new">Build my path</Link>
            </p>
          ) : (
            <p className="err-line own-noai" role="status">
              <span className="warn" aria-hidden="true">!</span>
              <span>
                Building a path needs an AI service, and none is connected. <Link to="/settings">Set one up in Settings</Link>.{paths.length > 0 ? " The paths below still open and work." : ""}
              </span>
            </p>
          )}
        </div>
        <div className="own-map" aria-hidden="true">
          <span className="st-track own-track">
            <Ring state="todo" />
            <HArc state="todo" />
            <Ring state="todo" />
            <HArc state="todo" />
            <Ring state="todo" />
            <HArc state="todo" />
            <Ring state="done" />
          </span>
          <span className="own-labels">
            <span className="own-label hand">your ask</span>
            <span className="own-label hand">mastery</span>
          </span>
        </div>
      </section>
      {paths.length > 0 && (
        <section className="own-list" aria-label="Your paths">
          <p className="eyebrow">{"// Your paths · "}{paths.length}</p>
          <ol className="path-rows">
            {paths.map((p: CustomPath) => {
              const { done, total } = pathProgress(p);
              return (
                <li key={p.id} className="path-row">
                  <span className="path-node"><PathNode done={done} total={total} /></span>
                  <Link to={`/paths/${p.id}`} className="topic-link">
                    <span className="jl-title">{p.title}</span>
                    <span className="jl-intro">{p.goal}</span>
                  </Link>
                  <span className="path-meta">
                    <span className="state">
                      {done >= total && <span aria-hidden="true">✓ </span>}
                      <b>{done}</b> of <b>{total}</b> steps · opened <b className="mono">{when(p.openedAt)}</b>
                    </span>
                    <span className="path-actions">
                      <Link to={`/paths/${p.id}`}>{done >= total ? "Open" : done > 0 ? "Resume" : "Start"}</Link>
                      {confirm === p.id ? (
                        <span className="path-confirm">
                          <button className="danger btn-sm" onClick={() => { remove(p.id); setConfirm(null); }}>Remove for good</button>
                          <button className="link" onClick={() => setConfirm(null)}>Keep it</button>
                        </span>
                      ) : (
                        <button className="link path-remove" onClick={() => setConfirm(p.id)}>Remove</button>
                      )}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </>
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
  const curNext = topicPath(data, cur.topic).next;

  return (
    <>
      <Eyebrow>
        Learn · {units().length} units · {rows.length} topics · {done} solid
      </Eyebrow>
      <h1>
        Your study <Scribble>journey</Scribble>
      </h1>
      <p className="lede">
        Each topic is a stop on the way to the exam. The fuller a node, the better you know it.
        <br />
        Or <Link to="/paths/new">build your own path</Link> from a question or your homework.
      </p>

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
              <Link className="button ghost" to={`/topic/${cur.topic.id}/${PATH_ROUTE[curNext]}`}>{NEXT_LABEL[curNext]}</Link>
            </div>
          </section>
        )}

        <OwnPaths />
        <JourneyList rows={rows} current={current} />
        <p className="glossary-line">
          Stuck on a word? <Link to="/glossary">The glossary</Link> has every term from the lectures, with search.
        </p>
      </div>
    </>
  );
}
