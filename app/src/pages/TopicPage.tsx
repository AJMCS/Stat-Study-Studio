import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { topicById } from "../mock/topics";
import { useStore } from "../lib/store";
import { StreakIndicator, ScoreBreakdown } from "../components/Score";
import { Pad, emptyPad, padToText } from "../components/Pad";
import { Citations } from "../components/Citation";
import { SelfCheck } from "../components/SelfCheck";
import { RichText } from "../components/Math";
import { Annotated, Eyebrow, KeyTitle } from "../components/Hand";
import { selfScore, uniformCriteria } from "../lib/scoring";
import { useAi } from "../lib/ai";
import { aiFailure, aiScore, type AiScored } from "../lib/aiScore";
import type { CriterionFeedback, SessionInfo, Topic } from "../types";
import { Ring, VArc, arcInto } from "../components/Rail";
import { PATH, PATH_ROUTE, topicPath, type ActivityProgress, type PathStep } from "../lib/learning";

const STEP_INFO: Record<PathStep, { title: string; desc: string; activity: SessionInfo["activity"]; start: string; resume: string }> = {
  vocab: {
    title: "Vocabulary",
    desc: "The terms and notation this topic uses, one at a time, then flashcards to check yourself.",
    activity: "vocab",
    start: "Start the vocabulary",
    resume: "Continue the vocabulary",
  },
  tutorial: {
    title: "Tutorial, with checks",
    desc: "A guided lesson in the professor's notation, with worked examples and a short comprehension check after each step.",
    activity: "tutorial",
    start: "Start the tutorial",
    resume: "Continue the tutorial",
  },
  breakdown: {
    title: "Break down a question",
    desc: "Take exam-style problems apart: what is asked, what is given, which tool, the plan, the pitfalls.",
    activity: "breakdown",
    start: "Break down a question",
    resume: "Continue breaking down",
  },
  practice: {
    title: "Practice: quiz and exam",
    desc: "A quiz marked for you, and full written exam answers you score against a reference.",
    activity: "quiz",
    start: "Take the quiz",
    resume: "Take the quiz",
  },
};

function stepState(k: PathStep, p: ActivityProgress & { review?: number[]; skipped?: number[]; right?: number }) {
  if (k === "practice") return p.status === "done" ? <><span aria-hidden="true">✓ </span>Practised: <b className="mono">{p.done}</b> attempt{p.done === 1 ? "" : "s"}</> : "Not started yet";
  if (p.status === "new") return "Not started yet";
  const unit = k === "vocab" ? "known" : k === "tutorial" ? "checks answered" : "problems done";
  const review = p.review ?? [];
  return (
    <>
      {p.status === "done" && <span aria-hidden="true">✓ </span>}
      <b className="mono">{p.done}</b> of <b className="mono">{p.total}</b> {unit}
      {k === "tutorial" && review.length > 0 && (
        <>
          {"; "}
          {review.length === 1 ? "step" : "steps"} to review:{" "}
          {review.map((i, j) => (
            <Fragment key={i}>
              {j > 0 && ", "}
              <b className="mono">{String(i + 1).padStart(2, "0")}</b>
              {p.skipped?.includes(i) && " (not answered)"}
            </Fragment>
          ))}
        </>
      )}
    </>
  );
}

/** The topic's path drawn as ringed nodes on one vertical baseline joined by shallow arcs: done steps filled, the arc
 * into the next step orange, and the next step raised as the one focal card. */
