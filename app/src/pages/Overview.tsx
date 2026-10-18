import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TOPICS, topicById } from "../mock/topics";
import { useStore } from "../lib/store";
import { analyticsAttempts, classify, recencyWeighted, trend } from "../lib/scoring";
import { StreakIndicator } from "../components/Score";

const ACTIVITY_PATH = { tutor: "tutor", tutorial: "tutorial", quiz: "quiz", exam: "exam" } as const;

export function Overview() {
  const { data, setSession } = useStore();
  const nav = useNavigate();
  const [hideResume, setHideResume] = useState(false);
  const s = data.session;
  const resumeTopic = s ? topicById(s.topicId) : undefined;
  const units = [...new Set(TOPICS.map((t) => t.unit))];

  return (
    <>
      <h1>Stats 132</h1>
      <p className="lede">Choose a topic to study. Your progress reflects how well you understand and retain ideas, not how often you open the app.</p>

      {s && resumeTopic && !hideResume && (
        <section className="panel resume" aria-label="Resume previous session">
          <div>
            <strong>Pick up where you left off?</strong>
            <p>
              {resumeTopic.title} · {s.activity} · {new Date(s.at).toLocaleString()}
            </p>
          </div>
          <div className="row">
            <button onClick={() => nav(`/topic/${s.topicId}/${ACTIVITY_PATH[s.activity]}`)}>Resume</button>
            <button
              className="ghost"
              onClick={() => {
                setHideResume(true);
                setSession(null);
              }}
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {units.map((u) => (
        <section key={u} aria-labelledby={`u-${u}`}>
          <h2 id={`u-${u}`}>{u}</h2>
          <div className="grid">
            {TOPICS.filter((t) => t.unit === u).map((t) => {
              const at = analyticsAttempts(data.attempts, t.id);
              const score = recencyWeighted(at, data.config.recencyWindow);
              const state = data.topicState[t.id];
              const cls = classify(score, data.config);
              const tr = trend(at, data.config.recencyWindow);
              return (
                <Link key={t.id} to={`/topic/${t.id}`} className="card">
                  <h3>{t.title}</h3>
                  <p>{t.intro.split(". ")[0]}.</p>
                  <div className="row between">
                    <span className={`chip ${cls === "strength" ? "ok" : cls === "gap" ? "flag" : ""}`}>
                      {score === null ? "Not started" : cls === "strength" ? `Strength · ${score}` : `Gap · ${score}`}
                    </span>
                    {tr !== "new" && tr !== "steady" && <span className="chip">{tr === "improving" ? "↑ Improving" : "↓ Declining"}</span>}
                    {state && <StreakIndicator streak={state.streak} warn={state.warnCriteria} flagged={state.flagged} />}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
