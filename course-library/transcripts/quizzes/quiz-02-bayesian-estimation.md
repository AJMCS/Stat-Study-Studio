---
source: quizzes/quiz-02-bayesian-estimation.pdf
method: transcribed from the PDF text layer (valid Unicode) and checked against page images
pages: 5
kind: answer-key
note: Contains answer keys. Keep out of general search so answers are never shown before a learner submits.
---

<!-- page 1 -->
# Bayesian Estimation: Questions 1-10

Beta-Binomial and Gamma-Poisson conjugacy, loss functions, and Bayes estimators. Correct choices are marked ✓.

## Question 1 · Multiple Answer

You have independent Bernoulli($p$) data, $X_1, \ldots, X_n$. The prior for $p$ is Beta($\alpha, \beta$). Which statements below are true? (Select all that apply)

- A. The posterior variance is always zero if $\alpha + \beta$ is very large
- ✓ B. The posterior mean is $(\alpha + \sum X_i) / [(\alpha + \sum X_i) + (\beta + n - \sum X_i)]$
- C. The posterior is Beta($\alpha + n, \beta$) regardless of the data
- ✓ D. If $\alpha = 1$ and $\beta = 1$, the prior is uniform on $[0, 1]$

**Answer: Statements 2 and 4.**

The Beta prior is conjugate to the Bernoulli likelihood, so the posterior is Beta($\alpha + \sum X_i$, $\beta + n - \sum X_i$): add successes to $\alpha$ and failures to $\beta$.

- 1 is false. A large $\alpha + \beta$ makes the posterior variance small but never exactly zero. Var of Beta($a, b$) $= ab / [(a+b)^2(a+b+1)] > 0$.
- 2 is true. The mean of Beta($a, b$) is $a/(a+b)$, which gives exactly this expression, simplifying to $(\alpha + \sum X_i) / (\alpha + \beta + n)$.
- 3 is false. That only happens if every observation is a success ($\sum X_i = n$).
- 4 is true. Beta(1, 1) has density proportional to $p^0(1-p)^0 = 1$ on $[0, 1]$.

## Question 2 · Multiple Choice

A random sample of $n = 12$ items is tested for defectives. Let $X_i = 1$ if the $i$-th item is defective and 0 otherwise, and suppose $\sum X_i = 5$. The prior for $\theta$, the proportion of defectives, is Beta(2, 3). What is the **posterior mean** for $\theta$?

- ✓ A. 7/17
- B. 7/15
- C. 12/17
- D. 2/5

**Answer: 7/17.** Posterior is Beta($2 + 5$, $3 + 12 - 5$) = Beta(7, 10), with mean $7/(7+10) = 7/17$.

Distractors: 2/5 is the prior mean, 7/15 leaves failures out of $\beta$, and 12/17 uses $n$ in place of the defect count.

<!-- page 2 -->
## Question 3 · Multiple Choice

Which of the following statements about a loss function $L(\theta, a)$ is **incorrect**?

- ✓ A. A loss function must be based on the squared difference $(\theta - a)^2$ to ensure non-negativity
- B. It measures how bad it is to estimate $\theta$ using $a$
- C. If we knew $\theta$, we could choose $a = \theta$ to suffer zero loss
- D. The expected prior loss is $\int L(\theta, a)\,\pi(\theta)\,d\theta$

**Answer: The first statement (it is the incorrect one).** Squared error is just one choice. Absolute error $|\theta - a|$, 0-1 loss, and asymmetric losses are all non-negative too. The Bayes estimator under absolute error is the posterior median. The other three are correct descriptions of a loss function.

## Question 4 · Multiple Choice

A website typically sees $\lambda$ clicks per hour. We place a Gamma(3, 1) prior on $\lambda$. Over a 2-hour period, we observe $X_1 = 5$ clicks in the first hour and $X_2 = 7$ in the second hour (total 12 clicks). What is the **Bayes estimate** of $\lambda$ under **squared error loss**?

- A. 3
- ✓ B. 5
- C. 6
- D. 4.67

**Answer: 5.** Under squared error loss the Bayes estimate is the posterior mean. Gamma is conjugate to Poisson: posterior is Gamma($\alpha + \sum X_i$, $\beta + n$) = Gamma($3 + 12$, $1 + 2$) = Gamma(15, 3). Posterior mean $= 15/3 = 5$. Compare with the prior mean (3) and sample mean/MLE (6): the estimate sits between them.

<!-- page 3 -->
## Question 5 · Multiple Choice

