/**
 * Text a model wrote, made ready for the app's Markdown and KaTeX renderer. Models reach for LaTeX's own delimiters
 * as often as the $ forms, and put display maths mid-line; the renderer reads $…$ and $$…$$ on their own lines.
 *
 * - \( … \) becomes $…$ and \[ … \] becomes $$…$$
 * - every $$…$$ block stands on its own lines, so it is set as display maths rather than shown raw
 * - an align, equation or gather environment outside any delimiters is wrapped as display maths
 */
const PART = /\([a-h]\)\s/g;

/**
 * A question with lettered parts, one part to a line: "…: (a) write the likelihood, (b) show why …, and (c) find …"
 * becomes the setting, then (a), (b) and (c) each on its own line. Text with fewer than two parts is left alone,
 * and a marker inside maths is never touched.
 */
export function splitParts(text: string): string {
  const markers = text.replace(/\$[^$]*\$/g, "").match(PART) ?? [];
  if (new Set(markers).size < 2) return text;
  const segments = text.split(/(\$[^$]*\$)/g); // odd entries are maths and stay as they are
  return segments
    .map((seg, i) => (i % 2 === 1 ? seg : seg.replace(/\s*,?\s*(?:and\s+|then\s+)?(?=\([a-h]\)\s)/g, "\n\n")))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeMath(text: string): string {
  const t = text
    .replace(/\r\n/g, "\n")
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner: string) => `$$${inner}$$`)
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, inner: string) => `$${inner}$`);
  const out = t
    .split(/(\$\$[\s\S]*?\$\$)/g)
    .map((seg, i) =>
      i % 2 === 1
        ? `\n\n$$\n${seg.slice(2, -2).trim()}\n$$\n\n`
        : seg.replace(/\\begin\{(align\*?|equation\*?|gather\*?)\}[\s\S]*?\\end\{\1\}/g, (env) => `\n\n$$\n${env}\n$$\n\n`),
    )
    .join("");
  return out
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
