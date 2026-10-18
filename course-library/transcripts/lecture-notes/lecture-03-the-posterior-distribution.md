---
source: lecture-notes/lecture-03-the-posterior-distribution.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 7
kind: lecture
---

<!-- page 1 -->
# Lecture 3: The Posterior Distribution

STAT 132

## Contents

1. Posterior Distribution (p. 2): Definition (p. 2); Bayesian Inference (p. 2); Example (p. 3); Conjugate Priors (p. 4); Bernoulli Sampling (p. 4); Poisson Sampling (p. 5); Normal Sampling (p. 5); Effect of the Prior (p. 6)

<!-- page 2 -->
## 1 Posterior Distribution

Recall that the prior distribution $\pi(\theta)$ expresses our state of knowledge for the parameter $\theta$ before observing any data. However, we actually want to know what our state of knowledge is after observing data.

### 1.1 Definition

> **Definition 1.1** (Posterior). Consider a statistical inference problem with parameter $\theta$ and random variables $X_1, \ldots, X_n$ to be observed. The conditional distribution of $\theta$ given $X_1, \ldots, X_n$ is called the **posterior distribution** of $\theta$. The conditional pdf or pmf of $\theta$ given $X_1 = x_1, \ldots, X_n = x_n$ is called the posterior pdf or posterior pmf of $\theta$ and is typically denoted $\pi(\theta|x_1, \ldots, x_n)$.

The posterior distribution expresses our state of knowledge about the parameter <u>after</u> observing the data. This is a probability distribution, so we can freely calculate things like the mean and variance of this distribution.

- High posterior variance means that we still are not very certain what a likely value is for the parameter
- Low posterior variance means we have little uncertainty about the likely values for the parameter

### 1.2 Bayesian Inference

Bayesian inference is centered around the posterior distribution. The main goal is to find or calculate this distribution.

> **Theorem 1.1** (Bayes Theorem). *Suppose that the $n$ random variables $X_1, \ldots, X_n$ form a random sample from a distribution for which the pdf or pmf is $f(x|\theta)$. Suppose also that the value of the parameter $\theta$ is unknown and the prior pdf or pmf of $\theta$ is $\pi(\theta)$, with parameter space $\theta \in \Theta$. Then the posterior pdf or pmf of $\theta$ is*
> $$\pi(\theta|x_1, \ldots, x_n) = \frac{f(x_1|\theta) \cdots f(x_n|\theta)\,\pi(\theta)}{m_n(x_1, \ldots, x_n)}$$
> *where $m_n(x_1, \ldots, x_n)$ is the joint marginal distribution of the data, $x_1, \ldots, x_n$.*

Notice that because the data are all independent (random sample) coming from the same distribution, we have that
$$f(x_1, \ldots, x_n|\theta) = f(\mathbf{x}|\theta) = f(x_1|\theta) \cdots f(x_n|\theta) = \prod_{i=1}^{n} f(x_i|\theta).$$

<!-- page 3 -->
The marginal distribution of the data can be found by integrating out the parameter
$$m_n(x_1, \ldots, x_n) = m_n(\mathbf{x}) = \int_\Theta f(\mathbf{x}|\theta)\,\pi(\theta)\,d\theta.$$

- After integrating out the parameter, the marginal is no longer a function of the parameter ($\theta$)
- Since the marginal is not a function of $\theta$, it can be thought of as a constant term that shows up in the posterior distribution, and is usually ignored
- In this case, we write $\pi(\theta|\mathbf{x}) \propto f(\mathbf{x}|\theta)\,\pi(\theta)$ where the symbol $\propto$ means "proportional to"
- The posterior distribution is then proportional to the likelihood times the prior distribution!

### 1.3 Example

Since $\pi(\theta|\mathbf{x}) \propto f(\mathbf{x}|\theta)\,\pi(\theta)$, if we recognize $f(\mathbf{x}|\theta)\,\pi(\theta)$ corresponding to a specific family of distributions, then we know what our posterior distribution is.

**Example 1.1.** Suppose that the proportion $\theta$ of defective items in a large manufactured lot is unknown and that the prior distribution for $\theta$ is a uniform distribution on the interval $[0, 1]$. Suppose also that a random sample of $n$ items is taken from the lot, and for $i = 1, \ldots, n$, let $X_i = 1$ if the $i$th item is defective, and let $X_i = 0$ otherwise. Determine the posterior distribution of $\theta$.

*(Worked solution left blank in the notes.)*

<!-- page 4 -->
### 1.4 Conjugate Priors

> **Definition 1.2** (Conjugate Prior). For a given likelihood, if the prior and posterior distribution belong to the same family, this is said to be a **conjugate** prior distribution. In this case, posterior updating can be done simply by updating the parameters that correspond to the family.

