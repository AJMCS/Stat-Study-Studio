import { useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";
import "katex/dist/katex.min.css";
import { REF_CODE, TRAILING_PUNCT } from "./Math";

type HastNode = { type: string; tagName?: string; value?: string; properties?: { className?: string[] }; children?: HastNode[] };

/** The text of a node and its descendants. */
const textOf = (n: HastNode): string => (n.type === "text" ? n.value ?? "" : (n.children ?? []).map(textOf).join(""));

/**
 * The mono voice in Markdown copy, the same as RichText's: a ‹…› run is written to the Markdown as inline code (the
 * Markdown construct for a mono run), and here each inline <code> becomes the chip for a course reference ("L07",
 * "L01 · P3", "HW02") or a bold mono numeral for anything else ("1.4"). Code blocks (<pre>) are left alone.
 */
function rehypeMonoRuns() {
  return (tree: unknown) => {
    visit(tree as never, "element", (node: HastNode) => {
      if (node.tagName === "pre") return;
      for (const k of node.children ?? []) {
        if (k.type !== "element" || k.tagName !== "code") continue;
        const ref = REF_CODE.test(textOf(k));
        k.tagName = ref ? "span" : "b";
        k.properties = { className: ref ? ["chip", "ref-chip"] : ["mono"] };
      }
    });
  };
}

/** The classes of an inline run (a formula or a mono run) that must keep the punctuation after it. */
const isRun = (cls: string[]) => (cls.includes("katex") && !cls.includes("katex-display")) || cls.includes("ref-chip") || cls.includes("mono");

/**
 * Binds the punctuation after an inline formula to the formula: KaTeX sets each formula as an atomic inline box, and
 * a browser will happily break the line between that box and a following "." or ",". Each such pair is wrapped in
 * one no-wrap span, the same binding RichText applies, so the punctuation can never start a line on its own. A mono
 * run (a chip or a numeral) is bound the same way.
 */
function rehypeBindPunctuation() {
  return (tree: unknown) => {
    visit(tree as never, "element", (node: HastNode) => {
      const kids = node.children;
      if (!kids || node.properties?.className?.includes("math-bound")) return; // a wrapper made below: already bound
      for (let i = 0; i < kids.length - 1; i++) {
        const k = kids[i];
        const next = kids[i + 1];
        const cls = k.properties?.className ?? [];
        if (k.type !== "element" || !isRun(cls) || next.type !== "text") continue;
        const punct = next.value?.match(TRAILING_PUNCT)?.[0];
        if (!punct) continue;
        next.value = next.value!.slice(punct.length);
        kids[i] = { type: "element", tagName: "span", properties: { className: ["math-bound"] }, children: [k, { type: "text", value: punct }] };
      }
    });
  };
}

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
  // a ‹…› mono run is Markdown's inline code; rehypeMonoRuns then sets it in the mono voice
  const source = useMemo(() => text.replace(/‹([^›\n]+)›/g, "`$1`"), [text]);

  useEffect(() => {
    if (!highlight) return;
    const mark = ref.current?.querySelector("mark");
    onHighlight?.(!!mark);
    mark?.scrollIntoView?.({ block: "nearest" });
  }, [text, highlight, onHighlight]);

  return (
    <div className="page-view" ref={ref}>
      <ReactMarkdown remarkPlugins={plugins} rehypePlugins={[[rehypeKatex, { throwOnError: false }], rehypeMonoRuns, rehypeBindPunctuation]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
