import os

# Tests must never reach the real internet: no automatic update check at startup unless a test turns it on.
os.environ.setdefault("STUDIO_AUTOCHECK", "0")
os.environ.pop("STUDIO_UPDATE_BASE", None)
os.environ["STUDIO_KEYSTORE"] = "file"  # never touch the real OS credential store
os.environ.pop("STUDIO_GEMINI_BASE", None)
os.environ.pop("STUDIO_OLLAMA_BASE", None)
os.environ.pop("STUDIO_ANTHROPIC_BASE", None)
os.environ.pop("STUDIO_OPENAI_BASE", None)
