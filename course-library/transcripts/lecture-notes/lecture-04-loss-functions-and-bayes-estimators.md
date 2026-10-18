---
source: lecture-notes/lecture-04-loss-functions-and-bayes-estimators.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 5
kind: lecture
---

<!-- page 1 -->
# Lecture 4: Loss Functions and Bayes Estimators

STAT 132

## Contents

1. Loss Functions (p. 2): Point Estimation (p. 2); Loss Functions (p. 2); Bayes Estimators (p. 2); Common Loss Functions (p. 3)
2. Finding Bayes Estimators (p. 3): Bayes Estimator for Squared Error Loss (p. 3); Bayes Estimator for Absolute Error Loss (p. 5)

<!-- page 2 -->
## 1 Loss Functions

We now understand the general idea behind Bayesian inference and the flow from prior to posterior distribution. However, we often want a point estimate for a parameter.

### 1.1 Point Estimation

> **Definition 1.1** (Point Estimator). Let $X_1, \ldots, X_n$ be observable data whose joint distribution is indexed by a parameter $\theta$ taking values in a subset $\Theta$ of the real line. A **point estimator** of the parameter $\theta$ is a real-valued function $\delta(X_1, \ldots, X_n)$. If $X_1 = x_1, \ldots, X_n = x_n$ are observed, then $\delta(x_1, \ldots, x_n)$ is called the **point estimate** of $\theta$.

We almost always would like our estimator $\delta(\mathbf{x})$ to give an estimate that is close to the true value of the parameter. Generally, the further away an estimate is from the truth, the less valuable the estimate is to us.

### 1.2 Loss Functions

> **Definition 1.2** (Loss Function). A **loss function** is a real-valued function of two variables, $L(\theta, a)$, where $\theta \in \Theta$ and $a$ is a real number. The interpretation is that the statistician "loses" by $L(\theta, a)$ if the parameter equals $\theta$ and the estimate equals $a$.

**Note:** We never actually know the true parameter value, so we don't know what the loss will be... if we did, we could just set the estimator to be the true value for zero loss. However, when we view the parameter as a random variable with a distribution, we can find the expected loss. For example, the expected prior loss is
$$\mathbb{E}[L(\theta, a)] = \int_\Theta L(\theta, a)\,\pi(\theta)\,d\theta.$$

### 1.3 Bayes Estimators

In practice, we are probably more interested in finding a good estimate after observing the data. In this case, we can consider the expected posterior loss
$$\mathbb{E}[L(\theta, a)\,|\,\mathbf{x}] = \int_\Theta L(\theta, a)\,\pi(\theta|\mathbf{x})\,d\theta.$$
Our goal will be to minimize this expected loss.

<!-- page 3 -->
> **Definition 1.3** (Bayes Estimator). Let $L(\theta, a)$ be a loss function. For each possible value $x$, let $\delta^*(\mathbf{x}) = a$ be such that $\mathbb{E}[L(\theta, a)\,|\,\mathbf{x}]$ is minimized. Then $\delta^*(\mathbf{x})$ is called a **Bayes estimator** of $\theta$. Once $\mathbf{X} = \mathbf{x}$ is observed, $\delta^*(\mathbf{x})$ is called a **Bayes estimate** of $\theta$.

### 1.4 Common Loss Functions

Once we have determined an appropriate loss function, we can find our Bayes estimator. Some common loss functions are given below.

> **Definition 1.4** (Squared Error Loss). The loss function
> $$L(\theta, a) = (\theta - a)^2$$
> is called **squared error loss**.

**Note:** Squared error loss is by far the most commonly used loss function.

> **Definition 1.5** (Absolute Error Loss). The loss function
> $$L(\theta, a) = |\theta - a|$$
> is called **absolute error loss**.

**Note:** Absolute error loss does not penalize extreme deviations as much as squared error loss.

## 2 Finding Bayes Estimators

### 2.1 Bayes Estimator for Squared Error Loss

> **Theorem 2.1** (Bayes Estimator for Squared Error Loss). *Let $\theta$ be a real-valued parameter. Suppose that the squared error loss function is used and that the posterior mean of $\theta$, $\mathbb{E}(\theta|\mathbf{x})$, is finite. Then, the Bayes estimator of $\theta$ is $\delta(\mathbf{X}) = \mathbb{E}(\theta|\mathbf{X})$.*

<!-- page 4 -->
**Example 2.1.** Let the random sample $X_1, \ldots, X_n$ be taken from the Bernoulli distribution with parameter $p$, which is unknown and must be estimated. Let the prior distribution of $p$ be the beta distribution with parameters $\alpha > 0$ and $\beta > 0$. Suppose that the squared error loss function is used. Determine the Bayes estimator of $p$.

*(Worked solution left blank in the notes.)*

**Example 2.2.** Suppose you have observed 10 independent flips of a coin, and observed 8 heads. Your prior distribution for $p$, the probability of heads is a uniform distribution. What is the Bayes estimate of $p$ under squared error loss?

*(Worked solution left blank in the notes.)*

**Example 2.3.** Allison, Heshka, Sepulveda, and Heymsfield (1993) sampled 20 nationally prepared foods and compared the stated calorie contents per gram from the labels to calorie contents determined in the laboratory. Suppose that we model the conditional distribution of the differences given $\mu$ as the normal distribution with mean $\mu$ and variance 100. We will use a prior distribution for $\mu$ that is the normal distribution with mean 0 and a variance of 60. The data comprise the collection of 20 differences whose average is 0.125. Under squared error loss, what is the Bayes estimate of $\mu$?

<!-- page 5 -->
**Example 2.4.** A store owner models customer arrivals as Poisson with unknown rate $\lambda$ per hour. She assigns $\lambda$ a gamma prior distribution with parameters $\alpha = 3$ and $\beta = 2$. Let $X$ be the number of customers that arrive in a specific one-hour period. If $X = 3$ is observed, find the Bayes estimate of $\lambda$ under squared error loss.

### 2.2 Bayes Estimator for Absolute Error Loss

> **Theorem 2.2** (Bayes Estimator for Absolute Error Loss). *Let $\theta$ be a real-valued parameter. Suppose that the absolute error loss function is used. Then, the Bayes estimator of $\theta$ is the posterior median.*

**Example 2.5.** Allison, Heshka, Sepulveda, and Heymsfield (1993) sampled 20 nationally prepared foods and compared the stated calorie contents per gram from the labels to calorie contents determined in the laboratory. Suppose that we model the conditional distribution of the differences given $\mu$ as the normal distribution with mean $\mu$ and variance 100. We will use a prior distribution for $\mu$ that is the normal distribution with mean 0 and a variance of 60. The data comprise the collection of 20 differences whose average is 0.125. Under absolute error loss, what is the Bayes estimate of $\mu$?