You are estimating the one-year return on Apple stock for options trading. Small errors are fine, but large errors could lose a lot of money, so you want to penalize big mistakes heavily. Choosing between squared error loss and absolute error loss, which is more appropriate?

- A. Absolute error loss, because it penalizes outliers more severely.
- B. Both penalize outliers equally.
- ✓ C. Squared error loss, because it penalizes larger deviations quadratically.
- D. Neither loss function has to do with deviations from the true return.

**Answer: Squared error loss.** Squared loss grows with the square of the miss; absolute loss grows linearly. A miss of 0.5 costs 0.25 vs 0.5, but a miss of 10 costs 100 vs 10. Small errors are treated gently and big ones harshly, matching the scenario. Absolute error is actually the more outlier-robust loss (its Bayes estimator is the posterior median).

## Question 6 · Multiple Choice

Which of the following is correct?

- A. The posterior is proportional to the prior times the marginal distribution of the data
- ✓ B. The posterior is proportional to the likelihood times the prior
- C. The marginal distribution of the data is proportional to the posterior times the likelihood
- D. The prior is proportional to the posterior times the likelihood

**Answer: Posterior $\propto$ likelihood $\times$ prior.** Bayes' theorem: $\pi(\theta \mid x) = f(x \mid \theta)\,\pi(\theta) / m(x)$, where $m(x) = \int f(x \mid \theta)\,\pi(\theta)\,d\theta$. Since $m(x)$ does not depend on $\theta$, it is a normalizing constant, so $\pi(\theta \mid x) \propto f(x \mid \theta)\,\pi(\theta)$.

<!-- page 4 -->
## Question 7 · Multiple Choice

In a Normal($\mu, \sigma^2$) model with **known** variance and a Normal($\mu_0, \sigma_0^2$) prior on $\mu$, what happens if the prior variance $\sigma_0^2$ is very large?

- A. The posterior mean is pulled strongly toward $\mu_0$
- B. The posterior variance is large, indicating high certainty
- C. The marginal distribution of the data cannot be computed
- ✓ D. The posterior mean is close to the sample mean

**Answer: The posterior mean is close to the sample mean.** Posterior mean $= [(1/\sigma_0^2)\mu_0 + (n/\sigma^2)\bar{x}] / [(1/\sigma_0^2) + (n/\sigma^2)]$. As $\sigma_0^2$ grows, the prior precision goes to 0, so the weight on $\mu_0$ vanishes and the posterior mean approaches $\bar{x}$. A vague prior lets the data dominate. Strong pull toward $\mu_0$ happens when $\sigma_0^2$ is small; large variance means low certainty; the marginal is still Normal and computable.

## Question 8 · Multiple Choice

A quality-control engineer inspects $n = 50$ electronic components and finds $k = 7$ defective. The unknown defect probability is $p$. The **prior** on $p$ is Beta(2, 2). Under **squared error loss**, what is the Bayes estimate of $p$?

- A. 8/52
- B. 1/2
- C. 7/50
- ✓ D. 9/54

**Answer: 9/54 ($= 1/6 \approx 0.167$).** Bayes estimate under squared error loss is the posterior mean. Posterior is Beta($2 + 7$, $2 + 50 - 7$) = Beta(9, 45), with mean $9/54$. Distractors: 1/2 is the prior mean, 7/50 is the MLE, and 8/52 corresponds to a Beta(1, 1) prior.

## Question 9 · Multiple Choice

A Bayes estimator under a loss function is defined to be the value that:

- ✓ A. Minimizes the expected posterior loss
- B. Minimizes the posterior distribution
- C. Maximizes the prior distribution
- D. Maximizes the likelihood

**Answer: Minimizes the expected posterior loss.** The Bayes estimator is the action $a$ minimizing $E[L(\theta, a) \mid x] = \int L(\theta, a)\,\pi(\theta \mid x)\,d\theta$. This gives the posterior mean under squared error and the posterior median under absolute error. Maximizing the likelihood gives the MLE instead.

<!-- page 5 -->
## Question 10 · Multiple Choice

A random sample of $n = 12$ items is tested for defectives, with $\sum X_i = 5$. The prior for $\theta$, the proportion of defectives, is Beta(2, 3). What is the **prior mean** for $\theta$?

- ✓ A. 2/5
- B. 3/5
- C. 1/25
- D. 2/3

**Answer: 2/5.** The prior mean depends only on the prior, so the data do not matter. For Beta($\alpha, \beta$), the mean is $\alpha/(\alpha + \beta) = 2/5$. 3/5 is the prior mean of $1 - \theta$, and 2/3 is $\alpha/\beta$, a common mix-up.
