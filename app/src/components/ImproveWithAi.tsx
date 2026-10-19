import { useEffect, useRef, useState } from "react";
import { api, ServiceRejected, type ImproveInfo, type UploadJob } from "../lib/api";
import type { PersonalFile } from "../types";

type Scope = "flagged" | "all";

/**
 * "Improve this upload with AI". Unlike every other AI feature this sends page IMAGES, so it asks for a separate,
 * explicit yes every single time (the checkbox always starts unticked) and says exactly how many pages go where.
 */
export function ImproveWithAi({ file, onClose, onDone, onReview }: { file: PersonalFile; onClose: () => void; onDone: () => void; onReview: (page: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [scope, setScope] = useState<Scope>("flagged");
  const [info, setInfo] = useState<ImproveInfo | null>(null);
  const [all, setAll] = useState<ImproveInfo | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<UploadJob | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    ref.current?.showModal?.();
    Promise.all([api.improveInfo(file.id, "flagged"), api.improveInfo(file.id, "all")])
      .then(([flagged, every]) => {
        if (!alive.current) return;
        setAll(every);
        setInfo(flagged);
        if (flagged.count === 0) setScope("all");
      })
      .catch((e) => alive.current && setError(e instanceof ServiceRejected ? e.message : "Couldn't reach the study service."));
    return () => {
      alive.current = false;
    };
  }, [file.id]);

  const chosen = scope === "flagged" ? info : all;
  const working = job && (job.status === "queued" || job.status === "processing");

  const start = async () => {
    setError("");
    try {
      let j = await api.improveFile(file.id, true, scope);
      setJob(j);
      while (alive.current && (j.status === "queued" || j.status === "processing")) {
        await new Promise((r) => setTimeout(r, 500));
        j = await api.uploadStatus(j.uploadId);
        setJob(j);
      }
      onDone();
    } catch (e) {
      setError(e instanceof ServiceRejected ? e.message : "Couldn't reach the study service.");
    }
  };

  const finished = job && (job.status === "ready" || job.status === "failed");
  const report = job?.report
    ? { improved: [] as number[], failed: [] as number[], unclear: {} as Record<string, string[]>, stopped: null as string | null, skipped: 0, ...job.report }
    : null;

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby="improve-title">
      <h2 id="improve-title">Improve “{file.filename}” with AI</h2>
      {error && <p className="notice warn-box" role="alert">{error}</p>}

      {!info || !all ? (
        !error && <p className="muted">Checking the file…</p>
      ) : !info.connected ? (
        <p className="notice warn-box">Connect an AI service in Settings first.</p>
      ) : finished ? (
        <>
          {job.status === "failed" ? (
            <p className="notice warn-box" role="alert">{job.error}</p>
          ) : (
            <p role="status">
              Improved {report?.improved.length ?? 0} page{report?.improved.length === 1 ? "" : "s"} ({report?.improved.join(", ")}). They are searchable now, marked <i>AI-read</i>, and
              you can go back to the automatic reading any time.
            </p>
          )}
          {report && report.failed.length > 0 && <p className="notice" role="status">Couldn't read page{report.failed.length === 1 ? "" : "s"} {report.failed.join(", ")}; the automatic reading was kept.</p>}
          {report?.stopped && <p className="notice warn-box" role="status">Stopped early: {report.stopped}</p>}
          {report && report.skipped > 0 && <p className="muted">{report.skipped} more page{report.skipped === 1 ? " was" : "s were"} not sent because one run is limited to {info.limit} pages. Run it again for the rest.</p>}
          {report && Object.keys(report.unclear).length > 0 && (
            <details>
              <summary>Parts the AI was unsure about</summary>
              <ul>{Object.entries(report.unclear).map(([p, items]) => <li key={p}>Page {p}: {items.join("; ")}</li>)}</ul>
            </details>
          )}
          <div className="row">
            {report && report.improved.length > 0 && <button className="ghost" onClick={() => { ref.current?.close(); onReview(report.improved[0]); }}>Check page {report.improved[0]}</button>}
            <button onClick={() => ref.current?.close()}>Done</button>
          </div>
        </>
      ) : working ? (
        <>
          <p role="status">Reading page {Math.min((job?.progress ?? 0) + 1, job?.total ?? 1)} of {job?.total}…</p>
          <progress value={job?.progress} max={job?.total} aria-label="Improving" />
        </>
      ) : (
        <>
          <p>
            This sends <strong>a picture of each page</strong> to {info.local ? "the model on this computer" : <strong>{info.providerName}</strong>} so it can read handwriting and math more accurately than the automatic reading.
          </p>
          {info.local ? (
            <p className="muted">Nothing leaves this computer. Your model needs to be one that can read images, or the result may be poor.</p>
          ) : (
            <p className="notice warn-box">
              Other AI features send only text. This sends the page images themselves, so everything visible on those pages goes to {info.providerName}, including anything personal.
              The notice you accepted in Settings covers text only, so please check {info.providerName}'s data terms. Each page is one request on your own account.
            </p>
          )}
          <fieldset>
            <legend>Which pages?</legend>
            <label className="choice">
              <input type="radio" name="scope" disabled={info.count === 0} checked={scope === "flagged"} onChange={() => setScope("flagged")} />
              <span>Only pages that look hard to read ({info.count})</span>
            </label>
            <label className="choice">
              <input type="radio" name="scope" checked={scope === "all"} onChange={() => setScope("all")} />
              <span>All pages ({all.count})</span>
            </label>
          </fieldset>
          {chosen && chosen.count > chosen.limit && <p className="muted">One run sends at most {chosen.limit} pages, so the first {chosen.limit} will be sent. You can run it again for the rest.</p>}
          <label className="choice">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I understand, and I want to send {chosen?.willSend ?? 0} page picture{chosen?.willSend === 1 ? "" : "s"} to {info.local ? "my local model" : info.providerName} this time.</span>
          </label>
          <div className="row">
            <button disabled={!agree || !chosen || chosen.willSend === 0} onClick={() => void start()}>Send {chosen?.willSend ?? 0} page{chosen?.willSend === 1 ? "" : "s"} and improve</button>
            <button className="ghost" onClick={() => ref.current?.close()}>Cancel</button>
          </div>
        </>
      )}
      {!finished && !working && info && !info.connected && <button className="ghost" onClick={() => ref.current?.close()}>Close</button>}
    </dialog>
  );
}
