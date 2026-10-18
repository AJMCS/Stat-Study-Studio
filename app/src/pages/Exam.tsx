import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import type { SourceRef } from "../types";
import { generateExam, gradeExamAnswer, type DraftExam } from "../mock/ai";
import { uid, useStore } from "../lib/store";
import { Pad, emptyPad, padToText, type PadValue } from "../components/Pad";
import { RichText } from "../components/Math";
import { Citations, isAnswerKey } from "../components/Citation";
import { CRITERIA, type CriterionScores, type ExamRecord } from "../types";
import { composite } from "../lib/scoring";

const SECONDS_PER_QUESTION = 600;

export function Exam() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const nav = useNavigate();
  const { data, saveExam, recordAttempt } = useStore();
  const [timed, setTimed] = useState(false);
  const [focus, setFocus] = useState("");
  const [exam, setExam] = useState<DraftExam | null>(null);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, PadValue>>({});
  const [i, setI] = useState(0);
  const [showSrc, setShowSrc] = useState(false);
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(0);
  const submitted = useRef(false);

  const submit = async () => {
    if (!topic || !exam || submitted.current) return;
    submitted.current = true;
    setBusy(true);
    const items: ExamRecord["items"] = [];
    const sums: CriterionScores = { core: 0, depth: 0, relevance: 0, application: 0 };
    for (const q of exam.questions) {
      const a = answers[q.id] ?? emptyPad();
      const text = padToText(a);
      const g = text.trim() ? await gradeExamAnswer(q, text) : { criteria: { core: 0, depth: 0, relevance: 0, application: 0 }, feedback: "Unanswered, counted as a miss.", keyPointNote: `Key points expected: ${q.keyPoints.join("; ")}.` };
      CRITERIA.forEach((k) => (sums[k] += g.criteria[k]));
      items.push({ questionId: q.id, prompt: q.prompt, answer: text, feedback: `${g.feedback} ${g.keyPointNote}`, sourceIds: q.sourceIds, composite: composite(g.criteria, data.config) });
    }
    const n = exam.questions.length;
    const criteria = Object.fromEntries(CRITERIA.map((k) => [k, Math.round(sums[k] / n)])) as CriterionScores;
    const record: ExamRecord = {
      id: uid(),
      topicId: topic.id,
      at: new Date().toISOString(),
      timed,
      focus,
      attempt: data.exams.filter((e) => e.topicId === topic.id).length + 1,
      composite: composite(criteria, data.config),
      criteria,
      items,
      sources: [...new Set(exam.questions.flatMap((q) => q.sourceIds))].map(sourceById).filter((s): s is SourceRef => !!s),
    };
    saveExam(record);
    recordAttempt({ topicId: topic.id, kind: "exam", counted: true, criteria, note: `Exam attempt ${record.attempt}` });
    nav(`/exams/${record.id}`);
  };

  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    if (!exam || !timed) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [exam, timed]);
  useEffect(() => {
    if (exam && timed && left <= 0) submitRef.current();
  }, [left, exam, timed]);

  if (!topic) return <p>Topic not found.</p>;

  if (!exam) {
    return (
      <>
        <p><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
        <h1>{topic.title}: exam</h1>
        <p className="lede">Write complete, multi-step solutions. You're graded on your setup choices and reasoning, not only the final answer.</p>
        <fieldset className="panel">
          <legend>Mode</legend>
          <label className="choice"><input type="radio" name="mode" checked={!timed} onChange={() => setTimed(false)} /> <span>Untimed (default): source toggle and hints available while you work</span></label>
          <label className="choice"><input type="radio" name="mode" checked={timed} onChange={() => setTimed(true)} /> <span>Timed: no in-exam aids; auto-submits when time runs out</span></label>
        </fieldset>
        <label className="field">
          <span>Focus (optional)</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. standard error and sample size, or the topic I'm struggling with" />
        </label>
        <p className="muted">Questions are drawn from the course materials, including prior homework and quiz questions. With a focus, existing questions are adapted or new ones are created.</p>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const d = await generateExam(topic, focus);
            setExam(d);
            setLeft(d.questions.length * SECONDS_PER_QUESTION);
            setBusy(false);
          }}
        >
          {busy ? "Preparing exam…" : "Start exam"}
        </button>
      </>
    );
  }

  const q = exam.questions[i];
  const a = answers[q.id] ?? emptyPad();
  const srcs = q.sourceIds.map(sourceById).filter((s): s is SourceRef => !!s && !isAnswerKey(s));
  const mm = Math.max(0, Math.floor(left / 60));
  const ss = Math.max(0, left % 60).toString().padStart(2, "0");

  return (
    <>
      <h1>{exam.title}</h1>
      <div className="row between">
        <span>Question {i + 1} of {exam.questions.length}{exam.adapted && " · adapted to your focus"}</span>
        {timed ? <span className="timer" role="timer" aria-label={`Time left ${mm} minutes ${ss} seconds`}>{mm}:{ss}</span> : <span className="chip">Untimed</span>}
      </div>
      <section className="panel">
        <p className="prompt"><RichText text={q.prompt} /></p>
        <Pad value={a} onChange={(v) => setAnswers((m) => ({ ...m, [q.id]: v }))} label="Your full solution" />
        {!timed && (
          <div className="row">
            <button className="ghost" aria-pressed={showSrc} onClick={() => setShowSrc((s) => !s)}>{showSrc ? "Hide source material" : "Show source material"}</button>
            <button className="ghost" onClick={() => setHints((h) => ({ ...h, [q.id]: true }))}>Hint</button>
          </div>
        )}
        {!timed && hints[q.id] && <p className="notice" role="status">Hint: {q.hint}</p>}
        {!timed && showSrc && <Citations sources={srcs} />}
      </section>
      <div className="row">
        <button className="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < exam.questions.length - 1 ? (
          <button onClick={() => setI(i + 1)}>Next</button>
        ) : (
          <button onClick={submit} disabled={busy}>{busy ? "Grading…" : "Submit exam"}</button>
        )}
      </div>
    </>
  );
}
