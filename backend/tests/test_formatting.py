"""Model-written text reaches the app in the shape its renderer reads: $ maths, display blocks on their own lines."""

import json

from studio.ai.tasks import tidy_math
from test_ai import client, connect, exam_body, fake, question  # noqa: F401  (client and fake are fixtures)


def test_latex_delimiters_become_dollar_forms():
    assert tidy_math(r"Let \(\theta\) be unknown and \( n = 10 \).") == r"Let $\theta$ be unknown and $n = 10$."
    assert tidy_math(r"Then \[ \hat\theta = \bar x \] is the MLE.") == "Then\n\n$$\n" + r"\hat\theta = \bar x" + "\n$$\n\nis the MLE."


def test_every_display_block_stands_on_its_own_lines():
    assert tidy_math(r"(a) Show $$L(\theta) = \prod f(x_i)$$ and (b) maximise it.") == "(a) Show\n\n$$\n" + r"L(\theta) = \prod f(x_i)" + "\n$$\n\nand (b) maximise it."
    assert tidy_math("$$\n a = b \n$$") == "$$\na = b\n$$"


def test_an_align_environment_outside_maths_is_wrapped_and_one_inside_is_left_alone():
    assert tidy_math(r"So \begin{align} a &= b \end{align} holds.") == "So\n\n$$\n" + r"\begin{align} a &= b \end{align}" + "\n$$\n\nholds."
    assert tidy_math(r"$$\begin{align} a &= b \end{align}$$") == "$$\n" + r"\begin{align} a &= b \end{align}" + "\n$$"


def test_plain_text_inline_maths_and_markdown_are_left_alone():
    s = "A coin is tossed $n$ times.\n\n(a) Write the likelihood.\n(b) Find the MLE of $p$."
    assert tidy_math(s) == s


def test_written_exam_questions_are_tidied_before_they_reach_the_app(client, fake):
    connect(client)
    q = question(1)
    q["prompt"] = r"For \(X_1,\dots,X_n\) i.i.d. Poisson: (a) write \[ L(\lambda) \] (b) find the MLE."
    q["hint"] = r"Start from \(\ell(\lambda)\)."
    q["keyPoints"] = [r"Writes \(\ell(\lambda)\)", "Differentiates", "Checks the maximum"]
    fake.replies = [json.dumps({"questions": [q, question(2)]})]
    out = client.post("/api/ai/exam", json=exam_body()).json()["questions"][0]
    assert out["prompt"] == "For $X_1,\\dots,X_n$ i.i.d. Poisson: (a) write\n\n$$\nL(\\lambda)\n$$\n\n(b) find the MLE."
    assert out["hint"] == r"Start from $\ell(\lambda)$." and out["keyPoints"][0] == r"Writes $\ell(\lambda)$"


def test_written_quiz_questions_and_choices_are_tidied(client, fake):
    connect(client)
    q = {"kind": "mc", "prompt": r"Which is the MLE of \(\lambda\)?", "choices": [r"\(\bar x\)", "$n$", "$1/\\bar x$"], "answer": 0, "explanation": r"It maximises \[ \ell(\lambda) \].", "concept": "MLE", "cites": [1]}
    fake.replies = [json.dumps({"questions": [q, q, q]})]
    out = client.post("/api/ai/quiz", json={"ask": "the Poisson MLE", "count": 3}).json()["questions"][0]
    assert out["prompt"] == r"Which is the MLE of $\lambda$?" and out["choices"][0] == r"$\bar x$"
    assert out["explanation"] == "It maximises\n\n$$\n" + r"\ell(\lambda)" + "\n$$\n\n."
