import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAi } from "../lib/ai";
import { topicById } from "../mock/topics";
import { api, hitToSource, personalHitToSource, ServiceRejected, type TutorStage } from "../lib/api";
import { Citations } from "../components/Citation";
import { useStore } from "../lib/store";
import { Pad, emptyPad, padToText } from "../components/Pad";
import { RichText } from "../components/Math";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { ScoreBreakdown } from "../components/Score";
import { composite, EMPTY_TOPIC_STATE } from "../lib/scoring";
import { CRITERIA, CRITERION_LABELS, type ChatMessage, type CriterionScores, type SourceRef } from "../types";

const OPENING = (title: string, focus: string) =>
  focus
    ? `Let's start with what you already know. You came to work on this: "${focus}". In your own words, where are you with it so far? Informal answers are perfect here, and a quick sketch is welcome too.`
    : `Let's start with what you already know. In your own words, what is "${title.toLowerCase()}" about? Informal answers are perfect here, and a quick sketch is welcome too.`;

/** A custom path can open the tutor with its goal as the focus (and a way back to the path). */
function usePathFocus() {
  const [params] = useSearchParams();
  return { focus: (params.get("focus") ?? "").trim().slice(0, 500), pathId: params.get("path") ?? "" };
}

interface Msg extends ChatMessage {
  sources?: SourceRef[];
}

