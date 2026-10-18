import { useRef, useState } from "react";
import { GENERAL_ID, uid, useStore } from "../lib/store";
import { ACCEPTED, parseUpload, removeIndexed, searchPersonal, storeFile } from "../lib/personal";
import { TOPICS } from "../mock/topics";
import { Citations } from "../components/Citation";
import type { PersonalFile, SourceRef } from "../types";

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);

export function Materials() {
  const { data, update } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState(GENERAL_ID);
  const [newName, setNewName] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [extra, setExtra] = useState<string[]>([]);
  const [results, setResults] = useState<{ shared: SourceRef[]; personal: SourceRef[]; searched: boolean; declined: string[] } | null>(null);
  const [consentFor, setConsentFor] = useState<{ ids: string[]; resolve: (ok: boolean) => void } | null>(null);
  const colName = Object.fromEntries(data.collections.map((c) => [c.id, c.name]));

  const addCollection = () => {
    const name = newName.trim();
    if (!name) return;
    if (data.collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) return setErrors([`A collection named "${name}" already exists.`]);
    update((d) => ({ ...d, collections: [...d.collections, { id: uid(), name, consent: false, searchByDefault: false }] }));
    setNewName("");
    setErrors([]);
  };

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    const errs: string[] = [];
    for (const file of Array.from(list)) {
      const parsed = await parseUpload(file);
      if (!parsed.ok) {
        errs.push(parsed.reason!); // Rejected files never enter the searchable collection.
        continue;
      }
      const old = replaceId ? data.files.find((f) => f.id === replaceId) : undefined;
      const rec: PersonalFile = {
        id: uid(),
        collectionId: old?.collectionId ?? target,
        filename: file.name,
        version: old ? old.version + 1 : 1,
        uploadedAt: new Date().toISOString(),
        pages: parsed.pages ?? 1,
        ocr: !!parsed.ocr,
        ocrConfidence: parsed.ocrConfidence,
        removed: false,
        supersedes: old?.id,
      };
      try {
        await storeFile(rec.id, file, parsed.chunks!);
      } catch {
        errs.push(`"${file.name}" could not be stored on this device (storage may be full or blocked).`);
        continue;
      }
      update((d) => ({ ...d, files: [...d.files, rec] }));
    }
    setErrors(errs);
    setReplaceId(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeFile = async (f: PersonalFile) => {
    await removeIndexed(f.id); // out of search; reference kept for history, marked unavailable
    update((d) => ({ ...d, files: d.files.map((x) => (x.id === f.id ? { ...x, removed: true } : x)) }));
  };

  const ask = (ids: string[]) => new Promise<boolean>((resolve) => setConsentFor({ ids, resolve }));

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    const qs = new Set(words(q));
    const shared = TOPICS.flatMap((t) => t.sources).filter((s) => words(s.excerpt + " " + s.title).some((w) => qs.has(w)));
    const allowed = new Set([GENERAL_ID, ...extra]);
    let personal = await searchPersonal(q, data.files, colName, allowed);
    const declined: string[] = [];
    // Hosted requests that use a personal collection need that collection's opt-in first.
    const needing = [...new Set(personal.map((p) => data.collections.find((c) => c.name === p.collection)!).filter((c) => c && !c.consent).map((c) => c.id))];
    if (needing.length) {
      const ok = await ask(needing);
      if (ok) update((d) => ({ ...d, collections: d.collections.map((c) => (needing.includes(c.id) ? { ...c, consent: true } : c)) }));
      else {
        declined.push(...needing.map((id) => colName[id]));
        personal = personal.filter((p) => !declined.includes(p.collection ?? ""));
      }
    }
    setResults({ shared, personal, searched: true, declined });
  };

  const live = data.files.filter((f) => !f.removed);
  const history = data.files.filter((f) => f.removed);
  const superseded = new Set(data.files.map((f) => f.supersedes).filter(Boolean));

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
          <button onClick={search}>Search</button>
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
            {results.declined.length > 0 && (
              <p className="notice">Skipped {results.declined.join(", ")} because hosted requests for that collection were not allowed.</p>
            )}
            {results.shared.length + results.personal.length === 0 ? (
              <Citations sources={[]} empty="No relevant sources were found. Nothing here is presented as source-grounded. Try different wording, or upload material that covers it." />
            ) : (
              <>
                {results.shared.length > 0 && results.personal.length > 0 && (
                  <p className="notice">Both shared course materials and your personal materials matched. If they disagree, the shared course materials take priority because they are the official class sources used for grading.</p>
                )}
                <Citations sources={[...results.shared, ...results.personal]} />
                <ul className="excerpts">
                  {[...results.shared, ...results.personal].map((s) => (
                    <li key={s.id}>{s.excerpt}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <section className="panel" aria-label="Upload">
        <h2>{replaceId ? "Upload replacement version" : "Upload to a personal collection"}</h2>
        <div className="row">
          <label className="field">
            <span>Collection</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={!!replaceId}>
              {data.collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Files ({ACCEPTED.join(" ")})</span>
            <input ref={fileInput} type="file" multiple={!replaceId} accept={ACCEPTED.join(",")} onChange={(e) => onFiles(e.target.files)} />
          </label>
        </div>
        {replaceId && <button className="ghost" onClick={() => setReplaceId(null)}>Cancel replacement</button>}
        {errors.map((e, i) => <p key={i} className="notice warn-box" role="alert">{e}</p>)}
        <div className="row">
          <label className="field grow">
            <span>New collection</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Homework 3" />
          </label>
          <button onClick={addCollection}>Create</button>
        </div>
      </section>

      <section aria-label="Your collections">
        <h2>Your collections</h2>
        {data.collections.map((c) => {
          const files = live.filter((f) => f.collectionId === c.id && !superseded.has(f.id));
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
                  <span>Allow hosted requests using this collection</span>
                </label>
              </div>
              {!c.consent && <p className="muted">Off: hosted requests using this collection are paused until you opt in.</p>}
              {files.length === 0 ? (
                <p className="muted">No files.</p>
              ) : (
                <ul className="list">
                  {files.map((f) => (
                    <li key={f.id} className="row between">
                      <span>
                        {f.filename} <span className="muted">v{f.version} · {new Date(f.uploadedAt).toLocaleDateString()}{f.ocr && " · OCR"}</span>
                        {f.linkBroken && <span className="chip flag">Link broken, excluded from search</span>}
                      </span>
                      <span className="row">
                        <button className="ghost" onClick={() => { setReplaceId(f.id); fileInput.current?.focus(); }}>Replace</button>
                        <button className="ghost" onClick={() => update((d) => ({ ...d, files: d.files.map((x) => (x.id === f.id ? { ...x, linkBroken: !x.linkBroken } : x)) }))}>
                          {f.linkBroken ? "Reconnect" : "Mark moved"}
                        </button>
                        <button className="ghost" onClick={() => removeFile(f)}>Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {history.length > 0 && (
          <p className="muted">{history.length} removed file{history.length === 1 ? "" : "s"} are kept only as references in past activity, marked unavailable, and are never searched.</p>
        )}
      </section>

      {consentFor && (
        <dialog
          className="modal"
          aria-labelledby="consent-title"
          ref={(el) => {
            if (el && !el.open) el.showModal();
          }}
        >
          <h3 id="consent-title">Send to a hosted model?</h3>
          <p>
            Answering this uses {consentFor.ids.map((id) => colName[id]).join(", ")}. Your original files and personal index stay on this device. Only the matching excerpts and your prompt are sent to a hosted model.
          </p>
          <p className="muted">We remember your choice for this collection. You can revoke it any time in collection settings.</p>
          <div className="row">
            <button onClick={() => { consentFor.resolve(true); setConsentFor(null); }}>Allow</button>
            <button className="ghost" onClick={() => { consentFor.resolve(false); setConsentFor(null); }}>Don't send</button>
          </div>
        </dialog>
      )}
    </>
  );
}
