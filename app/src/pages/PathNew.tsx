import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eyebrow, Note, Scribble } from "../components/Hand";
import { PlainText } from "../components/PlainText";
import { PageView } from "../components/PageView";
import { Citations, SourceTag } from "../components/Citation";
import { useAi } from "../lib/ai";
import { GENERAL_ID, useStore } from "../lib/store";
import { api, hitToSource, personalHitToSource, ServiceRejected, ServiceUnavailable, type AiPathProposal, type UploadReport } from "../lib/api";
import { buildCatalogue, fromProposal, KIND_LABEL, two, usePaths } from "../lib/paths";
import { Coverage } from "./PathPage";
import type { PersonalFile } from "../types";

const ACCEPTED = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.webp";
const IS_PICTURE = /\.(png|jpe?g|tiff?|bmp|webp)$/i;
const POLL_MS = 500;
const PREVIEW_CHARS = 280;
/** How many pages' first lines the "everything that was read" disclosure lists before it says "and n more". */
const PREVIEW_PAGES = 40;
const excerpt = (t: string) => (t.length > PREVIEW_CHARS ? `${t.slice(0, PREVIEW_CHARS).trimEnd()}…` : t);
const PLACEHOLDER = "e.g. I can follow the MLE steps for an exponential rate, but I don't see why the answer is one over the mean, or how to get its standard error";

/** The first lines of one page as it was read, and how ("ocr" when OCR read it). */
interface PageRead {
  text: string;
  method: string;
}

/** Where an added file is in the upload pipeline: being read, refused, or read (with what was read from it, page by
 * page; `preview` and `method` are the first page's, the excerpt shown first). */
type Reading =
  | { state: "reading"; filename: string; progress: number; total: number }
  | { state: "failed"; filename: string; error: string }
  | { state: "read"; file: PersonalFile; report: UploadReport | null; preview: string; method: string; pageReads: PageRead[] };

const reason = (e: unknown) =>
  e instanceof ServiceRejected ? e.message : e instanceof ServiceUnavailable ? "The study service is not responding. Check that the app is still running." : "Something went wrong. Please try again.";

/**
 * Build a custom path: a text ask, a file (a photo of homework, a PDF, a Word file or a text file), or both. The
 * file goes through the ordinary upload pipeline, so it is parsed and OCR'd the same way and lands in Your files;
 * what was read from it is shown before anything is built. The proposal is saved only when the learner starts it.
 */
