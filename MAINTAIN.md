# Maintaining Stats 132 Study Studio

Written for the person who owns the shared course library and publishes the download. Commands assume Windows and
the repo root as the working directory; on Mac/Linux use `venv/bin/python` instead of `venv/Scripts/python.exe`.

## One-time setup

```
python -m venv venv
venv/Scripts/python.exe -m pip install -r backend/requirements.txt pyinstaller
cd app && npm install && cd ..
```

Push the repo to GitHub on branch `main` (`AJMCS/Stat-Study-Studio`, set in `backend/studio/channel.json`).
**Course updates only reach students once `course-library/` is on `main`**, and the repo has to be public
(students' apps read it from raw.githubusercontent.com). `docs/` is gitignored on purpose and stays local.

## Checklist: new course material arrives (lecture, homework, discussion, reading)

1. **Add the PDF** under `course-library/` in the right folder, named as in `course-library/README.md`
   (e.g. `homework/homework-03.pdf`). Quiz reviews are `answer-key` material: searchable never, used only for grading.
2. **Transcribe it.**
   - Best quality: a hand transcript at `course-library/transcripts/<same path>.md` (page-aligned Markdown with
     LaTeX, `<!-- page N -->` markers, frontmatter `source`, `method`, `pages`, `kind`). Check Greek letters and
     symbols against the page image; LaTeX-made PDFs often have scrambled text layers.
   - Quick path: `venv/Scripts/python.exe -m studio.ingest transcribe-missing` (run in `backend/`) writes automatic
     transcripts and OCRs pages with scrambled symbols; those are flagged `text-layer-corrupted` in the app.
3. **Rebuild the search index:** `python -m studio.ingest build-index` (in `backend/`).
4. **Rebuild the update manifest:** `python -m studio.ingest build-manifest`. This bumps `course-library/library.json`
   (file list with sha256 and a `version` number). Students are offered an update only when `version` goes up.
5. **Run the tests** (below). They fail if a PDF has no transcript, a transcript points at a missing PDF, the index is
   stale, or the manifest is stale.
6. **Topics and citations** (if the material changes what is taught): edit `app/src/mock/topics.ts` and
   `app/src/mock/learning.ts`. Citation highlights must be a verbatim run of plain text on the cited page;
   `npx vitest run` checks every one.
7. **Commit and push to `main`.** Announce in Discord; students click "Check for updates" (the app also checks
   itself on start).

Still missing from the library: Quiz 1, annotated lecture notes (video-only), Discussion 4 annotations, Homework 3.

## Before every release

```
cd backend && ../venv/Scripts/python.exe -m pytest        # expect all pass (168 at last count)
cd ../app && npx vitest run                               # expect all pass (41)
cd app && npm run build && npm run e2e                    # real service + real browser, prints "E2E passed"
```

The e2e needs Chrome or Edge (set `BROWSER_PATH` otherwise).

## AI features (Gemini)

The AI features are tested against a fake Gemini server, never the real one, so **before a release, try them once with
a real key** (make a free one at aistudio.google.com/apikey):

1. Settings > connect the key. Check it says "Connected" and that **Test connection** works.
2. Topic page > **Try a recall** > **Score with AI**: you should see four scores with comments.
3. Tutor: have a short conversation; it should reach a plan, cite a lecture page, and save a session.
4. Exam > "Written for me by your AI service" > it should show AI-written questions with sources.
5. Disconnect. (Windows: the key is in Credential Manager under "StatsStudio" until you do.)
5b. Course materials > upload a photo of handwritten notes (or a scanned page with math) > **Improve with AI**. Check that
   the dialog asks you to agree, the page is transcribed with sensible LaTeX, and **Use automatic reading** undoes it.
   Page images are the biggest thing sent anywhere, so try this with one short file first.
6. Repeat 1 to 5 with a real Anthropic key and a real OpenAI key if you have them (each needs a little API credit).
   Check that the model it picked on its own (shown in Settings) is a sensible, current one. These two pick the newest
   model matching `PREFERRED` in `backend/studio/ai/anthropic.py` / `openai_provider.py`; if Anthropic or OpenAI
   rename their models and the picked one is wrong, adjust those patterns.
7. With Ollama installed and a model pulled (for example `ollama pull llama3.2`): Settings > Ollama > pick the model >
   connect, then repeat steps 2 to 4. Small models sometimes return malformed JSON or odd scores; if that is common
   with the model you tried, say so in the README for classmates (a larger model scores better, a smaller one is faster).

If a step fails with "bad response", look at what Google returned (`studio/ai/gemini.py`); Google changes model
behavior and names. The default model is the alias `gemini-flash-latest`; if it ever stops working, students can
type another model name in Settings, and you can change `DEFAULT_MODEL` in `backend/studio/ai/gemini.py`.

Things you own here:
- **The data notice** (`NOTICE` in `backend/studio/ai/service.py`) says Google's free tier may use submitted content
  to improve its products. If Google's terms change, edit it and bump `CONSENT_VERSION`; everyone is asked again.
- **Costs:** none to you. Each student's usage is on their own Google key and free allowance; a student who hits the
  limit sees "used up its free allowance" and can self-score instead.
- **Anthropic / OpenAI** keys are paid per use on the student's own account. There is no "log in with Claude/ChatGPT":
  Anthropic forbids it and OpenAI's sign-in is a partner programme. If you ever want it, read OpenAI's current
  developer docs first.
- **Ollama** needs nothing from you. The app only talks to Ollama on the same computer.
- **Prompts** live in `backend/studio/ai/tasks.py` (rubric, tutor, exam). Change them there and run the tests.
- Google's free tier may not be available in every country (check ai.google.dev terms if a classmate abroad can't
  connect).