function TutorChat() {
  const { id } = useParams();
  const topic = topicById(id ?? "");
  const { focus, pathId } = usePathFocus();
  const { data, update, recordAttempt } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [stage, setStage] = useState<TutorStage>("probe");
  const [plan, setPlan] = useState<string[] | null>(null);
  const [adjust, setAdjust] = useState("");
  const [pad, setPad] = useState(emptyPad());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [final, setFinal] = useState<CriterionScores | null>(null);
  /** The tutor's short version at the end: what the learner showed and what to work on, above the score sheet. */
  const [wrap, setWrap] = useState<{ strengths: string[]; gaps: string[] } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (topic) setMsgs([{ role: "tutor", text: OPENING(topic.title, focus) }]);
  }, [topic?.id, focus]);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [msgs.length]);

  if (!topic) return <p>Topic not found.</p>;

  /** Send the conversation so far plus the learner's new message. Nothing changes on screen unless the reply arrives,
   * so a failure never loses what the learner wrote. */
  const ask = async (learnerText: string, shown: string, from: TutorStage, clearPad: boolean) => {
    setBusy(true);
    setError("");
    const sent: Msg = { role: "learner", text: shown };
    try {
      const turn = await api.aiTutor(topic.title, from, [...msgs, sent].map((m) => ({ role: m.role, text: m === sent ? learnerText : m.text })), focus);
      const sources = turn.sources.map((h) => (h.scope === "shared" ? hitToSource(h) : personalHitToSource(h)));
      setMsgs((m) => [...m, sent, { role: "tutor", text: turn.text, sources }]);
      if (clearPad) setPad(emptyPad());
      setStage(turn.stage);
      setPlan(turn.plan);
      if (turn.stage === "done" && turn.assess) {
        const a = turn.assess;
        const fallback = (below: boolean) => CRITERIA.filter((k) => (a[k] < data.config.criterionCutoffs[k]) === below).map((k) => CRITERION_LABELS[k]);
        update((d) => ({
          ...d,
          topicState: {
            ...d.topicState,
            [topic.id]: { ...EMPTY_TOPIC_STATE, ...d.topicState[topic.id], strengths: turn.strengths.length ? turn.strengths : fallback(false), gaps: turn.gaps.length ? turn.gaps : fallback(true) },
          },
        }));
        recordAttempt({ topicId: topic.id, kind: "tutor", counted: true, aiScored: true, criteria: a, note: "Tutor session" });
        setFinal(a);
        setWrap({ strengths: turn.strengths.length ? turn.strengths : fallback(false), gaps: turn.gaps.length ? turn.gaps : fallback(true) });
      }
      setAdjust("");
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : "Couldn't reach the study service. Your message is kept; try again.");
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const text = padToText(pad).trim();
    if (!text || busy) return;
    void ask(text, pad.text + (pad.drawing ? "\n[drawing attached; only the typed text is sent]" : ""), stage, true);
  };

  const acceptPlan = () => void ask(adjust.trim() ? `Please adjust the plan: ${adjust.trim()}` : "That plan works for me. Let's start.", adjust.trim() ? `Adjustment: ${adjust.trim()}` : "Plan accepted", "plan", false);

  const needsPlan = stage === "plan" && plan;
  const finalComposite = final ? composite(final, data.config) : null;
  const restart = () => {
    setMsgs([{ role: "tutor", text: OPENING(topic.title, focus) }]);
    setStage("probe");
    setPlan(null);
    setFinal(null);
    setWrap(null);
    setError("");
    setPad(emptyPad());
  };

  return (
    <>
      <p className="back">{pathId ? <Link to={`/paths/${pathId}`}>← Your path</Link> : <Link to={`/topic/${topic.id}`}>← {topic.title}</Link>}</p>
      <Eyebrow>Tutor · {topic.title}{focus ? " · from your path" : ""}</Eyebrow>
      <h1>Adaptive <Scribble>tutor</Scribble></h1>
      <div className="chat" role="log" aria-live="polite" aria-label="Tutor conversation">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <b className="sr-only">{m.role === "tutor" ? "Tutor: " : "You: "}</b>
            <RichText text={m.text} />
            {m.sources && m.sources.length > 0 && <Citations sources={m.sources} />}
          </div>
        ))}
        {busy && <div className="bubble tutor muted">Thinking…</div>}
        <div ref={endRef} />
      </div>
      {error && (
        <p className="notice warn-box" role="alert">
          {error} <Link to={`/topic/${topic.id}/tutorial`}>The tutorial</Link> and quiz work without the tutor.
        </p>
      )}

      {needsPlan && (
        <section className="panel" aria-label="Learning plan">
          <h2>Proposed plan</h2>
          <ol>{plan!.map((p) => <li key={p}>{p}</li>)}</ol>
          <label className="field">
            <span>Want to adjust it? (optional)</span>
            <input value={adjust} onChange={(e) => setAdjust(e.target.value)} placeholder="e.g. skip the scenario and go straight to the formula" />
          </label>
          <button onClick={acceptPlan} disabled={busy}>{error ? "Try again" : adjust.trim() ? "Use my adjustment" : "Accept plan"}</button>
        </section>
      )}

      {!needsPlan && stage !== "done" && (
        <>
          <Pad value={pad} onChange={setPad} label={stage === "bridge" ? "Write the formal statement" : "Your reply"} disabled={busy} />
          <button onClick={send} disabled={busy || !pad.text.trim()}>{error ? "Try again" : "Send"}</button>
        </>
      )}

      {final && (
        <section className="panel">
          <h2>Session saved · {finalComposite}</h2>
          {wrap && (
            <div className="short-version">
              <p className="eyebrow">{"// The short version"}</p>
              <div className="grid two">
                <div>
                  <p className="sv-head">What you showed</p>
                  <ul>{wrap.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div>
                  <p className="sv-head">What to work on</p>
                  <ul>{wrap.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
                </div>
              </div>
              <p className="eyebrow">{"// The score sheet"}</p>
            </div>
          )}
          <ScoreBreakdown criteria={final} cfg={data.config} />
          <div className="row">
            <Link className="button" to={`/topic/${topic.id}/quiz`}>Take the quiz</Link>
            <button className="ghost" onClick={restart}>Start another conversation</button>
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
      <p className="back"><Link to={topic ? `/topic/${topic.id}` : "/learn"}>← {topic?.title ?? "Study journey"}</Link></p>
      <Eyebrow>Tutor</Eyebrow>
      <h1>Adaptive <Scribble>tutor</Scribble></h1>
      <p className="notice warn-box" role="status">
        The tutor talks with you, reads your explanations, finds the gaps and builds from there. That needs an AI service, and none is connected
        {ai.comingSoon ? " yet (connecting one is coming soon)" : ""}. Everything else here works without one.
      </p>
      {topic && (
        <>
          <h2>Learn it without the tutor</h2>
          <Note dir="down" className="tutor-note">these two work fully offline</Note>
          <div className="grid two">
            <Link to={`/topic/${topic.id}/tutorial`} className="card focal">
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
