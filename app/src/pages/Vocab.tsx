import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { topicById } from "../mock/topics";
import { vocabFor } from "../mock/vocab";
import { useStore } from "../lib/store";
import { useLearning, vocabProgress } from "../lib/learning";
import { Math as Tex, RichText } from "../components/Math";
import { PageView } from "../components/PageView";
import { Citations } from "../components/Citation";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { EyebrowSwitch } from "../components/EyebrowSwitch";
import { StepTrack } from "../components/StepTrack";
import { OptionNote, Result } from "../components/Result";
import { sessionShuffle, stableOrder } from "../lib/shuffle";
import type { VocabTerm } from "../types";

type Mode = "lesson" | "cards" | "quiz" | "list";
const MODES: { id: Mode; label: string }[] = [
  { id: "lesson", label: "Learn the terms" },
  { id: "cards", label: "Flashcards" },
  { id: "quiz", label: "Quiz me" },
  { id: "list", label: "Glossary" },
];

/** The lesson track's label: how many of the topic's terms are known (the filled nodes), in status words. */
function Known({ n, total, next }: { n: number; total: number; next?: string }) {
  return (
    <>
      <b className="mono">{n}</b> of <b className="mono">{total}</b> known
      {next && <> · next: <b>{next}</b></>}
    </>
  );
}

/**
 * A hand-lettered note hung on the thing it points at: beside it on a wide screen (arrow left), under it on a phone
 * (arrow up). Words only.
 */
function Beside({ note, children, className }: { note: string; children: ReactNode; className?: string }) {
  return (
    <div className={`beside${className ? ` ${className}` : ""}`}>
      {children}
      <span className="beside-note" aria-hidden="true">
        <Note dir="left" className="beside-wide">{note}</Note>
        <Note dir="up" className="beside-narrow">{note}</Note>
      </span>
    </div>
  );
}

/**
 * "Which term matches this definition?": three terms from the same topic, marked at once. A right answer counts the
 * term as known and a wrong one as not yet, the same progress the flashcards keep. The deck is shuffled for the
 * session, and the track shows only this session's sequence (question k of N), so nothing above the card says which
 * term is being asked. The verdict is the `// Result` eyebrow and one sentence that says what the mark did (the chips
 * already say which option was which); the term's lecture page is cited on its lesson card, flashcard and glossary
 * row, not here.
 */
function QuizMe({ topicId, terms }: { topicId: string; terms: VocabTerm[] }) {
  const { rateTerm } = useLearning();
  const [round, setRound] = useState(0);
  const deck = useMemo(() => sessionShuffle(`${topicId}-quiz-${round}`, terms.length).map((k) => terms[k]), [topicId, terms, round]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);
  const [right, setRight] = useState(0);

  if (i >= deck.length) {
    return (
      <section className="panel focal term-card" aria-label="Quiz finished">
        <p className="eyebrow">{"// Quiz finished"}</p>
        <h2>
          You matched <b className="mono">{right}</b> of <b className="mono">{deck.length}</b> definitions
        </h2>
        <p className="muted">Each answer updated which terms count as known.</p>
        <div className="row">
          <button onClick={() => { setRound(round + 1); setI(0); setRight(0); setPick(null); setMarked(false); }}>Quiz me again</button>
        </div>
      </section>
    );
  }

  const v = deck[i];
  const others = terms.filter((t) => t.id !== v.id);
  const two = stableOrder(v.id, others.length).slice(0, 2).map((k) => others[k]);
  const options = stableOrder(`${v.id}-quiz`, 3).map((k) => [v, ...two][k]);
  const name = `quiz-${v.id}`;
  const check = () => {
    if (!pick) return;
    setMarked(true);
    rateTerm(topicId, v.id, pick === v.id);
    if (pick === v.id) setRight(right + 1);
  };
  return (
    <>
      <StepTrack at={i} total={deck.length} label="Quiz progress" counter={false} />
      <article className="panel focal term-card" aria-label={`Definition ${i + 1} of ${deck.length}`}>
        <p className="eyebrow">{"// Definition "}{String(i + 1).padStart(2, "0")}{" of "}{String(deck.length).padStart(2, "0")}</p>
        <h2 className="quiz-ask">Which term matches this definition?</h2>
        <Beside note="name it before you look down" className="quiz-def">
          <p className="term-plain"><RichText text={v.plain} /></p>
        </Beside>
        <fieldset disabled={marked} className="quiz-options">
          <legend className="sr-only">Choose one</legend>
          {options.map((o) => (
            <label key={o.id} data-term={o.id} className={`choice${marked ? (o.id === v.id ? " is-right" : " is-wrong") : ""}${marked && o.id === pick ? " is-picked" : ""}`}>
              <input type="radio" name={name} checked={pick === o.id} onChange={() => setPick(o.id)} />
              <span>
                <span className="term-only">{o.term}</span>
                {marked && o.id === v.id && <OptionNote kind="right">the match</OptionNote>}
                {marked && o.id !== v.id && o.id === pick && <OptionNote kind="wrong">your pick</OptionNote>}
              </span>
            </label>
          ))}
        </fieldset>
        {marked ? (
          <>
            <Result ok={pick === v.id}>{pick === v.id ? "Marked as known." : "Marked as not yet known, so the flashcards will bring it back."}</Result>
            <div className="row">
              <button onClick={() => { setI(i + 1); setPick(null); setMarked(false); }}>{i < deck.length - 1 ? "Next definition" : "See how you did"}</button>
            </div>
          </>
        ) : (
          <div className="row">
            <button disabled={!pick} onClick={check}>Check my answer</button>
          </div>
        )}
      </article>
    </>
  );
}

