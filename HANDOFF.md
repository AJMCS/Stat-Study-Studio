# Handoff: resume the comprehension-charts design loop

Written for the Claude session that picks this repo up in the cloud. Everything below is also in the repo; this is the
short path in.

## Where things stand (commit 1a62c9f, 2026-11-03)

- **Shipped on `main`:** course library through lecture 12 with recordings for lectures 2, 3, 5–10 (`course-library/`),
  a glossary that reads numbered definitions from the transcripts (`backend/studio/glossary.py`), Settings that pick
  an AI model from the account's own list, and the Progress page's comprehension charts.
- **In progress:** a design-loop review of those charts (piece F). Round 3 is built and committed but **its three
  critics have not run yet**. Start there.

## What the owner asked for (the brief for piece F)

One chart shell reused for every metric: the course score, a pathway's composite, and each of the four criteria
(core idea, depth, relevance, application) behind tabs. On open the line draws on from the left like the app's intro
animation. Per pathway: the composite chart; "Inspect criteria and attempts" closes it and reuses the same space for
criterion tabs (and the attempts table); each tab says whether that metric is improving or declining. Keep the code
small: one shell, data fed in, no sprawl. The owner works sequentially, reviews renders, and may send example charts
to add to the bar; until then the bar is Vercel Analytics (interaction, polish) and Observable Plot (mark discipline).

## The design loop, condensed (the skill may not be installed in the cloud)

The context that builds cannot fairly judge. Each round: build, render, then three critics in fresh contexts that see
only renders (never code), each giving a binary PASS/FAIL and the single biggest gap:

| Critic | Judges against | Model |
|---|---|---|
| Brief | the owner's ask above only; ignores aesthetics | sonnet |
| System | `design/design-system.md` only; mechanical adherence | haiku |
| Craft | the **Charts (piece F)** section of `design/bar.md` plus two blind pairs (ours vs a reference, labels stripped: say which is better craft) | strongest model available |

All three must pass; any fail goes back to the builder with the biggest gap. No fixed round count. Keep
`design/progress.md` updated (row for piece F plus a gap-history line per round). Round 1 and 2 verdicts and the
round 3 build notes are already there; read its "Resume here" section.

## Commands

```
# setup (Mac/Linux; Windows uses venv/Scripts/python.exe)
python -m venv venv && venv/bin/python -m pip install -r backend/requirements.txt
cd app && npm install

# tests
cd backend && ../venv/bin/python -m pytest -q          # 237 pass
cd app && npx vitest run                               # 109 pass
cd app && npm run build && node e2e/run.mjs            # real service + Chrome; prints "E2E passed"

# renders for the critics (gitignored; regenerate)
cd app && npm run build && node e2e/shots.mjs ../design/shots/charts-r8 --charts
node e2e/shoot-ref.mjs https://vercel.com/analytics ../design/reference/charts-vercel
node e2e/shoot-ref.mjs https://observablehq.com/plot/marks/line ../design/reference/charts-plot
```

`shots.mjs --charts` writes stills (`charts-section-*`, `charts-readout-*`, `charts-pathway-composite-*`,
`charts-pathway-criteria-*`) and quarter-speed filmstrips (`charts-draw-*-NNNNms`, `charts-crit-open-*-NNNNms`) for
dark/light and desktop/mobile. Blind pairs for Craft: our `charts-course-light-desktop.png` vs
`charts-vercel-desktop.png`, and `charts-plot-desktop.png` vs our `charts-section-light-desktop.png`, copied to
neutral names.

## Files that matter

- `app/src/components/ComprehensionCharts.tsx`: the shell (`MetricChart`) and the change bars (`TopicChangeChart`).
- `app/src/pages/Progress.tsx`: the section with filters, and `PathwayChart` (composite ↔ criterion tabs).
- `app/src/lib/scoring.ts`: `courseTimeline`, `topicChange` (pure, unit-tested).
- `app/src/styles.css`: search for "comprehension charts" and "draw-on".
- `app/e2e/shots.mjs`, `app/e2e/app.mjs` (the "progress:" step covers the charts).
- `design/bar.md` (Charts section), `design/design-system.md`, `design/progress.md`.

## Known open items (not blocking)

- The app's topic pages (`app/src/mock/topics.ts`) still cover lectures 1–7; lectures 8–12 are searchable, citable and
  in the glossary but have no tutorial/quiz content yet.
- The raw caption exports the recordings were made from are not in the repo (the recordings themselves are, under
  `course-library/lecture-transcripts/`); the lecture 4 export was empty.
- Pre-existing chrome the critics keep noting but which is not this work: the floating "AI · OFF" chip, the per-topic
  stat block sizes, the attempts table's layout on a phone.
- MAINTAIN.md is the owner's guide for adding course material; keep it in step if the library workflow changes.
