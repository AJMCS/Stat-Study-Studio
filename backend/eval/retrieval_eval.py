"""Bake-off: BM25 vs small CPU embedding models vs hybrid, on the transcribed shared library.

Run from the repo root:  venv/Scripts/python.exe backend/eval/retrieval_eval.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from studio.chunking import load_all  # noqa: E402
from studio.config import LIBRARY  # noqa: E402
from studio.textnorm import latex_to_text, tokenize  # noqa: E402

MODELS = [
    "sentence-transformers/all-MiniLM-L6-v2",
    "BAAI/bge-small-en-v1.5",
    "snowflake/snowflake-arctic-embed-xs",
]
TOP = 5


def rrf(rankings: list[list[int]], k: int = 60) -> list[int]:
    score: dict[int, float] = {}
    for ranking in rankings:
        for r, idx in enumerate(ranking):
            score[idx] = score.get(idx, 0.0) + 1.0 / (k + r + 1)
    return sorted(score, key=score.get, reverse=True)


def metrics(order_fn, queries, chunks):
    hit1 = hit3 = hit5 = 0
    rr = 0.0
    misses = []
    for item in queries:
        gold = {(g[0], g[1]) for g in item["gold"]}
        order = order_fn(item["q"])[:TOP]
        got = [(Path(chunks[i].source).stem, chunks[i].page) for i in order]
        rank = next((r for r, g in enumerate(got) if g in gold), None)
        if rank is not None:
            rr += 1.0 / (rank + 1)
            hit1 += rank < 1
            hit3 += rank < 3
            hit5 += rank < 5
        else:
            misses.append((item["q"], got[:3]))
    n = len(queries)
    return {"recall@1": hit1 / n, "recall@3": hit3 / n, "recall@5": hit5 / n, "mrr": rr / n}, misses


def production_eval(queries):
    """The retrieval module the app actually uses: hybrid + source-tier weighting."""
    from studio.retrieval import SharedIndex

    idx = SharedIndex()
    hit1 = hit3 = hit5 = 0
    rr = 0.0
    misses = []
    for item in queries:
        gold = {(g[0], g[1]) for g in item["gold"]}
        got = [(Path(h.source).stem, h.page) for h in idx.search(item["q"], k=TOP)]
        rank = next((r for r, g in enumerate(got) if g in gold), None)
        if rank is None:
            misses.append((item["q"], got[:3]))
            continue
        rr += 1.0 / (rank + 1)
        hit1 += rank < 1
        hit3 += rank < 3
        hit5 += rank < 5
    n = len(queries)
    return {"recall@1": hit1 / n, "recall@3": hit3 / n, "recall@5": hit5 / n, "mrr": rr / n}, misses


def main():
    chunks = load_all(LIBRARY)
    queries = json.loads((Path(__file__).parent / "queries.json").read_text(encoding="utf-8"))
    print(f"{len(chunks)} searchable chunks from {len({c.source for c in chunks})} documents; {len(queries)} queries\n")

    docs_text = [latex_to_text(f"{c.heading}. {c.text}") for c in chunks]
    bm25 = BM25Okapi([tokenize(t) for t in docs_text])

    def bm25_order(q):
        s = bm25.get_scores(tokenize(q))
        return list(np.argsort(-s))

    rows = {}
    m, miss = metrics(bm25_order, queries, chunks)
    rows["BM25 only"] = m
    print("misses for BM25 only:")
    for q, got in miss:
        print("  ", q, "->", got)

    from fastembed import TextEmbedding

    for name in MODELS:
        t0 = time.time()
        model = TextEmbedding(model_name=name)
        load = time.time() - t0
        t0 = time.time()
        emb = np.array(list(model.embed(docs_text)))
        enc = time.time() - t0
        emb /= np.linalg.norm(emb, axis=1, keepdims=True)

        def dense_order(q, model=model, emb=emb):
            qv = np.array(list(model.query_embed([latex_to_text(q)])))[0]
            qv /= np.linalg.norm(qv)
            return list(np.argsort(-(emb @ qv)))

        def hybrid_order(q, dense_order=dense_order):
            return rrf([dense_order(q), bm25_order(q)])

        for label, fn in ((name.split("/")[-1], dense_order), (name.split("/")[-1] + " + BM25", hybrid_order)):
            m, _ = metrics(fn, queries, chunks)
            rows[label] = m
        info = f"dim={emb.shape[1]} load={load:.1f}s encode={enc:.1f}s for {len(chunks)} chunks"
        print(f"\n{name}: {info}")

    m, miss = production_eval(queries)
    rows["PRODUCTION (MiniLM + BM25 + source weights)"] = m
    print("\nproduction misses:")
    for q, got in miss:
        print("  ", q, "->", got)

    print(f"\n{'method':50s} r@1   r@3   r@5   mrr")
    for label, m in rows.items():
        print(f"{label:50s} {m['recall@1']:.2f}  {m['recall@3']:.2f}  {m['recall@5']:.2f}  {m['mrr']:.3f}")


if __name__ == "__main__":
    main()
