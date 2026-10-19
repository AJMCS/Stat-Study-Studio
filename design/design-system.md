# Stats Study Studio: design system

Source: the maintainer's Timescale-derived style reference ("engineering blueprint on warm graph paper"), adapted into
a study notebook: the same hard-edged, near-monochrome system, plus a hand-lettered annotation layer. **Dark mode is
the default**; light mode is the reference palette. This file is what the System critic checks against.

## 1. Colour

Two chromatic colours only. Everything else is achromatic.

| Role | Light | Dark (default) | Use |
|---|---|---|---|
| Canvas | `#fafafa` paper white | `#121212` | page background, with the grid texture (§6) |
| Surface | `#fafafa` | `#1a1a1a` | cards, dialogs, inputs |
| Ink | `#000000` | `#f2f0eb` (chalk) | primary text, structural borders, filled buttons |
| Ink on fill | `#fafafa` | `#121212` | text on a filled (ink) button |
| Muted | `#6c6c6c` steel | `#a3a3a3` | secondary text, helper copy, axis labels |
| Faint | `#b3b3b3` ash | `#5a5a5a` | placeholders, disabled, light dividers, grid lines (at low opacity) |
| Hard shadow | `#000000` | `#4a4a4a` solid, with a `#3a3a3a` 1px rim (see §5) | offset shadow |
| **Signal orange** | `#ff5b29` | `#ff6a3d` | **voice**: one key word in a heading, large stat numerals, the active path/node in a diagram, decorative strokes. Never a button fill, never body text, never a link colour. |
| **Chartreuse** | `#f5ff80` | `#f5ff80` (text on it is always `#000`) | **highlighter**: a marker stroke behind a word or phrase, the announcement/notice wash, a featured chip. Never a button fill. |
| Danger | ink text + underline + `!` | ink text + underline + `!` | destructive actions and errors are worded, not coloured (amended after round 4: a red/orange danger tone read as the orange voice) |

**Orange as text (amended after round 1):** `#ff5b29` on the light canvas is 2.97:1, under the 3:1 needed even for
large text. So in light mode, orange *text* (heading key word, stat numerals, θ mark) uses `#e0461a` (about 4:1 on
`#fafafa`), while orange *strokes* (underlines, diagram paths, nodes) keep `#ff5b29`. Light mode must still show its
orange voice; dropping it to black is not allowed. Orange text is only ever 24px or larger.

**Stat block placement (amended after round 1):** big orange mono numerals belong only in a stat block (Progress
summary, results). Elsewhere (page headers, library counts) counts are small mono captions, so they never compete
with the page title. A stat block has **one** orange numeral (the headline stat); its other numerals are ink mono at
the same size. Per-topic numbers (cards, tables) are ink mono at body or heading size, never a third style.

**Orange marks "where you are" (clarified after round 3):** in diagrams, completed or structural lines and hub rings
are ink/muted; orange is only the single current route (from the start to the current node) or, if that is long,
only the branch into the current node. A viewport's orange budget is: one heading key word (+ its underline) and one
diagram route.

Rules: at most one orange element group and one chartreuse highlight per screen region; no gradients, glass, or
blurred glows; no third hue (success is shown with ink + a check mark, not green).

## 2. Typography

| Family | Role |
|---|---|
| **Geist** (sans) | interface voice: body, buttons, nav, headings |
| **Geist Mono** | every number that is data (scores, page numbers, counts, timers, versions), eyebrow labels (UPPERCASE, `// LABEL`), code, keyboard hints |
| **Caveat** (hand) | annotation layer only: hand-lettered display words, margin notes, diagram labels, callouts with arrows. Never body copy, buttons, form labels, or math. |
| KaTeX | all mathematics, unchanged |

Scale (px / line-height): caption 14/20 · body 16/24 · subheading 18/25 · heading-sm 20/28 · heading 24/33 ·
heading-lg 40-52/1.1 · display 64-80/1.1. Weights: 400 body, 600 headings, 700 display. Tracking: -0.03em at 40px+,
-0.02em at 18-24px, normal below. Hand-lettered text is set ~1.35x the size it replaces (Caveat runs small).
One block uses one family; don't mix within a run.

