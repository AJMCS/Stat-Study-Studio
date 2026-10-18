"""SQLite storage for learner data. One file in the user's app-data folder; nothing leaves the device.

The front end owns the shape of its state, so the API reads and replaces whole slices (attempts, quizzes, ...).
Each slice replace is one transaction, and list order is preserved with a position column.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from pydantic import TypeAdapter

from .models import (
    ALL_SLICES,
    FLAG_SLICES,
    FREE_SLICES,
    GENERAL_ID,
    LIST_SLICES,
    MAP_SLICES,
    VALUE_SLICES,
    Attempt,
    Collection,
    Record,
)

SCHEMA_VERSION = 2

SCHEMA_V1 = """
CREATE TABLE attempts (
  position INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, topic_id TEXT NOT NULL, at TEXT NOT NULL,
  kind TEXT NOT NULL, counted INTEGER NOT NULL, composite REAL NOT NULL, criteria TEXT NOT NULL,
  note TEXT, self_scored INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX attempts_topic ON attempts (topic_id, at);
CREATE TABLE quizzes (position INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, topic_id TEXT NOT NULL, at TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE exams   (position INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, topic_id TEXT NOT NULL, at TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE topic_state (topic_id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE collections (
  position INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  consent INTEGER NOT NULL, search_by_default INTEGER NOT NULL
);
CREATE TABLE files (
  position INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, collection_id TEXT NOT NULL, filename TEXT NOT NULL,
  version INTEGER NOT NULL, uploaded_at TEXT NOT NULL, pages INTEGER NOT NULL, ocr INTEGER NOT NULL,
  ocr_confidence REAL, removed INTEGER NOT NULL, supersedes TEXT, link_broken INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"""

# v2: personal uploads are parsed and indexed by the service.
SCHEMA_V2 = """
ALTER TABLE files ADD COLUMN sha256 TEXT NOT NULL DEFAULT '';
ALTER TABLE files ADD COLUMN size INTEGER NOT NULL DEFAULT 0;
ALTER TABLE files ADD COLUMN ext TEXT NOT NULL DEFAULT '';
ALTER TABLE files ADD COLUMN flagged_pages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE files ADD COLUMN low_confidence INTEGER NOT NULL DEFAULT 0;
CREATE TABLE personal_pages (
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE, page INTEGER NOT NULL, text TEXT NOT NULL,
  method TEXT NOT NULL, confidence REAL NOT NULL, flags TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (file_id, page)
);
CREATE TABLE personal_chunks (
  id TEXT PRIMARY KEY, file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE, page INTEGER NOT NULL,
  ordinal INTEGER NOT NULL, heading TEXT NOT NULL, text TEXT NOT NULL, embedding BLOB
);
CREATE INDEX personal_chunks_file ON personal_chunks (file_id);
"""

_statements = lambda sql: [x for x in (s.strip() for s in sql.split(";")) if x]  # noqa: E731

_adapters = {name: TypeAdapter(list[model]) for name, model in LIST_SLICES.items()}


class Database:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")
        self._migrate()

    # ------------------------------------------------------------------ plumbing
    def _migrate(self) -> None:
        version = self._conn.execute("PRAGMA user_version").fetchone()[0]
        if version < SCHEMA_VERSION:
            with self._tx():
                if version == 0:
                    for stmt in _statements(SCHEMA_V1):
                        self._conn.execute(stmt)
                    self._seed_general()
                if version < 2:
                    for stmt in _statements(SCHEMA_V2):
                        self._conn.execute(stmt)
                self._conn.execute(f"PRAGMA user_version={SCHEMA_VERSION}")
        elif version > SCHEMA_VERSION:
            raise RuntimeError(f"{self.path} was written by a newer version of the app (schema {version}).")

    @contextmanager
    def _tx(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            self._conn.execute("BEGIN IMMEDIATE")
            try:
                yield self._conn
            except BaseException:
                self._conn.execute("ROLLBACK")
                raise
            else:
                self._conn.execute("COMMIT")

    def read(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._conn.execute(sql, params).fetchall()

    def transaction(self):
        """`with db.transaction() as conn:` runs several statements atomically."""
        return self._tx()

    def close(self) -> None:
        with self._lock:
            self._conn.close()

    def _seed_general(self) -> None:
        self._conn.execute(
            "INSERT OR IGNORE INTO collections (position, id, name, consent, search_by_default) VALUES (0, ?, 'General', 0, 1)",
            (GENERAL_ID,),
        )

    def _setting(self, key: str, default: Any = None) -> Any:
        row = self._conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
        return json.loads(row["value"]) if row else default

    def _set_setting(self, conn: sqlite3.Connection, key: str, value: Any) -> None:
        conn.execute("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value)))

    # ------------------------------------------------------------------ read
    def initialized(self) -> bool:
        with self._lock:
            return bool(self._setting("initialized", False))

    def get_state(self) -> dict[str, Any]:
        with self._lock:
            c = self._conn
            q = lambda sql: c.execute(sql).fetchall()  # noqa: E731
            attempts = [
                {
                    "id": r["id"], "topicId": r["topic_id"], "at": r["at"], "kind": r["kind"], "counted": bool(r["counted"]),
                    "composite": r["composite"], "criteria": json.loads(r["criteria"]),
                    **({"note": r["note"]} if r["note"] is not None else {}),
                    **({"selfScored": True} if r["self_scored"] else {}),
                }
                for r in q("SELECT * FROM attempts ORDER BY position")
            ]
            collections = [
                {"id": r["id"], "name": r["name"], "consent": bool(r["consent"]), "searchByDefault": bool(r["search_by_default"])}
                for r in q("SELECT * FROM collections ORDER BY position")
            ]
            files = [
                {
                    "id": r["id"], "collectionId": r["collection_id"], "filename": r["filename"], "version": r["version"],
                    "uploadedAt": r["uploaded_at"], "pages": r["pages"], "ocr": bool(r["ocr"]), "removed": bool(r["removed"]),
                    "size": r["size"], "flaggedPages": r["flagged_pages"], "lowConfidence": bool(r["low_confidence"]),
                    **({"ocrConfidence": r["ocr_confidence"]} if r["ocr_confidence"] is not None else {}),
                    **({"supersedes": r["supersedes"]} if r["supersedes"] else {}),
                    **({"linkBroken": True} if r["link_broken"] else {}),
                }
                for r in q("SELECT * FROM files ORDER BY position")
            ]
            return {
                "attempts": attempts,
                "quizzes": [json.loads(r["data"]) for r in q("SELECT data FROM quizzes ORDER BY position")],
                "exams": [json.loads(r["data"]) for r in q("SELECT data FROM exams ORDER BY position")],
                "topicState": {r["topic_id"]: json.loads(r["data"]) for r in q("SELECT * FROM topic_state")},
                "session": self._setting("session"),
                "collections": collections,
                "files": files,
                "config": self._setting("config"),
                "hostedDisclosureAck": self._setting("hostedDisclosureAck", False),
                "chats": self._setting("chats", {}),
            }

    # ------------------------------------------------------------------ write
    def put_slice(self, name: str, value: Any) -> None:
        if name not in ALL_SLICES:
            raise KeyError(name)
        with self._tx() as c:
            self._write_slice(c, name, value)
            self._set_setting(c, "initialized", True)

    def _write_slice(self, c: sqlite3.Connection, name: str, value: Any) -> None:
        if name in LIST_SLICES:
            items = _adapters[name].validate_python(value)
            getattr(self, f"_write_{name}")(c, items)
        elif name in MAP_SLICES:
            model = MAP_SLICES[name]
            c.execute("DELETE FROM topic_state")
            for topic_id, raw in (value or {}).items():
                c.execute("INSERT INTO topic_state (topic_id, data) VALUES (?, ?)", (topic_id, json.dumps(model.model_validate(raw).dump())))
        elif name in VALUE_SLICES:
            if value is None:
                c.execute("DELETE FROM settings WHERE key=?", (name,))
            else:
                self._set_setting(c, name, VALUE_SLICES[name].model_validate(value).dump())
        elif name in FLAG_SLICES:
            if not isinstance(value, bool):
                raise ValueError(f"{name} must be true or false")
            self._set_setting(c, name, value)
        else:  # free-form
            if not isinstance(value, dict):
                raise ValueError(f"{name} must be an object")
            self._set_setting(c, name, value)

    @staticmethod
    def _write_attempts(c: sqlite3.Connection, items: list[Attempt]) -> None:
        c.execute("DELETE FROM attempts")
        c.executemany(
            "INSERT INTO attempts (position, id, topic_id, at, kind, counted, composite, criteria, note, self_scored) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [
                (i, a.id, a.topic_id, a.at, a.kind, int(a.counted), a.composite, json.dumps(a.criteria.dump()), a.note, int(a.self_scored))
                for i, a in enumerate(items)
            ],
        )

    @staticmethod
    def _write_records(c: sqlite3.Connection, table: str, items: list[Record]) -> None:
        c.execute(f"DELETE FROM {table}")
        c.executemany(
            f"INSERT INTO {table} (position, id, topic_id, at, data) VALUES (?,?,?,?,?)",
            [(i, r.id, r.topicId, r.at, json.dumps(r.model_dump())) for i, r in enumerate(items)],
        )

    def _write_quizzes(self, c: sqlite3.Connection, items: list[Record]) -> None:
        self._write_records(c, "quizzes", items)

    def _write_exams(self, c: sqlite3.Connection, items: list[Record]) -> None:
        self._write_records(c, "exams", items)

    @staticmethod
    def _write_collections(c: sqlite3.Connection, items: list[Collection]) -> None:
        general = next((x for x in items if x.id == GENERAL_ID), None)
        if general is None or general.name != "General":
            raise ValueError("The General collection cannot be removed or renamed")
        c.execute("DELETE FROM collections")
        c.executemany(
            "INSERT INTO collections (position, id, name, consent, search_by_default) VALUES (?,?,?,?,?)",
            [(i, x.id, x.name, int(x.consent), int(x.search_by_default)) for i, x in enumerate(items)],
        )

    def import_state(self, state: dict[str, Any]) -> None:
        """Replace everything from a full state object (migration from browser storage, or a restored export)."""
        unknown = set(state) - ALL_SLICES
        if unknown:
            raise ValueError(f"unknown fields: {sorted(unknown)}")
        with self._tx() as c:
            self._wipe_tables(c)
            for name, value in state.items():
                if name in {"config", "session"} and value is None:
                    continue
                self._write_slice(c, name, value)
            self._seed_general()
            self._set_setting(c, "initialized", True)

    def _wipe_tables(self, c: sqlite3.Connection) -> None:
        for table in ("attempts", "quizzes", "exams", "topic_state", "collections", "personal_chunks", "personal_pages", "files", "settings"):
            c.execute(f"DELETE FROM {table}")

    def wipe(self) -> None:
        with self._tx() as c:
            self._wipe_tables(c)
            self._seed_general()
