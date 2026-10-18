---
source: lecture-notes/lecture-06-maximum-likelihood-properties.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 4
kind: lecture
---

<!-- page 1 -->
# Lecture 6: Maximum Likelihood Properties

STAT 132

## Contents

1. Maximum Likelihood (p. 2): Invariance (p. 2); Consistency (p. 3); Is the MLE unbiased? (p. 3)

<!-- page 2 -->
## 1 Maximum Likelihood

Maximum likelihood estimators have some nice properties that make them a valuable estimator. We will explore these properties below.

### 1.1 Invariance

> **Theorem 1.1.** *Let $\hat{\theta}$ be a maximum likelihood estimate of some parameter $\theta$. Also let $g(\theta)$ be any function of the parameter $\theta$. Then the maximum likelihood estimate of $g(\theta)$ is $g(\hat{\theta})$.*

This means that as long as we can compute an MLE for the parameter $\theta$, we get the MLE of any function of the parameter for "free". For example, medians and other quantiles are typically a function of the distribution parameters.

**Example 1.1.** Suppose you observe a random sample, $X_1, \ldots, X_n$, of wait times for a customer support center. These wait times are modeled as coming from an exponential distribution with parameter $\lambda$. What is the MLE of the average wait time?

*(Worked solution left blank in the notes.)*

**Example 1.2.** Suppose you observe a random sample, $X_1, \ldots, X_n$, of wait times for a customer support center. These wait times are modeled as coming from an exponential distribution with parameter $\lambda$. What is the MLE of the variance of the waiting times?

*(Worked solution left blank in the notes.)*

<!-- page 3 -->
**Example 1.3.** Suppose that $X_1, \ldots, X_n$ form a random sample from the uniform distribution on $[0, \theta]$, where $\theta > 0$ is unknown. Find the MLE of the median of the distribution.

*(Worked solution left blank in the notes.)*

### 1.2 Consistency

> **Theorem 1.2.** *Let $\hat{\theta}_n$ be the maximum likelihood estimate for some parameter $\theta$ using a sample size of $n$. Also, let $\theta_T$ represent the true unknown parameter value. Then, as $n \to \infty$, we have that $\hat{\theta}_n \xrightarrow{P} \theta_T$.*

This tells us that if you have a large enough sample size, the MLE will get very close to the true value of the parameter you're trying to estimate. In other words, as you collect more and more data, the MLE becomes a better and better approximation of the true parameter. In the limit (as the sample size becomes infinite), the MLE will give us the correct "answer".

### 1.3 Is the MLE unbiased?

One desirable property of estimators is unbiasedness. What exactly does this mean?

The **bias** of an estimator is the difference between its expected value (on average, what it estimates) and the true value of the parameter. Formally, for an estimator $\hat{\theta}$ of a parameter $\theta$, the bias is:
$$\mathrm{Bias}(\hat{\theta}) = \mathbb{E}[\hat{\theta}] - \theta.$$

- If $\mathrm{Bias}(\hat{\theta}) = 0$, the estimator is **unbiased**.
- If $\mathrm{Bias}(\hat{\theta}) \ne 0$, the estimator is **biased**.

<!-- page 4 -->
It turns out that the MLE is **not always unbiased**, especially for small sample sizes. However we saw previously that the MLE is **consistent**, meaning it converges to the true value of the parameter as the sample size grows. This means that the bias tends to zero as the sample size grows.

**Example 1.4.** Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. random variables from $U(0, \theta)$, where $\theta > 0$ is the unknown maximum. The MLE for $\theta$ is:
$$\hat{\theta} = \max(X_1, X_2, \ldots, X_n).$$
Is $\hat{\theta}$ unbiased? Calculate the expected value of $\hat{\theta}$.

*(Worked solution left blank in the notes.)*
