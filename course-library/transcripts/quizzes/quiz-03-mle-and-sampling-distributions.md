---
source: quizzes/quiz-03-mle-and-sampling-distributions.pdf
method: transcribed from the PDF text layer (valid Unicode) and checked against page images
pages: 5
kind: answer-key
note: Contains answer keys. Keep out of general search so answers are never shown before a learner submits.
---

<!-- page 1 -->
# MLE & Sampling Distributions

Quiz review · 10 questions with answers and explanations

## Answer Key

| Q | Answer |
| --- | --- |
| 1 | 2 |
| 2 | False |
| 3 | Increasing the sample size. |
| 4 | $\sigma / \sqrt{n}$ |
| 5 | $(1/n) \sum X_i$ |
| 6 | It describes how likely the observed data are for given parameter values. |
| 7 | $p(1-p) / n$ |
| 8 | It must be negative at the candidate point. |
| 9 | 0.5 |
| 10 | It gets closer to $\theta$. |

## Question 1 · Multiple Choice

Suppose the length of fish caught is modeled as normally distributed with mean $\mu$ and variance $\sigma^2$, where both parameters are unknown. You collect a sample of size $n = 10$ and calculate the MLEs $\hat\mu = 5$ and $\hat\sigma^2 = 4$. What is the MLE for the standard deviation of fish length?

- A. $\sqrt{4/10}$
- B. $4/10$
- ✓ C. 2
- D. 4

**Answer: 2.** By the **invariance property of MLEs**, if $\hat\theta$ is the MLE of $\theta$, then $g(\hat\theta)$ is the MLE of $g(\theta)$. Since $\sigma = \sqrt{\sigma^2}$:
$$\hat\sigma = \sqrt{\hat\sigma^2} = \sqrt{4} = 2$$
The $1/n$ factor is already built into $\hat\sigma^2$, so dividing by 10 again is wrong. $\sqrt{4/10}$ looks more like a standard error, which is a different quantity.

<!-- page 2 -->
## Question 2 · True or False

An important property that MLEs have is that they are always unbiased.

- A. True
- ✓ B. False

**Answer: False.** MLEs are not guaranteed to be unbiased. The normal variance MLE divides by $n$:
$$\hat\sigma^2 = \tfrac{1}{n}\sum (X_i - \bar{X})^2, \qquad E[\hat\sigma^2] = \tfrac{n-1}{n}\sigma^2$$
so it underestimates $\sigma^2$ (which is why $s^2$ uses $n - 1$). Under regularity conditions, MLEs are **consistent**, **asymptotically unbiased**, **asymptotically normal**, and **asymptotically efficient**. Invariance also breaks unbiasedness in general, since $E[\sqrt{X}] \ne \sqrt{E[X]}$.

## Question 3 · Multiple Choice

Which of the following factors reduces the variance of a sampling distribution?

- ✓ A. Increasing the sample size.
- B. Increasing the population size.
- C. Decreasing the sample size.
- D. None of the above.

**Answer: Increasing the sample size.** $\mathrm{Var}(\bar{X}) = \sigma^2 / n$. Larger $n$ shrinks the variance; smaller $n$ inflates it. Population size does not appear in the standard formula. (With the finite population correction, a larger population would slightly *increase* the variance, not reduce it.)

## Question 4 · Multiple Choice

What is the standard error of the sample mean for $n$ i.i.d. observations $X_1, \ldots, X_n$ from $N(\mu, \sigma^2)$?

- A. $\sigma^2 / \sqrt{n}$
- B. $\sigma^2 / n$
- C. $\sigma / n$
- ✓ D. $\sigma / \sqrt{n}$

**Answer: $\sigma / \sqrt{n}$.** The standard error is the standard deviation of the estimator's sampling distribution:
$$\mathrm{SE}(\bar{X}) = \sqrt{\mathrm{Var}(\bar{X})} = \sqrt{\sigma^2/n} = \sigma / \sqrt{n}$$
Watch out for $\sigma^2/n$: that is the *variance* of $\bar{X}$, not its standard error.

<!-- page 3 -->
## Question 5 · Multiple Choice

Suppose a (possibly weighted) die is rolled $n$ times, and the probability of rolling a six is $\theta$. The outcomes are recorded as $X_1, \ldots, X_n$ where $X_i = 1$ if a six is rolled and 0 otherwise. What is the MLE for $\theta$?

- A. $(\sum X_i) / (6n)$
- B. None of the above
- C. $(6/n) \sum X_i$
- ✓ D. $(1/n) \sum X_i$

