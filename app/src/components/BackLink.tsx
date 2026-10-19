import { Link, useLocation } from "react-router-dom";

/** The back link on a topic's quiz or exam: to the Practice hub when that is where the learner came from, else the topic. */
export function BackToTopic({ id, title }: { id: string; title: string }) {
  const fromPractice = (useLocation().state as { from?: string } | null)?.from === "practice";
  return (
    <p className="back">
      {fromPractice ? <Link to="/practice">← Practice</Link> : <Link to={`/topic/${id}`}>← {title}</Link>}
    </p>
  );
}