/**
 * A term's name with its notation beside it; `after` is a marker set directly after the name, before the symbol. The
 * marker is bound to the name's last word in one no-wrap span, so a long name ("Marginal distribution of the data")
 * wraps its words but never drops the marker alone onto the next line.
 */
export function TermName({ v, as: Tag = "span", after }: { v: VocabTerm; as?: "span" | "h2" | "h3"; after?: ReactNode }) {
  const cut = after ? v.term.lastIndexOf(" ") + 1 : 0;
  return (
    <Tag className="term-name">
      <span className="term-word">
        {after ? (
          <>
            {v.term.slice(0, cut)}
            <span className="term-last">
              {v.term.slice(cut)}
              {after}
            </span>
          </>
        ) : (
          v.term
        )}
      </span>
      {v.symbol && <span className="term-symbol"><Tex tex={v.symbol} /></span>}
    </Tag>
  );
}

function TermBody({ v }: { v: VocabTerm }) {
  return (
    <>
      <p className="term-plain"><RichText text={v.plain} /></p>
      {v.formal && (
        <div className="term-part">
          <p className="eyebrow">{"// In the notes"}</p>
          <PageView text={v.formal} />
        </div>
      )}
      <div className="term-part">
        <p className="eyebrow">{"// You'll see it as"}</p>
        <PageView text={v.seeIt} />
      </div>
      <Citations sources={[v.source]} />
    </>
  );
}

function Lesson({ terms, known, onDone }: { terms: VocabTerm[]; known: Set<string>; onDone: () => void }) {
  // open on the first term not yet marked known; when every term is known it is a review
  const firstNew = terms.findIndex((t) => !known.has(t.id));
  const [i, setI] = useState(Math.max(0, firstNew));
  const v = terms[i];
  const note = firstNew < 0 ? (i === 0 ? "all known: a quick review" : undefined) : i === firstNew ? "start here" : known.has(v.id) ? "you know this one" : "you are here";
  const next = terms.find((t) => !known.has(t.id));
  return (
    <>
      <StepTrack
        at={i}
        total={terms.length}
        label="Terms known"
        note={note}
        done={(k) => known.has(terms[k].id)}
        count={<Known n={known.size} total={terms.length} next={next?.term} />}
      />
      <article className="panel focal term-card" aria-live="polite" aria-label={`Term ${i + 1} of ${terms.length}`}>
        <p className="eyebrow">{"// Term "}{String(i + 1).padStart(2, "0")}{" of "}{String(terms.length).padStart(2, "0")}</p>
        <TermName v={v} as="h2" />
        <TermBody v={v} />
      </article>
      <div className="row">
        <button className="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < terms.length - 1 ? <button onClick={() => setI(i + 1)}>Next term</button> : <button onClick={onDone}>Check yourself</button>}
      </div>
    </>
  );
}

/**
 * Flashcards: recall the definition, reveal it, then rate yourself. The deck is shuffled for the session and the
 * track shows this session's sequence (card k of N), not which terms are known.
 */
