import { useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";
import "katex/dist/katex.min.css";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Wraps the first occurrence of `phrase` in a <mark>. The phrase must sit inside one piece of text (not span
 * math or bold), which is exactly what the service guarantees for the highlights it returns. If it is not
 * found nothing is marked, so a wrong passage is never highlighted.
 */
function remarkMark(phrase: string) {
  const re = new RegExp(phrase.trim().split(/\s+/).map(escapeRegex).join("\\s+"));
  return () => (tree: unknown) => {
    let done = false;
    visit(tree as never, "text", (node: { value: string }, index: number | undefined, parent: { children: unknown[] } | undefined) => {
      if (done || index === undefined || !parent) return;
      const m = re.exec(node.value);
      if (!m) return;
      done = true;
      const before = node.value.slice(0, m.index);
      const after = node.value.slice(m.index + m[0].length);
      const parts: unknown[] = [];
      if (before) parts.push({ type: "text", value: before });
      parts.push({ type: "mark", data: { hName: "mark" }, children: [{ type: "text", value: m[0] }] });
      if (after) parts.push({ type: "text", value: after });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}

/** Renders a page of transcript Markdown (with LaTeX), optionally marking one verbatim passage. */
export function PageView({
  text,
  highlight,
  onHighlight,
}: {
  text: string;
  highlight?: string;
  /** Reports whether the passage was found and marked, once the page has rendered. */
  onHighlight?: (found: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const plugins = useMemo(() => [remarkGfm, remarkMath, ...(highlight ? [remarkMark(highlight)] : [])], [highlight]);

  useEffect(() => {
    if (!highlight) return;
    const mark = ref.current?.querySelector("mark");
    onHighlight?.(!!mark);
    mark?.scrollIntoView?.({ block: "nearest" });
  }, [text, highlight, onHighlight]);

  return (
    <div className="page-view" ref={ref}>
      <ReactMarkdown remarkPlugins={plugins} rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
