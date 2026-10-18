import os

# Tests must never reach the real internet: no automatic update check at startup unless a test turns it on.
os.environ.setdefault("STUDIO_AUTOCHECK", "0")
os.environ.pop("STUDIO_UPDATE_BASE", None)
