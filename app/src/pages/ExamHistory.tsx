import { Link, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { COURSE_ID, scopeTitle, sectionTitle } from "../lib/exam";
import { useStore } from "../lib/store";
import { ScoreBreakdown } from "../components/Score";
import { Citations } from "../components/Citation";
import { RichText } from "../components/Math";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { PageView } from "../components/PageView";
import { CRITERION_LABELS, type ExamRecord } from "../types";

/** What an exam was on: its topic, or "Across the course". */
const titleOf = (e: ExamRecord) => scopeTitle(e.topicId);
/** Where to sit the same exam again. */
const retakeLink = (e: ExamRecord) => (e.topicId === COURSE_ID ? "/exam" : `/topic/${e.topicId}/exam`);

function downloadPdf(e: ExamRecord, title: string) {
  const doc = new jsPDF();
  const W = 180;
  let y = 16;
  const line = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    for (const l of doc.splitTextToSize(text, W) as string[]) {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      doc.text(l, 15, y);
      y += size * 0.5 + 1.5;
    }
  };
  line(`${title} · attempt ${e.attempt}`, 16, true);
  line(`${new Date(e.at).toLocaleString()} · ${e.timed ? "Timed" : "Untimed"} · ${e.selfScored ? "self-score" : "composite"} ${e.composite}/100`);
  if (e.focus) line(`Focus: ${e.focus}`);
  y += 3;
  e.items.forEach((it, n) => {
    line(`Q${n + 1}. ${it.prompt.replace(/‹([^›]*)›/g, "$1")}`, 12, true); // a ‹mono› run is plain text in the export
    if (it.topicId) line(`Topic: ${sectionTitle(it.topicId)}`);
    line(`Your answer: ${it.answer || "(unanswered)"}`);
    line(`Feedback: ${it.feedback}`);
    it.aiFeedback?.forEach((f) => line(`${CRITERION_LABELS[f.criterion]} ${f.score}: ${f.comment} Try: ${f.suggestion}`));
    it.keyPoints?.forEach((k) => line(`[${k.got ? "x" : " "}] ${k.text}`));
    y += 3;
  });
  doc.save(`${title.replace(/\s+/g, "-")}-attempt-${e.attempt}.pdf`);
}

export function ExamHistory() {
  const { data } = useStore();
  return (
    <>
      <p className="back"><Link to="/practice">← Practice</Link></p>
      <Eyebrow>Practice · {data.exams.length} exam{data.exams.length === 1 ? "" : "s"}</Eyebrow>
      <h1>Exam <Scribble>history</Scribble></h1>
      {data.exams.length === 0 ? (
        <div className="empty">
          <p className="muted">No completed exams yet. Start one from Practice: across the whole course, or on one topic.</p>
          <div className="row">
            <Link className="button" to="/practice">Start an exam</Link>
            <Note dir="left">every topic, like the real thing</Note>
          </div>
        </div>
      ) : (
        <>
        <Note dir="down" className="block-note">open one to see each answer next to the reference</Note>
        <ul className="list exam-list">
          {data.exams.map((e) => (
            <li key={e.id} className="row between">
              <span>
                <Link to={`/exams/${e.id}`}>{titleOf(e)}</Link>
                <span className="eyebrow block">{"// attempt "}{e.attempt} · {new Date(e.at).toLocaleString()} · {e.timed ? "timed" : "untimed"}</span>
              </span>
              <span className="row">
                <b className="score-num">{e.composite}</b>
                {e.composite < data.config.compositeCutoff && <span className="warn" role="img" aria-label="Below cutoff">!</span>}
                <button className="ghost btn-sm" onClick={() => downloadPdf(e, titleOf(e))}>Download PDF</button>
              </span>
            </li>
          ))}
        </ul>
        </>
      )}
    </>
  );
}

export function ExamReview() {
  const { examId } = useParams();
  const { data } = useStore();
  const e = data.exams.find((x) => x.id === examId);
  if (!e) return <p>Exam not found. <Link to="/exams">Back to history</Link></p>;
  const general = e.topicId === COURSE_ID;
  return (
    <>
      <p className="back"><Link to="/exams">← Exam history</Link></p>
      <Eyebrow>Exam review · attempt {e.attempt} · {new Date(e.at).toLocaleString()} · {e.timed ? "timed" : "untimed"}</Eyebrow>
      <h1>{general ? <>Exam across the <Scribble>course</Scribble></> : <>{titleOf(e)} <Scribble>exam</Scribble></>}</h1>
      {e.focus && <p className="muted">Focus: {e.focus}</p>}
      <ScoreBreakdown criteria={e.criteria} cfg={data.config} selfScored={e.selfScored && !e.aiScored} />
      <ol className="review-list">
        {e.items.map((it) => (
          <li key={it.questionId}>
            {it.topicId && <p className="eyebrow">{"// "}{sectionTitle(it.topicId)}</p>}
            <p className="prompt"><RichText text={it.prompt} />{it.aiWritten && <span className="chip">AI-written</span>}</p>
            <h3>Your answer</h3>
            <pre className="answer">{it.answer || "(unanswered)"}</pre>
            <p className="eyebrow">{"// Score "}{it.composite}</p>
            <p>{it.feedback}</p>
            {it.aiFeedback && (
              <ul className="small">
                {it.aiFeedback.map((f) => (
                  <li key={f.criterion}><b>{CRITERION_LABELS[f.criterion]}</b> <span className="chip">{f.score}</span> {f.comment} <i>Try:</i> {f.suggestion}</li>
                ))}
              </ul>
            )}
            {it.keyPoints && (
              <ul className="ticks" aria-label="Key points">
                {it.keyPoints.map((k, n) => (
                  <li key={n} className={k.got ? "got" : "missed"}>
                    <span aria-hidden>{k.got ? "✓" : "!"}</span> <span className="sr-only">{k.got ? "Covered: " : "Not covered: "}</span>
                    <RichText text={k.text} />
                  </li>
                ))}
              </ul>
            )}
            {it.solution && (
              <details>
                <summary>Reference solution</summary>
                <div className="reference"><PageView text={it.solution} /></div>
              </details>
            )}
            <h3>Source materials</h3>
            <Citations sources={e.sources.filter((s) => it.sourceIds.includes(s.id))} />
          </li>
        ))}
      </ol>
      <div className="row">
        <Link className="button" to={retakeLink(e)}>Retake exam</Link>
        <button className="ghost" onClick={() => downloadPdf(e, titleOf(e))}>Download PDF</button>
      </div>
    </>
  );
}
