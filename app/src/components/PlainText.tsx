import { useEffect, useRef } from "react";

/**
 * Text from a personal upload, shown exactly as extracted (no Markdown or math interpretation, so stray
 * symbols in OCR output can never be rendered as something else). `highlight` is marked only if it appears
 * verbatim; otherwise nothing is marked.
 */
export function PlainText({
  text,
  highlight,
  onHighlight,
}: {
  text: string;
  highlight?: string;
  onHighlight?: (found: boolean) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const at = highlight ? text.indexOf(highlight) : -1;

  useEffect(() => {
    if (!highlight) return;
    onHighlight?.(at >= 0);
    ref.current?.scrollIntoView?.({ block: "nearest" });
  }, [at, highlight, onHighlight]);

  if (!highlight || at < 0) return <div className="plain-page">{text}</div>;
  return (
    <div className="plain-page">
      {text.slice(0, at)}
      <mark ref={ref}>{highlight}</mark>
      {text.slice(at + highlight.length)}
    </div>
  );
}
