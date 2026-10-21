"""The hosted-model layer (Tier 1). Nothing here runs unless the learner connected their own API key and accepted the
data notice. Providers sit behind one small interface so Anthropic and OpenAI can be added later."""

from . import tasks
from .errors import AiError
from .keystore import KeyStore
from .provider import Provider
from .service import AiService, WorkspaceChoice

__all__ = ["AiError", "AiService", "KeyStore", "Provider", "WorkspaceChoice", "tasks"]
