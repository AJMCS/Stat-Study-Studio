import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sourceById, topicById } from "../mock/topics";
import { buildQuiz } from "../mock/quiz";
import { uid, useStore } from "../lib/store";
import { Pad, emptyPad, padToText, type PadValue } from "../components/Pad";
import { RichText } from "../components/Math";
import { ScoreBreakdown } from "../components/Score";
import { Citations } from "../components/Citation";
import { Annotated, Eyebrow, KeyTitle, Scribble } from "../components/Hand";
import { StepTrack } from "../components/StepTrack";
import { BackToTopic } from "../components/BackLink";
import { RATING_CREDIT, SelfRate, type Rating } from "../components/SelfCheck";
import { uniformCriteria } from "../lib/scoring";
import type { CriterionScores, QuizQuestion, QuizResult } from "../types";

import { useAi } from "../lib/ai";
import { aiFailure, aiScore, type AiScored } from "../lib/aiScore";
import { CRITERIA, CRITERION_LABELS } from "../types";

type Mode = "graded" | "practice";
interface Answer {
  choice?: number;
  pad: PadValue;
}
interface Outcome {
  correct: boolean;
  credit: number;
  feedback: string;
  /** Open-ended answers are scored by the learner against the reference answer. */
  selfScored?: boolean;
  /** Or by an AI service on the four criteria. */
  ai?: AiScored;
}

const outcomeFromAi = (q: QuizQuestion, r: AiScored, cutoff: number): Outcome => ({
  correct: r.composite >= cutoff,
  credit: r.composite / 100,
  feedback: q.explanation,
  ai: r,
});
/** A learner choosing how an open-ended answer compared with the reference, for the first response or a retry. */
interface Rating_ {
  target: "first" | "retry";
  value: Rating | null;
}

const outcomeFromRating = (q: QuizQuestion, r: Rating): Outcome => ({
  correct: r === "got",
  credit: RATING_CREDIT[r],
  feedback: q.explanation,
  selfScored: true,
});

function gradeMc(q: QuizQuestion, a: Answer | undefined): Outcome {
  if (a?.choice === undefined) return { correct: false, credit: 0, feedback: "No answer given; counted as a miss." };
  const ok = a.choice === q.answer;
  return { correct: ok, credit: ok ? 1 : 0, feedback: ok ? q.explanation : `Not quite. ${q.explanation}` };
}

