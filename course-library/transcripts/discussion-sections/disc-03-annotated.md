---
source: discussion-sections/disc-03-annotated.pdf
method: manual transcription from page images; handwriting read visually (items marked "unclear" are low confidence)
pages: 6
kind: worked-solutions
note: Printed problem statements are the same as disc-03.md. Pages 1-3 are one set of handwritten solutions. Pages 4-6 (page 4 headed "Monday") are a second, cleaner pass over problems 1-4, so some steps repeat.
---

<!-- page 1 -->
# Discussion Section 3, annotated (handwritten solutions)

*Margin steps for the MLE procedure at the top of page 1: ② $\log L$, ③ $\dfrac{d\log L}{d\theta} = 0$, $\hat\theta = ?$.*

**Problem 1: normal mean and variance.** The density is $f(x) = \dfrac{1}{\sqrt{2\pi\sigma^2}}\exp\left\{-\dfrac{(x-\mu)^2}{2\sigma^2}\right\}$. The likelihood is
$$L(\mu, \sigma^2) = \prod_{i=1}^n f(x_i) = \left(\frac{1}{\sqrt{2\pi\sigma^2}}\right)^n \exp\left\{-\frac{\sum_{i=1}^n (x_i - \mu)^2}{2\sigma^2}\right\}.$$
The log likelihood is
$$\log L = n\log\left(\frac{1}{\sqrt{2\pi\sigma^2}}\right) - \frac{\sum (x_i - \mu)^2}{2\sigma^2} = -n\left[\log\sqrt{2\pi} + \log\sigma\right] - \frac{\sum x_i^2 - \left(2\sum x_i\right)\mu + n\mu^2}{2\sigma^2}.$$
*Margin reminders:* $\log\left(\tfrac{1}{a}\right) = -\log a$ and $\log(ab) = \log a + \log b$. Also the expansion $\sum_{i=1}^n (x_i - \mu)^2 = \sum_{i=1}^n \left(x_i^2 - 2x_i\mu + \mu^2\right)$, and $\dfrac{1}{\sigma^2} = \sigma^{-2}$, $-2\sigma^{-3}$ for the derivative.

Differentiate with respect to $\mu$:
$$\frac{\partial\log L}{\partial\mu} = \frac{2\sum x_i}{2\sigma^2} - \frac{n\mu}{\sigma^2} = 0 \;\Rightarrow\; \sum x_i - n\mu = 0 \;\Rightarrow\; \hat\mu = \frac{\sum x_i}{n}.$$

<!-- page 2 -->
Now the variance. With $\log L = -n\log\sqrt{2\pi} - n\log\sigma - \dfrac{\sum (x_i - \mu)^2}{2\sigma^2}$,
$$\frac{\partial\log L}{\partial\sigma} = -\frac{n}{\sigma} + \frac{\sum (x_i - \mu)^2}{\sigma^3} = 0 \;\Rightarrow\; \frac{\sum (x_i - \mu)^2}{\sigma^3} = \frac{n}{\sigma} \;\Rightarrow\; \hat\sigma^2 = \frac{\sum (x_i - \hat\mu)^2}{n},$$
with an arrow showing that $\hat\mu = \dfrac{\sum x_i}{n}$ is plugged in.

**Problem 2: $f(x|\theta) = \theta / x^{\theta+1}$ for $x > 1$.**
$$L = \prod_{i=1}^n f(x_i) = \frac{\theta^n}{x_1^{\theta+1} x_2^{\theta+1} \cdots x_n^{\theta+1}} = \frac{\theta^n}{(x_1 x_2 \cdots x_n)^{\theta+1}}$$
$$\log L = n\log\theta - (\theta + 1)\log(x_1 x_2 \cdots x_n) = n\log\theta - (\theta + 1)\sum_{i=1}^n \log x_i$$
$$\frac{d\log L}{d\theta} = \frac{n}{\theta} - \sum_{i=1}^n \log x_i = 0 \;\Rightarrow\; \hat\theta = \frac{n}{\sum_{i=1}^n \log x_i}.$$
*Margin reminder (red):* $\log(ab) = \log a + \log b$.

