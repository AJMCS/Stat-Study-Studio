import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { topicById } from "../mock/topics";
import { useStore } from "../lib/store";
import { StreakIndicator, ScoreBreakdown } from "../components/Score";
import { Pad, emptyPad, padToText } from "../components/Pad";
import { Citations } from "../components/Citation";
import { SelfCheck } from "../components/SelfCheck";
import { RichText } from "../components/Math";
import { selfScore, uniformCriteria } from "../lib/scoring";

export function TopicPage() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data, setSession, recordAttempt } = useStore();
  const [pad, setPad] = useState(emptyPad());
  const [recalling, setRecalling] = useState(false);
  const [checking, setChecking] = useState(false);
  const [got, setGot] = useState<boolean[]>([]);
  const [saved, setSaved] = useState<number | null>(null);

  if (!topic) return <p>Topic not found. <Link to="/">Back to topics</Link></p>;
  const state = data.topicState[topic.id];
  const mark = (activity: "tutor" | "tutorial" | "quiz" | "exam") => setSession({ topicId: topic.id, activity, at: new Date().toISOString() });

  const startChecking = () => {
    setGot(topic.recall.keyPoints.map(() => false));
    setChecking(true);
  };

  const saveRecall = () => {
    const score = selfScore(got);
    recordAttempt({ topicId: topic.id, kind: "recall", counted: true, selfScored: true, criteria: uniformCriteria(score), note: "Revisit recall (self-scored)" });
    setSaved(score);
    setChecking(false);
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
          <p>A conversation that finds out what you know, fills the gaps, then bridges to the formal math. Needs an AI service.</p>
        </Link>
        <Link to={`/topic/${topic.id}/tutorial`} className="card" onClick={() => mark("tutorial")}>
          <h3>Tutorial first</h3>
          <p>A guided lesson grounded in the lecture notes, using the professor's notation, with worked examples you can try before you see the answer.</p>
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
          <p>Full written solutions that you score against a reference solution. Timed or untimed.</p>
        </Link>
      </div>

      <h2>Revisit</h2>
      <section className="panel">
        <p>
          Revisiting later builds your retention streak. A qualifying recall (a score of {data.config.compositeCutoff}+) counts whether it is the same day or a month later.
        </p>
        {!recalling ? (
          <button onClick={() => setRecalling(true)}>Try a recall</button>
        ) : checking ? (
          <>
            <p><strong><RichText text={topic.recall.prompt} /></strong></p>
            <SelfCheck answer={padToText(pad)} reference={topic.recall.reference} keyPoints={topic.recall.keyPoints} got={got} onChange={setGot} />
            <button onClick={saveRecall}>Save my self-score</button>
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
            <button onClick={startChecking} disabled={!pad.text.trim() && !pad.drawing}>Compare with the reference</button>
          </>
        )}
      </section>

      <h2>Sources</h2>
      <Citations sources={topic.sources.filter((s) => s.filename?.startsWith("lecture-notes/"))} />
    </>
  );
}
