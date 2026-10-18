import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import { Math as Tex, RichText } from "../components/Math";
import { Citations } from "../components/Citation";

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
      <div className="row">
        <button className="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {!last ? (
          <button onClick={() => setI(i + 1)}>Next</button>
        ) : (
          <>
            <Link className="button" to={`/topic/${topic.id}/tutor`}>Talk it through with the tutor</Link>
            <Link className="button ghost" to={`/topic/${topic.id}/quiz`}>Take the quiz</Link>
          </>
        )}
      </div>
    </>
  );
}
