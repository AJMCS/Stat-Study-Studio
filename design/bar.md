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
