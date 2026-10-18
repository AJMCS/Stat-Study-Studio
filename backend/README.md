# Backend

Local Python service for the STAT 132 study app: it stores each learner's data on their own computer, serves the
web app and the course PDFs, and (next) does search and the AI calls. This folder also holds the shared-library
ingestion and retrieval code.

## Setup (maintainers)

```
python -m venv venv
venv/Scripts/python.exe -m pip install -r backend/requirements.txt     # Windows
cd backend
../venv/Scripts/python.exe -m pytest                                   # 79 tests
```

## Running the service

```
cd backend
../venv/Scripts/python.exe -m studio.server            # opens http://127.0.0.1:8765
../venv/Scripts/python.exe -m studio.server --dev      # also accept the Vite dev server on :5173
```

It serves the built web app (`app/dist`), the course PDFs at `/course-library/`, and the API. It listens on
127.0.0.1 only. Learner data lives in one SQLite file, `studio.sqlite3`, in the OS app-data folder (on Windows
`%LOCALAPPDATA%\StatsStudio`); set `STUDIO_DATA_DIR` to use another folder.

| endpoint | purpose |
| --- | --- |
| `GET /api/health` | version and shared-library index info |
| `GET /api/search?q=...&k=5&collection=id` | `results` (shared library) and `personal` (uploads; General is always searched, `collection` adds named ones), each with a citation; each has a `highlight` that is verbatim text on its page, or `null` when no passage matches well |
| `GET /api/page?source=...&page=N` | the text of one cited page, for the preview (only documents in the library can be read) |
| `POST /api/uploads` | add a personal file (multipart: `file`, `collectionId`, optional `replaceId`); returns an upload id and works in the background |
| `GET /api/uploads/{id}` | progress (`page 3 of 12`), then the new file record and a report of pages that need a second look, or a reason it was rejected |
| `GET /api/files` | personal files, including removed ones (kept as records) |
| `DELETE /api/files/{id}` | remove a file: out of search, text and original deleted, record kept |
| `POST /api/files/{id}/reconnect` | restore a file whose original went missing (must be the same bytes) |
| `GET /api/files/{id}/original`, `/pages/{n}`, `/pages/{n}/image` | the original, the extracted text of a page, and a picture of the page |
| `GET /api/state` | everything the app needs on load, plus `initialized` |
| `PUT /api/state/{slice}` | replace one slice (`attempts`, `quizzes`, `exams`, `topicState`, `session`, `collections`, `files`, `config`, `hostedDisclosureAck`, `chats`) in one transaction |
| `POST /api/import` | one-time move of old browser-storage data (refuses to overwrite unless `?overwrite=true`) |
| `GET /api/export` | all data as a JSON download |
| `DELETE /api/data` | erase everything (the General collection is recreated) |

Data is validated on write, so a bad request is rejected with a readable message and never half-saved.

### Why a web page cannot reach it

Any site open in the learner's browser can try to call `localhost`. The service refuses requests whose `Host` is
not localhost (blocks DNS rebinding), refuses every state-changing request whose `Origin` is not the app itself,
and sends no CORS headers, so a foreign page cannot read responses either. The end-to-end test confirms a foreign
page can neither read nor delete study data.

## Personal uploads

Files are copied to `<data dir>/personal/<file id>/original.<ext>`; extracted text, pages and the search index live
in the same SQLite file. Nothing leaves the device.

- **Formats:** PDF (text or scanned, OCR per page), Word `.docx`, `.txt`, and images (PNG, JPG, TIFF, BMP, WebP).
  Legacy `.doc` is read only if LibreOffice happens to be installed; otherwise the learner is told to save as `.docx`
  or PDF. Limits: 200 MB per file, 400 PDF pages.
- **Rejected with a reason, never added or searchable:** wrong type, empty, damaged, password-protected, binary
  `.txt`, an exact duplicate, a name that already exists in the collection (use Replace), and anything with no
  readable text.
- **Warnings, not blocks:** pages read by OCR, with low confidence, or whose math may be missing symbols are flagged;
  the file is searchable immediately and the learner can "accept as is" or review the page.
- **Versions:** Replace creates version N+1 and the old version stops being searched. Its pages and original are
  kept so past activity can still show what it cited. Removing a file also deletes its older versions' data and
  leaves only a record marked removed.
- **Moved or missing originals** are excluded from search until reconnected (same bytes) or re-added.
- **Embeddings** are computed at upload when the model is available; otherwise chunks are keyword-searched and
  embedded later (`personal_chunks.embedding` is null until then).
- Personal results are never mixed into the shared index or returned as shared; shared results always come first.

## End-to-end tests

`cd app && npm run build && npm run e2e` starts the real service on a throwaway data folder and drives the web app
in Chrome, Edge or Chromium (set `BROWSER_PATH` if it is not found). It covers every learner flow, moving old
browser data into the service, surviving a browser-storage wipe, the service being down, a failed save, and the
foreign-page check.

## Updating the shared course library

1. Drop the new PDF into the right `course-library/` folder, following the naming in `course-library/README.md`.
2. Transcribe it. Hand transcripts (page-aligned Markdown with LaTeX, symbols checked against the page image) go in
   `course-library/transcripts/<same path>.md`. Anything without a hand transcript gets an automatic one:
   `python -m studio.ingest transcribe-missing`
3. Rebuild the index: `python -m studio.ingest build-index`
4. `pytest` fails if a PDF has no transcript, a transcript points at a missing PDF, or the index is stale.
5. Rebuild the update manifest: `python -m studio.ingest build-manifest` (lists every file with its sha256; the test
   `test_the_committed_manifest_matches_the_library_files` fails when it is stale).