## Building the downloads (Windows, Mac, Linux)

On your Windows machine:

```
venv/Scripts/python.exe packaging/build.py                # ~2 minutes
venv/Scripts/python.exe packaging/smoke_test.py           # starts the built app and checks it end to end
cd app && STUDIO_EXE="<full path>/packaging/dist/StatsStudio/StatsStudio.exe" npm run e2e    # the full browser tests
```

Output: `packaging/dist/StatsStudio-windows.zip` (~425 MB). Run it from a normal folder (not while your shell sits inside
`packaging/dist`; the build deletes it).

**Mac and Linux are built by GitHub, not by you.** PyInstaller cannot cross-compile. Go to GitHub > Actions > "Build
packages" > Run workflow (or push a tag like `v0.1.0`, which also publishes everything on the repo's Releases page).
It builds on four machines (Windows, Mac with Apple chips, Mac with Intel chips, Ubuntu), runs `smoke_test.py` on each
(self-test, app page, semantic search with a citation, local-only protection), and attaches the downloads:
`StatsStudio-windows.zip`, `StatsStudio-macos-arm64.zip`, `StatsStudio-macos-x86_64.zip`,
`StatsStudio-linux-x86_64.tar.gz`. If one machine's job is red, that platform's build is not shipping-ready; the log
shows which self-test line or smoke check failed.

**The Mac and Linux builds have never run on a real Mac or Linux machine** (they were written on Windows). Before
telling classmates they work, get one person on each to download from Releases, follow `README-FIRST.txt`, and do a
topic tutorial plus a search. Known things to expect: macOS refuses the download at first, either as "unidentified
developer" or as "Python.framework is damaged" (both are Gatekeeper's quarantine flag on an unsigned app, not a broken
build; the starter `.command` clears the flag from the folder once it has been opened via right-click > Open, and
README-FIRST explains it; you can avoid it only by paying Apple for signing and notarization); some Linux desktops need
`libgl1` installed and may not offer "Run in terminal" on double-click. The runner labels (`macos-latest`,
`macos-15-intel`, `ubuntu-24.04`) are GitHub's and change: if a job never starts, check their runner list. Intel Macs
are on a runner GitHub plans to retire in 2027; after that Intel Mac students can run from source.

**The package contains a snapshot of the course library.** Students who already have the app get new material through
updates; only brand-new students need a fresh zip, so rebuild it occasionally (not after every lecture).
A new copy of the app program itself (code changes) has no auto-update: students must download the new zip.
Their saved progress lives in `%LOCALAPPDATA%\StatsStudio` (Windows), `~/Library/Application Support/StatsStudio` (Mac)
or `~/.local/share/StatsStudio` (Linux) and survives replacing the folder.

Things that have bitten before:
- Old Visual C++ runtime DLLs in the bundle crash onnxruntime. The build script replaces them; if `--selftest`
  segfaults after a Python/PyInstaller upgrade, look there first.
- New Python dependencies may need adding to the `collect_all` list in `packaging/studio.spec`.
- Windows only: the Visual C++ runtime fix is in `build.py` (it is skipped on Mac and Linux).
- Unsigned exe: Windows shows SmartScreen ("More info" > "Run anyway"). Code signing costs money; skip unless
  complaints pile up. Zipped copies can also trigger antivirus false positives; sending a link rather than an
  attachment helps.

## Resources and what they cost you

| Thing | Where | Notes |
|---|---|---|
| Course library | `course-library/` in the repo | Public. Everything in it is visible to anyone; do not add answer keys you wouldn't want public. |
| Update channel | GitHub `main` + `channel.json` | Free. If the repo is renamed or goes private, update `channel.json` and release a new zip, or students' checks fail (they fail gracefully). |
| Search model | bundled (all-MiniLM-L6-v2, ~90 MB) | Source builds download it on first run to a cache. Changing the model means rebuilding the index and the manifest; the updater refuses a library built with a different model. |
| Hosted AI | each student's own Gemini key | No cost to you. Keys are stored only on the student's computer (OS credential store). |
| Student data | `%LOCALAPPDATA%\StatsStudio` | Never uploaded. Students can export/delete in Settings. |

## When something breaks

- **"Can't reach the study service"** in the browser: the black window was closed. Restart the exe.
- **Update check fails**: the repo is not pushed or not public, `library.json` is missing on `main`, or a file's hash
  does not match (you edited a file and forgot `build-manifest`). Students keep their current library either way.
- **Search says nothing relevant for something that should match**: add it to `backend/eval/queries.json` and look at
  how the query ranks (`backend/README.md` has the evaluation notes). Known weak spots: queries written as formulas.
- **Reset a test install**: delete `%LOCALAPPDATA%\StatsStudio` (progress, uploads, downloaded updates).
- Tests use `STUDIO_AUTOCHECK=0` so they never touch the network; set `STUDIO_UPDATE_BASE` to point the app at a
  local test server.

## End of semester

Nothing needs to stay running; there is no server. Leaving the repo up keeps updates available. Archive or make it
private whenever you like (students' existing installs keep working offline).
