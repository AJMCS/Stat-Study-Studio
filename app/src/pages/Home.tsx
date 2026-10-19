import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ThetaMark } from "../components/ThetaMark";
import { Note } from "../components/Hand";
import { Intro, shouldPlayIntro } from "../components/Intro";
import { useStore } from "../lib/store";
import { useIncludeSelfScored } from "../lib/prefs";
import { currentTopicId, journey } from "../lib/journey";
import { topicById } from "../mock/topics";

/**
 * The front door: a short headline beside one diagram. The θ mark is the hub, and two branches run from its ring to
 * the two ways in, Learn (the orange route: where to start) and Practice. A quiet link goes back to the current
 * topic. The first time the app opens in a session, the intro plays over this screen and resolves into it.
 */
export function Home() {
  const { data } = useStore();
  const [includeSelf] = useIncludeSelfScored();
  const [playing, setPlaying] = useState(shouldPlayIntro);
  const played = useRef(playing);
  const mark = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const learn = useRef<HTMLAnchorElement>(null);

  const started = !!data.session || data.attempts.length > 0;
  const current = started ? topicById(currentTopicId(data, journey(data, includeSelf))) : undefined;

  const getTarget = useCallback(() => mark.current?.querySelector("svg")?.getBoundingClientRect() ?? null, []);
  // the θ becomes the two buttons first (branches, then Learn and Practice); everything else comes in after
  const reveal = useCallback(() => {
    const all = Array.from(section.current?.querySelectorAll("[data-reveal]") ?? []);
    const first = all.filter((e) => ["branch", "action", "node"].includes(e.getAttribute("data-reveal") ?? ""));
    const then = all.filter((e) => !first.includes(e)); // headline, note, the way back: close behind the buttons
    const last = Array.from(document.querySelectorAll("header.top")); // the nav comes in last
    return { first, then, last };
  }, []);
  const done = useCallback(() => setPlaying(false), []);

  // while the intro plays, the top bar waits too; it comes in last, with the buttons
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("intro-playing", playing);
    if (!playing && played.current) {
      played.current = false;
      // focus lands on Learn for keyboard and screen-reader users, without drawing a ring until a key is pressed
      const a = learn.current;
      if (a) {
        a.setAttribute("data-quiet-focus", "");
        a.focus();
        const loud = () => a.removeAttribute("data-quiet-focus");
        a.addEventListener("blur", loud, { once: true });
        window.addEventListener("keydown", loud, { once: true });
      }
    }
    return () => root.classList.remove("intro-playing");
  }, [playing]);

  return (
    <>
      <section ref={section} className={`home${playing ? " intro-on" : ""}`} aria-labelledby="home-title">
        <div className="home-copy">
          <h1 id="home-title" data-reveal="text">
            Learn it, then prove it.
          </h1>
        </div>
        <div className="hub-mark" ref={mark}>
          <ThetaMark size={144} className="home-mark" title="Stats Study Studio" />
          <span className="home-note-wide" data-reveal="text">
            <Note dir="left">the unknown we estimate</Note>
          </span>
        </div>
        <div className="hub-tree" aria-hidden="true">
          <svg className="hub-branches" viewBox="0 0 440 96" preserveAspectRatio="none" fill="none">
            <path className="hub-branch voice" data-reveal="branch" pathLength={1} d="M220 0 C220 58 110 38 110 96" />
            <path className="hub-branch" data-reveal="branch" pathLength={1} d="M220 0 C220 58 330 38 330 96" />
          </svg>
          <span className="hub-node learn" data-reveal="node" />
          <span className="hub-node practice" data-reveal="node" />
        </div>
        <div className="hub-actions">
          <Link to="/learn" className="button big" ref={learn} data-reveal="action">
            Learn
          </Link>
          <Link to="/practice" className="button ghost big" data-reveal="action">
            Practice
          </Link>
        </div>
        {current && (
          <p className="home-continue" data-reveal="text">
            Continue where you left off: <Link to={`/topic/${current.id}`}>{current.title}</Link>
          </p>
        )}
      </section>
      {playing && <Intro getTarget={getTarget} reveal={reveal} onDone={done} />}
    </>
  );
}
