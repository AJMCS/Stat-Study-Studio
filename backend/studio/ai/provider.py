from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Message:
    role: str  # "user" or "assistant"
    text: str


class Provider(Protocol):
    """What the rest of the app needs from a hosted model. One implementation per company."""

    name: str  # shown to the learner, e.g. "Google Gemini"

    def check_key(self) -> None:
        """Raise AiError if the key is not accepted. Must not use up the learner's quota."""

    def generate(self, system: str, messages: list[Message], *, json_output: bool = False, temperature: float = 0.4) -> str:
        """The model's reply as text (a JSON document when json_output is true)."""
