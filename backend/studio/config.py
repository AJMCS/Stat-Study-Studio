from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LIBRARY = REPO_ROOT / "course-library"
TRANSCRIPTS = LIBRARY / "transcripts"
INDEX_DIR = LIBRARY / "index"

# Kinds of transcript, set in each transcript's frontmatter.
#  lecture, problem-set, worked-solutions, reading, prerequisite: searchable
#  answer-key: question + answer together, never shown by general search
SEARCHABLE_KINDS = {"lecture", "problem-set", "worked-solutions", "reading", "prerequisite"}
