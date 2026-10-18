import { useCallback, useEffect, useRef, useState } from "react";
import { GENERAL_ID, uid, useStore } from "../lib/store";
import { Citations, SourcePreview } from "../components/Citation";
import { PageView } from "../components/PageView";
import { PlainText } from "../components/PlainText";
import { api, hitToSource, personalHitToSource, ServiceRejected, ServiceUnavailable, type UploadReport } from "../lib/api";
import type { PersonalFile, SourceRef } from "../types";

const ACCEPTED = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.webp";
const POLL_MS = 500;

interface UploadRow {
  key: string;
  filename: string;
  status: "uploading" | "queued" | "processing" | "ready" | "failed";
  progress: number;
  total: number;
  error?: string;
  report?: UploadReport | null;
  file?: PersonalFile | null;
}

const reason = (e: unknown) =>
  e instanceof ServiceRejected ? e.message : e instanceof ServiceUnavailable ? "The study service is not responding. Check that the app is still running." : "Something went wrong. Please try again.";

export function Materials() {
  const { data, update, refreshFiles } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const reconnectInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const [target, setTarget] = useState(GENERAL_ID);
  const [newName, setNewName] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [replacing, setReplacing] = useState<PersonalFile | null>(null);
  const [reconnecting, setReconnecting] = useState<PersonalFile | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [fileNotice, setFileNotice] = useState("");
  const [query, setQuery] = useState("");
  const [extra, setExtra] = useState<string[]>([]);
  const [results, setResults] = useState<{ sources: SourceRef[]; mode: string; error: string | null; both: boolean } | null>(null);
  const [searching, setSearching] = useState(false);
  const [review, setReview] = useState<SourceRef | null>(null);

  useEffect(() => {
    alive.current = true;
    void refreshFiles().catch(() => {});
    return () => {
      alive.current = false;
    };
  }, [refreshFiles]);

  const patch = useCallback((key: string, change: Partial<UploadRow>) => {
    if (alive.current) setUploads((rows) => rows.map((r) => (r.key === key ? { ...r, ...change } : r)));
  }, []);

  const track = useCallback(
    async (key: string, uploadId: string) => {
      while (alive.current) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        try {
          const job = await api.uploadStatus(uploadId);
          patch(key, { status: job.status, progress: job.progress, total: job.total, error: job.error ?? undefined, report: job.report, file: job.file });
          if (job.status === "ready") {
            await refreshFiles();
            return;
          }
          if (job.status === "failed") return;
        } catch (e) {
          patch(key, { status: "failed", error: reason(e) });
          return;
        }
      }
    },
    [patch, refreshFiles],
  );

  const send = async (file: File, collectionId: string, replaceId?: string) => {
    const key = uid();
    setUploads((rows) => [...rows, { key, filename: file.name, status: "uploading", progress: 0, total: 0 }]);
    try {
      const job = await api.uploadFile(file, collectionId, replaceId);
      patch(key, { status: job.status === "failed" ? "failed" : "queued", error: job.error ?? undefined });
      await track(key, job.uploadId);
    } catch (e) {
      patch(key, { status: "failed", error: reason(e) });
    }
  };

  const onFiles = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (fileInput.current) fileInput.current.value = "";
    await Promise.all(files.map((f) => send(f, target)));
  };

  const onReplace = async (list: FileList | null) => {
    const f = replacing;
    const file = list?.[0];
    if (replaceInput.current) replaceInput.current.value = "";
    setReplacing(null);
    if (f && file) await send(file, f.collectionId, f.id);
  };

  const onReconnect = async (list: FileList | null) => {
    const f = reconnecting;
    const file = list?.[0];
    if (reconnectInput.current) reconnectInput.current.value = "";
    setReconnecting(null);
    if (!f || !file) return;
    try {
      await api.reconnectFile(f.id, file);
      await refreshFiles();
      setFileNotice(`"${f.filename}" is connected again and searchable.`);
    } catch (e) {
      setFileNotice(reason(e));
    }
  };

  const removeFile = async (f: PersonalFile) => {
    setConfirmRemove(null);
    try {
      await api.removeFile(f.id);
      await refreshFiles();
      setFileNotice(`"${f.filename}" was removed from search and from this device. Past activity keeps a note that it was used.`);
    } catch (e) {
      setFileNotice(reason(e));
    }
  };

  const addCollection = () => {
    const name = newName.trim();
    if (!name) return;
    if (data.collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) return setCollectionError(`A collection named "${name}" already exists.`);
    update((d) => ({ ...d, collections: [...d.collections, { id: uid(), name, consent: false, searchByDefault: false }] }));
    setNewName("");
    setCollectionError("");
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await api.search(q, 5, extra);
      const sources = [...r.results.map(hitToSource), ...r.personal.map(personalHitToSource)];
      setResults({ sources, mode: r.mode, error: null, both: r.results.length > 0 && r.personal.length > 0 });
    } catch (e) {
      setResults({ sources: [], mode: "semantic", error: e instanceof ServiceRejected ? e.message : "Search is unavailable right now. Check that the study app is still running.", both: false });
    } finally {
      setSearching(false);
    }
  };

  const superseded = new Set(data.files.map((f) => f.supersedes).filter(Boolean));
  const removedCount = data.files.filter((f) => f.removed && !superseded.has(f.id)).length;

  return (
    <>
      <h1>Course materials</h1>
      <p className="lede">Search the shared course library and your own uploads. Your files and personal index stay on this device.</p>

      <section className="panel" aria-label="Search materials">
        <h2>Search</h2>
        <div className="row">
          <label className="field grow">
            <span>Ask about the course materials</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. what is a sampling distribution?" />
          </label>
          <button onClick={search} disabled={searching}>{searching ? "Searching…" : "Search"}</button>
        </div>
        <fieldset>
          <legend>Personal collections to include (General is always included)</legend>
          {data.collections.filter((c) => c.id !== GENERAL_ID).length === 0 && <span className="muted">No named collections yet.</span>}
          {data.collections.filter((c) => c.id !== GENERAL_ID).map((c) => (
            <label key={c.id} className="choice">
              <input type="checkbox" checked={extra.includes(c.id)} onChange={() => setExtra((e) => (e.includes(c.id) ? e.filter((x) => x !== c.id) : [...e, c.id]))} /> {c.name}
            </label>
          ))}
        </fieldset>

        {results && (
          <div aria-live="polite">
            {results.error && <p className="notice warn-box" role="alert">{results.error}</p>}
            {results.mode === "keyword" && (
              <p className="muted">Matching by keywords only for now: the model that understands meaning has not been downloaded yet (it needs an internet connection once).</p>
            )}
            {results.sources.length === 0 && !results.error ? (
              <Citations sources={[]} empty="No relevant sources were found. Nothing here is presented as source-grounded. Try different wording, or upload material that covers it." />
            ) : results.sources.length === 0 ? null : (
              <>
                {results.both && (
                  <p className="notice">Both shared course materials and your personal materials matched. If they disagree, the shared course materials take priority because they are the official class sources used for grading.</p>
                )}
                <Citations sources={results.sources} />
                <ol className="excerpts">
                  {results.sources.map((s) => (
                    <li key={s.id}>
                      <p className="muted small">{s.title}{s.page ? ` · p. ${s.page}` : ""}</p>
                      {s.kind === "Shared" && s.excerpt ? <PageView text={s.excerpt} highlight={s.highlight} /> : <PlainText text={s.excerpt ?? ""} highlight={s.highlight} />}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </section>

      <section className="panel" aria-label="Upload">
        <h2>Upload to a personal collection</h2>
        <p className="muted">PDF (including scans), Word (.docx), .txt and photos or images of notes. Scans and photos are read with OCR on this device.</p>
        <div className="row">
          <label className="field">
            <span>Collection</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {data.collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Files</span>
            <input ref={fileInput} type="file" multiple accept={ACCEPTED} onChange={(e) => void onFiles(e.target.files)} />
          </label>
        </div>
        <input ref={replaceInput} type="file" accept={ACCEPTED} hidden aria-hidden="true" tabIndex={-1} data-testid="replace-input" onChange={(e) => void onReplace(e.target.files)} />
        <input ref={reconnectInput} type="file" hidden aria-hidden="true" tabIndex={-1} data-testid="reconnect-input" onChange={(e) => void onReconnect(e.target.files)} />

        <ul className="uploads" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.key} className={u.status === "failed" ? "failed" : ""}>
              {(u.status === "uploading" || u.status === "queued" || u.status === "processing") && (
                <>
                  <span>Reading <b>{u.filename}</b>{u.total > 0 ? `: page ${Math.min(u.progress + 1, u.total)} of ${u.total}` : "…"}</span>
                  <progress value={u.total ? u.progress : undefined} max={u.total || undefined} aria-label={`Reading ${u.filename}`} />
                </>
              )}
              {u.status === "failed" && (
                <>
                  <span role="alert"><b>{u.filename}</b> wasn't added. {u.error}</span>
                  <button className="ghost" onClick={() => setUploads((rows) => rows.filter((r) => r.key !== u.key))}>Dismiss</button>
                </>
              )}
              {u.status === "ready" && u.file && (
                <>
                  <span>
                    Added <b>{u.filename}</b> ({u.report?.pages ?? u.file.pages} page{(u.report?.pages ?? u.file.pages) === 1 ? "" : "s"}); it is searchable now.
                    {u.report && u.report.ocrPages > 0 && <> {u.report.ocrPages} page{u.report.ocrPages === 1 ? " was" : "s were"} read with OCR.</>}
                  </span>
                  {u.report && u.report.flaggedPages.length > 0 && (
                    <span className="notice warn-box" role="status">
                      Some symbols may be missing on page{u.report.flaggedPages.length === 1 ? "" : "s"} {u.report.flaggedPages.map((p) => p.page).join(", ")}. Check {u.report.flaggedPages.length === 1 ? "it" : "them"} against the original if the math matters.
                    </span>
                  )}
                  <span className="row">
                    {u.report && u.report.flaggedPages.length > 0 && (
                      <button
                        className="ghost"
                        onClick={() => setReview({ id: `${u.file!.id}-review`, kind: "Personal", title: u.filename, filename: u.filename, collection: data.collections.find((c) => c.id === u.file!.collectionId)?.name, page: u.report!.flaggedPages[0].page, fileId: u.file!.id, ocr: true })}
                      >
                        Review page {u.report.flaggedPages[0].page}
                      </button>
                    )}
                    <button className="ghost" onClick={() => setUploads((rows) => rows.filter((r) => r.key !== u.key))}>
                      {u.report && u.report.flaggedPages.length > 0 ? "Accept as is" : "Dismiss"}
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="row">
          <label className="field grow">
            <span>New collection</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Homework 3" />
          </label>
          <button onClick={addCollection}>Create</button>
        </div>
        {collectionError && <p className="notice warn-box" role="alert">{collectionError}</p>}
      </section>

      <section aria-label="Your collections">
        <h2>Your collections</h2>
        {fileNotice && <p className="notice" role="status">{fileNotice} <button className="link" onClick={() => setFileNotice("")}>Dismiss</button></p>}
        {data.collections.map((c) => {
          const files = data.files.filter((f) => f.collectionId === c.id && !f.removed && !superseded.has(f.id));
          return (
            <div key={c.id} className="panel">
              <div className="row between">
                <h3>{c.name}</h3>
                <label className="choice">
                  <input
                    type="checkbox"
                    checked={c.consent}
                    onChange={() => update((d) => ({ ...d, collections: d.collections.map((x) => (x.id === c.id ? { ...x, consent: !x.consent } : x)) }))}
                  />
                  <span>Allow an AI service to use this collection</span>
                </label>
              </div>
              <p className="muted">{c.consent ? "On: once you connect an AI service, matching excerpts and your question may be sent to it. Original files never leave this device." : "Off: nothing from this collection is sent to any AI service. This only matters once you connect one."}</p>
              {files.length === 0 ? (
                <p className="muted">No files.</p>
              ) : (
                <ul className="list">
                  {files.map((f) => (
                    <li key={f.id} className="row between">
                      <span>
                        {f.filename} <span className="muted">v{f.version} · {new Date(f.uploadedAt).toLocaleDateString()} · {f.pages} page{f.pages === 1 ? "" : "s"}</span>
                        {f.ocr && <span className="chip">OCR</span>}
                        {(f.flaggedPages ?? 0) > 0 && <span className="chip flag" title="Some pages may be missing symbols or were read with low confidence">Check pages</span>}
                        {f.linkBroken && <span className="chip flag">Original missing, excluded from search</span>}
                      </span>
                      <span className="row">
                        {f.linkBroken && (
                          <button className="ghost" onClick={() => { setReconnecting(f); reconnectInput.current?.click(); }}>Reconnect</button>
                        )}
                        <button className="ghost" onClick={() => { setReplacing(f); replaceInput.current?.click(); }}>Replace</button>
                        {confirmRemove === f.id ? (
                          <>
                            <button className="danger" onClick={() => void removeFile(f)}>Remove for good</button>
                            <button className="ghost" onClick={() => setConfirmRemove(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="ghost" onClick={() => setConfirmRemove(f.id)}>Remove</button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {removedCount > 0 && (
          <p className="muted">{removedCount} removed file{removedCount === 1 ? " is" : "s are"} kept only as a note in past activity, marked unavailable, and never searched.</p>
        )}
      </section>

      {review && <SourcePreview s={review} onClose={() => setReview(null)} />}
    </>
  );
}
