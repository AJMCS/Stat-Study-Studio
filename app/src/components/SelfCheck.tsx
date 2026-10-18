import { RichText } from "./Math";
import { PageView } from "./PageView";
import { selfScore } from "../lib/scoring";

/**
 * Comparing your own answer with a reference, then scoring yourself. Used when no AI model is connected.
 * Shows the reference solution and a checklist of what a full answer covers; the score is the share you tick.
 */
export function SelfCheck({
  answer,
  reference,
  keyPoints,
  got,
  onChange,
  disabled = false,
}: {
  answer: string;
  /** Markdown with LaTeX. */
  reference: string;
  keyPoints: string[];
  got: boolean[];
  onChange: (got: boolean[]) => void;
  disabled?: boolean;
}) {
  const score = selfScore(got);
  return (
    <div className="selfcheck">
      <h3>Your answer</h3>
      <pre className="answer">{answer.trim() || "(no answer written)"}</pre>
      <h3>Reference solution</h3>
      <div className="reference">
        <PageView text={reference} />
      </div>
      <fieldset disabled={disabled}>
        <legend>Tick what your answer covered</legend>
        {keyPoints.map((kp, i) => (
          <label key={i} className="choice">
            <input type="checkbox" checked={got[i] ?? false} onChange={(e) => onChange(keyPoints.map((_, j) => (j === i ? e.target.checked : got[j] ?? false)))} />
            <span><RichText text={kp} /></span>
          </label>
        ))}
      </fieldset>
      <p role="status" className="muted">
        Self-score: <b>{score}</b>/100. Scored by you against the reference, and marked <i>self-scored</i> in your progress.
      </p>
    </div>
  );
}

export type Rating = "got" | "partly" | "missed";
export const RATING_CREDIT: Record<Rating, number> = { got: 1, partly: 0.5, missed: 0 };
const LABEL: Record<Rating, string> = { got: "I got it", partly: "Partly", missed: "I missed it" };

/** A quick three-way self-rating against a short reference answer (quiz questions). */
export function SelfRate({
  answer,
  reference,
  value,
  onChange,
  name,
  disabled = false,
}: {
  answer: string;
  reference: string;
  value: Rating | null;
  onChange: (r: Rating) => void;
  name: string;
  disabled?: boolean;
}) {
  return (
    <div className="selfcheck">
      <h4>Your answer</h4>
      <pre className="answer">{answer.trim() || "(drawing only)"}</pre>
      <h4>Reference answer</h4>
      <p className="reference"><RichText text={reference} /></p>
      <fieldset disabled={disabled}>
        <legend>How did your answer compare?</legend>
        {(Object.keys(LABEL) as Rating[]).map((r) => (
          <label key={r} className="choice">
            <input type="radio" name={name} checked={value === r} onChange={() => onChange(r)} />
            <span>{LABEL[r]}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
