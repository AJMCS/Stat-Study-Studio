import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useAi } from "../lib/ai";
import { useTheme } from "../lib/theme";
import type { ProviderId } from "../lib/api";
import type { AppData } from "../types";
import { AiConnect } from "./AiConnect";
import { Eyebrow, Note, Scribble } from "./Hand";
import { shouldPlayIntro } from "./Intro";

type Choice = ProviderId | "none";
type Slide = "welcome" | "choose" | "connect" | "done";

/** One line on cost and privacy for each choice in first-run setup. */
// `line` on wide screens, `short` on phones; both fit on one line
const CHOICES: { id: Choice; name: string; line: string; short: string }[] = [
  { id: "gemini", name: "Google Gemini", line: "Free tier with a Google account; data goes to Google.", short: "Free tier; data goes to Google." },
  { id: "anthropic", name: "Anthropic Claude", line: "Pay per use with API credit; data goes to Anthropic.", short: "Pay per use with API credit." },
  { id: "openai", name: "OpenAI", line: "Pay per use with API credit; data goes to OpenAI.", short: "Pay per use with API credit." },
  { id: "ollama", name: "Ollama", line: "Free, runs on this computer; nothing leaves it.", short: "Free and local; nothing leaves it." },
  { id: "none", name: "No AI for now", line: "Lessons, quizzes and self-scored exams work without it.", short: "Everything else works without it." },
];
const SHORT: Record<ProviderId, string> = { gemini: "Gemini", anthropic: "Claude", openai: "OpenAI", ollama: "Ollama" };

/** A learner with nothing yet: no attempts or other saved work. */
export const isNewLearner = (d: AppData) =>
  d.attempts.length === 0 && d.quizzes.length === 0 && d.exams.length === 0 && d.files.length === 0 && !d.session;

/** True while the opening animation is due or playing; first-run setup waits for it to finish. */
function useIntroBusy() {
  const check = () => shouldPlayIntro() || document.documentElement.classList.contains("intro-playing");
  const [busy, setBusy] = useState(check);
  useEffect(() => {
    const mo = new MutationObserver(() => setBusy(check()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setBusy(check());
    return () => mo.disconnect();
  }, []);
  return busy;
}

/**
 * First-run setup. Shown once, on opening the app, to a genuinely new learner (nothing saved, no AI service connected,
 * setup not finished before); everyone else is marked as done without seeing it. Finishing or skipping (Esc included)
 * marks it done in the study service, so clearing the browser's storage does not bring it back.
 */
export function Onboarding() {
  const { data, update } = useStore();
  const ai = useAi();
  const introBusy = useIntroBusy();
  const [open, setOpen] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current || !ai.info) return;
    if (data.onboarding.done) {
      decided.current = true;
      return;
    }
    if (ai.info.connected || !isNewLearner(data)) {
      // an existing learner: never shown, and never asked again
      decided.current = true;
      update((d) => ({ ...d, onboarding: { done: true } }));
      return;
    }
    if (introBusy) return;
    decided.current = true;
    setOpen(true);
  }, [ai.info, data, introBusy, update]);

  const finish = useCallback(() => {
    update((d) => ({ ...d, onboarding: { done: true, completedAt: new Date().toISOString() } }));
    setOpen(false);
  }, [update]);

  return open ? <SetupDialog onFinish={finish} /> : null;
}