**Problem 3: uniform on $[\theta_1, \theta_2]$.** The density is $f(x) = \dfrac{1}{\theta_2 - \theta_1}$ for $\theta_1 \le x \le \theta_2$. With a sample $x_1, \ldots, x_n$,
$$L(\theta) = \prod_{i=1}^n f(x_i) = \left(\frac{1}{\theta_2 - \theta_1}\right)^n, \qquad \theta_1 \le x_1, \ldots, x_n \le \theta_2.$$
*Red notes:* the usual derivative approach does not work here (crossed out "$\partial L$" and "$\partial \log L$"), so we maximize $L$ by minimizing $\theta_2 - \theta_1$. Make $\theta_2$ as small as allowed and $\theta_1$ as large as allowed:
$$\min \theta_2 = \max\{x_1, \ldots, x_n\}, \qquad \max\theta_1 = \min\{x_1, \ldots, x_n\}.$$
So $\hat\theta_2 = X_{(n)}$ (largest observation) and $\hat\theta_1 = X_{(1)}$ (smallest observation).

<!-- page 3 -->
**Problem 4: MLE of the exponential median.** $X_1, \ldots, X_n \sim \mathrm{Exp}(\lambda)$ with $f(x) = \lambda e^{-\lambda x}$.
$$L(\lambda) = \lambda^n e^{-\lambda\sum x_i}, \qquad \log L = n\log\lambda - \lambda\sum x_i$$
$$\frac{d\log L}{d\lambda} = \frac{n}{\lambda} - \sum x_i = 0 \;\Rightarrow\; \hat\lambda = \frac{n}{\sum x_i} \quad \text{(circled: MLE)}.$$
The median satisfies $F(x) = \tfrac{1}{2}$, that is $\int_{-\infty}^{x_{\text{median}}} f(x)\,dx = \tfrac12$. With the CDF $F(x) = 1 - e^{-\lambda x}$:
$$1 - e^{-\lambda x} = \tfrac12 \;\Rightarrow\; e^{-\lambda x} = \tfrac12 \;\Rightarrow\; -\lambda x = \log\tfrac12 = -\log 2 \;\Rightarrow\; x_{\text{median}} = \frac{\log 2}{\lambda}.$$
By invariance, the MLE of the median is
$$\hat{x}_{\text{median}} = \frac{\log 2}{\,n/\sum x_i\,}.$$

**Problem 5: MLE of the 0.95 quantile of a normal.** From problem 1, $\hat\mu = \dfrac{\sum x_i}{n}$ and $\hat\sigma^2 = \dfrac{\sum (x_i - \bar{x})^2}{n}$. The 0.95 quantile is the value $a$ with $P(X < a) = 0.95$. Since $X \sim N(\mu, \sigma^2)$, we have $\dfrac{X - \mu}{\sigma} \sim N(0, 1)$, so
$$P\left(\frac{X - \mu}{\sigma} < \Phi(0.95)\right) = 0.95 \;\Rightarrow\; P\left(X < \Phi(0.95)\,\sigma + \mu\right) = 0.95.$$
Replace $\sigma$ and $\mu$ with their MLEs ($\hat\sigma$, $\hat\mu$, marked in red):
$$\hat{a} = \Phi(0.95)\sqrt{\frac{\sum (x_i - \bar{x})^2}{n}} + \frac{\sum x_i}{n}.$$
*Notation note: the handwriting writes $\Phi(0.95)$ for the 0.95 quantile of the standard normal (the value usually written $\Phi^{-1}(0.95) \approx 1.645$).*

<!-- page 4 -->
## Second pass (page 4 headed "Monday")

