---
source: lecture-notes/lecture-05-maximum-likelihood-estimation.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 5
kind: lecture
---

<!-- page 1 -->
# Lecture 5: Maximum Likelihood Estimation

STAT 132

## Contents

1. Maximum Likelihood (p. 2): Definition (p. 2); Procedure (p. 2); Examples (p. 2); Edge Cases (p. 4)

<!-- page 2 -->
## 1 Maximum Likelihood

We will now turn away from Bayesian inference and look at a common frequentist method for point estimation. Note that we will no longer use a prior distribution, and we are no longer viewing the parameters of interest as random variables. Instead, these are fixed unknown values.

### 1.1 Definition

> **Definition 1.1** (Maximum Likelihood Estimator). The **maximum likelihood estimator** is defined as
> $$\hat{\theta}(\mathbf{X}) = \arg_\theta \max L(\theta|\mathbf{X}),$$
> provided it exists. After $\mathbf{X} = \mathbf{x}$ is observed, $\hat{\theta}(\mathbf{x})$ is called the **maximum likelihood estimate** of $\theta$.

**Note:** We will often abbreviate "maximum likelihood estimate" as MLE.

### 1.2 Procedure

Because logarithms are monotonically increasing, the argument that maximizes the likelihood is the same as the argument that maximizes the log likelihood. Working with the log likelihood will often be mathematically convenient. This results in the following procedure that often works for finding an MLE.

1. Compute the log likelihood function: $\ell(\theta|\mathbf{x}) = \log[L(\theta|\mathbf{X})]$
2. Differentiate the log likelihood with respect to $\theta$ and set this equal to zero: $\dfrac{d}{d\theta}\ell(\theta|\mathbf{x}) = 0$
3. Solve this expression for $\theta$ - this is your candidate MLE ($\hat{\theta}$)
4. Check that $\dfrac{d^2}{d\theta^2}\ell(\theta|\mathbf{x})\Big|_{\hat{\theta}} < 0$ to ensure that this is a maximum and not a minimum

### 1.3 Examples

**Example 1.1.** Suppose you observe a random sample of size 3 from an exponential distribution with parameter $\theta$. The observed data are $X_1 = 3$, $X_2 = 1.5$, and $X_3 = 2.1$. Compute the MLE of $\theta$.

*(Worked solution left blank in the notes.)*

<!-- page 3 -->
**Example 1.2.** Suppose that $X_1, \ldots, X_n$ are a random sample from the Bernoulli distribution with parameter $p$. Find the maximum likelihood estimator for $p$?

*(Worked solution left blank in the notes.)*

**Example 1.3.** Suppose that $X_1, \ldots, X_n$ are a random sample from the Normal distribution with unknown mean $\mu$ and known variance $\sigma^2$. Find the maximum likelihood estimator for $\mu$?

*(Worked solution left blank in the notes.)*

<!-- page 4 -->
**Example 1.4.** The number of failures in a computer system in a day follows a Poisson distribution with parameter $\lambda$. You observe failures on 7 consecutive days: 3, 2, 4, 3, 5, 2, 3. Find the MLE for $\lambda$.

*(Worked solution left blank in the notes.)*

### 1.4 Edge Cases

In some cases, there may not be a local maximum within the parameter space. In other cases, there may be a local maximum within the parameter space, but a global maximum could lie on the edge of the parameter space. In this case, the previous procedure for finding the MLE will fail. Thus, it is good practice to consider the edges of the parameter space if applicable.

**Example 1.5.** Suppose that $X_1, \ldots, X_n$ form a random sample from the uniform distribution on $[0, \theta]$, where $\theta > 0$ is unknown. Find the MLE of $\theta$.

*(Worked solution left blank in the notes.)*

<!-- page 5 -->
**Example 1.6.** A random variable $X$ is modeled using the following PDF:
$$f(x|\theta) = \frac{2}{\theta^2}\,x \quad \text{for } 0 \le x \le \theta.$$
Suppose you observe the random sample $X_1, \ldots, X_n$. What is the MLE of $\theta$?

*(Worked solution left blank in the notes.)*
