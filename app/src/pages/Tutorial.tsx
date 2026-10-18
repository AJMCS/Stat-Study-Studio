import { useState } from "react";
import { PageView } from "../components/PageView";
import { Link, useParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import { Math as Tex, RichText } from "../components/Math";
import { Citations } from "../components/Citation";

function Example({ n, prompt, solution }: { n: number; prompt: string; solution: string }) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState("");
  return (
    <section className="panel example" aria-label={`Worked example ${n}`}>
      <h3>Worked example {n}: try it first</h3>
      <p><RichText text={prompt} /></p>
      <label className="field">
        <span>Your attempt (optional, not saved)</span>
        <textarea rows={4} value={attempt} onChange={(e) => setAttempt(e.target.value)} placeholder="Work it out here or on paper, then compare." />
      </label>
      <button className="ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Hide the solution" : "Show the solution"}</button>
      {open && (
        <div className="reference" role="region" aria-label={`Solution to worked example ${n}`}>
          <PageView text={solution} />
          <p className="muted">Compare with your attempt. Where did your steps differ? Go back to the step above and the lecture page it cites.</p>
        </div>
      )}
    </section>
  );
}

export function Tutorial() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const [i, setI] = useState(0);
  if (!topic) return <p>Topic not found.</p>;
  const step = topic.tutorial[i];
  const src = step.sourceId ? sourceById(step.sourceId) : undefined;
  const last = i === topic.tutorial.length - 1;

  return (
    <>
      <p><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <h1>{topic.title}: tutorial</h1>
      <p className="muted">Step {i + 1} of {topic.tutorial.length}. Grounded in the lecture notes and their notation.</p>
      <progress value={i + 1} max={topic.tutorial.length} aria-label="Tutorial progress" />
      <article className="panel" aria-live="polite">
        <h2>{step.heading}</h2>
        <p><RichText text={step.body} /></p>
        {step.formula && <div className="formula"><Tex tex={step.formula} display /></div>}
        {src && <Citations sources={[src]} />}
      </article>
      {(step.examples ?? []).map((ex, n) => (
        <Example key={`${i}-${n}`} n={n + 1} prompt={ex.prompt} solution={ex.solution} />
      ))}
      <div className="row">
        <button className="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {!last ? (
          <button onClick={() => setI(i + 1)}>Next</button>
        ) : (
          <>
            <Link className="button" to={`/topic/${topic.id}/quiz`}>Take the quiz</Link>
            <Link className="button ghost" to={`/topic/${topic.id}`}>Back to the topic</Link>
          </>
        )}
      </div>
    </>
  );
}
