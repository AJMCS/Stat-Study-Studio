import { CRITERIA, CRITERION_LABELS, type CriterionFeedback, type CriterionScores, type ScoringConfig } from "../types";
import { composite } from "../lib/scoring";

export function StreakIndicator({ streak, warn, flagged }: { streak: number; warn: string[]; flagged?: boolean }) {
  return (
    <span className="streak" title="Retention streak: qualifying recalls across revisits, not daily use">
      <span aria-hidden>🔥</span> {streak}
      <span className="sr-only"> retention streak</span>
      {warn.length > 0 && (
        <span className="warn" role="img" aria-label={`Warning: below cutoff on ${warn.join(", ")}`} title={`Below cutoff: ${warn.join(", ")}`}>
          !
        </span>
      )}
      {flagged && <span className="chip flag">Revisit</span>}
    </span>
  );
}

export function ScoreBreakdown({
  criteria,
  cfg,
  feedback,
  selfScored = false,
  marked = false,
}: {
  criteria: CriterionScores;
  cfg: ScoringConfig;
  feedback?: CriterionFeedback[];
  /** A self-score is one number from the learner, so no per-criterion breakdown is shown. */
  selfScored?: boolean;
  /** Marked automatically (multiple choice): one score, no per-criterion breakdown. */
  marked?: boolean;
}) {
  const comp = composite(criteria, cfg);
  if (marked) {
    return (
      <div className="breakdown">
        <div className="composite">
          <strong>{comp}</strong>
          <span>/ 100</span>
          <span className={comp >= cfg.compositeCutoff ? "chip ok" : "chip flag"}>
            {comp >= cfg.compositeCutoff ? "Meets cutoff" : `Below ${cfg.compositeCutoff}`}
          </span>
        </div>
        <p className="muted small">Multiple-choice questions are marked automatically. The four-criterion breakdown only applies to written explanations scored by an AI service.</p>
      </div>
    );
  }
  if (selfScored) {
    return (
      <div className="breakdown">
        <div className="composite">
          <strong>{comp}</strong>
          <span>/ 100 self-score</span>
          <span className={comp >= cfg.compositeCutoff ? "chip ok" : "chip flag"}>
            {comp >= cfg.compositeCutoff ? "Meets cutoff" : `Below ${cfg.compositeCutoff}`}
          </span>
          <span className="chip">Self-scored</span>
        </div>
        <p className="muted small">You scored this against the reference answer. The four-criterion breakdown (core idea, depth, relevance, application) needs an AI service to read your explanation.</p>
      </div>
    );
  }
  return (
    <div className="breakdown">
      <div className="composite">
        <strong>{comp}</strong>
        <span>/ 100 composite</span>
        <span className={comp >= cfg.compositeCutoff ? "chip ok" : "chip flag"}>
          {comp >= cfg.compositeCutoff ? "Meets cutoff" : `Below ${cfg.compositeCutoff}`}
        </span>
      </div>
      <ul className="criteria">
        {CRITERIA.map((k) => {
          const low = criteria[k] < cfg.criterionCutoffs[k];
          const fb = feedback?.find((f) => f.criterion === k);
          return (
            <li key={k} className={low ? "low" : ""}>
              <div className="crit-head">
                <span>
                  {low && (
                    <span className="warn" role="img" aria-label="Below cutoff">
                      !
                    </span>
                  )}{" "}
                  {CRITERION_LABELS[k]}
                </span>
                <b>{criteria[k]}</b>
              </div>
              <div className="bar" role="presentation">
                <div style={{ width: `${criteria[k]}%` }} />
                <i style={{ left: `${cfg.criterionCutoffs[k]}%` }} />
              </div>
              {fb && (
                <p className="fb">
                  {fb.comment && <>{fb.comment} <br /></>}
                  <em>{fb.why}</em> <br />
                  <b>Try:</b> {fb.suggestion}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
