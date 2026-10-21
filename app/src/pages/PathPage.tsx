import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Eyebrow, KeyTitle, Note } from "../components/Hand";
import { StepTrack } from "../components/StepTrack";
import { PageView } from "../components/PageView";
import { Citations } from "../components/Citation";
import { useAi } from "../lib/ai";
import { KIND_LABEL, pathProgress, sentence, stepLink, two, usePaths } from "../lib/paths";
import type { CustomPath, CustomPathStep } from "../types";

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** What a path takes on and what it leaves out, in the model's words: "This path covers … It leaves out …". */
export function Coverage({ covers, leavesOut, className }: { covers?: string; leavesOut?: string; className: string }) {
  if (!covers && !leavesOut) return null;
  return (
    <p className={className}>
      {covers ? `This path covers ${sentence(covers)}` : ""}
      {covers && leavesOut ? " " : ""}
      {leavesOut ? `It leaves out ${sentence(leavesOut)}` : ""}
    </p>
  );
}

/**
 * One custom path: its title and goal, the steps as the settled track (ringed nodes on one baseline, orange only
 * into the current step), then each step with why it is here and the activity it opens, or its explanation inline.
 * The current step is the first not done and is the screen's one raised card; coming back resumes there.
 */
function Step({ path, step, i, current, onDone }: { path: CustomPath; step: CustomPathStep; i: number; current: boolean; onDone: (done: boolean) => void }) {
  const ai = useAi();
  const n = path.steps.length;
  const last = i === n - 1;
  const link = stepLink(step, { goal: path.goal, pathId: path.id });
  // a tutor session needs an AI service; without one, a done tutor step is not offered again (its title stays plain)
  const gated = step.kind === "tutor" && !ai.connected;
  const title = link && !(gated && step.done) ? <Link to={link.to}>{step.title}</Link> : step.title;
  return (
    <li id={`step-${i + 1}`} className={`path-step${step.done ? " done" : ""}${current ? " current" : ""}`} aria-current={current ? "step" : undefined}>
      <div className={current ? "ps-body card focal" : "ps-body"}>
        <p className="eyebrow">
          {"// "}{two(i + 1)} · {KIND_LABEL[step.kind]}{last ? " · mastery check" : ""}{step.done ? " · done" : current ? " · next up" : ""}
        </p>
        {step.done ? (
          <div className="ps-head">
            <h3>{title}</h3>
            <span className="status">
              <span aria-hidden="true">✓ </span>Done {step.doneAt ? <b className="mono">{when(step.doneAt)}</b> : ""} · <button className="link" onClick={() => onDone(false)}>Undo</button>
            </span>
          </div>
        ) : (
          <h3>{title}</h3>
        )}
        <p className="ps-why">{step.why}</p>
        {step.kind === "explain" && step.text && (
          <div className="ps-text">
            <PageView text={step.text} />
            {step.sources.length > 0 && <Citations sources={step.sources} />}
          </div>
        )}
        {gated && (
          <p className="muted">The tutor needs an AI service (<Link to="/settings">Settings</Link>); without one, take the topic's quiz as your check.</p>
        )}
        {!step.done && (
          <div className="row ps-actions">
            {current && link && <Link className="button" to={link.to}>{link.label}</Link>}
            {current ? (
              <button className={link ? "ghost" : undefined} onClick={() => onDone(true)}>{link ? "Mark as done" : "Done, next step"}</button>
            ) : (
              <button className="link" onClick={() => onDone(true)}>Mark as done</button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function PathPage() {
  const { id } = useParams();
  const ai = useAi();
  const { paths, setDone, touch } = usePaths();
  const path = paths.find((p) => p.id === id);
  const touched = useRef<string | null>(null);
  const opened = useRef<string | null>(null);

  // remember the visit (the list on Learn shows when a path was last opened)
  useEffect(() => {
    if (path && touched.current !== path.id) {
      touched.current = path.id;
      touch(path.id);
    }
  }, [path, touch]);

  const prog = path ? pathProgress(path) : null;

  // a path always opens at its top (the way back, the title, the goal and the track in view); the current node, its
  // note and the link under the track jump to the current step's card on request
  useEffect(() => {
    if (!path || opened.current === path.id) return;
    opened.current = path.id;
    window.scrollTo?.(0, 0);
  }, [path]);
  const jump = () => {
    if (!prog || prog.current < 0) return;
    const el = document.getElementById(`step-${prog.current + 1}`);
    if (!el) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  if (!path || !prog) {
    return (
      <>
        <p className="back"><Link to="/learn">← Study journey</Link></p>
        <p>That path is not here any more. <Link to="/paths/new">Build another one</Link>.</p>
      </>
    );
  }

  const { done, total, current } = prog;
  const allDone = current < 0;
  const mastery = path.steps[total - 1];
  const masteryLink = stepLink(mastery, { goal: path.goal, pathId: path.id });
  // a tutor check needs an AI service; without one, the wrap-up leads with the topic's quiz instead
  const tutorGated = mastery.kind === "tutor" && !ai.connected;
  const quizLink = tutorGated ? stepLink({ kind: "quiz", ref: `quiz:${mastery.ref.split(":")[1] ?? ""}` }, { goal: path.goal, pathId: path.id }) : null;
  const again = quizLink ?? masteryLink;
  const againLabel = quizLink ? "Take the quiz" : mastery.kind === "tutor" ? "Talk it through again" : "Take the quiz again";

  return (
    <>
      <p className="back"><Link to="/learn">← Study journey</Link></p>
      <Eyebrow>Your own path · {done} of {total} steps done</Eyebrow>
      <h1><KeyTitle text={path.title} /></h1>
      <p className="lede">{path.goal}</p>
      <Coverage covers={path.covers} leavesOut={path.leavesOut} className="path-covers" />
      <StepTrack
        at={allDone ? total : current}
        total={total}
        label="Path progress"
        note={allDone ? undefined : current === 0 ? "start here" : "you are here"}
        done={(i) => path.steps[i].done}
        counter={false}
        onJump={allDone ? undefined : jump}
      />
      {!allDone && (
        <p className="path-jump">
          <button type="button" className="link" onClick={jump}>Jump to the current step</button>
        </p>
      )}
      {allDone && (
        <section className="panel focal path-wrap" aria-label="Path complete">
          <p className="eyebrow">{"// Every step done"}{mastery.doneAt ? ` · ${when(mastery.doneAt)}` : ""}</p>
          <h2>You can do this now</h2>
          <p>{path.goal}</p>
          {path.concepts.length > 0 && (
            <p className="concepts">
              <span className="eyebrow inline">{"// Concepts"}</span>
              {path.concepts.map((c) => <span key={c} className="chip">{c}</span>)}
            </p>
          )}
          <p className="muted">Come back in a few days and do the check again from memory; that is what makes it stay.</p>
          {again && <Note dir="down" className="focal-note form-note">in a few days, from memory</Note>}
          <div className="row">
            {again && <Link className="button" to={again.to}>{againLabel}</Link>}
            <Link className="button ghost" to="/paths/new">Build another path</Link>
          </div>
          {tutorGated && (
            <p className="err-line path-gated" role="status">
              <span className="warn" aria-hidden="true">!</span>
              <span>Talking it through with the tutor again needs an AI service (<Link to="/settings">Settings</Link>); the quiz works without one.</span>
            </p>
          )}
        </section>
      )}
      <ol className="path-steps" aria-label="The steps">
        {path.steps.map((s, i) => (
          <Step key={i} path={path} step={s} i={i} current={i === current} onDone={(d) => setDone(path.id, i, d)} />
        ))}
      </ol>
      {(path.ask || path.filename) && (
        <p className="muted path-ask">
          {path.ask ? <>Your ask: “{path.ask}”</> : "Built from your file"}
          {path.filename ? <> · <b>{path.filename}</b></> : null}
        </p>
      )}
    </>
  );
}
