import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey } from "../lib/journey";
import { scopeTitle } from "../lib/exam";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { RowNode, StateLine } from "./Learn";

const KIND: Record<string, string> = { quiz: "Quiz", exam: "Exam", recall: "Recall", tutor: "Tutor" };

export function Practice() {
  const { data, setSession } = useStore();
  const [includeSelf] = useIncludeSelfScored();
  const rows = journey(data, includeSelf);
  // The same current topic as the next-up topic on Learn, so the two pages agree.
  const [picked, setPicked] = useState(() => currentTopicId(data, rows));
  const recentCount = data.attempts.filter((a) => a.counted).length;
  const [openList, setOpenList] = useState(false);
  const sel = rows.find((r) => r.topic.id === picked) ?? rows[0];
  const recent = [...data.attempts].filter((a) => a.counted).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const mark = (activity: "quiz" | "exam") => setSession({ topicId: sel.topic.id, activity, at: new Date().toISOString() });

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
