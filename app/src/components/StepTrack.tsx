import { Fragment, type ReactNode } from "react";
import { Note } from "./Hand";
import { HArc, Ring, arcInto } from "./Rail";

/**
 * Where you are in a sequence, drawn as the journey's ringed nodes on one straight baseline joined by shallow arcs,
 * with the track's own label at its end and an optional hand-lettered note pointing up at one node (the current one
 * by default).
 *
 * By default a filled node means "passed" (a step behind you in this session) and the label is the position, "03/10".
 * Pass `done` to give the filled nodes another meaning (the vocabulary lesson's known terms) and `count` for the label
 * that says so ("6 of 10 known"); the ringed orange node is always the current one. `counter={false}` draws the track
 * alone, with no position label at its end (the flashcards and the quiz: the card's eyebrow states the position).
 */
export function StepTrack({
  at,
  total,
  label,
  note,
  noteAt,
  done,
  count,
  counter = true,
}: {
  at: number;
  total: number;
  label: string;
  note?: string;
  noteAt?: number;
  done?: (i: number) => boolean;
  count?: ReactNode;
  counter?: boolean;
}) {
  const pin = noteAt ?? at;
  const p = total > 1 ? pin / (total - 1) : 0;
  const noted = !!note && pin >= 0;
  const long = total > 6;
  const filled = Array.from({ length: total }, (_, i) => (done ? done(i) : i < at)).filter(Boolean).length;
  return (
    <div className={`step-wrap${noted ? " noted" : ""}`}>
      <div
        className="step-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done ? filled : at + 1}
        aria-valuetext={done ? `${filled} of ${total} done; ${at + 1} of ${total} is current` : `${at + 1} of ${total}`}
      >
        <span className={`st-rail${long ? " long" : ""}`} aria-hidden="true">
          <span className={`st-track${long ? " long" : ""}`}>
            {Array.from({ length: total }, (_, i) => (
              <Fragment key={i}>
                <Ring state={i === at ? "current" : (done ? done(i) : i < at) ? "done" : "todo"} />
                {i < total - 1 && <HArc state={arcInto(i + 1, at)} />}
              </Fragment>
            ))}
          </span>
          {noted && (
            <span className="st-note">
              {/* the rail pads each side; the pin sits under the centre of node `pin` */}
              <span style={{ left: `calc((100% - 2 * var(--rail-pad) - var(--ring)) * ${p} + var(--rail-pad) + var(--ring) / 2)` }}>
                <Note dir="up">{note}</Note>
              </span>
            </span>
          )}
        </span>
        {count ? (
          <span className="st-label status" aria-hidden="true">{count}</span>
        ) : counter ? (
          <span className="st-count mono" aria-hidden="true">
            {String(at + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
