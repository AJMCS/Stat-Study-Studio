import { useState, type ReactNode } from "react";
import { RichText } from "./Math";
import { Citations } from "./Citation";
import { OptionNote, Result } from "./Result";
import { RATING_CREDIT, SelfRate, type Rating } from "./SelfCheck";
import { answered, useLearning } from "../lib/learning";
import { stableOrder } from "../lib/shuffle";
import type { CheckAnswer, CheckQuestion } from "../types";

const RATED: Record<Rating, string> = { got: "I got it", partly: "Partly", missed: "I missed it" };

/**
 * One comprehension check. Multiple choice is marked at once: the right answer gets its ✓ chip and a wrong pick its
 * ! chip, and every option's reason waits behind a "Why" disclosure on the verdict row, so no explanation sits above
 * a question it would answer. An explain-in-a-sentence item is compared with a reference answer and self-rated. The
 * latest answer is saved. The verdict is the `// Result` eyebrow and one sentence, nothing else: the lecture page that
 * settles the question is cited inside the "Why" disclosure (with the options' own citations) or, for an explain
 * item, with the reference answer.
 *
 * "Try it again" is a learning tool, not a scoring one. The retry is answered and marked like a first attempt and its
 * pick or rating is saved (`retried`), but the credit stays the first attempt's, so a miss cannot be turned into a
 * right by re-picking the ✓, and its verdict says so: "Right on the retry. The first attempt is what counts."
 *
 * There is one option list, in every state: open while answering, locked once marked (the picked radio in ink, the
 * others muted, the chips after the labels), and, while "Why" is open, with each option's reason under it in that
 * same list. The rule for folding, stated once: a marked question collapses only while a later question in the same
 * step is open (`collapsed`); it folds to its stem and verdict row, and its list waits behind "Show the options"
 * inside the "Why" disclosure, so no option text of an earlier question sits above the one being answered. Once the
 * step's set is complete, every list shows in full. `note` is a hand-lettered aside on the verdict row, pointing at
 * "Why" (or at the verdict of an explain item).
 */