**Problem 1.** $f(x) = \dfrac{1}{\sqrt{2\pi\sigma^2}}\exp\left\{-\dfrac{(x-\mu)^2}{2\sigma^2}\right\}$, and
$$L(x_1, \ldots, x_n) = \prod f(x_i) = \left(\frac{1}{\sqrt{2\pi\sigma^2}}\right)^n \exp\left\{-\frac{\sum (x_i - \mu)^2}{2\sigma^2}\right\},$$
$$\log L = \ell(x_1, \ldots, x_n) = -n\log\sqrt{2\pi\sigma^2} - \frac{\sum (x_i - \mu)^2}{2\sigma^2} = -n\log\sqrt{2\pi} - n\log\sigma - \frac{\sum (x_i - \mu)^2}{2\sigma^2}.$$
For $\mu$, the handwriting shows two routes, with the sum expanded first:
$$(x_1 - \mu)^2 + (x_2 - \mu)^2 + \cdots + (x_n - \mu)^2 = \sum x_i^2 - 2\mu\sum x_i + n\mu^2.$$
- **Route ①: differentiate.** $\dfrac{\partial}{\partial\mu}\left[n\mu^2 - 2\sum x_i\,\mu + \cdots\right] = 0 \Rightarrow 2n\mu - 2\sum x_i = 0 \Rightarrow \mu = \dfrac{\sum x_i}{n}$.
- **Route ②: complete the square.** $n\left(\mu^2 - 2\dfrac{\sum x_i}{n}\mu + \cdots\right) = n\left(\mu - \dfrac{\sum x_i}{n}\right)^2 + \text{const}$. The square is $\ge 0$ and smallest at $\mu = \dfrac{\sum x_i}{n}$, which maximizes the log likelihood because that term enters with a minus sign.

So the MLE is $\hat\mu = \dfrac{\sum x_i}{n} = \bar{X}$ (boxed). For $\sigma$:
$$\frac{\partial\ell}{\partial\sigma} = -\frac{n}{\sigma} + \frac{\sum (x_i - \mu)^2}{\sigma^3} = -\frac{n}{\sigma} + \frac{\sum (x_i - \bar{X})^2}{\sigma^3} = 0 \;\Rightarrow\; \sigma^2 = \frac{1}{n}\sum (x_i - \bar{X})^2.$$

<!-- page 5 -->
**Problem 2 (second pass).** $f(x) = \dfrac{\theta}{x^{\theta+1}}$.
$$L = \prod_{i=1}^n f(x_i) = \frac{\theta^n}{x_1^{\theta+1}x_2^{\theta+1}\cdots x_n^{\theta+1}} = \frac{\theta^n}{(x_1 x_2 \cdots x_n)^{\theta+1}}$$
$$\log L = n\log\theta - (\theta+1)\log(x_1 x_2 x_3 \cdots x_n) = n\log\theta - (\theta+1)\sum_{i=1}^n \log(x_i)$$
$$\frac{d\log L}{d\theta} = \frac{n}{\theta} - \sum_{i=1}^n \log(x_i) = 0 \quad\Rightarrow\quad \text{MLE: } \hat\theta = \frac{n}{\sum_{i=1}^n \log(x_i)}.$$

<!-- page 6 -->
**Problem 3 (second pass).** $X_1, \ldots, X_n \sim \mathrm{Unif}(\theta_1, \theta_2)$ with $f(x) = \dfrac{1}{\theta_2 - \theta_1}$ for $\theta_1 \le x \le \theta_2$ (underlined in red), so
$$L(\theta_1, \theta_2) = \prod_{i=1}^n f(x_i) = \frac{1}{(\theta_2 - \theta_1)^n}, \qquad \theta_1 \le x_1, \ldots, x_n \le \theta_2.$$
To **maximize** $L$ we **minimize** $\theta_2 - \theta_1$: $\theta_2$ should go down as far as the **largest** $X_i$, which is $X_{(n)}$, and $\theta_1$ should go up as far as the **smallest** $X_i$, which is $X_{(1)}$.

**Problem 4 (second pass).** The same steps as page 3: $L = \lambda^n e^{-\lambda\sum x_i}$, $\log L = n\log\lambda - \lambda\sum x_i$, $\dfrac{\partial\log L}{\partial\lambda} = \dfrac{n}{\lambda} - \sum x_i = 0 \Rightarrow \hat\lambda = \dfrac{n}{\sum x_i}$ (MLE). For the median, $F(x_m) = 0.5$ with $F(x) = 1 - e^{-\lambda x}$, giving $1 - e^{-\lambda x_m} = \tfrac12$, so $x_m = \dfrac{\log 2}{\lambda}$ and, by plugging in the MLE, $\hat{x}_m = \dfrac{\log 2}{n/\sum x_i}$.
