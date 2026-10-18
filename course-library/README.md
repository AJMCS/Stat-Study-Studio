# Shared course library

Official STAT 132 materials. Changes land only through pull requests. Personal uploads never go here.

## Layout and naming

Lowercase, hyphenated, zero-padded numbers, so files sort in course order.

| Folder | Pattern | Contents |
| --- | --- | --- |
| `lecture-notes/` | `lecture-NN-<title>.pdf` | Professor's lecture notes (the grounding source for tutorials) |
| `discussion-sections/` | `disc-NN.pdf`, `disc-NN-annotated.pdf` | Problem sets and worked/annotated versions |
| `quizzes/` | `quiz-NN-<title>.pdf` | Quiz question sets with answers |
| `readings/` | `reading-chNN-<title>.pdf` | Course reading, numbered by chapter |
| `prerequisites-stat131/` | `notes-NN-<title>.pdf` | STAT 131 background, for revisiting prerequisites |

`manifest.json` maps each topic to its files. Add or rename a file and update the manifest in the same PR. `relatedDiscussion` links are approximate hints: discussion problems often span lectures.