function SetupDialog({ onFinish }: { onFinish: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const ai = useAi();
  const [theme, setTheme] = useTheme();
  const [slide, setSlide] = useState<Slide>("welcome");
  const [choice, setChoice] = useState<Choice>("gemini");
  const [skipped, setSkipped] = useState(false);

  const slides: Slide[] = choice === "none" ? ["welcome", "choose", "done"] : ["welcome", "choose", "connect", "done"];
  const at = slides.indexOf(slide);
  const go = (s: Slide) => setSlide(s);
  const back = () => at > 0 && go(slides[at - 1]);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal?.();
    // the page behind shows only its canvas while setup is open, so the dialog title is the largest thing in view
    document.documentElement.classList.add("onboarding-open");
    return () => document.documentElement.classList.remove("onboarding-open");
  }, []);
  // each slide's heading takes focus so its title is announced; the first one too, instead of the first button
  useEffect(() => {
    heading.current?.focus();
  }, [slide]);

  // Tab and Shift+Tab stay inside the dialog
  const trap = (e: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, [tabindex='0']")).filter(
      (el) => el.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !ref.current.contains(active) || active === heading.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const connected = ai.info?.connected ? ai.info : null;
  const provider = choice === "none" ? null : choice;
  const connectedHere = !!connected && connected.provider === provider;

  const titleId = `ob-title-${slide}`;
  return (
    <dialog
      ref={ref}
      className="onboard"
      aria-labelledby={titleId}
      onKeyDown={trap}
      onCancel={(e) => {
        // Esc skips setup; anything already chosen (theme, a connection) is kept
        e.preventDefault();
        onFinish();
      }}
    >
      <div className={`ob-stage${slide === "done" ? " with-pointer" : ""}`}>
        {slide === "done" && <SettingsPointer />}
        <div className="ob-card">
          <div className="ob-head">
            <Eyebrow>First-run setup</Eyebrow>
            <StepDots count={slides.length} at={at} />
          </div>

          <div className="ob-slide" key={slide}>
            {slide === "welcome" && (
              <>
                <h2 id={titleId} ref={heading} tabIndex={-1} className="ob-title">
                  Welcome to the <Scribble>studio</Scribble>
                </h2>
                <p>
                  Stats Study Studio teaches each topic of the course, then has you prove it with quizzes, recalls and exams, and shows what is sticking. Everything works
                  offline, with no account, and your progress stays on this computer.
                </p>
                <p className="muted">
                  An AI service is optional. It adds a tutor that talks with you, scoring of written answers, exams written around what you want to practise, and better
                  reading of handwritten notes.
                </p>
                <fieldset className="ob-theme">
                  <legend>Appearance</legend>
                  <div className="ob-theme-row">
                    {(["dark", "light"] as const).map((t) => (
                      <label key={t} className={`choice ob-pill${theme === t ? " on" : ""}`}>
                        <input type="radio" name="ob-theme" checked={theme === t} onChange={() => setTheme(t)} />
                        <span>{t === "dark" ? "Dark" : "Light"}</span>
                      </label>
                    ))}
                    <Note dir="left" className="ob-note">switch any time</Note>
                  </div>
                  <Note dir="up" className="ob-note-narrow">switch any time</Note>
                </fieldset>
              </>
            )}

            {slide === "choose" && (
              <>
                <h2 id={titleId} ref={heading} tabIndex={-1} className="ob-title">
                  Add an AI <Scribble>helper</Scribble>?
                </h2>
                <p className="muted ob-choose-lede">Choose where the model runs, or carry on without one. The online ones need a key from their website; the next step shows how.</p>
                <fieldset className="ob-choices">
                  <legend className="sr-only">AI service</legend>
                  {CHOICES.map((c) => (
                    <label key={c.id} className={`choice opt-row${choice === c.id ? " on" : ""}${c.id === "none" ? " ob-none" : ""}`}>
                      <input type="radio" name="ob-choice" checked={choice === c.id} onChange={() => setChoice(c.id)} />
                      <span className="opt">
                        {c.id === "gemini" ? (
                          <span className="opt-name">
                            <b>{c.name}</b>
                            <Note dir="left">easiest start</Note>
                          </span>
                        ) : (
                          <b>{c.name}</b>
                        )}
                        <span className="opt-desc">
                          <span className="wide-line">{c.line}</span>
                          <span className="short-line">{c.short}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </>
            )}

            {slide === "connect" && provider && (
              <>
                <h2 id={titleId} ref={heading} tabIndex={-1} className="ob-title">
                  Connect <Scribble>{SHORT[provider]}</Scribble>
                </h2>
                {connectedHere ? (
                  <p role="status">
                    Connected to {connected!.providerName}. {connected!.local ? "It runs on this computer, so nothing is sent over the internet." : "Your key is kept on this computer only."}
                  </p>
                ) : (
                  <AiConnect key={provider} provider={provider} headingLevel={3} compact onConnected={() => go("done")} />
                )}
              </>
            )}

            {slide === "done" && (
              <>
                <h2 id={titleId} ref={heading} tabIndex={-1} className="ob-title">
                  You're <Scribble>set</Scribble>
                </h2>
                <dl className="ob-summary">
                  <div>
                    <dt>AI service</dt>
                    <dd>
                      {connected ? (
                        <>
                          Connected to {connected.providerName}
                          {connected.model && (
                            <>
                              {" "}
                              <span className="mono nowrap">({connected.model})</span>
                            </>
                          )}
                          .
                        </>
                      ) : skipped && provider
                          ? `Not connected yet. Connect ${SHORT[provider]} whenever you have a key.`
                          : "None for now. Features that need one will say so."}
                    </dd>
                  </div>
                  <div>
                    <dt>Appearance</dt>
                    <dd>{theme === "dark" ? "Dark" : "Light"}</dd>
                  </div>
                  <div>
                    <dt>Your progress</dt>
                    <dd>Saved on this computer.</dd>
                  </div>
                </dl>
                <p>
                  You can change any of this in{" "}
                  <Link to="/settings" onClick={onFinish}>
                    Settings
                  </Link>{" "}
                  (top right).
                </p>
              </>
            )}
          </div>

          <div className="ob-foot">
            {slide !== "done" ? (
              <button type="button" className="link ob-skip" onClick={onFinish}>
                Skip setup
              </button>
            ) : (
              <span />
            )}
            <div className="ob-nav">
              {at > 0 && (
                <button type="button" className="ghost" onClick={back}>
                  Back
                </button>
              )}
              {slide === "welcome" && <button type="button" onClick={() => go("choose")}>Next</button>}
              {slide === "choose" && (
                <button type="button" onClick={() => go(choice === "none" ? "done" : "connect")}>
                  Next
                </button>
              )}
              {slide === "connect" &&
                (connectedHere ? (
                  <button type="button" onClick={() => go("done")}>Continue</button>
                ) : (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setSkipped(true);
                      go("done");
                    }}
                  >
                    Skip this step
                  </button>
                ))}
              {slide === "done" && (
                <button type="button" onClick={onFinish}>
                  Start
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

/** Where you are in setup, drawn like the journey: ringed nodes on a thin line, the route so far in orange. */
function StepDots({ count, at }: { count: number; at: number }) {
  const gap = 28;
  const w = 12 + gap * (count - 1);
  const x = (i: number) => 6 + i * gap;
  return (
    <div className="ob-steps">
      <svg width={w} height={14} viewBox={`0 0 ${w} 14`} aria-hidden="true" className="ob-dots">
        {Array.from({ length: count - 1 }, (_, i) => (
          <path key={i} className={i < at ? "seg on" : "seg"} d={`M${x(i) + 6} 7 C${x(i) + 12} 3 ${x(i + 1) - 12} 11 ${x(i + 1) - 6} 7`} />
        ))}
        {Array.from({ length: count }, (_, i) => (
          <g key={i} className={i < at ? "node past" : i === at ? "node current" : "node"}>
            <circle cx={x(i)} cy={7} r={5.5} className="ring" />
            {i <= at && <circle cx={x(i)} cy={7} r={2.2} className="dot" />}
          </g>
        ))}
      </svg>
      <span className="mono ob-count" aria-hidden="true">
        {at + 1}/{count}
      </span>
      <span className="sr-only">
        Step {at + 1} of {count}
      </span>
    </div>
  );
}

/** On the last slide: a hand-drawn ring around the real Settings link (top right) with a note pointing at it. */
function SettingsPointer() {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(".top .settings-link");
      const r = el?.getBoundingClientRect();
      setRect(r && r.width > 0 ? r : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  if (!rect) return null;
  const right = Math.max(8, window.innerWidth - rect.right - 6);
  return (
    <div className="ob-pointer" aria-hidden="true">
      <span className="ob-ghost" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
        Settings
        <svg className="ob-ring" viewBox="0 0 120 50" preserveAspectRatio="none">
          <path pathLength={1} d="M62 4 C30 2 6 12 5 25 C4 40 34 47 62 46 C92 45 116 38 115 24 C114 10 90 3 56 6" />
        </svg>
      </span>
      <span className="ob-pointer-note" style={{ top: rect.bottom + 8, right }}>
        <Note dir="upright">change it all here, any time</Note>
      </span>
    </div>
  );
}
