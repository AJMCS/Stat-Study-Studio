import { Note } from "./Hand";

/** Where you are in a sequence, drawn as ringed nodes on a thin line (passed = filled, current = orange), with an
 * optional hand-lettered note pointing up at the current node. */
export function StepTrack({ at, total, label, note }: { at: number; total: number; label: string; note?: string }) {
  const pct = total > 1 ? (at / (total - 1)) * 100 : 0;
  return (
    <div className="step-wrap">
      <div className="step-track" role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={total} aria-valuenow={at + 1} aria-valuetext={`${at + 1} of ${total}`}>
        <span className="st-track" aria-hidden="true">
          <span className="st-line" />
          <span className="st-fill" style={{ width: `${pct}%` }} />
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`st-node${i === at ? " current" : i < at ? " done" : ""}`} />
          ))}
        </span>
        <span className="st-count" aria-hidden="true">
          {String(at + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
      </div>
      {note && (
        <div className="st-note" aria-hidden="true">
          <span style={{ left: `calc((100% - 72px) * ${pct / 100})` }}>
            <Note dir="up">{note}</Note>
          </span>
        </div>
      )}
    </div>
  );
}
