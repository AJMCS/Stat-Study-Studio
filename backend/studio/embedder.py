"""The small CPU embedding model, shared by search of the course library and of personal uploads.

The model is about 90 MB. It is loaded from the local cache when possible. If it is not there yet (first run,
no internet) `ensure()` returns None and callers fall back to keyword search, while a background thread tries to
download it. Nothing here ever blocks a request waiting for the network.
"""

from __future__ import annotations

import logging
import threading
from pathlib import Path

import numpy as np

from .textnorm import latex_to_text

log = logging.getLogger(__name__)

DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class Embedder:
    def __init__(self, model_name: str = DEFAULT_MODEL, cache_dir: Path | None = None):
        self.model_name = model_name
        self.cache_dir = cache_dir
        self._model = None
        self._loading = False
        self._lock = threading.Lock()

    def _load(self, local_only: bool):
        from fastembed import TextEmbedding

        kwargs = {"model_name": self.model_name, "local_files_only": local_only}
        if self.cache_dir:
            kwargs["cache_dir"] = str(self.cache_dir)
        return TextEmbedding(**kwargs)

    def _download_in_background(self) -> None:
        def work():
            try:
                model = self._load(local_only=False)
                with self._lock:
                    self._model = model
                log.info("Embedding model downloaded; semantic search is on.")
            except Exception as e:  # offline, blocked, disk full: keep using keyword search
                log.info("Embedding model unavailable (%s); using keyword search.", e)
            finally:
                self._loading = False

        self._loading = True
        threading.Thread(target=work, daemon=True).start()

    def ensure(self):
        """The loaded model, or None if it is not available right now."""
        with self._lock:
            if self._model is not None:
                return self._model
            if self._loading:
                return None
            try:
                self._model = self._load(local_only=True)
                return self._model
            except Exception:
                pass
        self._download_in_background()
        return None

    @property
    def available(self) -> bool:
        return self._model is not None

    def embed_query(self, text: str) -> np.ndarray | None:
        model = self.ensure()
        if model is None:
            return None
        v = np.array(list(model.query_embed([latex_to_text(text)])))[0].astype(np.float32)
        return v / np.linalg.norm(v)

    def embed_passages(self, texts: list[str]) -> np.ndarray | None:
        model = self.ensure()
        if model is None or not texts:
            return None
        v = np.array(list(model.embed([latex_to_text(t) for t in texts])), dtype=np.float32)
        return v / np.linalg.norm(v, axis=1, keepdims=True)
