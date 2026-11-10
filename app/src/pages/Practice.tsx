import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { useAi } from "../lib/ai";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey } from "../lib/journey";
import { scopeTitle } from "../lib/exam";
import { ACCEPTED_FILES, useFileRead } from "../lib/upload";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { RowNode, StateLine } from "./Learn";

const KIND: Record<string, string> = { quiz: "Quiz", exam: "Exam", recall: "Recall", tutor: "Tutor" };

/** Three ways to practise, in order: across the whole course, on one topic, or around your own ask (and a document). */
export function Practice() {
  const { data, setSession } = useStore();
  const ai = useAi();
  const nav = useNavigate();
  const [includeSelf] = useIncludeSelfScored();
  const rows = journey(data, includeSelf);
  // The same current topic as the next-up topic on Learn, so the two pages agree.
  const [picked, setPicked] = useState(() => currentTopicId(data, rows));
  const recentCount = data.attempts.filter((a) => a.counted).length;
  const [openList, setOpenList] = useState(false);
  const [ask, setAsk] = useState("");
  const { reading, addFile, reset, fileId } = useFileRead();
  const fileInput = useRef<HTMLInputElement>(null);
  const sel = rows.find((r) => r.topic.id === picked) ?? rows[0];
  const recent = [...data.attempts].filter((a) => a.counted).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const mark = (activity: "quiz" | "exam") => setSession({ topicId: sel.topic.id, activity, at: new Date().toISOString() });
  const canGo = (!!ask.trim() || !!fileId) && reading?.state !== "reading";
  /** A custom exam or quiz: around the ask, based on the read file, or both. */
  const custom = (kind: "exam" | "quiz") => {
    const q = ask.trim();
    if (!q && !fileId) return;
    const params = new URLSearchParams();
    if (q) params.set("ask", q);
    if (fileId) params.set("file", fileId);
    nav(`/${kind}?${params.toString()}`);
  };
  const onFile = (list: FileList | null) => {
    const file = list?.[0];
    if (fileInput.current) fileInput.current.value = "";
    if (file) void addFile(file);
  };

  return (
    <>
      <Eyebrow>
        Practice · {recentCount} score{recentCount === 1 ? "" : "s"} · {data.exams.length} exam{data.exams.length === 1 ? "" : "s"}
      </Eyebrow>
      <h1>
        Practice for the <Scribble>exam</Scribble>
      </h1>
      <p className="lede">Sit an exam across the whole course under real conditions, or warm up with a quiz. Everything you submit feeds your progress, topic by topic.</p>

      <section className="card focal exam-card" aria-labelledby="exam-h">
        <h2 id="exam-h">Exam</h2>
        <p>
          One question from every topic, like the real paper: full written solutions, timed or untimed. You compare each answer with a reference solution and score it, or
          let a connected AI service score it on four criteria.
        </p>
        <div className="row exam-actions">
          <Link className="button" to="/exam" state={{ from: "practice" }}>Start an exam</Link>
          <Link className="button ghost" to="/quiz" state={{ from: "practice" }}>Take a quiz</Link>
          <Note dir="left" className="focal-note">every topic, like the real thing</Note>
        </div>
      </section>

      <fieldset className={`topic-picker${openList ? " open" : ""}`}>
        <legend className="sr-only">One topic at a time</legend>
        <div className="topic-line">
          <span className="eyebrow inline">{"// One topic"}</span>
          <span className="topic-line-title">{sel.topic.title}</span>
          <StateLine r={sel} />
          <button type="button" className="link change-topic" aria-expanded={openList} onClick={() => setOpenList((o) => !o)}>
            {openList ? "Done" : "Change topic"}
          </button>
        </div>
        <div className="picks" hidden={!openList}>
          {rows.map((r) => {
            const on = r.topic.id === sel.topic.id;
            return (
              <label key={r.topic.id} className={`pick${on ? " on" : ""}`}>
                <input type="radio" name="practice-topic" checked={on} onChange={() => { setPicked(r.topic.id); setOpenList(false); }} />
                <span className="pick-node"><RowNode r={r} uniform /></span>
                <span className="pick-text">
                  <span className="pick-title">{r.topic.title}</span>
                  <span className="state">{r.score === null ? "Not started" : r.status === "revisit" ? <>Revisit · <b>{r.score}</b></> : <>Score <b>{r.score}</b></>}</span>
                </span>
              </label>
            );
          })}
        </div>
        <div className="row topic-actions">
          <Link className="button ghost" to={`/topic/${sel.topic.id}/exam`} state={{ from: "practice" }} onClick={() => mark("exam")}>Exam on this topic</Link>
          <Link className="button ghost" to={`/topic/${sel.topic.id}/quiz`} state={{ from: "practice" }} onClick={() => mark("quiz")}>Quiz on this topic</Link>
        </div>
      </fieldset>

      <form
        className="ask-row"
        aria-label="Your own ask"
        onSubmit={(e) => {
          e.preventDefault();
          custom("exam");
        }}
      >
        <div className="topic-line">
          <span className="eyebrow inline">{"// Your own ask"}</span>
          <span className="topic-line-title">Say what to be tested on</span>
        </div>
        <label className="field">
          <span className="sr-only">What do you want to be tested on?</span>
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            maxLength={500}
            aria-label="What do you want to be tested on?"
            placeholder={ai.connected ? 'e.g. "a mock exam based on exam 2 review", or "conjugate priors and the posterior mean"' : "e.g. conjugate priors and the posterior mean, with one MLE question"}
          />
        </label>
        {ai.connected && (
          <div className="file-row">
            {(!reading || reading.state === "failed") && (
              <label className="field">
                <span>Or a document to base it on: an exam review, a problem set, or a photo of one (optional)</span>
                <input ref={fileInput} type="file" accept={ACCEPTED_FILES} aria-label="A document to base it on" onChange={(e) => onFile(e.target.files)} />
              </label>
            )}
            {reading?.state === "reading" && (
              <p className="muted" role="status">
                Reading <b>{reading.filename}</b>{reading.total > 0 ? `: page ${Math.min(reading.progress + 1, reading.total)} of ${reading.total}` : "…"}
              </p>
            )}
            {reading?.state === "read" && (
              <p className="muted" role="status">
                <b>{reading.file.filename}</b> is read (<b className="mono">{reading.file.pages}</b> page{reading.file.pages === 1 ? "" : "s"}) and saved in your files.{" "}
                <button type="button" className="link" onClick={reset}>Use a different file</button>
              </p>
            )}
            {reading?.state === "failed" && (
              <p className="notice warn-box" role="alert">
                <b>{reading.filename}</b> wasn't read. {reading.error}
              </p>
            )}
          </div>
        )}
        <div className="row topic-actions">
          <button type="submit" className="ghost" disabled={!canGo}>Custom exam</button>
          <button type="button" className="ghost" disabled={!canGo} onClick={() => custom("quiz")}>Custom quiz</button>
        </div>
        <p className="muted small">
          {ai.connected
            ? 'Name course material to base it on ("exam 2 review", "homework 3"), add a document, or just say the topic. Questions are written by your AI service around it, or chosen from the question bank by your words.'
            : "Questions are chosen from the question bank by your words. Connect an AI service in Settings to have them written around your ask, or based on an exam review or a document."}
        </p>
      </form>

      <section aria-labelledby="recent-h" className="recent">
        <div className="row between">
          <h2 id="recent-h">Recent scores</h2>
          <Link to="/exams">Exam history</Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted">Nothing yet. Your quiz, exam and recall scores will show up here.</p>
        ) : (
          <table className="results">
            <thead>
              <tr><th>Date</th><th>Topic</th><th>Type</th><th className="num">Score</th></tr>
            </thead>
            <tbody>
              {recent.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{new Date(a.at).toLocaleDateString()}</td>
                  <td>{scopeTitle(a.topicId)}</td>
                  <td>{KIND[a.kind] ?? a.kind}{a.selfScored && <span className="chip">Self-scored</span>}</td>
                  <td className="num">
                    <b className="mono score-num">{a.composite}</b>
                    {a.composite < data.config.compositeCutoff && <span className="state below">below cutoff</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
