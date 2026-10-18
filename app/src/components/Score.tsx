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
}: {
  criteria: CriterionScores;
  cfg: ScoringConfig;
  feedback?: CriterionFeedback[];
}) {
  const comp = composite(criteria, cfg);
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
