import { Link } from "react-router-dom";
import { LECTURE_NOTES } from "../mock/topics";
import { VOCAB } from "../mock/vocab";

const GLOSSARY_SIZE = Object.values(VOCAB).flat().length;
import { useStore } from "../lib/store";
import { useLibrary } from "../lib/library";
import { Eyebrow, Note, Scribble } from "../components/Hand";

export function Library() {
  const { data } = useStore();
  const { status } = useLibrary();
  const files = data.files.filter((f) => !f.removed).length;
  return (
    <>
      <Eyebrow>Library</Eyebrow>
      <h1>
        The course <Scribble>library</Scribble>
      </h1>
      <p className="lede">What every answer in the app is grounded in: the lecture notes, and the course materials you can search.</p>

      <div className="library-grid">
        <Link to="/notes" className="card focal big-card">
          <p className="eyebrow">{"// Lecture notes · "}{LECTURE_NOTES.length} lectures</p>
          <h2>Lecture notes</h2>
          <p>Read each lecture in the app, page by page, or open the complete file.</p>
          <span className="card-go-row">
            <span className="card-go" aria-hidden="true">Open →</span>
            {/* beside the link on a wide screen, under it (arrow up) on a phone */}
            <Note dir="left" className="library-note beside-wide">start with these</Note>
            <Note dir="up" className="library-note-narrow beside-narrow">start with these</Note>
          </span>
        </Link>
        <Link to="/materials" className="card big-card">
          <p className="eyebrow" title={`Library v${status?.installed.version ?? "–"}`}>{"// Course materials · "}{files} file{files === 1 ? "" : "s"} of yours</p>
          <h2>Course materials</h2>
          <p>Search the shared library and your own collections, upload notes and scans, and check for updates.</p>
          <span className="card-go" aria-hidden="true">Open →</span>
        </Link>
        <Link to="/glossary" className="card big-card">
          <p className="eyebrow">{"// Glossary · "}{GLOSSARY_SIZE} terms</p>
          <h2>Glossary</h2>
          <p>Every term and symbol from the lectures, with a plain definition, the notes' wording and the page it comes from.</p>
          <span className="card-go" aria-hidden="true">Open →</span>
        </Link>
      </div>
    </>
  );
}
