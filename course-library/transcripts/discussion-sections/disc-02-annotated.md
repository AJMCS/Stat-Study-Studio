---
source: discussion-sections/disc-02-annotated.pdf
method: manual transcription from page images; handwriting read visually (items marked "unclear" are low confidence)
pages: 2
kind: worked-solutions
note: Printed problem statements are the same as disc-02.md. Only the handwritten work is transcribed here.
---

<!-- page 1 -->
# Discussion Section 2, annotated (handwritten solutions)

**Problem 1.** Prior: $\pi(\theta) = \mathrm{Beta}(2, 200)$, with $\alpha = 2$, $\beta = 200$ and $n$ marked on the problem. Answer (red): posterior $\sim \mathrm{Beta}(2 + 3,\ 200 + 97)$.

**Problem 2 (setup).** ① $X \sim N(\theta, 2^2)$, $\theta \sim N(\mu, \sigma^2)$ (with $\sigma$ circled), and $\theta \mid X \sim N(\mu^*, \sigma^{*2})$.

**Problem 3.** A bracket in the left margin is labeled "likelihood" next to the sentence about the exponential distribution. The full solution is on page 2.

**Problem 4.** The weighted-average form $\gamma_n \bar{X}_n + (1 - \gamma_n)\mu_0$ is boxed and underlined in blue and red. The full solution is on page 2.

**Problem 5.** The Poisson pmf is written as $X = \dfrac{\theta^x}{x!}e^{-\theta}$. Prior: $\pi(\theta) = \mathrm{Gamma}(3, 1)$. Posterior: $\pi(\theta \mid \mathbf{x}) = \mathrm{Gamma}(3 + 13,\ 1 + 5)$, with an arrow marking "mean" under it. An arrow from the circled phrase "squared error loss" points to "Posterior Mean". (The total defect count is $2 + 2 + 6 + 0 + 3 = 13$ over $n = 5$ rolls, so the Bayes estimate is $16/6 = 8/3$.)

*General note (red):* **Absolute error loss $\to$ Median.** Then "Z-table" and $P(X < \text{?}) = 0.5$, a reminder that the posterior median of a normal posterior is its mean, and that the median is the point with probability 0.5 below it.

<!-- page 2 -->
**Bayes' theorem (header on this page):**
$$P(\theta \mid Y) = \frac{P(Y \mid \theta)\cdot P(\theta)}{P(Y)}$$
with labels: $P(\theta \mid Y)$ is the **posterior**; $\theta$ is the parameter and $Y$ is the data; $P(Y \mid \theta)$ is the **likelihood**; $P(\theta)$ is the **prior**; and $P(Y)$ is a constant, "$\to c$".

**Problem 2.**
$$\sigma^{*2} = \left(\frac{1}{\sigma^2} + \frac{100}{2^2}\right)^{-1} = \left(\frac{1}{\sigma^2} + 25\right)^{-1} < \frac{1}{25} = \left(\frac{1}{5}\right)^2$$
with a brace under $\left(\frac{1}{\sigma^2} + 25\right)$ marking that it is $> 25$. So the posterior standard deviation is below $1/5$ no matter how large the prior standard deviation $\sigma$ is.

**Problem 3.** $t \mid \theta \sim \exp(\theta) = \theta e^{-\theta t}$. The prior is written $\pi(\theta) = \mathrm{gamma}(25, 125)$. Data: $n = 20$, $\bar{t} = 3.8$, and $\sum t = n\cdot\bar{t}$. Posterior:
$$\pi(\theta \mid t) = \mathrm{gamma}(25 + 20,\ 125 + 20 \times 3.8).$$

*Note: the prior $\mathrm{gamma}(25, 125)$ has mean $25/125 = 0.2$ but standard deviation $\sqrt{25}/125 = 0.04$, which does not match the "standard deviation is 1" printed in the problem. The posterior update rule used (add $n$ to the first parameter and $\sum t$ to the second) is correct for exponential data.*

**Problem 4.** $X \sim \mathrm{Ber}(\theta)$, $\pi(\theta) = \mathrm{Beta}(a, b)$ with $\dfrac{a}{a+b} = \mu_0$. The posterior is $\pi(\theta \mid x) = \mathrm{Beta}(a^*, b^*)$ and its mean is
$$\frac{a^*}{a^* + b^*} = \frac{a + \sum x_i}{a + \sum x_i + b + n - \sum x_i} = \frac{a + \sum x_i}{a + b + n} = \frac{a}{a + b + n} + \frac{\sum x_i}{a + b + n}.$$
The second term is $\dfrac{n\bar{X}_n}{a+b+n} = \left(\dfrac{n}{a+b+n}\right)\bar{X}_n$, and the weight $\dfrac{n}{a+b+n}$ is labeled $\gamma_n$ (blue). The first term is
$$\frac{a}{a+b+n} = \frac{a}{a+b}\cdot\frac{a+b}{a+b+n} = \left(\frac{a+b}{a+b+n}\right)\mu_0,$$
and the weight $\dfrac{a+b}{a+b+n}$ is labeled $1 - \gamma_n$ (blue).
