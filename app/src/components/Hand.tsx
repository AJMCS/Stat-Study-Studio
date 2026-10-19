import type { ReactNode } from "react";

/**
 * The hand-lettered annotation layer. Used sparingly and always pointing at something: a wobbly underline under the
 * key word of a heading, a chartreuse marker stroke behind a phrase, and margin notes in Caveat with a drawn arrow.
 * Never for body text, buttons, form labels or math.
 */

/** A slightly irregular hand-drawn underline under a key word. `voice` draws it (and the word) in signal orange. */
export function Scribble({ children, voice = true }: { children: ReactNode; voice?: boolean }) {
  return (
    <span className={`scribble${voice ? " voice" : ""}`}>
      {children}
      <svg className="scribble-line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M3 9.5 C 28 6.5, 52 11, 82 8.2 S 140 5.5, 165 8.4 S 190 7.6, 197 6.2" />
        <path pathLength={1} className="second" d="M22 12.4 C 60 10.4, 104 12.6, 150 10.8 S 182 11.2, 190 10.6" />
      </svg>
    </span>
  );
}

/** A chartreuse highlighter stroke behind a phrase (text on it is always black). */
export function Marker({ children }: { children: ReactNode }) {
  return <span className="marker">{children}</span>;
}

type Dir = "left" | "up" | "down" | "right";

const ARROWS: Record<Dir, { box: string; d: string; head: string }> = {
  left: { box: "0 0 60 32", d: "M56 4 C40 2 22 8 8 24", head: "M17.5 20.8 L8 24 L10 14" },
  right: { box: "0 0 60 32", d: "M4 4 C20 2 38 8 52 24", head: "M42.5 20.8 L52 24 L50 14" },
  up: { box: "0 0 40 50", d: "M24 46 C30 32 26 16 14 6", head: "M17.5 15.4 L14 6 L23.9 7.7" },
  down: { box: "0 0 40 50", d: "M10 4 C4 18 10 34 24 44", head: "M20 35 L24 44 L14 43" },
};

export function HandArrow({ dir }: { dir: Dir }) {
  const a = ARROWS[dir];
  return (
    <svg className={`hand-arrow ${dir}`} viewBox={a.box} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={a.d} />
      <path d={a.head} />
    </svg>
  );
}

/** A free-standing hand-lettered note with an arrow toward what it explains. */
export function Note({ children, dir = "left", className }: { children: ReactNode; dir?: Dir; className?: string }) {
  return (
    <span className={`hand-note dir-${dir}${className ? ` ${className}` : ""}`}>
      {(dir === "left" || dir === "up") && <HandArrow dir={dir} />}
      <span className="hand-note-text">{children}</span>
      {(dir === "right" || dir === "down") && <HandArrow dir={dir} />}
    </span>
  );
}

/**
 * Wraps a target and hangs a margin note beside it. On wide screens the note sits in the right margin with an arrow
 * pointing back at the target; on narrow screens it drops below the target, pointing up.
 */
export function Annotated({ note, children, block = false }: { note: ReactNode; children: ReactNode; block?: boolean }) {
  const Tag = block ? "div" : "span";
  return (
    <Tag className={`annotated${block ? " block" : ""}`}>
      {children}
      <span className="margin-note">
        <Note dir="left" className="wide-only">{note}</Note>
        <Note dir="up" className="narrow-only">{note}</Note>
      </span>
    </Tag>
  );
}

/** A heading whose last word is the key word, underlined by hand in the voice colour. */
export function KeyTitle({ text }: { text: string }) {
  const at = text.lastIndexOf(" ");
  if (at < 0) return <Scribble>{text}</Scribble>;
  return (
    <>
      {text.slice(0, at + 1)}
      <Scribble>{text.slice(at + 1)}</Scribble>
    </>
  );
}

/** "// LABEL" in Geist Mono. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{"// "}{children}</p>;
}