## 3. Spacing and layout

8px base: 8, 16, 24, 32, 40, 56, 80, 120. Page max width 1200px (reading content 760px). Section gap 40-56px. Card
padding 16-24px. Element gap 16px. Mobile: 16px side gutter, no horizontal scroll.

## 4. Shape

Radius vocabulary is exactly three values: **4px** small buttons/inputs, **12px** cards/dialogs, **9999px** pills
(primary buttons, tags, chips, nodes). Nothing else.

## 5. Elevation

- Elevated card / dialog: 1px ink border + **hard offset shadow `5px 5px 0 0`** (light: `#000`; dark: `#000` with the
  card's 1px border in `#3a3a3a`... the card rim stays visible against the dark canvas).
- **Dark mode (amended after round 2):** a pure-black offset shadow vanishes on the `#121212` canvas, so in dark mode
  the hard offset shadow is solid `#4a4a4a` (still `5px 5px 0 0`, no blur; raised from `#3a3a3a` after round 6,
  which read soft), with the card surface `#1f1f1f` and a 1px
  `#3a3a3a`-or-lighter rim.
- **Messages (clarified after round 2):** there is no dashed-box component. Empty states are plain muted text (with
  an optional hand-lettered note and an action button); warnings are the §7 warning (1px ink border + `!`); notable
  notices are the §7 chartreuse notice. Native form controls (file picker, select, checkbox, radio) are styled into
  the system (4px inputs/selects with a drawn chevron, pill file button, square 4px checkbox in ink).
- **One raised element per screen (amended after round 10, refined after round 11):** only the screen's single focal
  card/panel is a card (1px border + hard offset shadow). Every other grouping is NOT a bordered box: it is an open
  section on the canvas separated by spacing and, where needed, a single hairline rule above it. No bordered box
  without a shadow, so no sibling card ever looks half-styled. Inputs use a 1px muted border
  (`#6c6c6c` light / `#a3a3a3` dark, at least 3:1 against the canvas) that turns ink on focus, so content outweighs
  chrome. Links have one treatment app-wide: ink text with a 1px underline at 3px offset.
- Floating tooltip/menu: `0 3px 4px rgba(0,0,0,.6)`.
- Flat rows (lists, settings rows): no shadow, hairline dividers only.

## 6. Texture and drawing

- Canvas carries a graph-paper texture: 1px dots or lines every 20-24px at 5-7% ink opacity. Cards are plain.
- Diagrams (learning path, topic map, logo animation) use the node-and-curve language: circles with a 1px ring,
  connected by 1px curves; the active/current path is orange, everything else ink/muted.
- Hand-drawn accents: slightly irregular underlines, circles and arrows (SVG with a small wobble), chartreuse marker
  strokes behind words. Accents point at something; they are never pure decoration.

## 7. Components

- **Primary button:** ink fill, ink-on-fill text, Geist 16/600, pill, 10px x 20px. Hover: translate(-1px,-1px) + 2px
  hard shadow. **Secondary:** transparent, 1.5px ink border, pill. **Small/ghost:** 4px radius, no fill.
- **Input:** surface fill, 1px ink border, 4px radius, 12px padding; focus = 2px solid ink outline (no glow).
- **Tag/chip:** pill, 1px ink border, Geist Mono 12-13px UPPERCASE 500, 4px x 10px.
- **Eyebrow:** Geist Mono 13px UPPERCASE, `// ` prefix, muted.
- **Stat block:** Geist Mono 40-50px 700 in orange, Geist Mono 13px UPPERCASE label beneath.
- **Notice:** chartreuse wash, black text, 4px radius, no border (only for genuinely notable messages); warnings use
  a 1px ink border + `!` marker rather than colour.
- **Nav:** flat top bar, canvas background, 1px bottom hairline, θ mark left, few links, theme toggle and Settings at
  the right edge.

## 8. Motion

Only meaningful motion: strokes draw on, things converge in one direction, nothing under 200ms for UI or 400ms for
the intro. Respect `prefers-reduced-motion` (show end states). Theme switch recolours everything, including the
animation, via CSS variables.