function Cards({ topicId, terms }: { topicId: string; terms: VocabTerm[] }) {
  const { learning, rateTerm } = useLearning();
  const [round, setRound] = useState(0);
  const [only, setOnly] = useState<Set<string> | null>(null); // a rerun with only the terms not yet known
  const byId = useMemo(() => new Map(terms.map((t) => [t.id, t])), [terms]);
  const deck = useMemo(() => {
    const pool = only ? terms.filter((t) => only.has(t.id)) : terms;
    return sessionShuffle(`${topicId}-cards-${round}`, pool.length).map((k) => pool[k].id);
  }, [topicId, terms, round, only]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const notYet = (learning.vocab[topicId]?.notYet ?? []).filter((id) => byId.has(id));
  const known = (learning.vocab[topicId]?.known ?? []).filter((id) => byId.has(id));

  const rate = (got: boolean) => {
    rateTerm(topicId, deck[i], got);
    setLast(got ? "Saved: got it." : "Saved: not yet. It will come back first next time.");
    setShown(false);
    setI(i + 1);
  };
  const restart = (subset: Set<string> | null) => {
    setOnly(subset);
    setRound(round + 1);
    setI(0);
    setLast(null);
  };

  if (i >= deck.length) {
    return (
      <section className="panel focal term-card" aria-label="Flashcards finished">
        <p className="eyebrow">{"// Round finished"}</p>
        <h2>
          You know <b className="mono">{known.length}</b> of <b className="mono">{terms.length}</b> terms
        </h2>
        {notYet.length > 0 ? (
          <>
            <p>Not yet:</p>
            <ul className="term-chips">
              {notYet.map((id) => <li key={id}>{byId.get(id)!.term}</li>)}
            </ul>
          </>
        ) : (
          <p>Every term is marked as known. Come back before the exam and run them again.</p>
        )}
        <div className="row">
          {notYet.length > 0 && (
            <button onClick={() => restart(new Set(notYet))}>
              Go again with the <b className="mono">{notYet.length}</b> not yet known
            </button>
          )}
          <button className={notYet.length > 0 ? "ghost" : undefined} onClick={() => restart(null)}>Run all the cards again</button>
        </div>
      </section>
    );
  }

  const v = byId.get(deck[i])!;
  const was = known.includes(v.id) ? "known" : notYet.includes(v.id) ? "not yet" : null;
  return (
    <>
      <StepTrack at={i} total={deck.length} label="Flashcard progress" counter={false} />
      <article className="panel focal term-card flashcard" aria-label={`Flashcard ${i + 1} of ${deck.length}`}>
        <p className="eyebrow">
          {"// Card "}{String(i + 1).padStart(2, "0")}{" of "}{String(deck.length).padStart(2, "0")}
          {was ? ` · last time: ${was}` : " · new"}
        </p>
        <Beside note={shown ? "was that what you said?" : "say it out loud first"} className="term-head">
          <TermName v={v} as="h2" />
        </Beside>
        {!shown ? (
          <>
            <p className="muted">What does it mean? Say the definition to yourself, then reveal it.</p>
            <div className="row">
              <button onClick={() => setShown(true)}>Reveal the definition</button>
            </div>
          </>
        ) : (
          <>
            <div className="reveal" role="region" aria-label="Definition">
              <TermBody v={v} />
            </div>
            <div className="rate" role="group" aria-label="Did you have it?">
              <span className="rate-ask" aria-hidden="true">Did you have it?</span>
              <button onClick={() => rate(true)}>Got it</button>
              <button className="ghost" onClick={() => rate(false)}>Not yet</button>
            </div>
          </>
        )}
      </article>
      {last && <Result ok={last.startsWith("Saved: got")}>{last}</Result>}
    </>
  );
}

export function GlossaryRows({ terms, known }: { terms: VocabTerm[]; known: Set<string> }) {
  return (
    <dl className="glossary">
      {terms.map((v) => (
        <div key={v.id} className="g-row">
          <dt>
            <TermName
              v={v}
              after={
                known.has(v.id) ? (
                  <span className="chip status-note g-known" title="You rated this term as known">
                    <span aria-hidden="true">✓</span>
                    <span>known</span>
                  </span>
                ) : undefined
              }
            />
          </dt>
          <dd>
            <RichText text={v.plain} />
            <Citations sources={[v.source]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Vocab() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const mode = (MODES.find((x) => x.id === params.get("mode"))?.id ?? "lesson") as Mode;
  if (!topic) return <p>Topic not found.</p>;
  const terms = vocabFor(topic.id);
  const p = vocabProgress(data.learning, topic.id);
  const known = new Set(data.learning.vocab[topic.id]?.known ?? []);
  const setMode = (m: Mode) => setParams(m === "lesson" ? {} : { mode: m }, { replace: true });

  return (
    <>
      <p className="back"><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <Eyebrow>Vocabulary · {topic.title}</Eyebrow>
      <h1>Know the <Scribble>words</Scribble></h1>
      <p className="lede">The terms and notation this topic uses, defined the way the lecture notes define them. Read them one at a time, then check yourself.</p>

      <EyebrowSwitch
        ariaLabel="Vocabulary mode"
        items={MODES.map((x) => ({ id: x.id, label: x.label }))}
        active={mode}
        onChange={(m) => setMode(m as Mode)}
      />

      {mode === "lesson" && <Lesson terms={terms} known={known} onDone={() => setMode("cards")} />}
      {mode === "cards" && <Cards topicId={topic.id} terms={terms} />}
      {mode === "quiz" && <QuizMe topicId={topic.id} terms={terms} />}
      {mode === "list" && (
        <>
          <p className="status list-known">
            <Known n={p.done} total={p.total} />
          </p>
          <GlossaryRows terms={terms} known={known} />
          <p className="muted">
            Every term from every topic, with search, is in the <Link to="/glossary">course glossary</Link>.
          </p>
        </>
      )}

      {mode !== "list" && (
        <p className="next-activity">
          Next on this topic: <Link to={`/topic/${topic.id}/tutorial`}>the tutorial, with a check after each step</Link>
        </p>
      )}
    </>
  );
}
