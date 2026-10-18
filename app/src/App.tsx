import type { ReactNode } from "react";
import { NavLink, Route, Routes, useParams } from "react-router-dom";
import { Overview } from "./pages/Overview";
import { TopicPage } from "./pages/TopicPage";
import { Tutor } from "./pages/Tutor";
import { Tutorial } from "./pages/Tutorial";
import { Quiz } from "./pages/Quiz";
import { Exam } from "./pages/Exam";
import { ExamHistory, ExamReview } from "./pages/ExamHistory";
import { Progress } from "./pages/Progress";
import { Materials } from "./pages/Materials";
import { Notes } from "./pages/Notes";
import { Settings } from "./pages/Settings";
import { useStore } from "./lib/store";

/** Remount a topic screen when the topic changes so quiz, exam and tutor state never leaks between topics. */
function PerTopic({ children }: { children: ReactNode }) {
  const { id } = useParams();
  return <div key={id}>{children}</div>;
}

function Banners() {
  const { saveError, retrySave, notice, dismissNotice } = useStore();
  return (
    <>
      {saveError && (
        <div className="banner bad" role="alert">
          <span>{saveError}</span>
          <button onClick={retrySave}>Try saving again</button>
        </div>
      )}
      {notice && (
        <div className="banner" role="status">
          <span>{notice}</span>
          <button className="ghost" onClick={dismissNotice}>Dismiss</button>
        </div>
      )}
    </>
  );
}

export function App() {
  return (
    <>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <header className="top">
        <NavLink to="/" className="brand">
          Stats 132 Study Studio
        </NavLink>
        <nav aria-label="Main">
          <NavLink to="/" end>Topics</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          <NavLink to="/exams">Exams</NavLink>
          <NavLink to="/notes">Lecture notes</NavLink>
          <NavLink to="/materials">Course materials</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>
      <Banners />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/topic/:id" element={<PerTopic><TopicPage /></PerTopic>} />
          <Route path="/topic/:id/tutor" element={<PerTopic><Tutor /></PerTopic>} />
          <Route path="/topic/:id/tutorial" element={<PerTopic><Tutorial /></PerTopic>} />
          <Route path="/topic/:id/quiz" element={<PerTopic><Quiz /></PerTopic>} />
          <Route path="/topic/:id/exam" element={<PerTopic><Exam /></PerTopic>} />
          <Route path="/exams" element={<ExamHistory />} />
          <Route path="/exams/:examId" element={<ExamReview />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
