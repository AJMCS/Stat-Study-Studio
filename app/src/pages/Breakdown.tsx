import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { topicById } from "../mock/topics";
import { breakdownsFor, METHOD, MIXED, MIXED_ID } from "../mock/breakdown";
import { useStore } from "../lib/store";
import { useLearning } from "../lib/learning";
import { stableOrder } from "../lib/shuffle";
import { RichText } from "../components/Math";
import { PageView } from "../components/PageView";
import { Citations } from "../components/Citation";
import { OptionNote, Result } from "../components/Result";
import { Annotated, Eyebrow, Note, Scribble } from "../components/Hand";
import { HArc, Ring, VArc, arcInto } from "../components/Rail";
import { BREAKDOWN_PARTS, type Breakdown as BreakdownT, type BreakdownPartKey, type SourceRef } from "../types";

/**
 * The five parts as ringed nodes on one straight baseline joined by shallow arcs (down the left on a phone):
 * revealed parts filled, the arc into the next part orange. The hand note sits under node 01's labels; its arrow
 * rises from the note's text, past the labels, to land on the ring (on a phone the note points left into the node).
 */
function MethodTrack({ revealed, current }: { revealed: BreakdownPartKey[]; current: BreakdownPartKey | null }) {
  // only the arc into the current part is orange; once all five are revealed there is no "where you are", so the
  // whole track is drawn in ink
  const at = current ? BREAKDOWN_PARTS.indexOf(current) : BREAKDOWN_PARTS.length;
  return (
    <ol className="method" aria-label="The five parts of a breakdown">
      {METHOD.map((p, i) => {
        const done = revealed.includes(p.key);
        const cur = p.key === current;
        const last = i === METHOD.length - 1;
        const state = arcInto(i + 1, at);
        return (
          <li key={p.key} className={`${done ? "done" : ""}${cur ? " current" : ""}`} aria-current={cur ? "step" : undefined}>
            <span className="m-rail" aria-hidden="true">
              <Ring state={cur ? "current" : done ? "done" : "todo"} />
              {!last && <HArc state={state} className="m-h" />}
              {!last && <VArc state={state} className="m-v" />}
            </span>
            <span className="m-n mono">{String(i + 1).padStart(2, "0")}</span>
            <span className="m-title" title={p.title}>{p.short}</span>
            <span className="sr-only">{done ? " (revealed)" : cur ? " (next)" : ""}</span>
            {i === 0 && (
              <span className="method-note" aria-hidden="true">
                <span className="hand-note m-note-wide"><span className="hand-note-text">the same five, every time</span></span>
                {/* from the top of the note's text (bottom right of the box) up to the ring's lower right (top left) */}
                <svg className="hand-arrow m-note-arrow" viewBox="0 0 44 80" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M30 78 C 42 60, 36 26, 14 6" />
                  <path d="M15.9 15.8 L14 6 L24 5.9" />
                </svg>
                <Note dir="left" className="m-note-narrow">the same five, every time</Note>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface PickItem {
  id: string;
  label: string;
  /** Shown after the title as a ✓ (a problem already done). */
  done: boolean;
  ariaLabel: string;
}

/**
 * One row of the problem card's header control: the group's mono eyebrow (`// PROBLEMS`, `// WHICH TOOL?`), then the
 * problems' titles as sans text tabs, the open one in ink with the 1px link underline and the rest muted.
 */
function ProblemPick({ label, ariaLabel, items, active, onChange }: { label: string; ariaLabel: string; items: PickItem[]; active: string; onChange: (id: string) => void }) {
  return (
    <nav className="bd-pick" aria-label={ariaLabel}>
      <span className="eyebrow">{"// "}{label}</span>
      <span className="bd-pick-list">
        {items.map((x) => (
          <span key={x.id} className="bd-pick-cell">
            <button className={`bd-pick-item${x.id === active ? " on" : ""}`} aria-pressed={x.id === active} aria-label={x.ariaLabel} onClick={() => onChange(x.id)}>
              {x.label}
              {x.done && <span className="bd-done" aria-hidden="true">{" "}✓</span>}
            </button>
          </span>
        ))}
      </span>
    </nav>
  );
}

/**
 * One of the five parts. The problem's lecture citations are shown only here, with the Tool step's model answer
 * (`sources`): the lecture a page comes from names the tool, so the chips stay hidden until the tool is revealed.
 */
function Part({ b, k, n, revealed, onReveal, sources }: { b: BreakdownT; k: BreakdownPartKey; n: number; revealed: boolean; onReveal: () => void; sources?: SourceRef[] }) {
  const part = b.parts[k];
  const meta = METHOD[n];
  const [text, setText] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const id = `bd-${b.id}-${k}`;
  const tool = k === "tool";
  return (
    <section className={`bd-part${revealed ? " revealed" : ""}`} aria-labelledby={id}>
      <h3 id={id}>
        <span className="m-n mono">{String(n + 1).padStart(2, "0")}</span> {meta.title}
      </h3>
      <p className="muted">{meta.ask}</p>
      {part.options ? (
        <fieldset disabled={revealed}>
          <legend className="sr-only">Your choice</legend>
          {stableOrder(`${b.id}-${k}`, part.options.length).map((i) => (
            <label key={i} className={`choice${revealed ? (i === part.answer ? " is-right" : " is-wrong") : ""}${revealed && i === choice ? " is-picked" : ""}`}>
              <input type="radio" name={id} checked={choice === i} onChange={() => setChoice(i)} />
              <span>
                <RichText text={part.options![i]} />
                {revealed && i === part.answer && <OptionNote kind="right">the model's choice</OptionNote>}
                {revealed && i !== part.answer && i === choice && <OptionNote kind="wrong">your pick</OptionNote>}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        !revealed && (
          <label className="field">
            <span>Your answer (not saved)</span>
            <textarea rows={k === "plan" ? 4 : 2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Try it in a line or two before you look." />
          </label>
        )
      )}
      {revealed && !part.options && text.trim() && (
        <div className="your-answer">
          <p className="eyebrow">{"// Your answer"}</p>
          <p>{text.trim()}</p>
        </div>
      )}
      {revealed && part.options && choice !== null && (
        <Result ok={choice === part.answer}>{choice === part.answer ? "Same choice as the model." : "The model picks the option marked ✓ above."}</Result>
      )}
      {revealed ? (
        <div className={`model-answer${tool ? " tool-answer" : ""}`} role="region" aria-label={`Model answer: ${meta.title}`}>
          {tool ? (
            <div className="beside">
              <p className="eyebrow">{"// Model answer"}</p>
              <span className="beside-note" aria-hidden="true">
                <Note dir="left" className="beside-wide">the words that decide it</Note>
              </span>
            </div>
          ) : (
            <p className="eyebrow">{"// Model answer"}</p>
          )}
          <PageView text={part.model} />
          {tool && (
            <span className="tool-note-narrow" aria-hidden="true">
              <Note dir="up" className="beside-narrow">the words that decide it</Note>
            </span>
          )}
          {tool && sources && (
            <>
              <p className="muted bd-sources">The lecture pages this problem draws on:</p>
              <Citations sources={sources} />
            </>
          )}
        </div>
      ) : (
        <div className="row">
          <button className="ghost" onClick={onReveal}>Reveal the model answer</button>
        </div>
      )}
    </section>
  );
}

export function Breakdown() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data } = useStore();
  const { revealPart, restartBreakdown } = useLearning();
  const [params, setParams] = useSearchParams();
  const [showSolution, setShowSolution] = useState(false);
  if (!topic) return <p>Topic not found.</p>;
  const own = breakdownsFor(topic.id);
  /** The topic's own problems, then the shared "Which tool?" set; each with the key its progress is kept under. */
  const all = [...own.map((b) => ({ b, key: topic.id })), ...MIXED.map((b) => ({ b, key: MIXED_ID }))];
  const at = Math.min(Math.max(0, Number(params.get("q") ?? "1") - 1 || 0), all.length - 1);
  const { b, key } = all[at];
  const mixed = key === MIXED_ID;
  const prog = (k: string, bid: string) => data.learning.breakdowns[k]?.[bid];
  const revealed = prog(key, b.id)?.revealed ?? [];
  const current = BREAKDOWN_PARTS.find((k) => !revealed.includes(k)) ?? null;
  const shownParts = BREAKDOWN_PARTS.filter((k) => revealed.includes(k) || k === current);
  const choose = (n: number) => {
    setParams(n === 0 ? {} : { q: String(n + 1) }, { replace: true });
    setShowSolution(false);
  };
  const label = (n: number) => (n < own.length ? `Problem ${n + 1}` : `Which tool? ${n - own.length + 1}`);
  const items = (xs: BreakdownT[], k: string, offset: number): PickItem[] =>
    xs.map((x, j) => {
      const n = offset + j;
      const done = !!prog(k, x.id)?.done;
      return { id: String(n), label: x.title, done, ariaLabel: `${label(n)}: ${x.title}${done ? " (done)" : ""}` };
    });

  return (
    <>
      <p className="back"><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <Eyebrow>Break down a question · {topic.title}</Eyebrow>
      <h1>Break down a <Scribble>question</Scribble></h1>
      <p className="lede">Every problem in this course comes apart the same way. Answer these five questions before you calculate anything; try each part yourself, then reveal the model answer.</p>

      {/* the track block, its hand note the only thing in the band under it; then one section gap to the card */}
      <div className="method-wrap">
        <MethodTrack revealed={revealed} current={current} />
      </div>

      <article className="panel focal bd-problem" aria-label="The problem">
        {/* the problem selector is the card's header control: two short lines, each a mono eyebrow then the titles
            as sans text tabs, a hairline between them and the problem */}
        <header className="bd-head" aria-label="Choose a problem">
          <ProblemPick label="Problems" ariaLabel="This topic's problems" items={items(own, topic.id, 0)} active={String(at)} onChange={(x) => choose(Number(x))} />
          <ProblemPick label="Which tool?" ariaLabel="Which tool? Mixed problems from across the course" items={items(MIXED, MIXED_ID, own.length)} active={String(at)} onChange={(x) => choose(Number(x))} />
        </header>
        <p className="eyebrow">
          {"// "}
          {mixed ? `Which tool? · ${at - own.length + 1} of ${MIXED.length} · the tool is the question` : `Problem ${at + 1} of ${own.length}`}
        </p>
        <h2>{b.title}</h2>
        <p><RichText text={b.prompt} /></p>
        {/* the lecture pages come with the Tool step: a lecture's number names the tool */}
        {!revealed.includes("tool") && <p className="muted bd-sources-later">Lecture pages are cited once the tool is revealed.</p>}
      </article>

      {shownParts.map((k) => (
        <Part key={`${b.id}-${k}`} b={b} k={k} n={BREAKDOWN_PARTS.indexOf(k)} revealed={revealed.includes(k)} onReveal={() => revealPart(key, b.id, k)} sources={b.sources} />
      ))}

      {current === null && (
        <section className="bd-part bd-solution" aria-label="Full worked solution">
          <p className="eyebrow">{"// All five parts done · saved"}</p>
          <h2>The full worked solution</h2>
          {!showSolution ? (
            <Annotated note="now do it on paper, then compare">
              <button onClick={() => setShowSolution(true)}>Show the full worked solution</button>
            </Annotated>
          ) : (
            <div className="model-answer" role="region" aria-label="Worked solution">
              <PageView text={b.solution} />
              <p className="muted">The cited pages are where this comes from in the course:</p>
              <Citations sources={b.sources} />
            </div>
          )}
          <div className="row">
            {at < all.length - 1 ? (
              <button className={showSolution ? undefined : "ghost"} onClick={() => choose(at + 1)}>Next problem</button>
            ) : (
              <Link className={`button${showSolution ? "" : " ghost"}`} to={`/topic/${topic.id}/quiz`}>Practice: take the quiz</Link>
            )}
            <button className="link" onClick={() => { restartBreakdown(key, b.id); setShowSolution(false); }}>Start this one again</button>
          </div>
        </section>
      )}
    </>
  );
}
