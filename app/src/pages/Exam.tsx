import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import { selectExam, type DraftExam } from "../lib/exam";
import { uid, useStore } from "../lib/store";
import { Pad, emptyPad, padToText, type PadValue } from "../components/Pad";
import { RichText } from "../components/Math";
import { Citations, isAnswerKey } from "../components/Citation";
import { SelfCheck } from "../components/SelfCheck";
import { composite, selfScore, uniformCriteria } from "../lib/scoring";
import type { ExamRecord, SourceRef } from "../types";

const SECONDS_PER_QUESTION = 600;

const written = (a: PadValue | undefined) => !!a && (a.text.trim().length > 0 || !!a.drawing);

export function Exam() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const nav = useNavigate();
  const { data, saveExam, recordAttempt } = useStore();
  const [timed, setTimed] = useState(false);
  const [focus, setFocus] = useState("");
  const [exam, setExam] = useState<DraftExam | null>(null);
  const [stage, setStage] = useState<"work" | "check">("work");
  const [answers, setAnswers] = useState<Record<string, PadValue>>({});
  const [got, setGot] = useState<Record<string, boolean[]>>({});
  const [i, setI] = useState(0);
  const [showSrc, setShowSrc] = useState(false);
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(0);
  const submitted = useRef(false);

  const toCheck = () => {
    if (submitted.current) return;
    submitted.current = true;
    setStage("check");
    window.scrollTo?.({ top: 0 });
  };
  const toCheckRef = useRef(toCheck);
  toCheckRef.current = toCheck;

  useEffect(() => {
    if (!exam || !timed || stage !== "work") return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [exam, timed, stage]);
  useEffect(() => {
    if (exam && timed && stage === "work" && left <= 0) toCheckRef.current();
  }, [left, exam, timed, stage]);

  if (!topic) return <p>Topic not found.</p>;

  if (!exam) {
    return (
      <>
        <p><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
        <h1>{topic.title}: exam</h1>
        <p className="lede">Write complete, multi-step solutions: set up the problem, justify your choices, and show the work. When you finish, you compare with a full reference solution and score yourself.</p>
        <fieldset className="panel">
          <legend>Mode</legend>
          <label className="choice"><input type="radio" name="mode" checked={!timed} onChange={() => setTimed(false)} /> <span>Untimed (default): source toggle and hints available while you work</span></label>
          <label className="choice"><input type="radio" name="mode" checked={timed} onChange={() => setTimed(true)} /> <span>Timed: no in-exam aids; moves to scoring when time runs out</span></label>
        </fieldset>
        <label className="field">
          <span>Focus (optional)</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. edge cases, bias, or the posterior mean" />
        </label>
        <p className="muted">Questions come from the course materials, including prior homework. A focus chooses which existing questions to ask. New questions can be written once an AI service is connected.</p>
        <button
          onClick={() => {
            const d = selectExam(topic, focus);
            setExam(d);
            setLeft(d.questions.length * SECONDS_PER_QUESTION);
          }}
        >
          Start exam
        </button>
      </>
    );
  }

  const finish = () => {
    const items: ExamRecord["items"] = exam.questions.map((q) => {
      const a = answers[q.id];
      const ticks = got[q.id] ?? q.keyPoints.map(() => false);
      const has = written(a);
      const score = has ? selfScore(ticks) : 0;
      return {
        questionId: q.id,
        prompt: q.prompt,
        answer: a ? padToText(a) : "",
        feedback: has ? `Self-scored: ${ticks.filter(Boolean).length} of ${q.keyPoints.length} key points.` : "Unanswered, counted as a miss.",
        sourceIds: q.sourceIds,
        composite: score,
        solution: q.solution,
        keyPoints: q.keyPoints.map((text, k) => ({ text, got: has && !!ticks[k] })),
      };
    });
    const overall = Math.round(items.reduce((s, it) => s + it.composite, 0) / Math.max(1, items.length));
    const criteria = uniformCriteria(overall);
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
      selfScored: true,
    };
    saveExam(record);
    recordAttempt({ topicId: topic.id, kind: "exam", counted: true, selfScored: true, criteria, note: `Exam attempt ${record.attempt} (self-scored)` });
    nav(`/exams/${record.id}`);
  };

  if (stage === "check") {
    const answered = exam.questions.filter((q) => written(answers[q.id]));
    const overall = Math.round(
      exam.questions.reduce((s, q) => s + (written(answers[q.id]) ? selfScore(got[q.id] ?? q.keyPoints.map(() => false)) : 0), 0) / Math.max(1, exam.questions.length),
    );
    return (
      <>
        <h1>Score your exam</h1>
        <p className="lede">
          Compare each answer with the reference solution, then tick the key points your work covered. This is scored by you, so be honest: it is what shows you where to study next.
          {timed && " Time is up, so your answers are locked."}
        </p>
        {exam.questions.map((q, n) => (
          <section key={q.id} className="panel">
            <h2>Question {n + 1}</h2>
            <p className="prompt"><RichText text={q.prompt} /></p>
            {written(answers[q.id]) ? (
              <SelfCheck
                answer={padToText(answers[q.id])}
                reference={q.solution}
                keyPoints={q.keyPoints}
                got={got[q.id] ?? q.keyPoints.map(() => false)}
                onChange={(g) => setGot((m) => ({ ...m, [q.id]: g }))}
              />
            ) : (
              <p className="notice">No answer written, so this counts as a miss. The reference solution is in the exam review after you finish.</p>
            )}
          </section>
        ))}
        <div className="row">
          <button onClick={finish}>Finish and save ({overall}/100)</button>
          <span className="muted">{answered.length} of {exam.questions.length} answered</span>
        </div>
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
      {exam.focusMatched === true && <p className="muted">Chose the {exam.questions.length} question{exam.questions.length === 1 ? "" : "s"} that match your focus.</p>}
      {exam.focusMatched === false && <p className="notice" role="status">No question matched that focus, so this is the full exam. Try other words, or pick a different topic.</p>}
      <div className="row between">
        <span>Question {i + 1} of {exam.questions.length}</span>
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
          <button onClick={toCheck}>Submit and score</button>
        )}
      </div>
    </>
  );
}
