import { useEffect, useRef, useState } from "react";
import type { SourceRef } from "../types";
import { getBlob } from "../lib/personal";

export const LOW_OCR = 0.7;

export const isLowOcr = (s: SourceRef) => !!s.ocr && (s.ocrConfidence ?? 1) < LOW_OCR;

export function SourceTag({ s }: { s: SourceRef }) {
  const parts =
    s.kind === "Shared"
      ? ["Shared"]
      : ["Personal", s.collection, s.filename, s.page ? `p. ${s.page}` : undefined];
  return (
    <span className="tag">
      {parts.filter(Boolean).join(" · ")}
      {s.uploadedAt && s.version && s.version > 1 && <span className="muted"> ({new Date(s.uploadedAt).toLocaleDateString()})</span>}
      {s.unavailable && <span className="muted"> (unavailable)</span>}
    </span>
  );
}

/** Citation chips for an answer. Shows a low-OCR warning and opens an in-app preview on selection. */
export function Citations({ sources, empty }: { sources: SourceRef[]; empty?: string }) {
  const [open, setOpen] = useState<SourceRef | null>(null);
  if (sources.length === 0) {
    return (
      <p className="notice" role="status">
        {empty ?? "No relevant sources were found, so this is not presented as source-grounded. Try rephrasing, or add material in Course materials."}
      </p>
    );
  }
  return (
    <div className="citations">
      {sources.some(isLowOcr) && (
        <p className="notice warn-box" role="alert">
          This answer relies on low-confidence OCR text. The extracted text may be incomplete or inaccurate; check the original page.
        </p>
      )}
      {sources.map((s) => (
        <button key={s.id} className="cite" onClick={() => setOpen(s)} aria-haspopup="dialog">
          <SourceTag s={s} />
        </button>
      ))}
      {open && <SourcePreview s={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function SourcePreview({ s, onClose }: { s: SourceRef; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [fileMsg, setFileMsg] = useState("");

  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);

  // Highlight only when the span is reliably located within the excerpt.
  const idx = s.highlight ? s.excerpt.indexOf(s.highlight) : -1;
  const before = idx >= 0 ? s.excerpt.slice(0, idx) : s.excerpt;
  const hit = idx >= 0 ? s.highlight! : "";
  const after = idx >= 0 ? s.excerpt.slice(idx + hit.length) : "";

  const openFile = async () => {
    if (s.unavailable) return setFileMsg("The original file is no longer available.");
    if (s.kind === "Personal") {
      const id = s.id.split("-")[0];
      const blob = await getBlob(id);
      if (!blob) return setFileMsg("The file could not be found on this device. Reconnect or re-add it in Course materials.");
      window.open(URL.createObjectURL(blob), "_blank");
    } else {
      window.open(`/course-library/${s.filename}${s.page ? `#page=${s.page}` : ""}`, "_blank");
    }
  };

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby="src-title">
      <h3 id="src-title">{s.title}</h3>
      <p>
        <SourceTag s={s} />
        {s.page ? <span className="muted"> · page {s.page}</span> : null}
      </p>
      {s.ocr && <p className="muted">This text was extracted with OCR. Inspect the original page for diagrams and surrounding context.</p>}
      {isLowOcr(s) && <p className="notice warn-box">Low OCR confidence: this text may be incomplete or inaccurate.</p>}
      <blockquote className="excerpt">
        {before}
        {hit && <mark>{hit}</mark>}
        {after}
      </blockquote>
      {s.kind === "Shared" && s.filename?.endsWith(".pdf") && (
        <iframe className="pdf small" title={`${s.title}, page ${s.page}`} src={`/course-library/${s.filename}#page=${s.page ?? 1}`} />
      )}
      {idx < 0 && s.highlight === undefined && <p className="muted">Showing the cited page without a highlight because the exact passage could not be located reliably.</p>}
      <div className="row">
        <button onClick={openFile}>Open complete source file</button>
        <button className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      {fileMsg && <p role="status">{fileMsg}</p>}
    </dialog>
  );
}
