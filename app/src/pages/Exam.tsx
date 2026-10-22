import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { sourceById } from "../mock/topics";
import { COURSE_ID, examTitle, scopeFor, sectionTitle, selectExam, type DraftExam } from "../lib/exam";
import { api, hitToSource, personalHitToSource, ServiceRejected } from "../lib/api";
import { uid, useStore } from "../lib/store";
import { Pad, emptyPad, padForAi, padToText, type PadValue } from "../components/Pad";
import { RichText } from "../components/Math";
import { Eyebrow, KeyTitle, Scribble, Note } from "../components/Hand";
import { StepTrack } from "../components/StepTrack";
import { BackToTopic } from "../components/BackLink";
import { Citations, isAnswerKey } from "../components/Citation";
import { SelfCheck } from "../components/SelfCheck";
import { composite, selfScore, uniformCriteria } from "../lib/scoring";
import { CRITERIA, type CriterionScores, type ExamRecord, type SourceRef } from "../types";
import { ScoreBreakdown } from "../components/Score";
import { useAi } from "../lib/ai";
import { aiFailure, aiScore, type AiScored } from "../lib/aiScore";

const SECONDS_PER_QUESTION = 600;

const written = (a: PadValue | undefined) => !!a && (a.text.trim().length > 0 || !!a.drawing);

