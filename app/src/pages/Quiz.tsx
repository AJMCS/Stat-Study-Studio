import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import { buildQuiz, scoreExplanation } from "../mock/ai";
import { uid, useStore } from "../lib/store";
import { Pad, emptyPad, padToText, type PadValue } from "../components/Pad";
import { RichText } from "../components/Math";
import { ScoreBreakdown } from "../components/Score";
import { Citations } from "../components/Citation";
import { CRITERIA, type CriterionScores, type QuizResult } from "../types";

type Mode = "graded" | "practice";
interface Answer {
  choice?: number;
  pad: PadValue;
}
interface Checked {
  correct: boolean;
  credit: number;
  feedback: string;
  criteria?: CriterionScores;
}

const uniform = (n: number): CriterionScores => ({ core: n, depth: n, relevance: n, application: n });

export function Quiz() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data, recordAttempt, saveQuiz } = useStore();
  const questions = useMemo(() => (topic ? buildQuiz(topic) : []), [topic]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checked, setChecked] = useState<Record<string, Checked>>({});
  const [retries, setRetries] = useState<{ qid: string; criteria: CriterionScores }[]>([]);
  const [review, setReview] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [summaryCriteria, setSummaryCriteria] = useState<CriterionScores | null>(null);

  if (!topic) return <p>Topic not found.</p>;
  const cfg = data.config;

  if (!mode) {
    return (
      <>
        <p><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
        <h1>{topic.title}: quiz</h1>
        <p className="lede">10 questions, one at a time. Choose how you want feedback.</p>
        <div className="grid two">
          <button className="card" onClick={() => setMode("graded")}>
            <h3>Graded quiz</h3>
            <p>Move Back and Next, change answers freely, review, then submit. Feedback arrives after you submit.</p>
          </button>
          <button className="card" onClick={() => setMode("practice")}>
            <h3>Low-stakes practice</h3>
            <p>Feedback right after each response. Your first response is what counts toward progress and is then locked; retries are saved separately.</p>
          </button>
        </div>
      </>
    );
  }

  const q = questions[i];
  const ans = answers[q.id] ?? { pad: emptyPad() };
  const locked = mode === "practice" && !!checked[q.id];
  const answered = (qid: string) => {
    const a = answers[qid];
    return !!a && (a.choice !== undefined || a.pad.text.trim().length > 0 || !!a.pad.drawing);
  };
  const setAns = (a: Answer) => setAnswers((m) => ({ ...m, [q.id]: a }));

  const grade = async (qq: typeof q, a: Answer | undefined): Promise<Checked> => {
    if (!a) return { correct: false, credit: 0, feedback: "No answer given; counted as a miss." };
    if (qq.kind === "mc") {
      if (a.choice === undefined) return { correct: false, credit: 0, feedback: "No answer given; counted as a miss." };
      const ok = a.choice === qq.answer;
      return { correct: ok, credit: ok ? 1 : 0, feedback: ok ? qq.explanation : `Not quite. ${qq.explanation}`, criteria: uniform(ok ? 100 : 0) };
    }
    const text = padToText(a.pad);
    if (!text.trim()) return { correct: false, credit: 0, feedback: "No answer given; counted as a miss." };
    const r = await scoreExplanation(text);
    const comp = Math.round(CRITERIA.reduce((s, k) => s + r.criteria[k], 0) / 4);
    // Partial credit: sound reasoning earns credit even when the final answer is off.
    return {
      correct: comp >= cfg.compositeCutoff,
      credit: comp / 100,
      feedback: `${qq.explanation} ${r.feedback.filter((f) => f.score < cfg.criterionCutoffs[f.criterion]).map((f) => f.suggestion).join(" ")}`.trim(),
      criteria: r.criteria,
    };
  };

  const check = async () => {
    setBusy(true);
    const c = await grade(q, ans);
    setChecked((m) => ({ ...m, [q.id]: c }));
    setBusy(false);
  };

  const retry = async () => {
    // Practice retry: scored but kept out of initial-attempt metrics.
    setBusy(true);
    const c = await grade(q, ans);
    if (c.criteria) setRetries((r) => [...r, { qid: q.id, criteria: c.criteria! }]);
    setChecked((m) => ({ ...m, [`${q.id}:retry`]: c }));
    setBusy(false);
  };

  const submit = async () => {
    setBusy(true);
    const items: QuizResult["items"] = [];
    const crit: CriterionScores[] = [];
    for (const qq of questions) {
      const a = answers[qq.id];
      const c = mode === "practice" && checked[qq.id] ? checked[qq.id] : await grade(qq, a);
      const unanswered = !answered(qq.id);
      if (c.criteria) crit.push(c.criteria);
      else crit.push(uniform(0));
      items.push({
        questionId: qq.id,
        prompt: qq.prompt,
        answer: qq.kind === "mc" ? (a?.choice !== undefined ? qq.choices![a.choice] : "") : a ? padToText(a.pad) : "",
        correct: unanswered ? false : c.correct,
        partial: c.credit,
        feedback: unanswered ? `Unanswered, counted as a miss. Review: ${qq.concept}.` : c.feedback,
        concept: qq.concept,
        sourceId: qq.sourceId,
        unanswered,
      });
    }
    const score = Math.round(items.reduce((s, it) => s + (it.partial ?? 0), 0) * 10) / 10;
    const avg = (k: keyof CriterionScores) => Math.round(crit.reduce((s, c) => s + c[k], 0) / crit.length);
    const criteria: CriterionScores = { core: avg("core"), depth: avg("depth"), relevance: avg("relevance"), application: avg("application") };
    const flagged = [...new Set(items.filter((it) => it.unanswered || it.correct === false).map((it) => it.concept))];
    const res: QuizResult = { id: uid(), topicId: topic.id, at: new Date().toISOString(), score, total: questions.length, items, flaggedConcepts: flagged };
    saveQuiz(res);
    recordAttempt({ topicId: topic.id, kind: "quiz", counted: true, criteria, note: `${mode} quiz` });
    retries.forEach((r) => recordAttempt({ topicId: topic.id, kind: "quiz", counted: false, criteria: r.criteria, note: "Practice retry" }));
    setSummaryCriteria(criteria);
    setResult(res);
    setBusy(false);
  };

  if (result) {
    return (
      <>
        <h1>Quiz summary</h1>
        <p className="lede">
          Score <strong>{result.score}</strong> / {result.total}
        </p>
        {summaryCriteria && <ScoreBreakdown criteria={summaryCriteria} cfg={cfg} />}
        {result.flaggedConcepts.length > 0 && (
          <p className="notice">Concepts flagged for review: {result.flaggedConcepts.join("; ")}</p>
        )}
        <ol className="review-list">
          {result.items.map((it) => {
            const src = it.sourceId ? sourceById(it.sourceId) : undefined;
            return (
              <li key={it.questionId}>
                <p><RichText text={it.prompt} /></p>
                <p className={it.correct ? "ok-text" : "bad-text"}>{it.unanswered ? "Unanswered" : it.correct ? "Correct" : `Partial credit ${Math.round((it.partial ?? 0) * 100)}%`}</p>
                <p>{it.feedback}</p>
                {src && <Citations sources={[src]} />}
              </li>
            );
          })}
        </ol>
        <div className="row">
          <Link className="button" to={`/topic/${topic.id}`}>Back to topic</Link>
          <button className="ghost" onClick={() => location.reload()}>Retake quiz</button>
        </div>
      </>
    );
  }

  if (review) {
    const missing = questions.filter((qq) => !answered(qq.id)).length;
    return (
      <>
        <h1>Review before submitting</h1>
        {missing > 0 && <p className="notice">{missing} unanswered. You can still submit; each counts as a miss and flags its concept.</p>}
        <ol className="review-list">
          {questions.map((qq, idx) => (
            <li key={qq.id}>
              <button className="link" onClick={() => { setReview(false); setI(idx); }}>
                Q{idx + 1}: {qq.prompt.slice(0, 80)}
              </button>
              <span className={answered(qq.id) ? "chip ok" : "chip flag"}>{answered(qq.id) ? "Answered" : "Unanswered"}</span>
            </li>
          ))}
        </ol>
        <div className="row">
          <button className="ghost" onClick={() => setReview(false)}>Back to questions</button>
          <button onClick={submit} disabled={busy}>{busy ? "Scoring…" : "Submit quiz"}</button>
        </div>
      </>
    );
  }

  const c = checked[q.id];
  const rc = checked[`${q.id}:retry`];
  return (
    <>
      <p><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <h1>Question {i + 1} of {questions.length}</h1>
      <progress value={i + 1} max={questions.length} aria-label="Quiz progress" />
      <section className="panel">
        <p className="prompt"><RichText text={q.prompt} /></p>
        {q.kind === "mc" ? (
          <fieldset disabled={locked}>
            <legend className="sr-only">Choices</legend>
            {q.choices!.map((ch, idx) => (
              <label key={idx} className="choice">
                <input type="radio" name={q.id} checked={ans.choice === idx} onChange={() => setAns({ ...ans, choice: idx })} />
                <span><RichText text={ch} /></span>
              </label>
            ))}
          </fieldset>
        ) : (
          <Pad value={ans.pad} onChange={(pad) => setAns({ ...ans, pad })} label="Show your work" disabled={locked} />
        )}

        {mode === "practice" && !c && (
          <button onClick={check} disabled={busy || !answered(q.id)}>{busy ? "Checking…" : "Check answer"}</button>
        )}
        {c && (
          <div className="feedback" role="status">
            <p className={c.correct ? "ok-text" : "bad-text"}>{c.correct ? "Correct" : "Needs work"} (first response, now locked)</p>
            <p>{c.feedback}</p>
            {c.criteria && q.kind === "open" && <ScoreBreakdown criteria={c.criteria} cfg={cfg} />}
            <button className="ghost" onClick={retry} disabled={busy}>Try again (saved separately)</button>
            {rc && <p className="muted">Retry: {rc.correct ? "correct" : "not yet"}. {rc.feedback}</p>}
          </div>
        )}
      </section>
      <div className="row">
        <button className="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < questions.length - 1 ? (
          <button onClick={() => setI(i + 1)}>Next</button>
        ) : (
          <button onClick={() => setReview(true)}>Review answers</button>
        )}
        {i < questions.length - 1 && <button className="ghost" onClick={() => setReview(true)}>Review</button>}
      </div>
    </>
  );
}
