import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TOPICS } from "../mock/topics";
import { VOCAB } from "../mock/vocab";
import { useStore } from "../lib/store";
import { api, type GlossaryResponse, type PersonalGlossaryEntry, type SharedGlossaryEntry } from "../lib/api";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { GlossaryRows } from "./Vocab";
import type { Topic, VocabTerm } from "../types";

const GREEK: Record<string, string> = { θ: "theta", μ: "mu", σ: "sigma", λ: "lambda", π: "pi", δ: "delta", α: "alpha", β: "beta", ℓ: "ell", χ: "chi" };

/** Lower-case words, with LaTeX commands and Greek letters spelled out (\theta and θ both become "theta"). */
const plain = (s: string) =>
  s
    .toLowerCase()
    .replace(/[θμσλπδαβℓχ]/g, (c) => ` ${GREEK[c]} `)
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

/** The lecture a topic covers: read from its lecture-notes citation, else its place in the course. */
const lectureOf = (t: Topic, i: number): number => {
  for (const s of t.sources) {
    const m = /lecture-notes\/lecture-(\d+)-/.exec(s.filename ?? "");
    if (m) return Number(m[1]);
  }
  return i + 1;
};

/** A term read from the notes that a hand-written term of the same lecture already covers: the same name, or one
 * name inside the other ("Prior" is covered by "Prior distribution"). */
const covered = (term: string, hand: VocabTerm[]) => {
  const a = plain(term);
  return hand.some((v) => {
    const b = plain(v.term);
    return a === b || a.includes(b) || b.includes(a);
  });
};

const fromNotes = (e: SharedGlossaryEntry): VocabTerm => ({
  id: e.id,
  term: e.term,
  plain: e.definition,
  seeIt: "",
  origin: "notes",
  source: { id: `${e.id}-src`, kind: "Shared", title: `Lecture ${e.lecture ?? "?"} · ${e.heading || e.title || "Definition"}`, filename: e.source, page: e.page },
});

const fromUpload = (e: PersonalGlossaryEntry): VocabTerm => ({
  id: e.id,
  term: e.term,
  plain: e.definition,
  seeIt: "",
  origin: "upload",
  source: { id: `${e.id}-src`, kind: "Personal", title: e.filename, collection: e.collection, filename: e.filename, fileId: e.fileId, page: e.page, excerpt: e.definition },
});

interface Group {
  id: string;
  title: string;
  /** Set when the app has a topic (and so a vocabulary lesson) for this lecture. */
  topicId?: string;
  terms: VocabTerm[];
}

/**
 * Every vocabulary term in the course, by lecture, with search. The hand-written terms of each topic come first;
 * after them, and for every lecture the app has no topic for yet, come the numbered definitions read from the lecture
 * notes themselves, so new course material brings its key terms here by itself. Definitions found in the learner's
 * own uploads close the list.
 */
export function Glossary() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [glossary, setGlossary] = useState<GlossaryResponse | null | "failed">(null);
  useEffect(() => {
    let live = true;
    api
      .glossary()
      .then((g) => live && setGlossary(g))
      .catch(() => live && setGlossary("failed"));
    return () => {
      live = false;
    };
  }, []);

  const groups = useMemo<Group[]>(() => {
    const byLecture = new Map<number, Group>();
    TOPICS.forEach((t, i) => byLecture.set(lectureOf(t, i), { id: t.id, title: t.title, topicId: t.id, terms: [...(VOCAB[t.id] ?? [])] }));
    const read = glossary && glossary !== "failed" ? glossary : null;
    for (const e of read?.shared ?? []) {
      const n = e.lecture ?? 0;
      let g = byLecture.get(n);
      if (!g) {
        g = { id: `lecture-${n}`, title: e.title || e.heading || `Lecture ${n}`, terms: [] };
        byLecture.set(n, g);
      }
      const hand = VOCAB[g.topicId ?? ""] ?? [];
      if (!covered(e.term, hand) && !g.terms.some((v) => v.id === e.id)) g.terms.push(fromNotes(e));
    }
    const ordered = [...byLecture.entries()].sort((a, b) => a[0] - b[0]).map(([, g]) => g);
    if (read?.personal.length) ordered.push({ id: "uploads", title: "From your uploads", terms: read.personal.map(fromUpload) });
    return ordered;
  }, [glossary]);

  const total = groups.reduce((s, g) => s + g.terms.length, 0);
  const fromMaterial = groups.reduce((s, g) => s + g.terms.filter((v) => v.origin).length, 0);
  const shown = groups.map((g) => ({ ...g, terms: g.terms.filter((v) => matches(v, q)) })).filter((g) => g.terms.length > 0);
  const found = shown.reduce((s, g) => s + g.terms.length, 0);
  const known = new Set(Object.values(data.learning.vocab).flatMap((v) => v.known));

  return (
    <>
      <Eyebrow>Glossary · {total} terms · {groups.length} sections</Eyebrow>
      <h1>The course <Scribble>glossary</Scribble></h1>
      <p className="lede">
        Every term and symbol from the lectures, defined the way the notes define them, with the page each one comes from. Definitions the notes number are read from the
        notes themselves, so new material adds its terms here on its own.
      </p>

      <div className="glossary-search">
        <label className="field">
          <span>Search terms and definitions</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. likelihood, conjugate, pivotal quantity" aria-label="Search the glossary" />
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
        ) : glossary === null ? (
          <>Terms marked ✓ known are ones you rated "got it" in a vocabulary lesson. Reading the notes' own definitions…</>
        ) : glossary === "failed" ? (
          <>Terms marked ✓ known are ones you rated "got it" in a vocabulary lesson. The notes' own definitions could not be read just now (is the study service running?).</>
        ) : (
          <>
            Terms marked ✓ known are ones you rated "got it" in a vocabulary lesson. <b className="mono">{fromMaterial}</b> {fromMaterial === 1 ? "term is" : "terms are"} read straight from
            the material.
          </>
        )}
      </p>

      <nav className="g-jump" aria-label="Jump to a section">
        <p className="eyebrow">{"// Jump to a lecture"}</p>
        <div className="g-jump-links">
          {shown.map((g) => (
            <button key={g.id} className="link" onClick={() => document.getElementById(`g-${g.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })}>
              {g.title}
            </button>
          ))}
        </div>
      </nav>

      {shown.length === 0 && <p className="muted">No terms match "{q}". Try a shorter word, or a symbol's name such as theta.</p>}

      {shown.map((g) => (
        <section key={g.id} id={`g-${g.id}`} className="glossary-group" aria-label={g.title}>
          <div className="row between g-head">
            <h2>{g.title}</h2>
            {g.topicId ? <Link to={`/topic/${g.topicId}/vocab`}>Learn these terms</Link> : g.id === "uploads" ? <Link to="/materials">Your course materials</Link> : <span className="muted">From the lecture notes</span>}
          </div>
          <GlossaryRows terms={g.terms} known={known} />
        </section>
      ))}
    </>
  );
}