function TopicPath({ topic, onGo }: { topic: Topic; onGo: (a: SessionInfo["activity"]) => void }) {
  const { data } = useStore();
  const ai = useAi();
  const { steps, next } = topicPath(data, topic);
  const at = PATH.indexOf(next);
  return (
    <ol className="topic-path">
      {PATH.map((k, i) => {
        const p = steps[k];
        const info = STEP_INFO[k];
        const to = `/topic/${topic.id}/${PATH_ROUTE[k]}`;
        const cur = k === next;
        return (
          <li key={k} className={`tp-step ${p.status}${cur ? " current" : ""}${i < at ? " passed" : ""}`} aria-current={cur ? "step" : undefined}>
            {i < PATH.length - 1 && <VArc state={arcInto(i + 1, at)} className="tp-curve" />}
            <Ring state={cur ? "current" : p.status === "done" ? "done" : "todo"} className="tp-node" />
            <div className={cur ? "tp-body card focal" : "tp-body"}>
              <p className="eyebrow">{"// "}{String(i + 1).padStart(2, "0")}{cur ? " · next up" : ""}</p>
              <h3>
                <Link to={to} onClick={() => onGo(info.activity)}>{info.title}</Link>
              </h3>
              <p className="tp-desc">{info.desc}</p>
              <p className="status">{stepState(k, p)}</p>
              {cur && (
                <div className="row tp-actions">
                  <Link className="button" to={to} onClick={() => onGo(info.activity)}>{p.status === "new" ? info.start : info.resume}</Link>
                </div>
              )}
              {k === "tutorial" && (
                <p className="tp-more">
                  <Link to={`/topic/${topic.id}/check`} onClick={() => onGo("check")}>All the checks{steps.tutorial.review.length ? ", and the steps to review" : ""}</Link>
                  {" · "}
                  <Link to={`/topic/${topic.id}/tutor`} onClick={() => onGo("tutor")}>Talk it through with the AI tutor</Link>
                  {!ai.connected && (
                    <span className="muted"> (needs an AI service. Set one up in <Link to="/settings">Settings</Link>)</span>
                  )}
                </p>
              )}
              {k === "practice" && (
                <p className="tp-more">
                  <Link to={`/topic/${topic.id}/exam`} onClick={() => onGo("exam")}>Sit an exam</Link>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TopicPage() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data, setSession, recordAttempt } = useStore();
  const [pad, setPad] = useState(emptyPad());
  const [recalling, setRecalling] = useState(false);
  const [checking, setChecking] = useState(false);
  const [got, setGot] = useState<boolean[]>([]);
  const [saved, setSaved] = useState<number | null>(null);
  const ai = useAi();
  const [scoring, setScoring] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<AiScored | null>(null);

  if (!topic) return <p>Topic not found. <Link to="/">Back to topics</Link></p>;
  const state = data.topicState[topic.id];
  const mark = (activity: SessionInfo["activity"]) => setSession({ topicId: topic.id, activity, at: new Date().toISOString() });

  const startChecking = () => {
    setGot(topic.recall.keyPoints.map(() => false));
    setChecking(true);
  };

  const scoreWithAi = async () => {
    setScoring(true);
    setAiError("");
    try {
      const r = await aiScore(
        { topic: topic.title, question: topic.recall.prompt, answer: padToText(pad), reference: topic.recall.reference, keyPoints: topic.recall.keyPoints, stage: "conceptual" },
        data.config,
      );
      recordAttempt({ topicId: topic.id, kind: "recall", counted: true, aiScored: true, criteria: r.criteria, note: "Revisit recall (AI-scored)" });
      setAiResult(r);
    } catch (e) {
      setAiError(aiFailure(e));
    } finally {
      setScoring(false);
    }
  };

  const saveRecall = () => {
    const score = selfScore(got);
    recordAttempt({ topicId: topic.id, kind: "recall", counted: true, selfScored: true, criteria: uniformCriteria(score), note: "Revisit recall (self-scored)" });
    setSaved(score);
    setChecking(false);
  };

  return (
    <>
      <p className="back"><Link to="/learn">← Study journey</Link></p>
      <Eyebrow>{topic.unit}</Eyebrow>
      <h1><KeyTitle text={topic.title} /></h1>
      {state && <p><StreakIndicator streak={state.streak} warn={state.warnCriteria} flagged={state.flagged} /></p>}
      <Annotated block note="read this first">
        <p className="lede">{topic.intro}</p>
      </Annotated>
      <h2>What you'll study</h2>
      <ul>{topic.willStudy.map((w) => <li key={w}><RichText text={w} /></li>)}</ul>

      <h2>Your path through this topic</h2>
      <TopicPath topic={topic} onGo={mark} />

      <h2>Revisit</h2>
      <section className="panel">
        <p>
          Revisiting later builds your retention streak. A recall at or above your cutoff counts whether it is the same day or a month later.
        </p>
        {!recalling ? (
          <Annotated note="come back in a few days and do it again">
            <button onClick={() => setRecalling(true)}>Try a recall</button>
          </Annotated>
        ) : checking ? (
          <>
            <p><strong><RichText text={topic.recall.prompt} /></strong></p>
            <SelfCheck answer={padToText(pad)} reference={topic.recall.reference} keyPoints={topic.recall.keyPoints} got={got} onChange={setGot} />
            <button onClick={saveRecall}>Save my self-score</button>
          </>
        ) : aiResult ? (
          <>
            <ScoreBreakdown criteria={aiResult.criteria} cfg={data.config} feedback={aiResult.feedback as CriterionFeedback[]} />
            <p className="muted">
              {aiResult.composite >= data.config.compositeCutoff
                ? "Qualifying recall added to your streak."
                : "Below the cutoff this time. Your streak and progress are kept, the miss is recorded, and this topic is flagged to revisit."}
            </p>
            <button className="ghost" onClick={() => { setAiResult(null); setPad(emptyPad()); }}>Try another recall</button>
          </>
        ) : saved !== null ? (
          <>
            <ScoreBreakdown criteria={uniformCriteria(saved)} cfg={data.config} selfScored />
            <p className="muted">
              {saved >= data.config.compositeCutoff
                ? "Qualifying recall added to your streak."
                : "Below the cutoff this time. Your streak and progress are kept, the miss is recorded, and this topic is flagged to revisit."}
            </p>
            <button className="ghost" onClick={() => { setSaved(null); setPad(emptyPad()); }}>Try another recall</button>
          </>
        ) : (
          <>
            <p><strong><RichText text={topic.recall.prompt} /></strong></p>
            <Pad value={pad} onChange={setPad} label="Your answer" />
            {aiError && <p className="notice warn-box" role="alert">{aiError}</p>}
            <div className="row">
              {ai.connected && (
                <button onClick={() => void scoreWithAi()} disabled={scoring || !pad.text.trim()}>
                  {scoring ? "Scoring…" : aiError ? "Retry AI scoring" : "Score with AI"}
                </button>
              )}
              <button className={ai.connected ? "ghost" : undefined} onClick={startChecking} disabled={scoring || (!pad.text.trim() && !pad.drawing)}>
                {ai.connected ? "Score it myself instead" : "Compare with the reference"}
              </button>
            </div>
            {ai.connected && pad.drawing && <p className="muted small">Only what you typed is sent for AI scoring, not drawings. Self-score if your work is mostly a drawing.</p>}
          </>
        )}
      </section>

      <h2>Sources</h2>
      <Citations
        sources={topic.sources
          .filter((s) => s.filename?.startsWith("lecture-notes/"))
          .filter((s, i, all) => all.findIndex((x) => x.filename === s.filename && x.page === s.page) === i)}
      />
    </>
  );
}
