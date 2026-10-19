import { useState } from "react";
import { Link } from "react-router-dom";
import { LECTURE_NOTES } from "../mock/topics";
import { Annotated, Eyebrow, Scribble } from "../components/Hand";

export function Notes() {
  const [id, setId] = useState(LECTURE_NOTES[0].id);
  const note = LECTURE_NOTES.find((n) => n.id === id)!;
  const url = `/course-library/${note.file}`;
  return (
    <>
      <p className="back"><Link to="/library">← Library</Link></p>
      <Eyebrow>Library · lecture {String(note.number).padStart(2, "0")} of {String(LECTURE_NOTES.length).padStart(2, "0")}</Eyebrow>
      <h1>Lecture <Scribble>notes</Scribble></h1>
      <p className="muted">Shared course library. Scroll through the notes here or open the full file.</p>
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
      <iframe className="pdf" title={`Lecture ${note.number} notes`} src={`${url}#toolbar=0&navpanes=0&zoom=page-width&view=FitH`} />
      <p><a href={url} target="_blank" rel="noreferrer">Open complete file</a></p>
    </>
  );
}