export function PathNew() {
  const ai = useAi();
  const nav = useNavigate();
  const { refreshFiles } = useStore();
  const { add } = usePaths();
  const catalogue = useMemo(buildCatalogue, []);
  const [ask, setAsk] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<AiPathProposal | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const providerName = ai.info?.accounts.find((a) => a.active)?.name ?? ai.info?.providerName ?? "your AI service";

  /** Send one file through the upload pipeline and, once it is read, fetch what was read from each of its pages. */
  const addFile = async (file: File) => {
    setError("");
    setReading({ state: "reading", filename: file.name, progress: 0, total: 0 });
    try {
      const job = await api.uploadFile(file, GENERAL_ID);
      let current = job;
      while (alive.current && current.status !== "ready" && current.status !== "failed") {
        await new Promise((r) => setTimeout(r, POLL_MS));
        current = await api.uploadStatus(job.uploadId);
        if (alive.current) setReading({ state: "reading", filename: file.name, progress: current.progress, total: current.total });
      }
      if (!alive.current) return;
      if (current.status === "failed" || !current.file) {
        setReading({ state: "failed", filename: file.name, error: current.error ?? "It could not be read." });
        return;
      }
      await refreshFiles().catch(() => {});
      const read = current.file;
      const total = Math.max(1, current.report?.pages ?? read.pages ?? 1);
      const pages = await Promise.all(Array.from({ length: Math.min(total, PREVIEW_PAGES) }, (_, i) => api.personalPage(read.id, i + 1).catch(() => null)));
      const pageReads = pages.map((p) => ({ text: excerpt((p?.text ?? "").replace(/\s+/g, " ").trim()), method: p?.method ?? "" }));
      if (alive.current) setReading({ state: "read", file: read, report: current.report, preview: pageReads[0].text, method: pageReads[0].method, pageReads });
    } catch (e) {
      if (alive.current) setReading({ state: "failed", filename: file.name, error: reason(e) });
    }
  };

  const onFiles = (list: FileList | null) => {
    const file = list?.[0];
    if (fileInput.current) fileInput.current.value = "";
    if (file) void addFile(file);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    onFiles(e.dataTransfer.files);
  };

  const fileId = reading?.state === "read" ? reading.file.id : null;
  const canBuild = (ask.trim().length > 0 || !!fileId) && reading?.state !== "reading" && !busy;
  // nothing to build from yet (and no file on its way in): the disabled button says what it is waiting for
  const waiting = !busy && !ask.trim() && !fileId && reading?.state !== "reading";

  const build = async () => {
    setBusy(true);
    setError("");
    try {
      setProposal(await api.aiPath(ask.trim(), fileId, catalogue));
      window.scrollTo?.({ top: 0 });
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : reason(e));
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    if (!proposal) return;
    const path = fromProposal(proposal, ask.trim());
    add(path);
    nav(`/paths/${path.id}`);
  };

  if (!ai.connected) {
    return (
      <>
        <p className="back"><Link to="/learn">← Study journey</Link></p>
        <Eyebrow>Learn · your own path</Eyebrow>
        <h1>Your own <Scribble>path</Scribble></h1>
        <p className="notice warn-box" role="status">
          Building a path reads what you ask for and picks the stops that get you there. That needs an AI service, and none is connected. Paths you already built still open from the <Link to="/learn">study journey</Link>.
        </p>
        <p>
          <Link className="button" to="/settings">Set one up in Settings</Link>
        </p>
      </>
    );
  }

  const n = proposal?.steps.length ?? 0;
  const last = proposal?.steps[n - 1];
  // what was read from the file: how many pages, whether a picture (its OCR text and the picture itself are sent)
  const read = reading?.state === "read" ? reading : null;
  const pages = read ? (read.report?.pages ?? read.file.pages) : 0;
  const picture = !!read && IS_PICTURE.test(read.file.filename);
  const ocr = !!read && (read.method === "ocr" || (read.report?.ocrPages ?? 0) > 0);

  return (
    <>
      <p className="back"><Link to="/learn">← Study journey</Link></p>
      <Eyebrow>Learn · your own path</Eyebrow>
      <h1>Your own <Scribble>path</Scribble></h1>
      <p className="lede">
        Say what you want to be able to do, or hand over the homework, and {providerName} draws a short path to it through this course: the vocabulary, tutorial steps, worked examples and breakdowns that fit, and a check at the end.
      </p>

      {proposal ? (
        <section className="panel focal path-proposal" aria-label="Proposed path">
          <p className="eyebrow">
            {"// Proposed path · "}{n} steps · ends with {last?.kind === "tutor" ? "a tutor session" : "the quiz"}
          </p>
          <h2>{proposal.title}</h2>
          <p className="pp-goal">{proposal.goal}</p>
          <Coverage covers={proposal.covers} leavesOut={proposal.leavesOut} className="pp-covers" />
          {proposal.concepts.length > 0 && (
            <p className="concepts">
              <span className="eyebrow inline">{"// Concepts"}</span>
              {proposal.concepts.map((c) => <span key={c} className="chip">{c}</span>)}
            </p>
          )}
          <ol className="proposal-steps">
            {proposal.steps.map((s, i) => (
              <li key={i}>
                <p className="eyebrow">
                  {"// "}{two(i + 1)} · {KIND_LABEL[s.kind]}{i === n - 1 ? " · mastery check" : ""}{s.kind === "explain" ? " · written for you" : ""}
                </p>
                <p className="ps-title">{s.title}</p>
                <p className="ps-why">{s.why}</p>
                {s.kind === "explain" && s.text && (
                  <div className="ps-text">
                    <PageView text={s.text} />
                    {s.sources.length > 0 && (
                      <div className="ps-cites">
                        <Citations sources={s.sources.map((h) => (h.scope === "shared" ? hitToSource(h) : personalHitToSource(h)))} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <Note dir="down" className="focal-note form-note">the whole path is saved once you start</Note>
          <div className="row pp-actions">
            <button onClick={start}>Start this path</button>
            <button className="ghost" onClick={() => setProposal(null)}>Change my ask</button>
          </div>
        </section>
      ) : (
        <section className="panel focal path-form" aria-label="What do you want to be able to do?">
          <label className="field">
            <span>What do you want to be able to do?</span>
            <textarea rows={4} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={PLACEHOLDER} disabled={busy} />
          </label>
          <Note dir="down" className="focal-note form-note">or just hand over the homework</Note>
          {read ? (
            <div className="file-read" aria-live="polite">
              <p className="eyebrow">{picture ? "// Read from your picture" : "// Read from your file"}</p>
              <p className="file-line">
                <b>{read.file.filename}</b> · <b className="mono">{pages}</b> page{pages === 1 ? "" : "s"}
                {ocr ? <>, {pages > 1 && read.report ? <><b className="mono">{read.report.ocrPages}</b> </> : ""}read with OCR</> : null}
                {" · "}
                <button className="link" onClick={() => setReading(null)} disabled={busy}>Use a different file</button>
              </p>
              {read.preview ? (
                <blockquote className="file-preview">
                  <span className="eyebrow preview-label">
                    {"// "}{read.preview.endsWith("…") ? "First lines of" : "The whole of"} page <span className="mono">1</span>{pages > 1 ? <> of <span className="mono">{pages}</span></> : ""}
                    {read.method === "ocr" ? ", read with OCR" : ""}
                  </span>
                  <PlainText text={read.preview} />
                </blockquote>
              ) : (
                <p className="muted">No text could be shown from the first page.</p>
              )}
              {pages > 1 && read.pageReads.length > 1 && (
                <details className="file-all">
                  <summary>Show everything that was read</summary>
                  <ol className="file-pages">
                    {read.pageReads.map((p, i) => (
                      <li key={i}>
                        <span className="eyebrow preview-label">
                          {"// Page "}<span className="mono">{i + 1}</span>{p.text.endsWith("…") ? " · first lines" : ""}{p.method === "ocr" ? " · read with OCR" : ""}
                        </span>
                        {p.text ? <PlainText text={p.text} /> : <span>No text could be shown from this page.</span>}
                      </li>
                    ))}
                    {pages > read.pageReads.length && <li>…and <b className="mono">{pages - read.pageReads.length}</b> more pages, read the same way.</li>}
                  </ol>
                </details>
              )}
              {read.report && read.report.flaggedPages.length > 0 && (
                <p className="notice warn-box" role="status">
                  Page {read.report.flaggedPages.map((p) => p.page).join(", ")}: {read.report.flaggedPages[0].warning} The path is built from this reading, so check the page against the original if the math matters.
                </p>
              )}
              <p className="muted small">
                {pages > 1 ? (
                  <>All <b className="mono">{pages}</b> pages were read; their text goes with your ask.</>
                ) : picture ? (
                  <>The whole picture was read; its text and the picture itself go with your ask, so {providerName} can check the reading.</>
                ) : (
                  <>The whole page was read; its text goes with your ask.</>
                )}{" "}
                It is saved in your files too (<SourceTag s={{ id: "f", kind: "Personal", title: read.file.filename, collection: "General", filename: read.file.filename }} />).
              </p>
            </div>
          ) : (
            <div className={`drop${over ? " over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop} aria-live="polite">
              {reading?.state === "reading" ? (
                <>
                  <span>Reading <b>{reading.filename}</b>{reading.total > 0 ? <>: page <b className="mono">{Math.min(reading.progress + 1, reading.total)}</b> of <b className="mono">{reading.total}</b></> : "…"}</span>
                  <progress value={reading.total ? reading.progress : undefined} max={reading.total || undefined} aria-label={`Reading ${reading.filename}`} />
                </>
              ) : (
                <>
                  {reading?.state === "failed" && (
                    <p className="err-line" role="alert"><span className="warn" aria-hidden="true">!</span><span><b>{reading.filename}</b> wasn't read. {reading.error}</span></p>
                  )}
                  <label className="field drop-field">
                    <span>A photo of the homework, or the file itself</span>
                    <input ref={fileInput} type="file" accept={ACCEPTED} onChange={(e) => onFiles(e.target.files)} disabled={busy} />
                  </label>
                  <p className="muted small">PDF, Word (.docx), .txt, or a picture (PNG, JPG). Drop it here or choose it. It is read on this computer and kept in your files.</p>
                </>
              )}
            </div>
          )}
          <p className="muted small sent-line">
            {picture ? `What you type, the text read from your picture and the picture itself go to ${providerName}; nothing else does.` : `What you type and the text read from your file go to ${providerName}; nothing else does.`}
          </p>
          {error && <p className="err-line" role="alert"><span className="warn" aria-hidden="true">!</span><span>{error}</span></p>}
          <div className="row">
            <button onClick={() => void build()} disabled={!canBuild}>{busy ? "Drawing your path…" : error ? "Try again" : "Build my path"}</button>
            {busy && <span className="muted" role="status">Reading the course and choosing the stops. This takes a little while.</span>}
            {waiting && <span className="muted">Type what you want to be able to do, or add a file, and this comes alive.</span>}
          </div>
          {busy && <progress aria-label="Building your path" />}
        </section>
      )}
    </>
  );
}
