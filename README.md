# Stats 132 Study Studio

A study app for STAT 132 (Bayesian estimation, maximum likelihood and sampling distributions). It runs on each
student's own computer: a small local service stores their progress and uploaded notes on their device, and a web app
in their browser does the studying. It works with no AI model and no internet; an AI service can be added later.

## What works without an AI service

- **Tutorials** grounded in the lecture notes, with worked examples: try it first, then reveal the solution.
- **Quizzes** (graded or low-stakes practice) and **exams** with written solutions. Multiple choice is marked
  automatically. For written answers you compare with a reference solution and score yourself; those attempts are
  labeled *self-scored* and can be hidden from progress.
- **Search with citations** across the shared course library and your own uploads (PDF, Word, text, scans and photos with OCR),
  with a verbatim highlight and the original page.
- **Progress, streaks and history** kept on the device, exportable and deletable.
- The conversational tutor, automatic rubric scoring and better handwriting transcription need an AI service and say so.

## Layout

| folder | what is in it |
| --- | --- |
| `app/` | the web app (React + Vite + TypeScript), with browser end-to-end tests in `app/e2e/` |
| `backend/` | the local Python service: storage, search, uploads, ingestion tools (see `backend/README.md`) |
| `course-library/` | the shared course materials, hand-checked transcripts and the prebuilt search index (see its README) |

## Run it (development)

```
python -m venv venv
venv/Scripts/python.exe -m pip install -r backend/requirements.txt        # Windows; use venv/bin/python elsewhere
cd app && npm install && npm run build
cd ../backend && ../venv/Scripts/python.exe -m studio.server              # opens http://127.0.0.1:8765
```

## Make the Windows download

```
venv/Scripts/python.exe -m pip install pyinstaller
venv/Scripts/python.exe packaging/build_windows.py     # -> packaging/dist/StatsStudio-windows.zip
```

## Test it

```
cd backend && ../venv/Scripts/python.exe -m pytest      # service, search, uploads, security
cd app && npx vitest run                                # scoring and content checks (every citation is verified)
cd app && npm run build && npm run e2e                  # drives the real app in a browser
```

## Status

Milestone 1 (everything above) is built, including course-material updates and the Windows package (`packaging/`).
Milestone 2 is built: connect your own Google Gemini key in Settings for the adaptive tutor, four-criterion scoring of
written answers, and exam questions written around a focus, or your own Anthropic or OpenAI API key, or a model running on your own computer through Ollama (all optional; the app is
complete without them).
Milestone 3 adds Mac and Linux builds, Anthropic/OpenAI, and optional AI transcription of uploads.
