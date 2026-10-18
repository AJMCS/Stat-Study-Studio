import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

export function Math({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: false });
    } catch {
      return null;
    }
  }, [tex, display]);
  if (html === null) return <code>{tex}</code>;
  return <span dangerouslySetInnerHTML={{ __html: html }} aria-label={tex} role="math" />;
}

/** Renders text that may contain $inline$ LaTeX. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("$") && p.endsWith("$") && p.length > 2 ? <Math key={i} tex={p.slice(1, -1)} /> : <span key={i}>{p}</span>))}
    </>
  );
}
