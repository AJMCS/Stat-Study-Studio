# The bar

References: `reference/timescale-*.png` (overall structure and hard-edged system), `reference/handdrawn-1-node-diagram.png`
(diagram language), `reference/handdrawn-2-lettered-charts.png` and `reference/handdrawn-3-marker-network.png`
(hand-lettered, marker-annotated feel). Each line is checkable by looking at a screenshot or a frame.

1. **Near-monochrome with surgical colour.** On any screen, every coloured pixel is either signal orange or
   chartreuse; orange appears in at most two places per viewport (e.g. one heading word + the active diagram path),
   chartreuse at most once (a marker stroke or notice). Buttons are ink-filled or outlined, never coloured.
2. **Headline dominates; few sizes.** The page title is the largest text in the viewport and at least 2.5x body size,
   and the interface text uses no more than four distinct sizes per viewport. Excluded from the count, like math:
   the hand-lettered annotation layer (a different face whose apparent size cannot match a sans size exactly) and
   embedded third-party documents such as a PDF. Long reading text sits in a column no wider than ~760px.
   *(Clarified after round 8: the original wording counted the annotation layer, which line 3 requires on every
   screen, so the two lines contradicted each other.)*
3. **Three voices, never mixed.** Hand lettering appears on every main screen (a display word, a margin note, or a
   diagram label) but never in body text, buttons or form labels; every data number (score, page, count, time) is
   monospace; everything else is the clean sans. *(Clarified in piece D: the design system's `// EYEBROW` labels and the
   13px uppercase label under a stat block are also monospace by rule, and are not a violation; other status words are. Extended in
   piece D round 9: the design system's chips (§7, pill + mono uppercase), including the ✓/! option-marker chips, are monospace by the
   same rule.)*
4. **Hard edges.** Elevated things (cards, dialogs) have a 1px border and a solid, unblurred offset shadow; there are
   no gradients, blurs or glows anywhere, and corner radii come only from {4px, 12px, pill}.
5. **Graph paper, generous air.** The canvas shows a faint, regular grid texture; above the fold of the home screen at
   least 40% of the area is empty canvas; sections are separated by visibly larger gaps than elements within them.
6. **Structure is drawn as diagrams.** Paths and progress (the learning journey, where you are) are drawn as ringed
   nodes joined by thin curves, with the current path in orange, the way reference 1 draws flow. Annotations point at
   things with hand-drawn arrows or underlines, like reference 3.
7. **Motion draws, then rests.** In the intro, lines draw on from one end and every movement resolves in a single
   direction (toward Studio, rightward); no element moves for less than 400ms; the sequence finishes in under 7 seconds
   on a still θ mark plus two buttons, and frames sampled in dark and light mode use each mode's own ink and canvas.

**Scope (owner, 2026-10-19, during piece D round 10):** the app targets desktop/laptop only for now; a phone layout is a later
version. Critics judge the desktop captures (1440x900 and full-page) only; the 390px captures are rendered but not judged, and a
mobile-only flaw never fails a round.

## Charts (piece F)

References: `reference/charts-vercel-desktop.png` (one hairline series across the fold, one anchored readout card,
faint vertical grid), `reference/charts-plot-desktop.png` (tick-only axes, muted mono ticks, the line is the only
ink-weight object). Each line is checkable in a screenshot or a filmstrip frame.

1. **The series is the only heavy object.** The line is 1.5–2px ink; gridlines are hairlines at no more than ~10% ink;
   there is no axis box, only tick labels in muted mono (11–12px) and, at most, one baseline. Nothing else on the plot
   is as dark as the line except its end marker.
2. **One accent, on the present.** Orange appears once per chart: the current point (and its value). Every other mark
   and every label is ink or muted; no text is ever in the series colour.
3. **Labels are rare and anchored.** On the plot only the current value, the high and the low are labelled, each
   sitting clear of the line and the axis band. One readout at a time, anchored to its point, value first (bold mono),
   then what it is, then when.
4. **Draw-on from the left at one speed.** On open the line enters at its left end and travels to the right, finishing
   in 700–900ms with an ease-out; markers, labels and the wash appear only once the line has reached them, never
   before, and nothing pops in afterwards. With reduced motion the end state is shown at once.
5. **One frame, many series.** The composite and each criterion share one chart space with the same frame, 0–100
   scale, ticks, cutoff line and height, so switching changes only the line; the frame does not move or resize.
6. **Controls are one row, in the label voice.** Tabs and filters sit in a single row above the plot, in mono
   uppercase like the eyebrows; the active tab is marked with ink (fill or underline), not with colour.
7. **Rhythm.** Caption, plot and hint are spaced on the 8px grid; the plot is between one third and one half as tall
   as it is wide; no type under 11px; on a phone the chart fills the gutter width and its readout stays inside it.

