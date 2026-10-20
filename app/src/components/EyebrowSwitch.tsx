import type { ReactNode } from "react";

export interface SwitchItem {
  id: string;
  label: string;
  /** A data number in front of the label (the breakdown's problem numbers). */
  n?: number;
  /** Shown after the label as a ✓ (a problem already done). */
  done?: boolean;
  ariaLabel?: string;
}

/**
 * A row of modes or pickers in the eyebrow's voice: one Geist Mono 13px uppercase line, `// LABEL` then the items
 * separated by dots, the active one in ink with the link underline and the rest muted. It is the only thing between a
 * page's headline block and its track or card, so it reads as the card's control rather than as a second diagram.
 * Each dot is drawn (in CSS) at the start of the item it precedes, so when the line wraps the dot moves with its item
 * and is never left hanging at the end of a line.
 */
export function EyebrowSwitch({
  label,
  items,
  active,
  onChange,
  ariaLabel,
  children,
}: {
  label?: string;
  items: SwitchItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  children?: ReactNode;
}) {
  return (
    <nav className="eyebrow-switch" aria-label={ariaLabel}>
      <span className="es-label">{"//"}{label ? ` ${label}` : ""}</span>
      <span className="es-items">
        {items.map((x) => (
          <span key={x.id} className="es-cell">
            <button
              className={`es-item${x.id === active ? " on" : ""}`}
              aria-pressed={x.id === active}
              aria-label={x.ariaLabel}
              onClick={() => onChange(x.id)}
            >
              {x.n !== undefined && <span className="es-n">{x.n}</span>}
              {x.label}
              {x.done && <span className="es-done" aria-hidden="true">{" "}✓</span>}
            </button>
          </span>
        ))}
      </span>
      {children}
    </nav>
  );
}
