import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type PageInfo, type PersonalPageInfo } from "../lib/api";
import { PageView } from "../components/PageView";
import { PlainText } from "../components/PlainText";
import { docCode } from "../components/Citation";
import { AskPanel } from "../components/AskPanel";
import { Eyebrow, KeyTitle } from "../components/Hand";

type Loaded = { kind: "shared"; page: PageInfo } | { kind: "personal"; page: PersonalPageInfo };
type State = { status: "loading" } | { status: "ready"; doc: Loaded } | { status: "failed"; message: string };

/**
 * Any course document (?source=) or one of the learner's files (?file=), one page at a time as text with the
 * original beside it, and the guide to ask about the page. Every citation chip in the app can open here.
 */
export function Reader() {
  const [params, setParams] = useSearchParams();
  const source = params.get("source") ?? "";
  const fileId = params.get("file") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    const load: Promise<Loaded> = source
      ? api.page(source, page).then((p) => ({ kind: "shared" as const, page: p }))
      : fileId
        ? api.personalPage(fileId, page).then((p) => ({ kind: "personal" as const, page: p }))
        : Promise.reject(new Error("Nothing to read: choose a document in the Library."));
    load
      .then((doc) => live && setState({ status: "ready", doc }))
      .catch((e) => live && setState({ status: "failed", message: e instanceof Error ? e.message : "The page could not be loaded." }));
    return () => {
      live = false;
    };
  }, [source, fileId, page]);

  const goTo = (n: number) =>
    setParams((p) => {
      const q = new URLSearchParams(p);
      q.set("page", String(Math.max(1, n)));
      return q;
    });

  const doc = state.status === "ready" ? state.doc : null;
  const total = doc?.page.pages ?? 0;
  const title = doc ? (doc.kind === "shared" ? doc.page.title : doc.page.filename) : source ? docCode(source) : "Your file";
  const warning = doc?.page.warning;

  return (
    <>
      <p className="back"><Link to="/library">← Library</Link></p>
      <Eyebrow>Library · {source ? docCode(source) : "your file"} · page {page}{total ? ` of ${total}` : ""}</Eyebrow>
      <h1><KeyTitle text={title} /></h1>
      <div className="reader">
        <div className="reader-doc">
          <div className="row between pager">
            <button className="ghost" disabled={page <= 1} onClick={() => goTo(page - 1)}>Previous page</button>
            <label className="field page-field">
              <span>Page</span>
              <input type="number" min={1} max={total || undefined} value={page} aria-label="Page" onChange={(e) => goTo(Number(e.target.value) || 1)} />
            </label>
            <button className="ghost" disabled={!!total && page >= total} onClick={() => goTo(page + 1)}>Next page</button>
          </div>
          {state.status === "loading" && <p className="muted" role="status">Loading the page…</p>}
          {state.status === "failed" && <p className="notice warn-box" role="alert">{state.message}</p>}
          {warning && <p className="notice warn-box" role="alert">{warning}</p>}
          {doc && (
            <div className="page-text" tabIndex={0} aria-label="Text of the page">
              {doc.kind === "shared" || doc.page.method === "ai" ? <PageView text={doc.page.text} /> : <PlainText text={doc.page.text} />}
            </div>
          )}
          {doc?.kind === "shared" && /\.pdf$/i.test(source) && (
            <iframe key={`${source}-${page}`} className="pdf small" title={`${title}, page ${page}`} src={`/course-library/${source}#page=${page}&toolbar=0&navpanes=0&zoom=page-width`} />
          )}
          {doc?.kind === "personal" && doc.page.hasImage && <img className="page-image" alt={`Original page ${page} of ${doc.page.filename}`} src={`/api/files/${fileId}/pages/${page}/image`} />}
        </div>
        <AskPanel doc={{ source: source || undefined, fileId: fileId || undefined, title }} page={page} pages={total || undefined} />
      </div>
    </>
  );
}
