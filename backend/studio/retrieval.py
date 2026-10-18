"""Hybrid retrieval over the shared course library index (BM25 + small CPU embeddings).

The index is a few hundred chunks, so everything lives in memory and a search is brute force: instant,
no vector database server. Lecture notes are the primary source (the tutorials are anchored in them), so
supplementary material is down-weighted rather than excluded.
"""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi

from .config import INDEX_DIR, SEARCHABLE_KINDS
from .textnorm import latex_to_text, tokenize

# How strongly each kind of source is preferred when results are otherwise close.
KIND_WEIGHT = {
    "lecture": 1.0,
    "worked-solutions": 1.0,
    "problem-set": 0.95,
    "reading": 0.90,
    "prerequisite": 0.85,
}
RRF_K = 60

log = logging.getLogger(__name__)


@dataclass
class Hit:
    id: str
    source: str
    page: int
    heading: str
    kind: str
    method: str
    text: str
    score: float
    quality: dict = field(default_factory=dict)

    @property
    def low_confidence(self) -> bool:
        flags = self.quality.get("flags", [])
        return bool(flags) or self.quality.get("confidence", 1.0) < 0.8

    def as_dict(self) -> dict:
        return {
            "id": self.id,
            "scope": "shared",
            "source": self.source,
            "page": self.page,
            "heading": self.heading,
            "kind": self.kind,
            "text": self.text,
            "score": round(self.score, 5),
            "verified": self.method.startswith("manual"),
            "lowConfidence": self.low_confidence,
        }


class SharedIndex:
    """`mode` is "semantic" when the embedding model is loaded and "keyword" when it is not (for example on first
    run without internet, before the model has been downloaded). Keyword search keeps working either way."""

    def __init__(self, index_dir: Path = INDEX_DIR, cache_dir: Path | None = None):
        self.cache_dir = cache_dir
        self.mode = "semantic"
        self._loading = False
        self._lock = threading.Lock()
        meta = json.loads((index_dir / "index.json").read_text(encoding="utf-8"))
        self.meta = meta
        self.rows = [json.loads(line) for line in (index_dir / "chunks.jsonl").read_text(encoding="utf-8").splitlines()]
        self.emb = np.load(index_dir / "embeddings.npy").astype(np.float32)
        if len(self.rows) != len(self.emb):
            raise ValueError("index is inconsistent: chunk and embedding counts differ; rebuild it")
        self._bm25 = BM25Okapi([tokenize(f"{r['heading']}. {r['text']}") for r in self.rows])
        self._model = None

    # ------------------------------------------------------------------ embedding
    def _load_model(self, local_only: bool):
        from fastembed import TextEmbedding

        kwargs = {"model_name": self.meta["embedding_model"], "local_files_only": local_only}
        if self.cache_dir:
            kwargs["cache_dir"] = str(self.cache_dir)
        return TextEmbedding(**kwargs)

    def _download_in_background(self) -> None:
        def work():
            try:
                model = self._load_model(local_only=False)
                with self._lock:
                    self._model = model
                log.info("Embedding model downloaded; semantic search is on.")
            except Exception as e:  # offline, blocked, disk full: keep using keyword search
                log.info("Embedding model unavailable (%s); using keyword search.", e)
            finally:
                self._loading = False

        self._loading = True
        threading.Thread(target=work, daemon=True).start()

    def _ensure_model(self):
        with self._lock:
            if self._model is not None:
                return self._model
            if self._loading:
                return None
            try:
                self._model = self._load_model(local_only=True)
                return self._model
            except Exception:
                pass
        self._download_in_background()
        return None

    def _embed_query(self, query: str) -> np.ndarray | None:
        model = self._ensure_model()
        if model is None:
            return None
        v = np.array(list(model.query_embed([latex_to_text(query)])))[0].astype(np.float32)
        return v / np.linalg.norm(v)

    # ------------------------------------------------------------------ search
    def search(
        self,
        query: str,
        k: int = 5,
        kinds: set[str] | None = None,
        sources: set[str] | None = None,
    ) -> list[Hit]:
        """Return the top k chunks. `kinds` and `sources` restrict what can be returned."""
        query = query.strip()
        if not query:
            return []
        allowed = [
            i
            for i, r in enumerate(self.rows)
            if r["kind"] in (kinds or SEARCHABLE_KINDS) and (sources is None or r["source"] in sources)
        ]
        if not allowed:
            return []
        idx = np.array(allowed)
        qv = self._embed_query(query)
        self.mode = "semantic" if qv is not None else "keyword"
        dense = self.emb[idx] @ qv if qv is not None else np.zeros(len(idx))
        bm = np.asarray(self._bm25.get_scores(tokenize(query)))[idx]

        fused = np.zeros(len(idx))
        for scores in ((dense, bm) if qv is not None else (bm,)):
            order = np.argsort(-scores)
            for rank, pos in enumerate(order):
                fused[pos] += 1.0 / (RRF_K + rank + 1)
        # A chunk with no lexical overlap and a weak embedding match is not a real hit.
        relevant = (bm > 0) | (dense > 0.35)
        weights = np.array([KIND_WEIGHT.get(self.rows[i]["kind"], 0.8) for i in idx])
        final = fused * weights * relevant

        out: list[Hit] = []
        for pos in np.argsort(-final)[:k]:
            if final[pos] <= 0:
                break
            r = self.rows[int(idx[pos])]
            out.append(
                Hit(
                    id=r["id"],
                    source=r["source"],
                    page=r["page"],
                    heading=r.get("heading", ""),
                    kind=r["kind"],
                    method=r.get("method", ""),
                    text=r["text"],
                    score=float(final[pos]),
                    quality=r.get("quality", {}),
                )
            )
        return out
