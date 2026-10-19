import type { ReactNode } from "react";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Library } from "./pages/Library";
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
import { ThetaMark } from "./components/ThetaMark";
import { useStore } from "./lib/store";
import { megabytes, useLibrary } from "./lib/library";
import { useTheme } from "./lib/theme";

/** Remount a topic screen when the topic changes so quiz, exam and tutor state never leaks between topics. */
function PerTopic({ children }: { children: ReactNode }) {
  const { id } = useParams();
  return <div key={id}>{children}</div>;
}

function Banners() {
  const { saveError, retrySave, notice, dismissNotice } = useStore();
  const { status, showBanner, later, update, dismissUpdated } = useLibrary();
  return (
    <>
      {status?.state === "downloading" && (
        <div className="banner" role="status">
          <span>
            Updating course materials{status.progress.total > 0 ? <>: file <span className="mono">{Math.min(status.progress.done + 1, status.progress.total)}</span> of <span className="mono">{status.progress.total}</span></> : "…"}
          </span>
          <progress value={status.progress.total ? status.progress.done : undefined} max={status.progress.total || undefined} aria-label="Updating course materials" />
        </div>
      )}
      {status?.state !== "downloading" && showBanner && status?.available && (
        <div className="banner" role="status">
          <span>
            New course materials are available (version <span className="mono">{status.available.version}</span>: <span className="mono">{status.available.files}</span> file{status.available.files === 1 ? "" : "s"}, <span className="mono">{megabytes(status.available.bytes)}</span>).
          </span>
          <span className="row">
            <button onClick={() => void update()}>Update now</button>
            <button className="ghost" onClick={later}>Later</button>
          </span>
        </div>
      )}
      {status?.justUpdated && (
        <div className="banner" role="status">
          <span>Course materials updated to version <span className="mono">{status.installed.version}</span>.</span>
          <button className="ghost" onClick={dismissUpdated}>Dismiss</button>
        </div>
      )}
      {status?.state === "idle" && status.error && status.available && (
        <div className="banner bad" role="alert">
          <span>{status.error}</span>
          <button onClick={() => void update()}>Try again</button>
        </div>
      )}
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

/** Which top-level section a path belongs to, so the nav stays lit inside a section (a topic is part of Learn). */
function section(path: string): string {
  // Quizzes and exams (and their reviews) belong to Practice however you reached them; the back link returns you.
  if (/^\/topic\/[^/]+\/(quiz|exam)$/.test(path)) return "practice";
  if (path.startsWith("/learn") || path.startsWith("/topic/")) return "learn";
  if (path.startsWith("/practice") || path.startsWith("/exams")) return "practice";
  if (path.startsWith("/progress")) return "progress";
  if (path.startsWith("/library") || path.startsWith("/notes") || path.startsWith("/materials")) return "library";
  if (path.startsWith("/settings")) return "settings";
  return "";
}

const NAV = [
  { id: "learn", to: "/learn", label: "Learn" },
  { id: "practice", to: "/practice", label: "Practice" },
  { id: "progress", to: "/progress", label: "Progress" },
  { id: "library", to: "/library", label: "Library" },
  { id: "settings", to: "/settings", label: "Settings", mobile: true },
];

function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" />
        </svg>
      )}
    </button>
  );
}

const WIDE = new Set(["/", "/learn", "/practice", "/library", "/progress", "/exams"]);
const MID = new Set(["/settings"]);

export function App() {
  const { pathname } = useLocation();
  const here = section(pathname);
  return (
    <>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <header className="top">
        <Link to="/" className="brand" aria-label="Stats Study Studio, home">
          <ThetaMark size={30} />
          <span className="wordmark">Stats Study Studio</span>
        </Link>
        <nav aria-label="Main" className="main-nav">
          {NAV.map((n) => (
            <Link key={n.id} to={n.to} className={[here === n.id ? "active" : "", "mobile" in n ? "nav-mobile" : ""].join(" ").trim() || undefined} aria-current={here === n.id ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="top-tools">
          <ThemeToggle />
          <Link to="/settings" className={`settings-link${here === "settings" ? " active" : ""}`} aria-current={here === "settings" ? "page" : undefined}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2.2" />
              <circle cx="8" cy="17" r="2.2" />
            </svg>
            <span>Settings</span>
          </Link>
        </div>
      </header>
      <Banners />
      <main id="main" tabIndex={-1} className={WIDE.has(pathname) ? "wide" : MID.has(pathname) ? "mid" : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/library" element={<Library />} />
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