**Answer: $(1/n) \sum X_i$.** Each $X_i \sim$ Bernoulli($\theta$), so
$$L(\theta) = \theta^{\sum X_i}(1-\theta)^{n - \sum X_i}$$
$$\ell'(\theta) = \sum X_i/\theta - (n - \sum X_i)/(1-\theta) = 0 \implies \hat\theta = \sum X_i / n$$
The MLE is just the proportion of sixes. The "6" options are distractors: $\theta$ is already defined as $P(\text{six})$, so the number of faces never enters.

## Question 6 · Multiple Choice

What is the role of the likelihood function in MLE?

- A. It provides a Bayesian posterior distribution.
- B. It evaluates the probability of parameters given the observed data.
- ✓ C. It describes how likely the observed data are for given parameter values.
- D. It minimizes the data's variance.

**Answer: It describes how likely the observed data are for given parameter values.** $L(\theta) = f(x_1, \ldots, x_n \mid \theta)$, viewed as a function of $\theta$. MLE picks the $\theta$ that makes the observed data most probable. "Probability of parameters given data" is $P(\theta \mid \text{data})$, the Bayesian posterior, which requires a prior. The likelihood goes the other direction and does not need to integrate to 1 over $\theta$.

<!-- page 4 -->
## Question 7 · Multiple Choice

If $X_1, \ldots, X_n$ are i.i.d. Bernoulli random variables with parameter $p$, what is the variance of the sampling distribution of the sample proportion $T = (1/n) \sum X_i$?

- ✓ A. $p(1-p) / n$
- B. $p / n$
- C. $p(1-p)$
- D. $p / ((1-p)\,n)$

**Answer: $p(1-p) / n$.** $\mathrm{Var}(X_i) = p(1-p)$, and by independence:
$$\mathrm{Var}(T) = (1/n^2) \cdot n \cdot p(1-p) = p(1-p) / n$$
Same $\sigma^2/n$ pattern as Q3, with $\sigma^2 = p(1-p)$. The $p(1-p)$ option is the variance of a single observation.

## Question 8 · Multiple Choice

Assuming no edge cases, what condition must the second derivative of the log likelihood satisfy to ensure the candidate MLE is a maximum?

- A. It must be positive at the candidate point.
- B. It must be undefined.
- C. It must equal zero.
- ✓ D. It must be negative at the candidate point.

**Answer: It must be negative at the candidate point.** Second derivative test: $\ell'(\hat\theta) = 0$ finds a critical point, and $\ell''(\hat\theta) < 0$ means the log likelihood is concave down there, so $\hat\theta$ is a maximum. Positive means a minimum; zero is inconclusive. Bernoulli check: $\ell''(\theta) = -\sum X_i/\theta^2 - (n - \sum X_i)/(1-\theta)^2 < 0$.

<!-- page 5 -->
## Question 9 · Multiple Choice

In estimating the mean height of trees, a forester takes 40 measurements. If the true population distribution is $N(20, 25)$, what is the probability that the sample mean is less than the true mean?

- A. None of the above.
- B. 0.68
- C. 0.95
- D. 0.99
- ✓ E. 0.5

**Answer: 0.5.** $\bar{X} \sim N(20, 25/40)$, $P(\bar{X} < 20) = P(Z < 0) = 0.5$. $\bar{X}$ is centered exactly at $\mu$ and the normal is symmetric. The sample size and variance only change the spread, not the center. 0.68 / 0.95 / 0.99 are empirical-rule distractors.

## Question 10 · Multiple Choice

The maximum of $n$ i.i.d. random variables $X_1, \ldots, X_n$ from a uniform distribution over $[0, \theta]$ is used to estimate $\theta$. What happens to the expectation of this estimator as $n$ increases?

- A. The behavior is different for different values of $\theta$.
- ✓ B. It gets closer to $\theta$.
- C. It gets further from $\theta$.
- D. It is equal to $\theta$.
- E. It stays constant.

**Answer: It gets closer to $\theta$.** For $M = \max(X_i)$: $P(M \le m) = (m/\theta)^n$, so $f(m) = n\,m^{n-1}/\theta^n$ on $[0, \theta]$.
$$E[M] = \int_0^\theta m \cdot n\,m^{n-1}/\theta^n\,dm = \frac{n}{n+1}\,\theta \to \theta$$
Biased low for every finite $n$ (the max can never exceed $\theta$), but asymptotically unbiased. This max is the MLE for $\theta$, another example for Q2. Scaling by $(n+1)/n$ makes it unbiased.
