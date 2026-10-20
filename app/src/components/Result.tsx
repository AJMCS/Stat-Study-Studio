import type { ReactNode } from "react";
import { Note } from "./Hand";

/**
 * The one treatment for a verdict after the learner has answered (a marked check, a quiz match, a breakdown choice,
 * the checks summary): a hairline rule above, a "// Result" eyebrow, then the sentence in body ink with its marker,
 * ✓ for right and ! for attention. No box and no colour. `action` is an optional control on the verdict row (the
 * check's "Why" disclosure), and `note` a hand-lettered aside pointing back at that control (or, with no control, at
 * the verdict itself).
 */
export function Result({ ok, children, action, note }: { ok: boolean; children: ReactNode; action?: ReactNode; note?: string }) {
  return (
    <div className="result" role="status">
      <p className="eyebrow">{"// Result"}</p>
      <p className={ok ? "ok-text" : "bad-text"}>
        {children}
        {(action || note) && (
          <span className="result-action">
            {action && " "}
            {action}
            {note && (
              <span className="result-note" aria-hidden="true">
                <Note dir="left">{note}</Note>
              </span>
            )}
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * The marker an option carries once it is marked: the design system's chip (pill, 1px ink border, mono uppercase),
 * trailing the option's label in the same place on every option list. ✓ marks the right answer, ! the learner's wrong
 * pick. The glyph is real text, so it reads aloud and can be found.
 */
export function OptionNote({ kind, children }: { kind: "right" | "wrong"; children: string }) {
  return (
    <span className={`chip status-note note-${kind}`}>
      <span aria-hidden="true">{kind === "right" ? "✓" : "!"}</span>
      <span className="sr-only">{kind === "right" ? "Right: " : "Attention: "}</span>
      <span>{children}</span>
    </span>
  );
}
