import { Link, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { topicById } from "../mock/topics";
import { useStore } from "../lib/store";
import { ScoreBreakdown } from "../components/Score";
import { Citations } from "../components/Citation";
import { RichText } from "../components/Math";
import type { ExamRecord } from "../types";

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
  line(`${new Date(e.at).toLocaleString()} · ${e.timed ? "Timed" : "Untimed"} · composite ${e.composite}/100`);
  if (e.focus) line(`Focus: ${e.focus}`);
  y += 3;
  e.items.forEach((it, n) => {
    line(`Q${n + 1}. ${it.prompt}`, 12, true);
    line(`Your answer: ${it.answer || "(unanswered)"}`);
    line(`Feedback: ${it.feedback}`);
    y += 3;
  });
  doc.save(`${title.replace(/\s+/g, "-")}-attempt-${e.attempt}.pdf`);
}

export function ExamHistory() {
  const { data } = useStore();
  return (
    <>
      <h1>Exam history</h1>
      {data.exams.length === 0 ? (
        <p className="notice">No completed exams yet. Open a topic and choose Exam to start one.</p>
      ) : (
        <ul className="list">
          {data.exams.map((e) => {
            const t = topicById(e.topicId);
            return (
              <li key={e.id} className="row between">
                <span>
                  <Link to={`/exams/${e.id}`}>{t?.title ?? e.topicId} · attempt {e.attempt}</Link>
                  <span className="muted"> · {new Date(e.at).toLocaleString()} · {e.timed ? "timed" : "untimed"}</span>
                </span>
                <span className="row">
                  <b>{e.composite}</b>
                  <button className="ghost" onClick={() => downloadPdf(e, t?.title ?? "Exam")}>Download PDF</button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function ExamReview() {
  const { examId } = useParams();
  const { data } = useStore();
  const e = data.exams.find((x) => x.id === examId);
  if (!e) return <p>Exam not found. <Link to="/exams">Back to history</Link></p>;
  const t = topicById(e.topicId);
  return (
    <>
      <p><Link to="/exams">← Exam history</Link></p>
      <h1>{t?.title} exam · attempt {e.attempt}</h1>
      <p className="muted">{new Date(e.at).toLocaleString()} · {e.timed ? "Timed" : "Untimed"}{e.focus && ` · Focus: ${e.focus}`}</p>
      <ScoreBreakdown criteria={e.criteria} cfg={data.config} />
      <ol className="review-list">
        {e.items.map((it) => (
          <li key={it.questionId}>
            <p className="prompt"><RichText text={it.prompt} /></p>
            <h3>Your answer</h3>
            <pre className="answer">{it.answer || "(unanswered)"}</pre>
            <p><b>Score {it.composite}.</b> {it.feedback}</p>
            <h3>Source materials</h3>
            <Citations sources={e.sources.filter((s) => it.sourceIds.includes(s.id))} />
          </li>
        ))}
      </ol>
      <div className="row">
        <Link className="button" to={`/topic/${e.topicId}/exam`}>Retake exam</Link>
        <button className="ghost" onClick={() => downloadPdf(e, t?.title ?? "Exam")}>Download PDF</button>
      </div>
    </>
  );
}
