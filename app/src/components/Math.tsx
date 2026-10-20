import katex from "katex";
import "katex/dist/katex.min.css";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

const NARROW = "(max-width: 760px)";

/** True on a phone-width screen (and it follows the window if it is resized). */
function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(NARROW).matches);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/**
 * On a phone a display formula's side-by-side parts go on their own centred lines: the parts a `\quad` or `\qquad`
 * keeps apart, and the step a `⇒` or `∝` joins. Desktop rendering is unchanged, and a part that is still too wide
 * scrolls sideways inside its block.
 */
const stack = (tex: string) => tex.replace(/\\qquad|\\quad/g, "\\\\[0.4em] ").replace(/\\;(\\Rightarrow|\\propto)\\;/g, "\\\\[0.4em] $1\\;");

export function Math({ tex, display = false }: { tex: string; display?: boolean }) {
  const narrow = useNarrow();
  const src = display && narrow ? stack(tex) : tex;
  const html = useMemo(() => {
    try {
      return katex.renderToString(src, { displayMode: display, throwOnError: false });
    } catch {
      return null;
    }
  }, [src, display]);
  if (html === null) return <code>{tex}</code>;
  return <span dangerouslySetInnerHTML={{ __html: html }} aria-label={tex} role="math" />;
}

/** Punctuation that must stay on the line of the maths before it (never a lone "." at the start of the next line). */
export const TRAILING_PUNCT = /^[.,;:!?)\]]+/;

const isMath = (p: string) => p.startsWith("$") && p.endsWith("$") && p.length > 2;
const isMono = (p: string) => p.startsWith("‹") && p.endsWith("›") && p.length > 2;

/**
 * A course reference written as the citation chip's code: a lecture ("L07"), a lecture page ("L01 · P3") or a
 * homework ("HW02"). Anything else in a mono run is a bare data numeral (a theorem or step number, "1.4").
 */
export const REF_CODE = /^(?:L|HW)\d{2}(?: · P\d+)?$/;

/**
 * The mono voice inside sans copy. The app's text marks a run as ‹…›: a course reference becomes the design
 * system's chip (the same pill the citations use, so "L07" in a sentence looks like "L07 · P2" under it), and a bare
 * number becomes a mono numeral, bold like every count in a sentence. Maths stays in $…$ and KaTeX.
 */
export function Mono({ text }: { text: string }) {
  return REF_CODE.test(text) ? <span className="chip ref-chip">{text}</span> : <b className="mono">{text}</b>;
}

/**
 * Renders text that may contain $inline$ LaTeX and ‹mono› runs. A run and the punctuation right after it are bound
 * in one no-wrap span, so "$\mu = 1.5$." can never break before the full stop.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$|‹[^›]+›)/g);
  const out: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!isMath(p) && !isMono(p)) {
      out.push(<span key={i}>{p}</span>);
      continue;
    }
    const run = isMath(p) ? <Math tex={p.slice(1, -1)} /> : <Mono text={p.slice(1, -1)} />;
    const next = parts[i + 1] ?? "";
    const punct = next.match(TRAILING_PUNCT)?.[0];
    if (!punct) {
      out.push(<Fragment key={i}>{run}</Fragment>);
      continue;
    }
    out.push(
      <span key={i} className="math-bound">
        {run}
        {punct}
      </span>,
    );
    parts[i + 1] = next.slice(punct.length);
  }
  return <>{out}</>;
}
