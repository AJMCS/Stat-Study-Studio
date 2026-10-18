"""Turn LaTeX-flavoured transcript text into plain words for lexical and embedding models.

Embedding models and BM25 see "\\hat{\\theta}" as noise. Spelling the symbols out ("hat theta") lets a
learner's query "theta hat" or "MLE of theta" match. The original LaTeX is always kept for display.
"""

import re

_SYMBOLS = {
    "alpha": "alpha", "beta": "beta", "gamma": "gamma", "delta": "delta", "theta": "theta",
    "lambda": "lambda", "mu": "mu", "sigma": "sigma", "pi": "pi", "phi": "phi", "Phi": "phi",
    "Gamma": "gamma", "Theta": "theta", "Omega": "omega", "Delta": "delta", "ell": "log likelihood",
    "sum": "sum", "prod": "product", "int": "integral", "infty": "infinity", "propto": "proportional to",
    "hat": "hat", "bar": "bar", "mathbb": "", "mathbf": "", "mathrm": "", "text": "",
    "le": "less than or equal", "ge": "greater than or equal", "ne": "not equal", "to": "to",
    "sqrt": "square root", "frac": "", "dfrac": "", "binom": "choose", "log": "log", "exp": "exp",
    "max": "max", "min": "min", "arg": "arg", "Pr": "probability", "xrightarrow": "converges",
    "cdot": "", "times": "times", "ldots": "", "cdots": "", "left": "", "right": "", "quad": " ",
    "qquad": " ", "implies": "implies", "Rightarrow": "implies", "approx": "approximately",
    "in": "in", "cup": "union", "cap": "intersection",
}

_UNICODE = {
    "θ": " theta ", "λ": " lambda ", "μ": " mu ", "σ": " sigma ", "α": " alpha ", "β": " beta ",
    "γ": " gamma ", "π": " pi ", "δ": " delta ", "Σ": " sum ", "∑": " sum ", "∏": " product ",
    "∫": " integral ", "∞": " infinity ", "≤": " less than or equal ", "≥": " greater than or equal ",
    "≠": " not equal ", "∝": " proportional to ", "≈": " approximately ", "√": " square root ",
    "→": " to ", "⟹": " implies ", "ℓ": " log likelihood ", "θ̂": " theta hat ",
}


def latex_to_text(s: str) -> str:
    for ch, rep in _UNICODE.items():
        s = s.replace(ch, rep)
    s = re.sub(r"\\([A-Za-z]+)", lambda m: " " + _SYMBOLS.get(m.group(1), m.group(1)) + " ", s)
    s = s.replace("^*", " star ").replace("^2", " squared ").replace("_", " ")
    s = re.sub(r"[$\\{}^|~]", " ", s)
    s = re.sub(r"[*>#`]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


_TOKEN = re.compile(r"[a-z0-9]+")


def tokenize(s: str) -> list[str]:
    return _TOKEN.findall(latex_to_text(s).lower())