6. Commit the transcripts, `course-library/index/` and `course-library/library.json`, and push to `main`.

### How students get it

On start (and from Course materials > Check for updates) the app reads `library.json` from
`https://raw.githubusercontent.com/<repo>/<ref>/course-library/` (repo and ref are in `studio/channel.json`).
A changed `version` means an update: only changed files are downloaded, each is checked against its sha256, the new
library is test-loaded, and only then is it switched in (`<data>/library/v<N>/`, pointer file `CURRENT`, two versions
kept). Any failure leaves the current library untouched. Offline, the check just reports that it could not reach the
internet. Overrides for testing: `STUDIO_UPDATE_BASE`, `STUDIO_AUTOCHECK=0`.

## Windows package

`python packaging/build_windows.py` (needs the venv with `pyinstaller`, and Node) builds
`packaging/dist/StatsStudio/` and `StatsStudio-windows.zip` (about 640 MB unpacked, 425 MB zipped): the program, the
web app, the course library and the search model, so it needs no Python and no internet. Entry point:
`studio/launcher.py` (opens the browser, reuses an already-running copy, moves to the next port if 8765 is busy).
`StatsStudio.exe --selftest` checks that the search model, PDF reader and text recognition load. The build replaces
PyInstaller's bundled Visual C++ runtime with the current one, because onnxruntime crashes on the older copy.
Run the browser tests against the package with `STUDIO_EXE=<path to StatsStudio.exe> npm run e2e`.

Transcript `kind` (frontmatter) decides how a file is used: `lecture`, `problem-set`, `worked-solutions`,
`reading` and `prerequisite` are searchable. `answer-key` files (the quiz reviews) are never returned by search, so
answers cannot leak before a learner submits; they are used only to grade.

## What the index is

`course-library/index/` holds `chunks.jsonl` (text, page, source, kind, extraction quality), `embeddings.npy`
(float16, 384 dimensions) and `index.json` (model, counts, per-transcript hashes). It is about 0.5 MB. A search is
brute force over a few hundred chunks, so there is no vector database. Search is BM25 plus embeddings combined by
reciprocal rank fusion. Lecture notes are preferred over readings (x0.90) and STAT 131 prerequisites (x0.85): any
stronger and background questions never surface a prerequisite page. Tables of contents are not indexed, and
`answer-key` files are never searchable.

If the embedding model has not been downloaded yet (first run with no internet), search falls back to keyword
matching and says so (`mode: "keyword"`); it downloads the model in the background when it can.

### Citations and highlights

A highlight is only ever a stretch of plain text with no math, bold or list markup inside it (`studio/highlight.py`),
chosen by how many of the question's terms it contains. The preview renders the page's transcript and marks that
passage; if it cannot be found on the rendered page, no highlight is shown. The app's own authored citations are
checked the same way by `app/src/mock/topics.test.ts`.

## Decisions and the evidence for them

Run `eval/retrieval_eval.py` and `eval/ocr_eval.py` to reproduce these.

**Embedding model** (41 questions with known source pages, searched over the full 260-chunk index):

| method | recall@1 | recall@3 | recall@5 |
| --- | --- | --- | --- |
| BM25 only | 0.54 | 0.85 | 0.88 |
| all-MiniLM-L6-v2 (about 90 MB) | 0.71 | 0.88 | 0.95 |
| all-MiniLM-L6-v2 + BM25 | 0.73 | 0.90 | 0.93 |
| bge-small-en-v1.5 + BM25 | 0.66 | 0.90 | 0.93 |
| snowflake-arctic-embed-xs + BM25 | 0.59 | 0.83 | 0.98 |
| **shipped: MiniLM + BM25 + source weights** | **0.83** | **0.88** | **0.95** |

The bake-off set is small, so differences of a few points between models are within noise. MiniLM was kept because
it is the smallest and fastest. Known misses: "what is the standard error" and queries written as formulas.

**OCR engine** (RapidOCR 3.x, ONNX, about 32 MB, CPU only, 1 to 2 seconds per page):

| page | word recall | notes |
| --- | --- | --- |
| lecture page, clean print | 0.94 | Greek letters read correctly |
| same page, phone-photo quality | 0.96 | 22 of 28 Greek symbols kept |
| quiz page | 0.90 | |
| handwritten work | about 0 | not usable; flag it |

OCR reads letters, not math layout: fractions, sums and subscripts come out scrambled. Pages whose text layer is
corrupted (LaTeX PDFs whose symbols decode wrongly) are OCR'd and flagged "math may be missing or out of order".

## Layout

```
studio/chunking.py    transcript parsing, chunking, junk filter
studio/textnorm.py    LaTeX to plain words for BM25 and embeddings
studio/extract.py     PDF text layer, OCR fallback, per-page confidence and warnings
studio/ingest.py      maintainer CLI: transcribe-missing, build-index
studio/retrieval.py   SharedIndex.search()
studio/pages.py       page text and titles for citation previews
studio/highlight.py   picks the verbatim passage to highlight
studio/app.py         FastAPI app, localhost protection, static files
studio/db.py          SQLite storage (one transaction per slice)
studio/models.py      validation models, camelCase on the wire
studio/server.py      `python -m studio.server`
eval/                 retrieval and OCR bake-offs
tests/                79 tests (library, retrieval, search, API, security, personal uploads)
```
