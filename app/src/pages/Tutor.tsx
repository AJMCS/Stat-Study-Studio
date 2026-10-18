import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAi } from "../lib/ai";
import { topicById } from "../mock/topics";
import { tutorOpening, tutorReply, type TutorStage, type TutorTurn } from "../mock/ai";
import { useStore } from "../lib/store";
import { Pad, emptyPad, padToText } from "../components/Pad";
import { RichText } from "../components/Math";
import { ScoreBreakdown } from "../components/Score";
import { composite, EMPTY_TOPIC_STATE } from "../lib/scoring";
import { CRITERIA, CRITERION_LABELS, type ChatMessage, type CriterionScores } from "../types";

function TutorChat() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { data, update, recordAttempt } = useStore();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<TutorStage>("probe");
  const [plan, setPlan] = useState<string[] | null>(null);
  const [adjust, setAdjust] = useState("");
  const [pad, setPad] = useState(emptyPad());
  const [busy, setBusy] = useState(false);
  const [final, setFinal] = useState<CriterionScores | null>(null);
  const [step, setStep] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (topic) setMsgs([{ role: "tutor", text: tutorOpening(topic).text }]);
  }, [topic?.id]);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [msgs.length]);

  if (!topic) return <p>Topic not found.</p>;

  const apply = (turn: TutorTurn) => {
    setMsgs((m) => [...m, { role: "tutor", text: turn.text }]);
    setStage(turn.stage);
    if (turn.plan) setPlan(turn.plan);
    if (turn.assess) {
      const a = turn.assess;
      const strengths = CRITERIA.filter((k) => a[k] >= data.config.criterionCutoffs[k]).map((k) => CRITERION_LABELS[k]);
      const gaps = CRITERIA.filter((k) => a[k] < data.config.criterionCutoffs[k]).map((k) => CRITERION_LABELS[k]);
      // Persist strengths and gaps for this topic across sessions.
      update((d) => ({
        ...d,
        topicState: {
          ...d.topicState,
          [topic.id]: { ...EMPTY_TOPIC_STATE, ...d.topicState[topic.id], strengths, gaps },
        },
      }));
      if (turn.stage === "done") {
        recordAttempt({ topicId: topic.id, kind: "tutor", counted: true, criteria: a, note: "Tutor session" });
        setFinal(a);
      }
    }
  };

  const send = async () => {
    const text = padToText(pad).trim();
    if (!text || busy) return;
    setMsgs((m) => [...m, { role: "learner", text: pad.text + (pad.drawing ? "\n[drawing attached]" : "") }]);
    setPad(emptyPad());
    setBusy(true);
    const turn = await tutorReply(topic, stage, text, step);
    if (stage === "build") setStep((s) => s + 1);
    apply(turn);
    setBusy(false);
  };

  const acceptPlan = async () => {
    setBusy(true);
    const note = adjust.trim() ? `Adjustment: ${adjust}` : "Plan accepted";
    setMsgs((m) => [...m, { role: "learner", text: note }]);
    const turn = await tutorReply(topic, "plan", note);
    setPlan(null);
    apply(turn);
    setBusy(false);
  };

  const needsPlan = stage === "plan" && plan;
  const mockComposite = final ? composite(final, data.config) : null;

  return (
    <>
      <p><Link to={`/topic/${topic.id}`}>← {topic.title}</Link></p>
      <h1>Adaptive tutor</h1>
      <div className="chat" role="log" aria-live="polite" aria-label="Tutor conversation">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <b className="sr-only">{m.role === "tutor" ? "Tutor: " : "You: "}</b>
            <RichText text={m.text} />
          </div>
        ))}
        {busy && <div className="bubble tutor muted">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {needsPlan && (
        <section className="panel" aria-label="Learning plan">
          <h2>Proposed plan</h2>
          <ol>{plan!.map((p) => <li key={p}>{p}</li>)}</ol>
          <label className="field">
            <span>Want to adjust it? (optional)</span>
            <input value={adjust} onChange={(e) => setAdjust(e.target.value)} placeholder="e.g. skip the scenario and go straight to the formula" />
          </label>
          <button onClick={acceptPlan} disabled={busy}>{adjust.trim() ? "Use my adjustment" : "Accept plan"}</button>
        </section>
      )}

      {!needsPlan && stage !== "done" && (
        <>
          <Pad value={pad} onChange={setPad} label={stage === "bridge" ? "Write the formal statement" : "Your reply"} disabled={busy} />
          <button onClick={send} disabled={busy || !pad.text.trim()}>Send</button>
        </>
      )}
      {stage === "diagnose" && <p className="muted">Quick follow-up above, then I'll propose a learning plan.</p>}

      {final && (
        <section className="panel">
          <h2>Session saved · {mockComposite}</h2>
          <ScoreBreakdown criteria={final} cfg={data.config} />
          <div className="row">
            <Link className="button" to={`/topic/${topic.id}/quiz`}>Take the quiz</Link>
            <Link className="button ghost" to="/progress">See progress</Link>
          </div>
        </section>
      )}
    </>
  );
}


/** The conversational tutor reads the learner's own words, so it needs an AI service. Until one is connected, say so
 * and point to what works without one (the tutorial, quiz, exam and recall are all available). */
export function Tutor() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const ai = useAi();
  if (ai.connected) return <TutorChat />;
  return (
    <>
      <p><Link to={topic ? `/topic/${topic.id}` : "/"}>← {topic?.title ?? "All topics"}</Link></p>
      <h1>Adaptive tutor</h1>
      <p className="notice" role="status">
        The tutor talks with you, reads your explanations, finds the gaps and builds from there. That needs an AI service, and none is connected
        {ai.comingSoon ? " yet (connecting one is coming soon)" : ""}. Everything else here works without one.
      </p>
      {topic && (
        <>
          <h2>Learn it without the tutor</h2>
          <div className="grid two">
            <Link to={`/topic/${topic.id}/tutorial`} className="card">
              <h3>Guided tutorial</h3>
              <p>Lecture-grounded explanations with worked examples: try each one, then reveal the full solution.</p>
            </Link>
            <Link to={`/topic/${topic.id}/quiz`} className="card">
              <h3>Practice quiz</h3>
              <p>Feedback after each answer. Written answers are compared with a reference answer, and you score yourself.</p>
            </Link>
          </div>
          <p className="muted">
            Without the tutor, the step from "I see where I'm missing it" to fixing it is yours: compare your work with the reference solutions, note what you missed, and go back to the tutorial step and lecture page it came from.
          </p>
        </>
      )}
    </>
  );
}
