---
source: lecture-notes/lecture-07-sampling-distributions.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 5
kind: lecture
---

<!-- page 1 -->
# Lecture 7: Sampling Distributions

STAT 132

## Contents

1. Sampling Distributions (p. 2): Definition (p. 2); Properties of Sampling Distributions (p. 2); Some MLE Sampling Distributions (p. 3); Visualizing a Sampling Distribution (p. 4)

<!-- page 2 -->
## 1 Sampling Distributions

### 1.1 Definition

Recall that a statistic is some function of the data
$$T = t(X_1, X_2, \ldots, X_n).$$
Quite often, we will use a statistic to estimate a population parameter. For example, all of the maximum likelihood estimates and Bayes estimators that we have looked at are statistics.

Before observing any data, we think of the data itself as random... it has some probability distribution. Since a statistic is just a function of the data, it is also random, with some distribution. Our goal now is to understand what distribution a given statistic will have.

> **Definition 1.1** (Sampling Distribution). Consider a random sample of data $X_1, \ldots, X_n$ from some distribution with unknown parameter $\theta$. Let $T = t(X_1, X_2, \ldots, X_n)$ be a statistic. Then, the probability distribution of $T$ is called the **sampling distribution** of $T$.

**Note:** A statistic is only a function of the data, $\mathbf{X}$, and not the parameter $\theta$. However, the sampling distribution of the statistics may still depend on $\theta$.

**Example 1.1.** Suppose we want to estimate the proportion $p$ of patients who do not relapse after treatment with a drug. If $X_1, X_2, \ldots, X_n$ are i.i.d. Bernoulli random variables representing relapse (1 = no relapse, 0 = relapse), the sample proportion $T = \frac{1}{n}\sum_{i=1}^{n} X_i$ is a statistic that can be used to estimate $p$. What is the sampling distribution of $T$?

*(Worked solution left blank in the notes.)*

### 1.2 Properties of Sampling Distributions

1. The sampling distribution provides insight into the variability of a statistic.
2. The standard deviation of the sampling distribution is called the **standard error**.
3. As the sample size $n$ increases, the sampling distribution of many statistics becomes approximately normal (Central Limit Theorem).

<!-- page 3 -->
### 1.3 Some MLE Sampling Distributions

Previously we saw that the MLE is a common point estimator with some useful properties. To better understand the MLE, it is useful to understand its sampling distribution.

**Example 1.2** (Normal Data). Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. random variables from $N(\mu, \sigma^2)$, where $\mu$ is unknown but $\sigma^2 > 0$ is known. Find the sampling distribution of $\hat{\mu}$, the MLE of $\mu$.

*(Worked solution left blank in the notes.)*

**Note:** We can see that as the sample size increases, the sampling variance of $\hat{\mu} = \bar{X}$ decreases. In other words, the estimator becomes more and more precise.

**Example 1.3** (Uniform Data). Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. from the uniform distribution over the interval $[0, \theta]$. Find the sampling distribution of $\hat{\theta} = \max(X_1, X_2, \ldots, X_n)$, the MLE of $\theta$. What is the mean of this sampling distribution?

*(Worked solution left blank in the notes.)*

<!-- page 4 -->
**Note:** We can see that as $n$ increases, the maximum $T$ tends to get closer to $\theta$.

### 1.4 Visualizing a Sampling Distribution

Consider again the example discussed earlier:

Suppose we want to estimate the proportion $p$ of patients who do not relapse after treatment with a drug. If $X_1, X_2, \ldots, X_n$ are i.i.d. Bernoulli random variables representing relapse (1 = no relapse, 0 = relapse), the sample proportion $T = \frac{1}{n}\sum_{i=1}^{n} X_i$ is a statistic that can be used to estimate $p$.

Below we consider different sample sizes (5, 10, 30, and 50) and different true values for $p$ (0.1, 0.3, and 0.5). We plot the PMF of the sampling distribution of $T$ as red dots, and we plot a normal approximation based on the CLT as the blue curve.

*[Figure: "Sampling Distribution of Sample Mean and CLT Approximation". A 3-by-4 grid of panels. Columns are sample size 5, 10, 30 and 50; rows are $p = 0.1$, 0.3 and 0.5. Each panel shows the sampling-distribution PMF as red dots with vertical lines and a blue normal-approximation curve. The distributions are right-skewed for $p = 0.1$ at small $n$ and become narrower and closer to the normal curve as $n$ increases.]*

- As the sample size $n$ increases, the sampling distribution becomes closer to a normal distribution.

<!-- page 5 -->
- For $p$ close to zero (or one) the sampling distribution is skewed and approaches normality more slowly
- As the sample size increases, the sampling distribution has lower variance