### 1.5 Bernoulli Sampling

> **Theorem 1.2** (Beta-Bernoulli Updating). *Suppose that $X_1, \ldots, X_n$ form a random sample from the Bernoulli distribution with parameter $p$, which is unknown ($0 < p < 1$). Suppose also that the prior distribution of $p$ is the beta distribution with parameters $\alpha > 0$ and $\beta > 0$. Then the posterior distribution of $p$ given $x_1, \ldots, x_n$ is the beta distribution with parameters $\alpha + \sum_{i=1}^n x_i$ and $\beta + n - \sum_{i=1}^n x_i$.*

*Proof.* (blank in the notes) $\square$

**Example 1.2.** Suppose you have observed 10 independent flips of a coin, and observed 8 heads. Your prior distribution for $p$, the probability of heads is a uniform distribution (i.e., Beta(1,1)). What is the posterior distribution for $p$? What is the posterior mean? What is the posterior variance?

*(Worked solution left blank in the notes.)*

<!-- page 5 -->
### 1.6 Poisson Sampling

> **Theorem 1.3** (Gamma-Poisson Updating). *Suppose that $X_1, \ldots, X_n$ form a random sample from the Poisson distribution with parameter $\lambda$, which is unknown ($\lambda > 0$). Suppose also that the prior distribution of $\lambda$ is the gamma distribution with parameters $\alpha > 0$ and $\beta > 0$. Then the posterior distribution of $\lambda$ given $x_1, \ldots, x_n$ is the gamma distribution with parameters $\alpha + \sum_{i=1}^n x_i$ and $\beta + n$.*

*Proof.* (blank in the notes) $\square$

**Example 1.3.** A store owner models customer arrivals as Poisson with unknown rate $\lambda$ per hour. She assigns $\lambda$ a gamma prior distribution with parameters $\alpha = 3$ and $\beta = 2$. Let $X$ be the number of customers that arrive in a specific one-hour period. If $X = 3$ is observed, find the posterior distribution of $\lambda$. What is the prior variance? What is the posterior variance?

*(Worked solution left blank in the notes.)*

### 1.7 Normal Sampling

> **Theorem 1.4.** *Suppose that $X_1, \ldots, X_n$ form a random sample from a normal distribution for which the value of the mean $\mu$ is unknown and the value of the variance $\sigma^2 > 0$ is known. Suppose also that the prior distribution for $\mu$ is the normal distribution with mean $\mu_0$ and*

<!-- page 6 -->
> *variance $\sigma_0^2$. Then the posterior distribution of $\mu$ given $x_1, \ldots, x_n$ is the normal distribution with mean $\mu_1$ and variance $\sigma_1^2$ where*
> $$\mu_1 = \frac{\sigma^2 \mu_0 + n\sigma_0^2 \bar{x}_n}{\sigma^2 + n\sigma_0^2}$$
> *and*
> $$\sigma_1^2 = \frac{\sigma^2 \sigma_0^2}{\sigma^2 + n\sigma_0^2}.$$

**Example 1.4.** Allison, Heshka, Sepulveda, and Heymsfield (1993) sampled 20 nationally prepared foods and compared the stated calorie contents per gram from the labels to calorie contents determined in the laboratory. Suppose that we model the conditional distribution of the differences given $\mu$ as the normal distribution with mean $\mu$ and variance 100. We will use a prior distribution for $\mu$ that is the normal distribution with mean 0 and a variance of 60. The data comprise the collection of 20 differences whose average is 0.125. What is the posterior distribution of $\mu$?

*(Worked solution left blank in the notes.)*

### 1.8 Effect of the Prior

Consider the normal sampling case, where data points are sampled from a normal distribution with unknown mean $\mu$ and variance equal to 1. Suppose that 10 data points are sampled and the sample mean is 3. Consider three different normal prior distributions for $\mu$. All three priors are centered at zero, but the prior variances are 1/2, 1, and 5 respectively. The plot below illustrates the effect of the prior variance.

<!-- page 7 -->
*[Figure: "Effect of Prior Variance on Posterior Distribution". Three stacked panels (prior variance = 0.5, 1 and 5), each showing the prior (blue, centered at 0), the likelihood (red, centered at 3) and the posterior (green, shaded). With prior variance 0.5 the posterior sits near 2.5, with prior variance 1 it sits near 2.75, and with prior variance 5 it almost coincides with the likelihood near 3.]*

- When the sample size $n$ is small, the posterior mean will be closer to the prior mean.
- When the sample size is large, the posterior mean is pulled closer to the sample mean. This can be interpreted as giving more weight to the data.
- When the prior variance $\sigma_0^2$ is small, the prior has more influence on the posterior and the posterior mean will be pulled closer to the prior mean.
- As the sample size increases, the posterior variance decreases.