export function CheckItem({ topicId, q, n, note, collapsed = false }: { topicId: string; q: CheckQuestion; n: number; note?: string; collapsed?: boolean }) {
  const { learning, answerCheck } = useLearning();
  const saved = learning.checks[topicId]?.[q.id];
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [comparing, setComparing] = useState(false);
  const [why, setWhy] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  /** Answering again after "Try it again": the saved answer stays (and keeps counting) until the retry is marked. */
  const [retrying, setRetrying] = useState(false);
  const name = `check-${q.id}`;

  const again = () => {
    setRetrying(true);
    setChoice(null);
    setText("");
    setComparing(false);
    setWhy(false);
    setShowOptions(false);
  };

  /** Save the answer; a retry keeps the first attempt's credit beside the new choice or rating. */
  const save = (a: Omit<CheckAnswer, "at" | "retried">) => {
    answerCheck(topicId, q.id, saved && (retrying || saved.retried) ? { ...a, credit: saved.credit, retried: true } : a);
    setRetrying(false);
  };

  if (q.kind === "mc") {
    const marked = saved?.choice !== undefined && !retrying;
    const folded = marked && collapsed;
    const picked = marked ? saved!.choice! : choice;
    const right = q.choices!.findIndex((o) => o.correct);
    const order = stableOrder(q.id, q.choices!.length);
    /** The chip an option carries once marked: the same one in the option list and in the opened explanations. */
    const chip = (i: number) => {
      const o = q.choices![i];
      if (!marked) return null;
      if (o.correct) return <OptionNote kind="right">right</OptionNote>;
      if (i === picked) return <OptionNote kind="wrong">your pick</OptionNote>;
      return null;
    };
    /** The one option list: the locked radio rows once marked, each with its reason under it while "Why" is open. */
    const options = (
      <fieldset disabled={marked}>
        <legend className="sr-only">Choose one</legend>
        {order.map((i) => ({ o: q.choices![i], i })).map(({ o, i }) => {
          const state = `${marked ? (o.correct ? " is-right" : " is-wrong") : ""}${marked && i === picked ? " is-picked" : ""}`;
          return (
            <div key={i} className={`choice-wrap${state}`}>
              <label className={`choice${state}`}>
                <input type="radio" name={name} checked={picked === i} onChange={() => setChoice(i)} />
                <span>
                  <RichText text={o.text} />
                  {chip(i)}
                </span>
              </label>
              {marked && why && (
                <div className="why">
                  <span className="sr-only">{o.correct ? "Why it is right: " : "Why it is wrong: "}</span>
                  <RichText text={o.why} />
                  {o.source && <Citations sources={[o.source]} />}
                </div>
              )}
            </div>
          );
        })}
      </fieldset>
    );
    const ok = picked === right;
    const verdict = saved?.retried
      ? ok ? "Right on the retry. The first attempt is what counts." : "Not quite."
      : ok ? "Right." : folded ? "Not quite." : "Not quite. The right answer is marked ✓ above.";
    return (
      <div className={`check${marked ? " marked" : ""}${folded ? " folded" : ""}`} role="group" aria-labelledby={`${name}-q`}>
        <p className="prompt" id={`${name}-q`}>
          <span className="check-n mono" aria-hidden="true">{String(n).padStart(2, "0")}</span>
          <span><RichText text={q.prompt} /></span>
        </p>
        {!folded && options}
        {marked ? (
          <>
            <Result
              ok={ok}
              note={note}
              action={
                <button className="link" aria-expanded={why} aria-controls={`${name}-why`} onClick={() => setWhy((w) => !w)}>
                  {why ? "Hide why" : "Why"}
                </button>
              }
            >
              {verdict}
            </Result>
            {why && (
              <div className="whys-wrap" id={`${name}-why`}>
                {folded && (
                  <>
                    <p className="why-options">
                      <button className="link" aria-expanded={showOptions} onClick={() => setShowOptions((s) => !s)}>
                        {showOptions ? "Hide the options" : "Show the options"}
                      </button>
                    </p>
                    {showOptions && options}
                  </>
                )}
                <div className="why-source">
                  <p className="muted">The page that settles it:</p>
                  <Citations sources={[q.source]} />
                </div>
              </div>
            )}
            <div className="check-foot">
              <button className="link" onClick={again}>Try it again</button>
            </div>
          </>
        ) : (
          <div className="row">
            <button disabled={choice === null} onClick={() => choice !== null && save({ credit: choice === right ? 1 : 0, choice })}>
              Check my answer
            </button>
          </div>
        )}
      </div>
    );
  }

  // explain in a sentence (the saved rating is set aside while the learner is retrying, so the sentence box returns)
  const rating = retrying ? undefined : saved?.rating;
  const folded = !!rating && collapsed;
  return (
    <div className={`check${rating ? " marked" : ""}${folded ? " folded" : ""}`} role="group" aria-labelledby={`${name}-q`}>
      <p className="prompt" id={`${name}-q`}>
        <span className="check-n mono" aria-hidden="true">{String(n).padStart(2, "0")}</span>
        <span><RichText text={q.prompt} /></span>
      </p>
      {rating && !comparing ? (
        <>
          {!folded && (
            <div className="model-answer">
              <p className="eyebrow">{"// Reference answer"}</p>
              <p><RichText text={q.reference!} /></p>
              <Citations sources={[q.source]} />
            </div>
          )}
          <Result ok={rating === "got"} note={note}>
            {saved?.retried ? <>You rated your retry: {RATED[rating]}. The first attempt is what counts.</> : <>You rated your sentence: {RATED[rating]}. Saved as self-scored practice.</>}
          </Result>
          <div className="check-foot">
            <button className="link" onClick={again}>Try it again</button>
          </div>
        </>
      ) : comparing ? (
        <>
          <SelfRate answer={text} reference={q.reference!} name={name} value={rating ?? null} onChange={(r) => save({ credit: RATING_CREDIT[r], rating: r })} />
          <div className="reference-source">
            <Citations sources={[q.source]} />
          </div>
          {rating && (
            <Result ok={rating === "got"}>{saved?.retried ? <>Rated: {RATED[rating]}. The first attempt is what counts.</> : <>Saved: {RATED[rating]}.</>}</Result>
          )}
          <div className="check-foot">
            {rating && <button className="link" onClick={() => setComparing(false)}>Done</button>}
          </div>
        </>
      ) : (
        <>
          <label className="field">
            <span>Your sentence</span>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="One sentence in your own words." />
          </label>
          <div className="row">
            <button disabled={!text.trim()} onClick={() => setComparing(true)}>Compare with the reference</button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The checks of one tutorial step, revealed one at a time: a question appears once the one before it is marked, so
 * nothing on the page answers a question the learner has not reached, and a marked question above an open one folds
 * to its stem and verdict. `title` may carry mono numerals ("Step 01 of 04"); `titleText` is its plain form for the
 * section's accessible name. `note` is the group's one hand-lettered aside, hung on the verdict row of its first
 * marked question (the tutorial's "every option, explained"; the checks page varies the wording by step).
 */
export function StepChecks({
  topicId,
  step,
  checks,
  title = "Check your understanding",
  titleText,
  note,
}: {
  topicId: string;
  step: number;
  checks: CheckQuestion[];
  title?: ReactNode;
  titleText?: string;
  note?: string;
}) {
  const { learning } = useLearning();
  const mine = checks.filter((c) => c.step === step);
  if (!mine.length) return null;
  const answers = learning.checks[topicId] ?? {};
  const firstOpen = mine.findIndex((c) => !answered(answers[c.id]));
  const shown = mine.map((c, j) => ({ c, j })).filter(({ c, j }) => answered(answers[c.id]) || j === firstOpen);
  const later = mine.length - shown.length;
  const skipped = mine.some((c) => answers[c.id]?.skipped && !answered(answers[c.id]));
  const noted = shown.find(({ c }) => answered(answers[c.id]))?.c;
  return (
    <section className="checks" aria-label={`${titleText ?? (typeof title === "string" ? title : "Check your understanding")}, step ${step + 1}`}>
      <p className="eyebrow">
        {"// After step "}{String(step + 1).padStart(2, "0")}{" · "}{mine.length}{mine.length === 1 ? " question" : " questions"}
        {skipped && " · not answered"}
      </p>
      <h2>{title}</h2>
      {skipped && <p className="muted check-skipped">You skipped this check earlier, so it is on your list to review. Answer it here to take it off.</p>}
      {shown.map(({ c, j }) => (
        <CheckItem key={c.id} topicId={topicId} q={c} n={checks.indexOf(c) + 1} note={c === noted ? note : undefined} collapsed={firstOpen >= 0 && j < firstOpen} />
      ))}
      {later > 0 && (
        <p className="muted check-later">
          <b className="mono">{later}</b> more {later === 1 ? "question" : "questions"} once this one is marked.
        </p>
      )}
    </section>
  );
}
