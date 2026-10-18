---
source: discussion-sections/disc-01-annotated.pdf
method: manual transcription from page images; handwriting read visually (items marked "unclear" are low confidence)
pages: 3
kind: worked-solutions
note: Printed problem statements are the same as disc-01.md. Only the handwritten work is transcribed here. Page 1 shows a margin note "→ common distribution.pdf" pointing to the table of common distributions.
---

<!-- page 1 -->
# Discussion Section 1, annotated (handwritten solutions)

*Margin note: "→ common distribution.pdf" (use the table of common distributions for the beta mean and variance).*

**Problem 2 (handwritten work).** The exponential density is $f(x) = \lambda e^{-\lambda x}$.

- $x = 2 \to \lambda e^{-2\lambda} = L(\lambda \mid X = 2)$
- $x = 2.5 \to \lambda e^{-2.5\lambda}$
- $x = 3 \to \lambda e^{-3\lambda}$

So $L(\lambda \mid \mathbf{x}) = \lambda^3 e^{-7.5\lambda}$, and the log likelihood is
$$\log L = \ell = 3\log(\lambda) - 7.5\lambda \quad \text{(underlined)}.$$

*Sketch (red, partly unclear):* axes with $L$ vertical and $\lambda$ horizontal. The curve rises from zero, peaks, then decays. The peak is labeled "MLE" with "$\lambda = ?$" marked under it.

<!-- page 2 -->
**Problem 3 (handwritten work).** The model is $f(x \mid \lambda) = \lambda e^{-\lambda x}$, with $E(X) = \dfrac{1}{\lambda}$ and $\mathrm{Var}(X) = \dfrac{1}{\lambda^2}$. The proposed prior is $\lambda \sim \mathrm{Unif}[0, 10]$.

*Sketches (red):* a flat density on $[0, 10]$ for the proposed prior, and a second sketch of a density that is concentrated near small values of $\lambda$ with the mark "0.5" on the horizontal axis, suggesting the uniform prior puts as much weight on large rates as on small ones.

<!-- page 3 -->
**Problem 1 (scratch, unclear):** a side calculation "$9 - 6 = 3$" with "54", consistent with $\alpha + \beta = 9$, $\alpha = 3$, $\beta = 6$ for a beta with mean $1/3$ and variance $1/45$.

**Problem 4 (handwritten work).**
$$\pi(p) = \begin{cases} 0.5, & p = 0.1 \\ 0.5, & p = 0.2 \end{cases}$$

**Problem 5 (handwritten work).** First check that $\pi$ is a pdf (sketch of a line starting at height 2 at $p = 0$ and falling to 0 at $p = 1$).
$$E(p) = \int_0^1 p\,\pi(p)\,dp = \int_0^1 2p(1-p)\,dp = \frac{1}{3}$$
$$\mathrm{Var}(p) = E(p^2) - [E(p)]^2, \qquad E(p^2) = \int_0^1 p^2\,\pi(p)\,dp = \int_0^1 2p^2(1-p)\,dp = \frac{1}{6}$$
$$\mathrm{Var}(p) = \frac{1}{6} - \frac{1}{9} = \frac{1}{18}.$$

*Side work:* $\int 2p(1-p)\,dp = p^2 - \tfrac{2}{3}p^3 \Big|_0^1$ and $\int 2p^2(1-p)\,dp = \tfrac{2}{3}p^3 - \tfrac{1}{2}p^4 \Big|_0^1$.
