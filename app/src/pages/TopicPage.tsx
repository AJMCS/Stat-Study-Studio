import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { topicById } from "../mock/topics";
import { scoreExplanation } from "../mock/ai";
import { useStore } from "../lib/store";
import { StreakIndicator, ScoreBreakdown } from "../components/Score";
import { Pad, emptyPad, padToText } from "../components/Pad";
import { Citations } from "../components/Citation";
import type { CriterionFeedback, CriterionScores } from "../types";

export function TopicPage() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data, setSession, recordAttempt } = useStore();
  const [pad, setPad] = useState(emptyPad());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ criteria: CriterionScores; feedback: CriterionFeedback[] } | null>(null);
  const [recalling, setRecalling] = useState(false);

  if (!topic) return <p>Topic not found. <Link to="/">Back to topics</Link></p>;
  const state = data.topicState[topic.id];
  const mark = (activity: "tutor" | "tutorial" | "quiz" | "exam") => setSession({ topicId: topic.id, activity, at: new Date().toISOString() });

  const submitRecall = async () => {
    setBusy(true);
    const r = await scoreExplanation(padToText(pad));
    recordAttempt({ topicId: topic.id, kind: "recall", counted: true, criteria: r.criteria, note: "Revisit recall" });
    setResult(r);
    setBusy(false);
  };

  return (
    <>
      <p><Link to="/">← All topics</Link></p>
      <h1>{topic.title}</h1>
      <p className="muted">{topic.unit}</p>
      {state && <StreakIndicator streak={state.streak} warn={state.warnCriteria} flagged={state.flagged} />}
      <p className="lede">{topic.intro}</p>
      <h2>What you'll study</h2>
      <ul>{topic.willStudy.map((w) => <li key={w}>{w}</li>)}</ul>

      <h2>Start learning</h2>
      <div className="grid two">
        <Link to={`/topic/${topic.id}/tutor`} className="card" onClick={() => mark("tutor")}>
          <h3>Adaptive tutor</h3>
          <p>A conversation that finds out what you know, fills the gaps, then bridges to the formal math.</p>
        </Link>
        <Link to={`/topic/${topic.id}/tutorial`} className="card" onClick={() => mark("tutorial")}>
          <h3>Tutorial first</h3>
          <p>A guided lesson grounded in the lecture notes, using the professor's notation and methods.</p>
        </Link>
      </div>

      <h2>Check yourself</h2>
      <div className="grid two">
        <Link to={`/topic/${topic.id}/quiz`} className="card" onClick={() => mark("quiz")}>
          <h3>Quiz</h3>
          <p>10 questions, one at a time, with review before you submit.</p>
        </Link>
        <Link to={`/topic/${topic.id}/exam`} className="card" onClick={() => mark("exam")}>
          <h3>Exam</h3>
          <p>Full written solutions graded on setup and reasoning. Timed or untimed.</p>
        </Link>
      </div>

      <h2>Revisit</h2>
      <section className="panel">
        <p>
          Revisiting later builds your retention streak. A qualifying recall (composite {data.config.compositeCutoff}+) counts whether it is the same day or a month later.
        </p>
        {!recalling ? (
          <button onClick={() => setRecalling(true)}>Try a recall</button>
        ) : (
          <>
            <p><strong>From memory:</strong> explain the main idea of {topic.title.toLowerCase()} and why it matters.</p>
            <Pad value={pad} onChange={setPad} label="Your explanation" />
            <button onClick={submitRecall} disabled={busy || !pad.text.trim()}>{busy ? "Scoring…" : "Score my recall"}</button>
            {result && (
              <>
                <ScoreBreakdown criteria={result.criteria} cfg={data.config} feedback={result.feedback} />
                <p className="muted">
                  {data.topicState[topic.id]?.flagged
                    ? "Below the cutoff this time. Your streak and progress are kept, the miss is recorded, and this topic is flagged to revisit."
                    : "Qualifying recall added to your streak."}
                </p>
              </>
            )}
          </>
        )}
      </section>

      <h2>Sources</h2>
      <Citations sources={topic.sources.filter((s) => s.filename?.startsWith("lecture-notes/"))} />
    </>
  );
}
