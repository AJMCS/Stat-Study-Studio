"""OCR check for personal uploads: how well does a lightweight, pip-installable engine read course pages?

Compares RapidOCR output against our verified transcripts on clean, degraded and handwritten pages.

Run from the repo root:  venv/Scripts/python.exe backend/eval/ocr_eval.py
"""

from __future__ import annotations

import io
import re
import sys
import time
from pathlib import Path

import numpy as np
import pymupdf
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from studio.chunking import load_transcript, parse_frontmatter, split_pages  # noqa: E402
from studio.config import LIBRARY  # noqa: E402
from studio.textnorm import latex_to_text  # noqa: E402

GREEK = set("θλμσαβγπδΣ")


def page_image(pdf: str, page: int, dpi: int) -> Image.Image:
    doc = pymupdf.open(LIBRARY / pdf)
    pix = doc[page - 1].get_pixmap(dpi=dpi)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def degrade(img: Image.Image) -> Image.Image:
    """Roughly a phone photo: lower resolution, blur, slight rotation, JPEG artifacts."""
    img = img.resize((img.width * 2 // 3, img.height * 2 // 3))
    img = img.filter(ImageFilter.GaussianBlur(1.1)).rotate(1.5, expand=True, fillcolor=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=45)
    return Image.open(buf).convert("RGB")


def truth_text(transcript: str, page: int) -> str:
    raw = (LIBRARY / "transcripts" / transcript).read_text(encoding="utf-8")
    _, body = parse_frontmatter(raw)
    return dict(split_pages(body))[page]


def words(s: str) -> list[str]:
    return [w for w in re.findall(r"[a-z]{4,}", latex_to_text(s).lower())]


def main():
    from rapidocr import RapidOCR

    engine = RapidOCR()
    cases = [
        ("lecture 3 p2, clean print 150 dpi", "lecture-notes/lecture-03-the-posterior-distribution.pdf", 2, 150, False, "lecture-notes/lecture-03-the-posterior-distribution.md"),
        ("lecture 3 p2, phone-photo quality", "lecture-notes/lecture-03-the-posterior-distribution.pdf", 2, 150, True, "lecture-notes/lecture-03-the-posterior-distribution.md"),
        ("lecture 7 p2, clean print 150 dpi", "lecture-notes/lecture-07-sampling-distributions.pdf", 2, 150, False, "lecture-notes/lecture-07-sampling-distributions.md"),
        ("quiz 2 p1, sans-serif 150 dpi", "quizzes/quiz-02-bayesian-estimation.pdf", 1, 150, False, "quizzes/quiz-02-bayesian-estimation.md"),
        ("disc 3 annotated p4, handwriting", "discussion-sections/disc-03-annotated.pdf", 4, 150, False, "discussion-sections/disc-03-annotated.md"),
        ("disc 1 annotated p1, handwriting + print", "discussion-sections/disc-01-annotated.pdf", 1, 150, False, "discussion-sections/disc-01.md"),
    ]
    print(f"{'case':44s} {'word recall':>11s} {'noise':>6s} {'conf':>5s} {'sec':>5s}  greek kept")
    for name, pdf, page, dpi, bad, transcript in cases:
        img = page_image(pdf, page, dpi)
        if bad:
            img = degrade(img)
        t0 = time.time()
        res = engine(np.array(img))
        sec = time.time() - t0
        txts = list(res.txts or [])
        scores = list(res.scores or [])
        ocr = " ".join(txts)
        truth = truth_text(transcript, page if "annotated" not in pdf else 1)
        tw = set(words(truth))
        ow = words(ocr)
        recall = len(tw & set(ow)) / max(1, len(tw))
        noise = sum(1 for w in ow if w not in tw) / max(1, len(ow))
        conf = float(np.mean(scores)) if scores else 0.0
        g_truth = sum(1 for c in truth if c in GREEK or c == "\\")  # rough: LaTeX-backslash density
        g_ocr = sum(1 for c in ocr if c in GREEK)
        truth_greek = len(re.findall(r"\\(theta|lambda|mu|sigma|alpha|beta|pi)", truth))
        print(f"{name:44s} {recall:11.2f} {noise:6.2f} {conf:5.2f} {sec:5.1f}  {g_ocr}/{truth_greek} greek symbols read")
        if name.startswith("lecture 3 p2, phone"):
            print("   sample OCR:", ocr[:260].encode("ascii", "backslashreplace").decode())


if __name__ == "__main__":
    main()
