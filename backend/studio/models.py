"""Request and storage models. Field names are camelCase on the wire to match the front end's types."""

from __future__ import annotations

from typing import Any, Literal

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
    # True only when an AI rubric scored the four criteria; every other score has no per-criterion breakdown.
    ai_scored: bool = False


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
    activity: Literal["tutor", "tutorial", "quiz", "exam", "vocab", "breakdown", "check"]
    at: str


class Collection(Wire):
    id: str
    name: str = Field(min_length=1, max_length=80)
    consent: bool
    search_by_default: bool


class ScoringConfig(Wire):
    weights: Weights
    composite_cutoff: float = Score
    criterion_cutoffs: Criteria
    recency_window: int = Field(ge=1, le=50)


class Onboarding(Wire):
    """First-run setup. Kept by the service so it survives a browser-storage wipe."""

    done: bool
    completed_at: str | None = None


class VocabProgress(Wire):
    known: list[str] = Field(default_factory=list)
    not_yet: list[str] = Field(default_factory=list)


class CheckAnswer(Wire):
    credit: float = Field(ge=0, le=1)
    choice: int | None = Field(default=None, ge=0)
    rating: Literal["got", "partly", "missed"] | None = None
    skipped: bool | None = None  # the learner moved on without answering; it counts as not answered
    retried: bool | None = None  # answered again after "Try it again"; the credit is still the first attempt's
    at: str


class BreakdownProgress(Wire):
    revealed: list[Literal["ask", "given", "tool", "plan", "pitfalls"]] = Field(default_factory=list)
    done: bool = False
    at: str


class Learning(Wire):
    """Progress in the learning activities (vocabulary flashcards, comprehension checks, question breakdowns).

    Keyed by topic id, then by term / check / breakdown id. This is study progress, but it never feeds scores:
    those come only from counted attempts."""

    vocab: dict[str, VocabProgress] = Field(default_factory=dict)
    checks: dict[str, dict[str, CheckAnswer]] = Field(default_factory=dict)
    breakdowns: dict[str, dict[str, BreakdownProgress]] = Field(default_factory=dict)


PATH_STEP_KINDS = ("tutorial", "vocab", "example", "breakdown", "quiz", "tutor", "explain")
PathStepKind = Literal["tutorial", "vocab", "example", "breakdown", "quiz", "tutor", "explain"]


class PathStep(Wire):
    """One stop on a custom path: an activity that exists in the app (by its catalogue id), or an explanation the
    model wrote because nothing in the app fitted (kind "explain", with its text and the course pages it cites)."""

    kind: PathStepKind
    ref: str = Field(default="", max_length=200)
    title: str = Field(min_length=1, max_length=200)
    why: str = Field(default="", max_length=1000)
    text: str | None = Field(default=None, max_length=20000)
    # citation chips for an explanation: the service's own source records, kept as they came
    sources: list[dict[str, Any]] = Field(default_factory=list, max_length=12)
    done: bool = False
    done_at: str | None = None


class CustomPath(Wire):
    """A path the learner asked for: their own words (and the file they handed in), the model's title, goal and
    concepts, and the steps with their progress."""

    id: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=200)
    goal: str = Field(default="", max_length=600)
    # what the path takes on and what it leaves out (and why), as the model said them; older paths have neither
    covers: str | None = Field(default=None, max_length=600)
    leaves_out: str | None = Field(default=None, max_length=600)
    ask: str = Field(default="", max_length=4000)
    concepts: list[str] = Field(default_factory=list, max_length=12)
    file_id: str | None = None
    filename: str | None = None
    steps: list[PathStep] = Field(min_length=1, max_length=12)
    created_at: str
    opened_at: str


class Paths(Wire):
    """Every custom path, newest first. Progress on a path is study activity but never feeds scores."""

    items: list[CustomPath] = Field(default_factory=list, max_length=200)


class Record(BaseModel):
    """Quizzes and exams are stored as documents; only the identifying fields are required."""

    model_config = ConfigDict(extra="allow")

    id: str
    topicId: str
    at: str


# Slice name -> how to validate it. `list` slices take a JSON array; the rest take a value.
# Personal files are not a slice: the service owns them (uploads, versions, removal) and the app only reads them.
LIST_SLICES = {"attempts": Attempt, "quizzes": Record, "exams": Record, "collections": Collection}
MAP_SLICES = {"topicState": TopicState}
VALUE_SLICES = {"session": Session, "config": ScoringConfig, "onboarding": Onboarding, "learning": Learning, "paths": Paths}
FLAG_SLICES = {"hostedDisclosureAck"}
FREE_SLICES = {"chats"}
ALL_SLICES = set(LIST_SLICES) | set(MAP_SLICES) | set(VALUE_SLICES) | FLAG_SLICES | FREE_SLICES

GENERAL_ID = "general"
