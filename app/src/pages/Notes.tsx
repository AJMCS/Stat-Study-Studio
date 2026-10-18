import { useState } from "react";
import { LECTURE_NOTES } from "../mock/topics";

export function Notes() {
  const [id, setId] = useState(LECTURE_NOTES[0].id);
  const note = LECTURE_NOTES.find((n) => n.id === id)!;
  const url = `/course-library/${note.file}`;
  return (
    <>
      <h1>Lecture notes</h1>
      <p className="muted">Shared course library. Scroll through the notes here or open the full file.</p>
      <label className="field">
        <span>Lecture</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {LECTURE_NOTES.map((n) => (
            <option key={n.id} value={n.id}>Lecture {n.number}: {n.title}</option>
          ))}
        </select>
      </label>
      <iframe className="pdf" title={`Lecture ${note.number} notes`} src={url} />
      <p><a href={url} target="_blank" rel="noreferrer">Open complete file</a></p>
    </>
  );
}
