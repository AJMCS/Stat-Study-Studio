import { useState } from "react";
import { Link } from "react-router-dom";
import { TOPICS } from "../mock/topics";
import { VOCAB } from "../mock/vocab";
import { useStore } from "../lib/store";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { GlossaryRows } from "./Vocab";
import type { VocabTerm } from "../types";

const GREEK: Record<string, string> = { θ: "theta", μ: "mu", σ: "sigma", λ: "lambda", π: "pi", δ: "delta", α: "alpha", β: "beta", ℓ: "ell" };

/** Lower-case words, with LaTeX commands and Greek letters spelled out (\theta and θ both become "theta"). */
const plain = (s: string) =>
  s
    .toLowerCase()
    .replace(/[θμσλπδαβℓ]/g, (c) => ` ${GREEK[c]} `)
    .replace(/\\([a-z]+)/g, " $1 ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const matches = (v: VocabTerm, q: string) => {
  if (!q) return true;
  const hay = plain(`${v.term} ${v.symbol ?? ""} ${v.plain}`);
  return plain(q)
    .split(" ")
    .every((w) => hay.includes(w));
};

/** Every vocabulary term in the course, by topic, with search. */
export function Glossary() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const total = Object.values(VOCAB).flat().length;
  const groups = TOPICS.map((t) => ({ t, terms: (VOCAB[t.id] ?? []).filter((v) => matches(v, q)) })).filter((g) => g.terms.length > 0);
  const found = groups.reduce((s, g) => s + g.terms.length, 0);
  const known = new Set(Object.values(data.learning.vocab).flatMap((v) => v.known));

  return (
    <>
      <Eyebrow>Glossary · {total} terms · {TOPICS.length} topics</Eyebrow>
      <h1>The course <Scribble>glossary</Scribble></h1>
      <p className="lede">Every term and symbol from the lectures, defined the way the notes define them, with the page each one comes from.</p>

      <div className="glossary-search">
        <label className="field">
          <span>Search terms and definitions</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. likelihood, conjugate, standard error" aria-label="Search the glossary" />
        </label>
        {/* beside the field on a wide screen, under it (arrow up) on a phone */}
        <span className="g-note" aria-hidden="true">
          <Note dir="left" className="beside-wide">a word you don't know? start here</Note>
          <Note dir="up" className="beside-narrow">a word you don't know? start here</Note>
        </span>
      </div>
      <p className="muted" role="status">
        {q ? (
          <>
            <b className="mono">{found}</b> of <b className="mono">{total}</b> terms match
          </>
        ) : (
          <>Terms marked ✓ known are ones you rated "got it" in a vocabulary lesson.</>
        )}
      </p>

      <nav className="g-jump" aria-label="Jump to a topic">
        <p className="eyebrow">{"// Jump to a topic"}</p>
        <div className="g-jump-links">
          {groups.map(({ t }) => (
            <button key={t.id} className="link" onClick={() => document.getElementById(`g-${t.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })}>
              {t.title}
            </button>
          ))}
        </div>
      </nav>

      {groups.length === 0 &&<p className="muted">No terms match "{q}". Try a shorter word, or a symbol's name such as theta.</p>}

      {groups.map(({ t, terms }) => (
        <section key={t.id} id={`g-${t.id}`} className="glossary-group" aria-label={t.title}>
          <div className="row between g-head">
            <h2>{t.title}</h2>
            <Link to={`/topic/${t.id}/vocab`}>Learn these terms</Link>
          </div>
          <GlossaryRows terms={terms} known={known} />
        </section>
      ))}
    </>
  );
}