/** An exam on one topic (/topic/:id/exam) or, with no topic in the route (/exam), across every topic of the course. */
export function Exam() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const scope = scopeFor(id);
  /** /exam?ask=…: a custom exam around the learner's own words (the Practice page's "Your own ask"). */
  const ask = scope?.general ? (params.get("ask") ?? "").trim().slice(0, 500) : "";
  const nav = useNavigate();
  const { data, saveExam, recordAttempt } = useStore();
  const [timed, setTimed] = useState(false);
  const [focus, setFocus] = useState(ask);
  const [exam, setExam] = useState<DraftExam | null>(null);
  const [stage, setStage] = useState<"work" | "check">("work");
  const [answers, setAnswers] = useState<Record<string, PadValue>>({});
  const [got, setGot] = useState<Record<string, boolean[]>>({});
  const [i, setI] = useState(0);
  const [showSrc, setShowSrc] = useState(false);
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(0);
  const submitted = useRef(false);
  const ai = useAi();
  /** Answers the AI service has scored, by question id. A learner can drop one to self-score it instead. */
  const [aiRes, setAiRes] = useState<Record<string, AiScored>>({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  // a custom ask is best served by questions written around it, when a service is there to write them
  const [writeNew, setWriteNew] = useState(!!ask);
  const [count, setCount] = useState(4);
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState("");
  /** Across the course: how many such exams came before, so each sitting draws the next question from every topic. */
  const [rotation] = useState(() => data.exams.filter((e) => e.topicId === COURSE_ID).length);

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

  if (!scope) return <p>Topic not found.</p>;
  const general = scope.general;
  const custom = general && !!ask;
  /** What this paper is called in titles: a topic's exam, the course's, or a custom one around the ask. */
  const label = custom ? "Custom exam" : examTitle(scope);
  const back = general ? (
    <p className="back"><Link to="/practice">← Practice</Link></p>
  ) : (
    <BackToTopic id={scope.id} title={scope.title} />
  );
  /** The topic a question is scored against: its own, in an exam across the course. */
  const topicOf = (q: { topicId?: string }) => sectionTitle(q.topicId) || scope.title;

  const begin = (d: DraftExam) => {
    setExam(d);
    setLeft(d.questions.length * SECONDS_PER_QUESTION);
  };
  /** The paper from the question bank; a custom one is named for the ask whether or not a question matched it. */
  const fromBank = () => {
    const d = selectExam(scope, focus, rotation);
    begin(custom ? { ...d, title: `Custom exam: ${focus.trim() || ask}` } : d);
  };

  /** Ask the AI service for new questions around the focus. If that fails nothing is lost: the question bank is one click away. */
  const generate = async () => {
    setGenBusy(true);
    setGenError("");
    try {
      // the bank's examples for the model to adapt: a topic's first few, or one from every topic
      const examples = general
        ? scope.topics.filter((t) => t.examBank.length > 0).map((t) => t.examBank[rotation % t.examBank.length])
        : scope.topics[0].examBank.slice(0, 6);
      const res = await api.aiExam(
        general ? "STAT 132, every topic of the course" : scope.title,
        focus,
        count,
        examples.slice(0, 8).map((q) => ({ concept: q.concept, prompt: q.prompt })),
        general ? scope.topics.map((t) => t.title) : undefined,
      );
      const sources: SourceRef[] = [];
      const questions = res.questions.map((q, n) => {
        const ids = q.sources.map((h) => {
          const src = h.scope === "shared" ? hitToSource(h) : personalHitToSource(h);
          if (!sources.some((x) => x.id === src.id)) sources.push(src);
          return src.id;
        });
        const topicId = general ? scope.topics.find((t) => t.title === q.section)?.id : undefined;
        return {
          id: `ai-${uid()}-${n}`,
          prompt: q.prompt,
          solution: q.solution,
          hint: q.hint,
          concept: q.concept,
          sourceIds: ids,
          keyPoints: q.keyPoints,
          aiWritten: true,
          ...(topicId ? { topicId } : {}),
        };
      });
      begin({ title: `${label} (AI-written${focus.trim() ? `: ${focus.trim()}` : ""})`, questions, focusMatched: null, sources });
    } catch (e) {
      setGenError(e instanceof ServiceRejected ? e.message : "Couldn't reach the study service to write the questions.");
    } finally {
      setGenBusy(false);
    }
  };

  const sourceFor = (id: string) => exam?.sources?.find((s) => s.id === id) ?? sourceById(id);

  if (!exam) {
    return (
      <>
        {back}
        <Eyebrow>Exam · {custom ? "your own ask" : scope.unit}</Eyebrow>
        <h1><KeyTitle text={custom ? "Your custom exam" : scope.title} /></h1>
        <p className="lede">
          {custom ? "Around what you asked to be tested on. " : general && "One question from every topic, like the real paper. "}
          Write complete, multi-step solutions: set up the problem, justify your choices, and show the work. When you finish, you compare with a full reference solution and score yourself.
        </p>
        <fieldset className="panel">
          <legend>Mode</legend>
          <label className="choice"><input type="radio" name="mode" checked={!timed} onChange={() => setTimed(false)} /> <span>Untimed (default): source toggle and hints available while you work</span></label>
          <label className="choice"><input type="radio" name="mode" checked={timed} onChange={() => setTimed(true)} /> <span>Timed: no in-exam aids; moves to scoring when time runs out</span></label>
        </fieldset>
        <label className="field">
          <span>{custom ? "What to be tested on" : "Focus (optional)"}</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={500} placeholder="e.g. edge cases, bias, or the posterior mean" />
        </label>
        {ai.connected ? (
          <fieldset className="panel">
            <legend>Questions</legend>
            <label className="choice"><input type="radio" name="qsrc" checked={!writeNew} onChange={() => setWriteNew(false)} /> <span>From the question bank (authored from the course materials{general ? ", one from every topic" : ""}; a focus chooses which ones)</span></label>
            <label className="choice"><input type="radio" name="qsrc" checked={writeNew} onChange={() => setWriteNew(true)} /> <span>Written for me by your AI service, around your focus and adapted from the bank</span></label>
            {writeNew && (
              <>
                <label className="field">
                  <span>Number of questions</span>
                  <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                    {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <p className="muted">AI-written questions and solutions can contain mistakes. Each one is marked, and cites the course pages it was based on so you can check.</p>
              </>
            )}
          </fieldset>
        ) : (
          <p className="muted">Questions come from the course materials, including prior homework. A focus chooses which existing questions to ask. Connect an AI service in Settings to have new questions written around your focus.</p>
        )}
        {genError && <p className="notice warn-box" role="alert">{genError}</p>}
        <div className="row">
          <button onClick={() => (ai.connected && writeNew ? void generate() : fromBank())} disabled={genBusy}>
            {genBusy ? "Writing your exam…" : genError ? "Try again" : ai.connected && writeNew ? "Write my exam" : "Start exam"}
          </button>
          {genError && <button className="ghost" onClick={fromBank}>Use the question bank instead</button>}
          {!genError && <Note dir="left" className="focal-note">untimed is fine for a first go</Note>}
        </div>
      </>
    );
  }

  /** Score every written answer that has no AI score yet. Stops at the first failure and keeps what succeeded. */
  const scoreAllWithAi = async () => {
    setAiBusy(true);
    setAiError("");
    const next = { ...aiRes };
    try {
      for (const q of exam.questions) {
        if (!written(answers[q.id]) || next[q.id]) continue;
        next[q.id] = await aiScore(
          { topic: topicOf(q), question: q.prompt, ...padForAi(answers[q.id]), reference: q.solution, keyPoints: q.keyPoints, stage: "formal" },
          data.config,
        );
        setAiRes({ ...next });
      }
    } catch (e) {
      setAiError(aiFailure(e));
    } finally {
      setAiBusy(false);
    }
  };

  const finish = () => {
    const rows = exam.questions.map((q) => {
      const a = answers[q.id];
      const ticks = got[q.id] ?? q.keyPoints.map(() => false);
      const has = written(a);
      const scored = has ? aiRes[q.id] : undefined;
      const score = scored ? scored.composite : has ? selfScore(ticks) : 0;
      return { q, a, ticks, has, scored, score };
    });
    const items: ExamRecord["items"] = rows.map(({ q, a, ticks, has, scored, score }) => ({
      questionId: q.id,
      prompt: q.prompt,
      answer: a ? padToText(a) : "",
      feedback: scored ? "Scored by an AI service against the reference solution." : has ? `Self-scored: ${ticks.filter(Boolean).length} of ${q.keyPoints.length} key points.` : "Unanswered, counted as a miss.",
      sourceIds: q.sourceIds,
      composite: score,
      solution: q.solution,
      ...(q.aiWritten ? { aiWritten: true } : {}),
      ...(q.topicId ? { topicId: q.topicId } : {}),
      ...(scored ? { criteria: scored.criteria, aiFeedback: scored.feedback } : { keyPoints: q.keyPoints.map((text, k) => ({ text, got: has && !!ticks[k] })) }),
    }));
    /** The four criteria over some of the questions. AI-scored answers use their own scores; self-scored and unanswered ones count as their overall score. */
    const summarise = (set: typeof rows) => {
      const overall = Math.round(set.reduce((s, r) => s + r.score, 0) / Math.max(1, set.length));
      const aiScored = set.some((r) => !!r.scored);
      const selfScored = set.some((r) => r.has && !r.scored);
      const criteria: CriterionScores = aiScored
        ? (Object.fromEntries(CRITERIA.map((k) => [k, Math.round(set.reduce((s, r) => s + (r.scored ? r.scored.criteria[k] : r.score), 0) / Math.max(1, set.length))])) as CriterionScores)
        : uniformCriteria(overall);
      return { criteria, aiScored, selfScored };
    };
    const all = summarise(rows);
    const record: ExamRecord = {
      id: uid(),
      topicId: scope.id,
      at: new Date().toISOString(),
      timed,
      focus,
      attempt: data.exams.filter((e) => e.topicId === scope.id).length + 1,
      composite: composite(all.criteria, data.config),
      criteria: all.criteria,
      items,
      sources: [...new Set(exam.questions.flatMap((q) => q.sourceIds))].map(sourceFor).filter((s): s is SourceRef => !!s),
      selfScored: all.selfScored,
      ...(all.aiScored ? { aiScored: true } : {}),
    };
    saveExam(record);
    // An exam on one topic is one attempt on it. One across the course counts toward every topic it drew from, each
    // from the questions on that topic, so a topic's progress reflects what was shown there.
    const groups = general
      ? [...new Set(rows.map((r) => r.q.topicId).filter((t): t is string => !!t))].map((topicId) => ({ topicId, set: rows.filter((r) => r.q.topicId === topicId) }))
      : [{ topicId: scope.id, set: rows }];
    for (const g of groups) {
      const s = summarise(g.set);
      const how = s.selfScored ? "self-scored" : s.aiScored ? "AI-scored" : "no answers";
      recordAttempt({
        topicId: g.topicId,
        kind: "exam",
        counted: true,
        selfScored: s.selfScored,
        aiScored: s.aiScored,
        criteria: s.criteria,
        note: general
          ? `${custom ? `Custom exam ("${focus.trim() || ask}")` : "Exam across the course"}, attempt ${record.attempt}: ${g.set.length} question${g.set.length === 1 ? "" : "s"} on this topic (${how})`
          : `Exam attempt ${record.attempt} (${how})`,
      });
    }
    nav(`/exams/${record.id}`);
  };

  if (stage === "check") {
    const answered = exam.questions.filter((q) => written(answers[q.id]));
    const overall = Math.round(
      exam.questions.reduce((s, q) => s + (!written(answers[q.id]) ? 0 : aiRes[q.id] ? aiRes[q.id].composite : selfScore(got[q.id] ?? q.keyPoints.map(() => false))), 0) / Math.max(1, exam.questions.length),
    );
    const unscored = answered.filter((q) => !aiRes[q.id]).length;
    return (
      <>
        <Eyebrow>Exam · {custom ? "Custom" : scope.title} · {answered.length} of {exam.questions.length} answered</Eyebrow>
        <h1>Score your <Scribble>exam</Scribble></h1>
        <p className="lede">
          Compare each answer with the reference solution, then tick the key points your work covered. This is scored by you, so be honest: it is what shows you where to study next.
          {timed && " Time is up, so your answers are locked."}
        </p>
        {ai.connected && (
          <div className="panel">
            <p>Your AI service can score the written answers on the four criteria instead. Your typed answers, your drawings and the question text are sent.</p>
            {aiError && <p className="notice warn-box" role="alert">{aiError} Your answers are kept; retry, or score yourself below.</p>}
            <button onClick={() => void scoreAllWithAi()} disabled={aiBusy || unscored === 0}>
              {aiBusy ? "Scoring…" : unscored === 0 ? "All answers scored" : aiError ? "Retry AI scoring" : "Score my answers with AI"}
            </button>
          </div>
        )}
        {exam.questions.map((q, n) => (
          <section key={q.id} className="panel">
            <h2><span className="h-mono">Question {n + 1}</span>{q.aiWritten && <span className="chip">AI-written</span>}</h2>
            {general && q.topicId && <p className="eyebrow">{"// "}{sectionTitle(q.topicId)}</p>}
            <p className="prompt"><RichText text={q.prompt} /></p>
            {written(answers[q.id]) && aiRes[q.id] ? (
              <>
                <h3>Your answer</h3>
                <pre className="answer">{padToText(answers[q.id]) || "(drawing only)"}</pre>
                <ScoreBreakdown criteria={aiRes[q.id].criteria} cfg={data.config} feedback={aiRes[q.id].feedback} note={aiRes[q.id].note} drawingIgnored={aiRes[q.id].drawingIgnored} />
                <button className="ghost" onClick={() => setAiRes((m) => { const { [q.id]: _gone, ...rest } = m; return rest; })}>Score this one myself instead</button>
              </>
            ) : written(answers[q.id]) ? (
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
          <button onClick={finish}>Finish and save <span className="btn-num">{overall}/100</span></button>
        </div>
      </>
    );
  }

  const q = exam.questions[i];
  const a = answers[q.id] ?? emptyPad();
  const srcs = q.sourceIds.map(sourceFor).filter((s): s is SourceRef => !!s && !isAnswerKey(s));
  const mm = Math.max(0, Math.floor(left / 60));
  const ss = Math.max(0, left % 60).toString().padStart(2, "0");
  const section = general ? sectionTitle(q.topicId) : "";

  return (
    <>
      <Eyebrow>{timed ? "Timed exam" : "Exam"} · {custom ? "Custom" : scope.title}</Eyebrow>
      <h1><KeyTitle text={exam.title} /></h1>
      {exam.focusMatched === true && <p className="muted">Chose the {exam.questions.length} question{exam.questions.length === 1 ? "" : "s"} that match your focus.</p>}
      {exam.focusMatched === false && <p className="notice warn-box" role="status">No question matched that focus, so this is the full exam. Try other words, or pick a different topic.</p>}
      <div className="row between">
        <span className="q-count"><span className="eyebrow inline">{"// "}Question {i + 1} of {exam.questions.length}{section && ` · ${section}`}</span>{q.aiWritten && <span className="chip">AI-written</span>}</span>
        {timed ? <span className="timer" role="timer" aria-label={`Time left ${mm} minutes ${ss} seconds`}>{mm}:{ss}</span> : <span className="chip">Untimed</span>}
      </div>
      <StepTrack at={i} total={exam.questions.length} label="Exam progress" note="you are here" />
      <section className="panel focal">
        <p className="prompt"><RichText text={q.prompt} /></p>
        {q.aiWritten && <p className="muted small">Written by your AI service for this exam. If a reference solution later disagrees with the lecture notes, trust the notes.</p>}
        <Pad key={q.id} group={`exam:${scope.id}`} value={a} onChange={(v) => setAnswers((m) => ({ ...m, [q.id]: v }))} label="Your full solution" />
        {!timed && (
          <div className="row">
            <button className="ghost" aria-pressed={showSrc} onClick={() => setShowSrc((s) => !s)}>{showSrc ? "Hide source material" : "Show source material"}</button>
            <button className="ghost" onClick={() => setHints((h) => ({ ...h, [q.id]: true }))}>Hint</button>
          </div>
        )}
        {!timed && hints[q.id] && <p className="notice hl" role="status">Hint: {q.hint}</p>}
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
