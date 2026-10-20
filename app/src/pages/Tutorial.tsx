import { useRef, useState } from "react";
import { PageView } from "../components/PageView";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import { checksFor } from "../mock/comprehension";
import { answered, useLearning } from "../lib/learning";
import { Math as Tex, RichText } from "../components/Math";
import { Citations } from "../components/Citation";
import { Annotated, Eyebrow, KeyTitle } from "../components/Hand";
import { StepTrack } from "../components/StepTrack";
import { StepChecks } from "../components/CheckItem";

const two = (n: number) => String(n).padStart(2, "0");

function Example({ n, prompt, solution }: { n: number; prompt: string; solution: string }) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState("");
  return (
    <section className="panel example" aria-label={`Worked example ${n}`}>
      <h3>
        Worked example <b className="mono">{n}</b>: try it first
      </h3>
      <p><RichText text={prompt} /></p>
      <label className="field">
        <span>Your attempt (optional, not saved)</span>
        <textarea rows={4} value={attempt} onChange={(e) => setAttempt(e.target.value)} placeholder="Work it out here or on paper, then compare." />
      </label>
      <Annotated note={open ? "where did your steps differ?" : "try it on paper first"}>
        <button className="ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Hide the solution" : "Show the solution"}</button>
      </Annotated>
      {open && (
        <div className="reference" role="region" aria-label={`Solution to worked example ${n}`}>
          <PageView text={solution} />
          <p className="muted">Compare with your attempt. Where did your steps differ? Go back to the step above and the lecture page it cites.</p>
        </div>
      )}
    </section>
  );
}

/**
 * One tutorial step, its worked examples, then its comprehension check. While the check is being answered (the
 * learner has clicked or tabbed into it), the step's body is folded behind a "Re-read the step" disclosure, so the
 * sentence that answers the question is not sitting in the viewport; it reopens on request, and expands for good
 * once every question in the step's check is marked.
 *
 * The way forward is explicit: "Next step" appears once the step's check is marked. Before that the only forward
 * control is the text link "Skip the check for now", which records the step's unanswered checks as not answered (so
 * the checks page and the topic page list the step among those to review) and then moves on.
 */
export function Tutorial() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { learning, skipChecks } = useLearning();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [answering, setAnswering] = useState(false); // the learner is in the check, so the step is folded
  const total = topic?.tutorial.length ?? 0;
  const fromUrl = Number(params.get("step") ?? "1") - 1;
  const i = Number.isInteger(fromUrl) && fromUrl >= 0 && fromUrl < total ? fromUrl : 0;
  if (!topic) return <p>Topic not found.</p>;
  const go = (n: number) => {
    setParams({ step: String(n + 1) }, { replace: true });
    setAnswering(false);
    window.scrollTo?.(0, 0);
  };
  const step = topic.tutorial[i];
  const src = step.sourceId ? sourceById(step.sourceId) : undefined;
  const last = i === total - 1;
  const checks = checksFor(topic.id);
  const answers = learning.checks[topic.id] ?? {};
  const mine = checks.filter((c) => c.step === i);
  const marked = mine.every((c) => answered(answers[c.id])); // every question of this step's check is marked
  const isFolded = answering && !marked;
  const startAnswering = () => {
    if (!marked && !answering) setAnswering(true);
  };
  const skip = () => {
    skipChecks(topic.id, i);
    if (last) navigate(`/topic/${topic.id}/check`);
    else go(i + 1);
  };
  // A pointer press focuses an option before the click lands; folding then would move the option out from under
  // the pointer and lose the click. So a pointer folds the step on the click (in the bubble phase, so the fold and
  // the option's change land in one render; a re-render between the two would reset the controlled radio), and only
  // keyboard focus folds at once.
  const pointer = useRef(false);
  const zone = {
    onPointerDownCapture: () => {
      pointer.current = true;
    },
    onPointerUpCapture: () => {
      pointer.current = false;
    },
    onClick: () => {
      pointer.current = false;
      startAnswering();
    },
    onFocusCapture: () => {
      if (!pointer.current) startAnswering();
    },
  };

  return (
    <>
      <p className="back"><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <Eyebrow>Tutorial · step {two(i + 1)} of {two(total)}</Eyebrow>
      <h1><KeyTitle text={topic.title} /></h1>
      <p className="muted">A guided lesson grounded in the lecture notes and their notation, with a short check after each step.</p>
      <StepTrack at={i} total={total} label="Tutorial progress" note={i === 0 ? "start here" : "you are here"} />
      <article className={`panel focal step-card${isFolded ? " folded" : ""}`} aria-live="polite">
        {isFolded ? (
          <div className="step-folded">
            <p className="eyebrow">{"// Step "}{two(i + 1)}{" of "}{two(total)}{" · folded"}</p>
            <p>
              The step is out of sight while you answer its check.{" "}
              <button className="link" aria-expanded={false} aria-controls={`step-${i + 1}`} onClick={() => setAnswering(false)}>Re-read the step</button>
            </p>
          </div>
        ) : (
          <div id={`step-${i + 1}`}>
            <h2>{step.heading}</h2>
            <p><RichText text={step.body} /></p>
            {step.formula && <div className="formula"><Tex tex={step.formula} display /></div>}
            {src && <Citations sources={[src]} />}
          </div>
        )}
      </article>
      {(step.examples ?? []).map((ex, n) => (
        <Example key={`${i}-${n}`} n={n + 1} prompt={ex.prompt} solution={ex.solution} />
      ))}
      <div className="checks-zone" {...zone}>
        <StepChecks key={i} topicId={topic.id} step={i} checks={checks} note="every option, explained" />
      </div>
      <div className="row step-nav">
        <button className="ghost" disabled={i === 0} onClick={() => go(i - 1)}>Back</button>
        {!marked ? (
          <button className="link skip-check" onClick={skip}>Skip the check for now</button>
        ) : !last ? (
          <button onClick={() => go(i + 1)}>Next step</button>
        ) : (
          <>
            <Link className="button" to={`/topic/${topic.id}/breakdown`}>Next: break down a question</Link>
            <Link className="button ghost" to={`/topic/${topic.id}/check`}>See all your checks</Link>
          </>
        )}
      </div>
      {!marked && (
        <p className="muted skip-note">
          Skipping records this check as not answered and lists the step among the steps to review.
        </p>
      )}
    </>
  );
}