export function Quiz() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data, recordAttempt, saveQuiz } = useStore();
  const questions = useMemo(() => (topic ? buildQuiz(topic) : []), [topic]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  /** The first response to each question in practice mode. It is what counts, and it is then locked. */
  const [first, setFirst] = useState<Record<string, Outcome>>({});
  /** What the learner wrote for their first response, kept even if they later retry with something else. */
  const [firstAns, setFirstAns] = useState<Record<string, Answer>>({});
  const [retryOutcome, setRetryOutcome] = useState<Record<string, Outcome>>({});
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [rating, setRating] = useState<Record<string, Rating_>>({});
  const [retryScores, setRetryScores] = useState<{ qid: string; credit: number; selfScored: boolean }[]>([]);
  const [review, setReview] = useState(false);
  const [stage, setStage] = useState<"questions" | "selfcheck">("questions");
  const [pending, setPending] = useState<Record<string, Rating | null>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [summary, setSummary] = useState<{ criteria: CriterionScores; selfScored: boolean; aiScored: boolean } | null>(null);
  const ai = useAi();
  const [aiBusy, setAiBusy] = useState(false);
  /** Why AI scoring failed, per question (practice) or "all" (graded submit). The learner's answers are untouched. */
  const [aiError, setAiError] = useState<Record<string, string>>({});
  /** Graded quizzes: answers the AI has already scored this submit, so a retry only redoes the ones that failed. */
  const [aiDone, setAiDone] = useState<Record<string, Outcome>>({});

  if (!topic) return <p>Topic not found.</p>;
  const cfg = data.config;

  if (!mode) {
    return (
      <>
        <BackToTopic id={topic.id} title={topic.title} />
        <Eyebrow>Quiz · {questions.length} questions</Eyebrow>
        <h1><KeyTitle text={topic.title} /></h1>
        <p className="lede">One question at a time. Choose how you want feedback.</p>
        <Annotated block note="graded counts toward progress; practice tells you as you go">
        <div className="grid two">
          <button className="card focal" onClick={() => setMode("graded")}>
            <h3>Graded quiz</h3>
            <p>Move Back and Next, change answers freely, review, then submit. Feedback arrives after you submit.</p>
            <span className="card-go">Start graded quiz →</span>
          </button>
          <button className="card" onClick={() => setMode("practice")}>
            <h3>Low-stakes practice</h3>
            <p>Feedback right after each response. Your first response is what counts toward progress and is then locked; retries are saved separately.</p>
            <span className="card-go">Start practice →</span>
          </button>
        </div>
        </Annotated>
        <p className="muted">Multiple-choice questions are marked for you. For written answers you compare with a reference answer and score yourself, and those attempts are labeled <i>self-scored</i>.</p>
      </>
    );
  }

  const q = questions[i];
  const ans = answers[q.id] ?? { pad: emptyPad() };
  const answered = (qid: string) => {
    const a = answers[qid];
    return !!a && (a.choice !== undefined || a.pad.text.trim().length > 0 || !!a.pad.drawing);
  };
  const setAns = (a: Answer) => setAnswers((m) => ({ ...m, [q.id]: a }));

  const locked = mode === "practice" && !!first[q.id] && !retrying[q.id];
  const rate = rating[q.id];

  /** Practice: check the current answer. Multiple choice is marked now; a written answer goes to self-rating first. */
  const check = (target: "first" | "retry") => {
    if (q.kind === "mc") {
      const o = gradeMc(q, ans);
      if (target === "first") {
        setFirst((m) => ({ ...m, [q.id]: o }));
        setFirstAns((m) => ({ ...m, [q.id]: ans }));
      } else {
        setRetryOutcome((m) => ({ ...m, [q.id]: o }));
        setRetryScores((r) => [...r, { qid: q.id, credit: o.credit, selfScored: false }]);
        setRetrying((m) => ({ ...m, [q.id]: false }));
      }
    } else {
      setRating((m) => ({ ...m, [q.id]: { target, value: null } }));
    }
  };

  /** Practice: score a written answer with the AI service. On failure the answer stays and the learner can retry or self-score. */
  const checkWithAi = async (target: "first" | "retry") => {
    setAiBusy(true);
    setAiError((m) => ({ ...m, [q.id]: "" }));
    try {
      const r = await aiScore({ topic: topic.title, question: q.prompt, answer: padToText(ans.pad), reference: q.explanation, stage: "conceptual" }, cfg);
      const o = outcomeFromAi(q, r, cfg.compositeCutoff);
      if (target === "first") {
        setFirst((m) => ({ ...m, [q.id]: o }));
        setFirstAns((m) => ({ ...m, [q.id]: ans }));
      } else {
        setRetryOutcome((m) => ({ ...m, [q.id]: o }));
        setRetryScores((rs) => [...rs, { qid: q.id, credit: o.credit, selfScored: false }]);
        setRetrying((m) => ({ ...m, [q.id]: false }));
      }
    } catch (e) {
      setAiError((m) => ({ ...m, [q.id]: aiFailure(e) }));
    } finally {
      setAiBusy(false);
    }
  };

  const saveRating = () => {
    if (!rate?.value) return;
    const o = outcomeFromRating(q, rate.value);
    if (rate.target === "first") {
      setFirst((m) => ({ ...m, [q.id]: o }));
      setFirstAns((m) => ({ ...m, [q.id]: ans }));
    } else {
      setRetryOutcome((m) => ({ ...m, [q.id]: o }));
      setRetryScores((r) => [...r, { qid: q.id, credit: o.credit, selfScored: true }]);
      setRetrying((m) => ({ ...m, [q.id]: false }));
    }
    setRating((m) => {
      const { [q.id]: _gone, ...rest } = m;
      return rest;
    });
  };

  /** Written answers that still need the learner's rating before the quiz can be saved. */
  const needRating = () => questions.filter((qq) => qq.kind === "open" && answered(qq.id) && !first[qq.id]);

  const submit = async () => {
    const todo = needRating();
    if (todo.length === 0) return finish({});
    if (ai.connected) {
      // Score every written answer with the AI service; whatever fails is offered for retry or self-scoring.
      setAiBusy(true);
      setAiError({});
      const done: Record<string, Outcome> = { ...aiDone };
      let failure = "";
      for (const qq of todo) {
        if (done[qq.id]) continue;
        try {
          done[qq.id] = outcomeFromAi(qq, await aiScore({ topic: topic.title, question: qq.prompt, answer: padToText(answers[qq.id].pad), reference: qq.explanation, stage: "conceptual" }, cfg), cfg.compositeCutoff);
        } catch (e) {
          failure = aiFailure(e);
          break;
        }
      }
      setAiDone(done);
      setAiBusy(false);
      if (!failure) return finish({}, done);
      setAiError({ all: failure });
    }
    setStage("selfcheck");
    setReview(false);
    window.scrollTo?.({ top: 0 });
  };

  const finish = (ratings: Record<string, Rating | null>, scored: Record<string, Outcome> = aiDone) => {
    const items: QuizResult["items"] = questions.map((qq) => {
      const a = firstAns[qq.id] ?? answers[qq.id];
      const isAnswered = answered(qq.id);
      let o: Outcome;
      if (!isAnswered) o = { correct: false, credit: 0, feedback: "No answer given; counted as a miss." };
      else if (first[qq.id]) o = first[qq.id];
      else if (scored[qq.id]) o = scored[qq.id];
      else if (qq.kind === "mc") o = gradeMc(qq, a);
      else o = outcomeFromRating(qq, ratings[qq.id] ?? "missed");
      return {
        questionId: qq.id,
        prompt: qq.prompt,
        answer: qq.kind === "mc" ? (a?.choice !== undefined ? qq.choices![a.choice] : "") : a ? padToText(a.pad) : "",
        correct: isAnswered ? o.correct : false,
        partial: o.credit,
        feedback: isAnswered ? o.feedback : `Unanswered, counted as a miss. Review: ${qq.concept}.`,
        concept: qq.concept,
        sourceId: qq.sourceId,
        unanswered: !isAnswered,
        selfScored: o.selfScored,
        ...(o.ai && isAnswered ? { aiScored: true, criteria: o.ai.criteria, aiFeedback: o.ai.feedback } : {}),
      };
    });
    const score = Math.round(items.reduce((s, it) => s + (it.partial ?? 0), 0) * 10) / 10;
    const percent = (score / questions.length) * 100;
    const selfScored = items.some((it) => it.selfScored);
    const aiScored = items.some((it) => it.aiScored);
    // Written answers scored by the AI contribute their own criterion scores; everything else counts as its credit.
    const criteria: CriterionScores = aiScored
      ? (Object.fromEntries(
          CRITERIA.map((k) => [k, Math.round(items.reduce((s, it) => s + (it.aiScored && it.criteria ? it.criteria[k] : (it.partial ?? 0) * 100), 0) / items.length)]),
        ) as CriterionScores)
      : uniformCriteria(percent);
    const flagged = [...new Set(items.filter((it) => it.unanswered || it.correct === false).map((it) => it.concept))];
    const res: QuizResult = { id: uid(), topicId: topic.id, at: new Date().toISOString(), score, total: questions.length, items, flaggedConcepts: flagged, selfScored };
    saveQuiz(res);
    // Only the first response counts. Retries are saved separately and never touch the initial-attempt metrics.
    recordAttempt({ topicId: topic.id, kind: "quiz", counted: true, selfScored, aiScored, criteria, note: `${mode} quiz${selfScored ? " (self-scored)" : aiScored ? " (AI-scored)" : ""}` });
    retryScores.forEach((r) => recordAttempt({ topicId: topic.id, kind: "quiz", counted: false, selfScored: r.selfScored, criteria: uniformCriteria(r.credit * 100), note: "Practice retry" }));
    setSummary({ criteria, selfScored, aiScored });
    setResult(res);
  };

  if (result) {
    return (
      <>
        <Eyebrow>Quiz · {topic.title}</Eyebrow>
        <h1>Quiz <Scribble voice={false}>summary</Scribble></h1>
        <p className="eyebrow">{"// Score "}{result.score} / {result.total}</p>
        {summary && <ScoreBreakdown criteria={summary.criteria} cfg={cfg} selfScored={summary.selfScored} marked={!summary.selfScored && !summary.aiScored} />}
        {summary?.aiScored && <p className="muted small">The four criteria combine your AI-scored written answers with your multiple-choice marks.</p>}
        {result.flaggedConcepts.length > 0 && (
          <p className="notice hl">Concepts flagged for review: {result.flaggedConcepts.join("; ")}</p>
        )}
        <ol className="review-list">
          {result.items.map((it) => {
            const src = it.sourceId ? sourceById(it.sourceId) : undefined;
            return (
              <li key={it.questionId}>
                <p><RichText text={it.prompt} /></p>
                <p className={it.correct ? "ok-text" : "bad-text"}>
                  {it.unanswered ? "Unanswered" : it.correct ? "Correct" : "Partial credit"}
                  {!it.unanswered && !it.correct && <span className="chip">{Math.round((it.partial ?? 0) * 100)}%</span>}
                  {it.selfScored && <span className="chip">Self-scored</span>}
                  {it.aiScored && <span className="chip">AI-scored</span>}
                </p>
                <p><RichText text={it.feedback} /></p>
                {it.aiFeedback && (
                  <ul className="small">
                    {it.aiFeedback.map((f) => (
                      <li key={f.criterion}><b>{CRITERION_LABELS[f.criterion]}</b> <span className="chip">{f.score}</span> {f.comment} <i>Try:</i> {f.suggestion}</li>
                    ))}
                  </ul>
                )}
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

  if (stage === "selfcheck") {
    const list = needRating();
    const done = list.every((qq) => pending[qq.id]);
    return (
      <>
        <Eyebrow>Quiz · self-check</Eyebrow>
        <h1>Score your written <Scribble>answers</Scribble></h1>
        {aiError.all && <p className="notice warn-box" role="alert">{aiError.all} Your answers are kept.</p>}
        {ai.connected && Object.keys(aiDone).length > 0 && <p className="muted">{Object.keys(aiDone).length} written answer(s) were already scored by the AI service.</p>}
        <p className="lede">Compare each answer with the reference answer and say how it went. Be honest: this is what tells you what to review. These are marked <i>self-scored</i> in your progress.</p>
        {list.map((qq) => (
          <section key={qq.id} className="panel">
            <p className="prompt"><RichText text={qq.prompt} /></p>
            <SelfRate
              name={`rate-${qq.id}`}
              answer={padToText(answers[qq.id].pad)}
              reference={qq.explanation}
              value={pending[qq.id] ?? null}
              onChange={(r) => setPending((m) => ({ ...m, [qq.id]: r }))}
            />
          </section>
        ))}
        <div className="row">
          <button className="ghost" onClick={() => setStage("questions")}>Back to questions</button>
          {ai.connected && <button className="ghost" disabled={aiBusy} onClick={() => void submit()}>{aiBusy ? "Scoring…" : "Retry AI scoring"}</button>}
          <button disabled={!done} onClick={() => finish(pending)}>Finish and save</button>
        </div>
      </>
    );
  }

  if (review) {
    const missing = questions.filter((qq) => !answered(qq.id)).length;
    return (
      <>
        <Eyebrow>Quiz · review · {questions.length - missing} of {questions.length} answered</Eyebrow>
        <h1>Review before <Scribble>submitting</Scribble></h1>
        {missing > 0 && <p className="notice warn-box">Some questions are unanswered. You can still submit; each counts as a miss and flags its concept.</p>}
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
          <button onClick={() => void submit()} disabled={aiBusy}>{aiBusy ? "Scoring your written answers…" : "Submit quiz"}</button>
        </div>
      </>
    );
  }

  const f = first[q.id];
  const rf = retryOutcome[q.id];
  return (
    <>
      <BackToTopic id={topic.id} title={topic.title} />
      <Eyebrow>{mode === "graded" ? "Graded quiz" : "Practice quiz"} · {topic.title}</Eyebrow>
      <h1 className="h-mono">Question {i + 1} of {questions.length}</h1>
      <StepTrack at={i} total={questions.length} label="Quiz progress" note={i === questions.length - 1 ? "last one" : "you are here"} />
      <section className="panel focal">
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
          <Pad key={q.id} group={`quiz:${topic.id}`} value={ans.pad} onChange={(pad) => setAns({ ...ans, pad })} label="Show your work" disabled={locked || !!rate} />
        )}

        {aiError[q.id] && <p className="notice warn-box" role="alert">{aiError[q.id]} Your answer is kept.</p>}
        {mode === "practice" && !f && !rate && (
          <div className="row">
            <button onClick={() => (ai.connected && q.kind === "open" ? void checkWithAi("first") : check("first"))} disabled={!answered(q.id) || aiBusy}>
              {aiBusy ? "Scoring…" : aiError[q.id] ? "Retry check" : "Check answer"}
            </button>
            {ai.connected && q.kind === "open" && <button className="ghost" disabled={!answered(q.id) || aiBusy} onClick={() => check("first")}>Score it myself instead</button>}
          </div>
        )}
        {mode === "practice" && retrying[q.id] && !rate && (
          <div className="row">
            <button onClick={() => (ai.connected && q.kind === "open" ? void checkWithAi("retry") : check("retry"))} disabled={!answered(q.id) || aiBusy}>
              {aiBusy ? "Scoring…" : "Check retry"}
            </button>
            {ai.connected && q.kind === "open" && <button className="ghost" disabled={!answered(q.id) || aiBusy} onClick={() => check("retry")}>Score it myself instead</button>}
          </div>
        )}
        {rate && (
          <>
            <SelfRate
              name={`rate-${q.id}`}
              answer={padToText(ans.pad)}
              reference={q.explanation}
              value={rate.value}
              onChange={(v) => setRating((m) => ({ ...m, [q.id]: { ...rate, value: v } }))}
            />
            <button onClick={saveRating} disabled={!rate.value}>{rate.target === "first" ? "Save my rating (locks this response)" : "Save my rating"}</button>
          </>
        )}

        {f && !rate && (
          <div className="feedback" role="status">
            {/* The latest attempt leads: after a retry its own verdict and explanation show, and the locked first
                response (the one that counts) drops to a footnote, so a correct retry never looks like the old miss. */}
            {rf && !retrying[q.id] ? (
              <>
                <p className={rf.correct ? "ok-text" : "bad-text"}>
                  {rf.correct ? "Correct on the retry" : rf.credit > 0 ? "Partly right on the retry" : "Not yet, on the retry"}
                  {rf.selfScored && <span className="chip">Self-scored</span>}
                  {rf.ai && <span className="chip">AI-scored</span>}
                </p>
                {rf.ai && <ScoreBreakdown criteria={rf.ai.criteria} cfg={cfg} feedback={rf.ai.feedback} note={rf.ai.note} />}
                <p><RichText text={rf.feedback} /></p>
                <p className="muted">
                  First response: {f.correct ? "correct" : f.credit > 0 ? "partly right" : "needs work"}. It is locked and is what counts; a retry does not change your first-attempt score.
                </p>
              </>
            ) : (
              <>
                <p className={f.correct ? "ok-text" : "bad-text"}>
                  {f.correct ? "Correct" : f.credit > 0 ? "Partly" : "Needs work"} (first response, now locked)
                  {f.selfScored && <span className="chip">Self-scored</span>}
                  {f.ai && <span className="chip">AI-scored</span>}
                </p>
                {f.ai && <ScoreBreakdown criteria={f.ai.criteria} cfg={cfg} feedback={f.ai.feedback} note={f.ai.note} />}
                <p><RichText text={f.feedback} /></p>
              </>
            )}
            {!retrying[q.id] && <button className="ghost" onClick={() => setRetrying((m) => ({ ...m, [q.id]: true }))}>Try again (saved separately)</button>}
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
