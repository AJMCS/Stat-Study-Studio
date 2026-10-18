import { useCallback, useEffect, useRef, useState } from "react";
import type { SourceRef } from "../types";
import { api, type PageInfo } from "../lib/api";
import { getBlob } from "../lib/personal";
import { PageView } from "./PageView";

export const LOW_OCR = 0.7;

export const isLowOcr = (s: SourceRef) => !!s.ocr && (s.ocrConfidence ?? 1) < LOW_OCR;

/** Answer keys (quiz reviews) must not be opened from study screens before a learner has submitted. */
export const isAnswerKey = (s: SourceRef) => !!s.filename?.startsWith("quizzes/");

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

/** The warning to show alongside an answer that relies on these sources, if any. */
export function sourceWarning(sources: SourceRef[]): string | null {
  const w = sources.find((s) => s.warning)?.warning;
  if (w) return w;
  if (sources.some(isLowOcr)) return "This answer relies on low-confidence OCR text. The extracted text may be incomplete or inaccurate; check the original page.";
  return null;
}

/** Citation chips for an answer. Shows a warning for low-confidence text and opens a preview on selection. */
export function Citations({ sources, empty }: { sources: SourceRef[]; empty?: string }) {
  const [open, setOpen] = useState<SourceRef | null>(null);
  if (sources.length === 0) {
    return (
      <p className="notice" role="status">
        {empty ?? "No relevant sources were found, so this is not presented as source-grounded. Try rephrasing, or add material in Course materials."}
      </p>
    );
  }
  const warning = sourceWarning(sources);
  return (
    <div className="citations">
      {warning && (
        <p className="notice warn-box" role="alert">
          {warning}
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

type Load = { state: "loading" } | { state: "ready"; page: PageInfo } | { state: "failed"; message: string };

export function SourcePreview({ s, onClose }: { s: SourceRef; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [fileMsg, setFileMsg] = useState("");
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [marked, setMarked] = useState<boolean | null>(null);
  const shared = s.kind === "Shared" && !!s.filename && s.page !== undefined;

  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    api
      .page(s.filename!, s.page!)
      .then((page) => !cancelled && setLoad({ state: "ready", page }))
      .catch((e) => !cancelled && setLoad({ state: "failed", message: e instanceof Error ? e.message : "The page text could not be loaded." }));
    return () => {
      cancelled = true;
    };
  }, [shared, s.filename, s.page]);

  const onHighlight = useCallback((found: boolean) => setMarked(found), []);

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

  const page = load.state === "ready" ? load.page : null;
  const warning = page?.warning ?? s.warning ?? (isLowOcr(s) ? "Low OCR confidence: this text may be incomplete or inaccurate." : null);

  return (
    <dialog ref={ref} className="modal wide" onClose={onClose} aria-labelledby="src-title">
      <h3 id="src-title">{page?.title ?? s.title}</h3>
      <p>
        <SourceTag s={s} />
        {s.page ? <span className="muted"> · page {s.page}{page ? ` of ${page.pages}` : ""}</span> : null}
      </p>
      {s.ocr && <p className="muted">This text was extracted with OCR. Inspect the original page for diagrams and surrounding context.</p>}
      {warning && <p className="notice warn-box" role="alert">{warning}</p>}

      {shared ? (
        <>
          {load.state === "loading" && <p className="muted" role="status">Loading the page…</p>}
          {load.state === "failed" && <p className="notice warn-box" role="alert">Couldn't load the page text ({load.message}). The original page is shown below.</p>}
          {page && (
            <div className="page-scroll" tabIndex={0} aria-label="Text of the cited page">
              <PageView text={page.text} highlight={s.highlight} onHighlight={onHighlight} />
            </div>
          )}
          {page && s.highlight && marked === false && (
            <p className="muted">Showing the cited page without a highlight because the exact passage could not be located reliably.</p>
          )}
          {s.filename?.endsWith(".pdf") && (
            <iframe className="pdf small" title={`${s.title}, page ${s.page}`} src={`/course-library/${s.filename}#page=${s.page ?? 1}`} />
          )}
        </>
      ) : (
        s.excerpt && <blockquote className="excerpt">{s.excerpt}</blockquote>
      )}

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
