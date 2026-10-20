from __future__ import annotations

# kind -> (HTTP status for our own API, what to tell the learner). The learner's answer is never lost on any of these;
# the front end offers "retry" or "self-score instead".
MESSAGES = {
    "not_connected": (409, "No AI service is connected. Add your key in Settings."),
    "no_consent": (409, "Please read and accept the data notice in Settings before using an AI service."),
    "invalid_key": (401, "The AI service did not accept your key. Check that you copied all of it, or make a new one."),
    "rate_limited": (429, "The AI service says you have used up its free allowance for now. Wait a minute and retry, or self-score instead."),
    "offline": (503, "Could not reach the AI service. Check your internet connection, then retry."),
    "blocked": (422, "The AI service declined to answer that request. Try rewording it."),
    "bad_response": (502, "The AI service sent back something unreadable. Retrying usually fixes this."),
    "rejected": (502, "The AI service rejected the app's request, so retrying will not help. It said: {detail}"),
    "local_not_running": (503, "Ollama is not running on this computer. Open the Ollama app (or run 'ollama serve'), then retry."),
    "model_missing": (404, "That model is not available. For Ollama, install it first (ollama pull <model name>). For an online service, pick a model name your account can use."),
    "billing": (402, "The AI service says this account has no credit or billing set up. Add credit on the provider's website, then retry. (A chat subscription does not include API credit.)"),
    "server": (502, "The AI service had a problem on its side. Retry in a moment."),
}


class AiError(Exception):
    def __init__(self, kind: str, detail: str = ""):
        self.kind = kind
        self.detail = detail
        self.status = MESSAGES[kind][0]
        # A few messages quote what the service said, so the learner (and whoever they ask for help) sees the reason.
        self.message = MESSAGES[kind][1].replace("{detail}", detail or "(no details)")
        super().__init__(f"{kind}: {detail}" if detail else kind)
