import { PageView } from "./PageView";
import { normalizeMath, splitParts } from "../lib/mathtext";

/**
 * Text a model wrote (a question, a solution, a hint, a reply): Markdown with maths, so lettered parts, lists and
 * display formulas read as written, and LaTeX's own delimiters are accepted. Flush inside whatever holds it.
 */
export function Prose({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`prose${className ? ` ${className}` : ""}`}>
      <PageView text={normalizeMath(text)} />
    </div>
  );
}

/**
 * A question's text, authored or written: the setting first, then each lettered part on its own line, with the
 * maths set. The same treatment for both, so a bank question and a written one read alike.
 */
export function QuestionText({ text, className = "prompt" }: { text: string; written?: boolean; className?: string }) {
  return <Prose className={className} text={splitParts(text)} />;
}
