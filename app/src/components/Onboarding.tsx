import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useAi } from "../lib/ai";
import { useTheme } from "../lib/theme";
import type { ProviderId } from "../lib/api";
import type { AppData } from "../types";
import { AiConnect, KeyGuide } from "./AiConnect";
import { Note, Scribble } from "./Hand";
import { shouldPlayIntro } from "./Intro";

type Choice = ProviderId | "none";
type Slide = "welcome" | "choose" | "key" | "paste" | "done";

/** One line on cost and privacy for each choice in first-run setup. */
// `line` on wide screens, `short` on phones; both fit on one line
const CHOICES: { id: Choice; name: string; line: string; short: string }[] = [
  { id: "gemini", name: "Google Gemini", line: "Free with a Google account; data goes to Google.", short: "Free with Google; data goes to Google." },
  { id: "anthropic", name: "Anthropic Claude", line: "Costs a little: you add prepaid credit; data goes to Anthropic.", short: "Costs a little; data goes to Anthropic." },
  { id: "openai", name: "OpenAI", line: "Costs a little: you add prepaid credit; data goes to OpenAI.", short: "Costs a little; data goes to OpenAI." },
  { id: "ollama", name: "Ollama", line: "Free app you install; runs on this computer, nothing leaves it.", short: "Free app; runs here, nothing leaves it." },
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
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  const slides: Slide[] = choice === "none" ? ["welcome", "choose", "done"] : ["welcome", "choose", "key", "paste", "done"];
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

  // On the last slide the top bar comes back (cleanly, above the dialog) so the note can point at Settings in it.
  const [topH, setTopH] = useState(0);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("ob-show-top", slide === "done");
    setTopH(slide === "done" ? (document.querySelector("header.top")?.getBoundingClientRect().bottom ?? 0) : 0);
    return () => root.classList.remove("ob-show-top");
  }, [slide]);

  const reassure = <p className="muted ob-reassure">You can change this any time in Settings (top right).</p>;
  const titleId = `ob-title-${slide}`;
  const title = (children: ReactNode) => (
    <h2 id={titleId} ref={heading} tabIndex={-1} className="ob-title">
      {children}
    </h2>
  );
  const later = "any time in Settings."; // where Settings is follows on the next line

  return (
    <dialog
      ref={ref}
      className="onboard"
      aria-labelledby={titleId}
      onKeyDown={trap}
      style={topH ? { top: topH, height: `calc(100% - ${topH}px)` } : undefined}
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
            <StepDots count={slides.length} at={at} />
            {slide !== "done" && (
              <button type="button" className="link ob-skip" onClick={onFinish}>
                Skip setup
              </button>
            )}
          </div>

          <div className="ob-slide" key={slide}>
            {slide === "welcome" && (
              <>
                <div className="ob-block">
                  {title(
                    <>
                      Welcome to the <Scribble>studio</Scribble>
                    </>,
                  )}
                </div>
                <div className="ob-block">
                  <p>
                    Stats Study Studio teaches each topic of the course, then has you prove it with quizzes, recalls and exams, and shows what is sticking. Everything works
                    offline, with no account, and your progress stays on this computer.
                  </p>
                  <p className="muted">
                    An AI service is optional. It adds a tutor that talks with you, scoring of written answers, exams written around what you want to practise, and better
                    reading of handwritten notes.
                  </p>
                </div>
                <fieldset className="ob-block ob-theme">
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
                <div className="ob-block">
                  {title(
                    <>
                      Add an AI <Scribble>helper</Scribble>?
                    </>,
                  )}
                  <p className="muted">Pick an AI service, or carry on without one.</p>
                  {reassure}
                </div>
                <fieldset className="ob-block ob-choices">
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

            {slide === "key" && provider && (
              <>
                <div className="ob-block">
                  {title(
                    provider === "ollama" ? (
                      <>
                        Install <Scribble>Ollama</Scribble>
                      </>
                    ) : (
                      <>
                        Get a <Scribble>key</Scribble>
                      </>
                    ),
                  )}
                  {reassure}
                </div>
                <div className="ob-block">
                  <KeyGuide provider={provider} />
                </div>
              </>
            )}

            {slide === "paste" && provider && (
              <>
                <div className="ob-block">
                  {title(
                    provider === "ollama" ? (
                      <>
                        Pick your <Scribble>model</Scribble>
                      </>
                    ) : (
                      <>
                        Paste your <Scribble>key</Scribble>
                      </>
                    ),
                  )}
                  {reassure}
                </div>
                {connectedHere ? (
                  <p className="ob-block" role="status">
                    Connected to {connected!.providerName}. {connected!.local ? "It runs on this computer, so nothing is sent over the internet." : "Your key is kept on this computer only."}
                  </p>
                ) : (
                  <AiConnect key={provider} provider={provider} headingLevel={3} compact connectSlot={slot} onConnected={() => go("done")} />
                )}
              </>
            )}

            {slide === "done" && (
              <>
                <div className="ob-block">
                  {title(
                    connected ? (
                      <>
                        You're <Scribble>set</Scribble>
                      </>
                    ) : (
                      <>
                        All set to <Scribble>start</Scribble>
                      </>
                    ),
                  )}
                </div>
                <div className="ob-block">
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
                        ) : skipped && provider ? (
                          `Not connected yet: connect it ${later}`
                        ) : (
                          `None for now: add one ${later}`
                        )}
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
                  <p className="ob-change">
                    You can change any of this in{" "}
                    <Link to="/settings" onClick={onFinish}>
                      Settings
                    </Link>{" "}
                    (top right).
                  </p>
                </div>
              </>
            )}
          </div>

          <div className={`ob-foot${slide === "key" ? " two" : (slide === "paste" && !connectedHere) || (slide === "done" && !connected && skipped) ? " pair" : ""}`}>
            {at > 0 ? (
              <button type="button" className="link ob-back" onClick={back}>
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="ob-nav">
              {slide === "welcome" && <button type="button" onClick={() => go("choose")}>Next</button>}
              {slide === "choose" && (
                <button type="button" onClick={() => go(choice === "none" ? "done" : "key")}>
                  Next
                </button>
              )}
              {/* the forward action comes first in the page order (it is drawn on the right) */}
              {slide === "key" && (
                <button type="button" onClick={() => go("paste")}>
                  {provider === "ollama" ? "Next: pick it" : "Next: paste it"}
                </button>
              )}
              {slide === "paste" && !connectedHere && <span className="connect-slot" ref={setSlot} />}
              {slide === "done" && (
                <button type="button" onClick={onFinish}>
                  Start
                </button>
              )}
              {slide === "done" && !connected && skipped && provider && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setSkipped(false);
                    go("paste");
                  }}
                >
                  Connect {SHORT[provider]} now
                </button>
              )}
              {slide === "paste" && connectedHere && (
                <button type="button" onClick={() => go("done")}>
                  Continue
                </button>
              )}
              {(slide === "key" || (slide === "paste" && !connectedHere)) && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setSkipped(true);
                    go("done");
                  }}
                >
                  Continue without AI
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
  const right = Math.max(16, window.innerWidth - rect.right);
  return (
    <div className="ob-pointer" aria-hidden="true">
      <svg className="ob-ring" viewBox="0 0 120 50" preserveAspectRatio="none" style={{ left: rect.left - 12, top: rect.top - 6, width: rect.width + 24, height: rect.height + 12 }}>
        <path pathLength={1} d="M62 4 C30 2 6 12 5 25 C4 40 34 47 62 46 C92 45 116 38 115 24 C114 10 90 3 56 6" />
      </svg>
      <span className="ob-pointer-note" style={{ top: rect.bottom + 8, right }}>
        <Note dir="upright">change it all here, any time</Note>
      </span>
    </div>
  );
}
