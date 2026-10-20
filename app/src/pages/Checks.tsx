import { Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { topicById } from "../mock/topics";
import { checksFor } from "../mock/comprehension";
import { useStore } from "../lib/store";
import { answered, checkProgress } from "../lib/learning";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { StepChecks } from "../components/CheckItem";
import { Result } from "../components/Result";

const two = (n: number) => String(n).padStart(2, "0");

/** One hand-lettered aside per step group, on the verdict row of its first marked question, worded differently each time. */
const NOTES = ["every option, explained", "why the others miss", "the reasons, one click away", "each option, with its why", "see what the others get wrong"];

/**
 * Every comprehension check of a topic, grouped by tutorial step, with a results summary and the steps to review.
 * A step's title can answer its own first question ("Fixed parameter, no prior" over "how is p treated?"), so a
 * group is headed by its number alone until every question in it is marked; the title then appears in the heading,
 * the results list and the link to review the step. A step whose check was skipped in the tutorial is listed as not
 * answered, among the steps to review, until it is answered here or there.
 */
export function Checks() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data } = useStore();
  if (!topic) return <p>Topic not found.</p>;
  const checks = checksFor(topic.id);
  const p = checkProgress(data.learning, topic);
  const answers = data.learning.checks[topic.id] ?? {};
  const finished = p.done === p.total;
  const selfMarked = checks.filter((c) => answers[c.id]?.rating).length;
  const steps = topic.tutorial.length;
  /** Every question of the step is marked, so its title no longer gives anything away. */
  const marked = (i: number) => checks.filter((c) => c.step === i).every((c) => answered(answers[c.id]));
  /** The step's name: its title once marked, otherwise its number (a data number, so mono). */
  const stepName = (i: number) =>
    marked(i) ? (
      topic.tutorial[i].heading
    ) : (
      <>
        Step <b className="mono">{two(i + 1)}</b> of <b className="mono">{two(steps)}</b>
      </>
    );
  const stepText = (i: number) => (marked(i) ? topic.tutorial[i].heading : `Step ${two(i + 1)} of ${two(steps)}`);
  /** The card's one hand note, pointing down at the step list. */
  const noteText = p.review.length > 0 ? "start with the steps to review" : p.done > 0 ? "nothing to review so far" : "each step has its own questions";

  return (
    <>
      <p className="back"><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <Eyebrow>Comprehension · {topic.title}</Eyebrow>
      <h1>Comprehension <Scribble>checks</Scribble></h1>
      <p className="lede">Short questions about the ideas behind each tutorial step, not the arithmetic. Every option says why it is right or wrong, with the lecture page that settles it.</p>

      <section className="panel focal check-summary summary" aria-label="Your results">
        <p className="eyebrow">{finished ? "// Results · every check answered" : "// Results so far"}</p>
        <div className="stats">
          <div><b className="lead">{p.right}</b><span>Right</span></div>
          <div><b>{p.done}</b><span>of {p.total} answered</span></div>
          <div><b>{p.review.length}</b><span>Steps to review</span></div>
        </div>
        {(p.done > 0 || p.skipped.length > 0) && (
          <Result ok={p.review.length === 0}>
            {p.review.length > 0 ? (
              <>
                <b className="mono">{p.review.length}</b> {p.review.length === 1 ? "step needs" : "steps need"} another look:{" "}
                {p.review.map((i, k) => (
                  <Fragment key={i}>
                    {k > 0 && "; "}
                    {stepName(i)}
                    {p.skipped.includes(i) && " (not answered)"}
                  </Fragment>
                ))}
                .
              </>
            ) : finished ? (
              "Every step understood."
            ) : (
              "Every step answered so far is understood."
            )}
          </Result>
        )}
        {selfMarked > 0 && (
          <p className="muted self-marked">
            <b className="mono">{selfMarked}</b> of the <b className="mono">{p.done}</b> are one-sentence answers you marked yourself against the reference; the rest were marked automatically.
          </p>
        )}
        <div className="summary-head">
          <p className="eyebrow">{"// By tutorial step"}</p>
          <Note dir="down" className="summary-note">{noteText}</Note>
        </div>
        <ol className="step-list">
          {topic.tutorial.map((s, i) => {
            const mine = checks.filter((c) => c.step === i);
            const got = mine.filter((c) => answered(answers[c.id]));
            const right = got.filter((c) => answers[c.id].credit >= 1).length;
            const review = p.review.includes(i);
            const skipped = p.skipped.includes(i);
            const done = got.length === mine.length;
            return (
              <li key={i} className={review ? "review" : done ? "done" : ""}>
                <span className="sl-n mono">{two(i + 1)}</span>
                <span className="sl-title">
                  {done ? s.heading : <><b className="mono">{mine.length}</b> {mine.length === 1 ? "question" : "questions"}</>}
                </span>
                <span className="status">
                  {got.length === 0 ? (
                    skipped ? "Not answered" : "Not answered yet"
                  ) : skipped ? (
                    <><b className="mono">{got.length}</b> of <b className="mono">{mine.length}</b> answered, the rest skipped</>
                  ) : !done ? (
                    <><b className="mono">{got.length}</b> of <b className="mono">{mine.length}</b> answered, <b className="mono">{right}</b> right</>
                  ) : review ? (
                    <><b className="mono">{right}</b> of <b className="mono">{mine.length}</b> right</>
                  ) : (
                    <>All <b className="mono">{mine.length}</b> right</>
                  )}
                </span>
                <Link to={`/topic/${topic.id}/tutorial?step=${i + 1}`} className="sl-go">
                  {review ? "Review the step" : "Open the step"}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {topic.tutorial.map((_, i) => (
        <StepChecks key={i} topicId={topic.id} step={i} checks={checks} title={stepName(i)} titleText={stepText(i)} note={NOTES[i % NOTES.length]} />
      ))}

      <div className="row">
        <Link className="button" to={`/topic/${topic.id}/breakdown`}>Next: break down a question</Link>
        <Link className="button ghost" to={`/topic/${topic.id}`}>Back to the topic</Link>
      </div>
    </>
  );
}
