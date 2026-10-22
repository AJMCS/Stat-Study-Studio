import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LECTURE_NOTES } from "../mock/topics";
import { api } from "../lib/api";
import { Annotated, Eyebrow, Scribble } from "../components/Hand";
import { AskPanel } from "../components/AskPanel";

/** The lecture notes, page by page, with the guide beside them to ask about the page in view. */
export function Notes() {
  const [id, setId] = useState(LECTURE_NOTES[0].id);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<number | undefined>();
  const note = LECTURE_NOTES.find((n) => n.id === id)!;
  const url = `/course-library/${note.file}`;

  // a new lecture opens at its first page; its length comes from the library's transcript of it
  useEffect(() => {
    let live = true;
    setPage(1);
    setPages(undefined);
    api.page(note.file, 1).then((p) => live && setPages(p.pages)).catch(() => {});
    return () => {
      live = false;
    };
  }, [note.file]);

  const goTo = (n: number) => setPage(Math.min(Math.max(1, n), pages ?? Infinity));

  return (
    <>
      <p className="back"><Link to="/library">← Library</Link></p>
      <Eyebrow>Library · lecture {String(note.number).padStart(2, "0")} of {String(LECTURE_NOTES.length).padStart(2, "0")}</Eyebrow>
      <h1>Lecture <Scribble>notes</Scribble></h1>
      <p className="muted">Shared course library. Read the notes here, and ask about the page you are on; the page number tells the guide which one.</p>
      <Annotated note="the professor's own notation">
        <label className="field">
          <span>Lecture</span>
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {LECTURE_NOTES.map((n) => (
              <option key={n.id} value={n.id}>Lecture {n.number}: {n.title}</option>
            ))}
          </select>
        </label>
      </Annotated>
      <div className="reader">
        <div className="reader-doc">
          {/* above the notes, so the page the guide is asked about is in view beside the conversation */}
          <div className="row between pager">
            <button className="ghost" disabled={page <= 1} onClick={() => goTo(page - 1)}>Previous page</button>
            <label className="field page-field">
              <span>Page you are on</span>
              <input type="number" min={1} max={pages} value={page} aria-label="Page you are on" onChange={(e) => goTo(Number(e.target.value) || 1)} />
            </label>
            <button className="ghost" disabled={!!pages && page >= pages} onClick={() => goTo(page + 1)}>Next page</button>
          </div>
          <iframe key={`${note.file}-${page}`} className="pdf" title={`Lecture ${note.number} notes`} src={`${url}#page=${page}&toolbar=0&navpanes=0&zoom=page-width&view=FitH`} />
          <p>
            <a href={url} target="_blank" rel="noreferrer">Open complete file</a> · <Link to={`/read?source=${encodeURIComponent(note.file)}&page=${page}`}>Read this page as text</Link>
          </p>
        </div>
        <AskPanel doc={{ source: note.file, title: `Lecture ${note.number}: ${note.title}` }} page={page} pages={pages} />
      </div>
    </>
  );
}
