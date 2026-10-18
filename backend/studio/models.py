"""Request and storage models. Field names are camelCase on the wire to match the front end's types."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Criterion = Literal["core", "depth", "relevance", "application"]
Score = Field(ge=0, le=100)


class Wire(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")

    def dump(self) -> dict:
        return self.model_dump(by_alias=True, exclude_none=True)


class Criteria(Wire):
    core: float = Score
    depth: float = Score
    relevance: float = Score
    application: float = Score


class Weights(Wire):
    core: float = Field(ge=0)
    depth: float = Field(ge=0)
    relevance: float = Field(ge=0)
    application: float = Field(ge=0)


class Attempt(Wire):
    id: str
    topic_id: str
    at: str
    kind: Literal["tutor", "quiz", "exam", "recall"]
    counted: bool
    composite: float = Score
    criteria: Criteria
    note: str | None = None
    self_scored: bool = False


class RecallEntry(Wire):
    at: str
    composite: float
    qualified: bool


class TopicState(Wire):
    streak: int = Field(ge=0)
    flagged: bool
    misses: int = Field(ge=0)
    warn_criteria: list[Criterion]
    recall_history: list[RecallEntry]
    strengths: list[str]
    gaps: list[str]


class Session(Wire):
    topic_id: str
    activity: Literal["tutor", "tutorial", "quiz", "exam"]
    at: str


class Collection(Wire):
    id: str
    name: str = Field(min_length=1, max_length=80)
    consent: bool
    search_by_default: bool


class PersonalFile(Wire):
    id: str
    collection_id: str
    filename: str
    version: int = Field(ge=1)
    uploaded_at: str
    pages: int = Field(ge=0)
    ocr: bool
    ocr_confidence: float | None = None
    removed: bool
    supersedes: str | None = None
    link_broken: bool = False


class ScoringConfig(Wire):
    weights: Weights
    composite_cutoff: float = Score
    criterion_cutoffs: Criteria
    recency_window: int = Field(ge=1, le=50)


class Record(BaseModel):
    """Quizzes and exams are stored as documents; only the identifying fields are required."""

    model_config = ConfigDict(extra="allow")

    id: str
    topicId: str
    at: str


# Slice name -> how to validate it. `list` slices take a JSON array; the rest take a value.
LIST_SLICES = {"attempts": Attempt, "quizzes": Record, "exams": Record, "collections": Collection, "files": PersonalFile}
MAP_SLICES = {"topicState": TopicState}
VALUE_SLICES = {"session": Session, "config": ScoringConfig}
FLAG_SLICES = {"hostedDisclosureAck"}
FREE_SLICES = {"chats"}
ALL_SLICES = set(LIST_SLICES) | set(MAP_SLICES) | set(VALUE_SLICES) | FLAG_SLICES | FREE_SLICES

GENERAL_ID = "general"
