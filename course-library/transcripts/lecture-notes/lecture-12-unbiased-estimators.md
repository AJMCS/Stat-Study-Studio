---
source: lecture-notes/lecture-12-unbiased-estimators.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 6
kind: lecture
---

<!-- page 1 -->
# Lecture 12: Unbiased Estimators

STAT 132

## Contents

1. Unbiasedness (p. 2): Definitions (p. 2); Examples (p. 2)
2. Mean Squared Error (p. 4): Definition (p. 4); Example (p. 6)

<!-- page 2 -->
## 1 Unbiasedness

### 1.1 Definitions

We have seen many example of (point) estimators up to this point. A desirable property for an estimator is **unbiasedness**, which ensures that, on average, the estimator equals the true parameter value.

**Definition 1.1.** An estimator $\delta(\mathbf{X})$ of a parameter $\theta$ is said to be **unbiased** if:
$$\mathbb{E}[\delta(\mathbf{X})] = \theta, \quad \forall\theta.$$
That is, its expected value is equal to the true parameter for all possible values.

Unbiased estimators do not systematically overestimate or underestimate the parameter. However, unbiasedness alone is not sufficient to ensure a good estimator. For example, an estimator might be unbiased but have extremely high variance. Such an estimator would not be very useful.

**Definition 1.2.** The **bias** of an estimator $\delta(\mathbf{X})$ is defined as:
$$\mathrm{Bias}(\delta) = \mathbb{E}[X)] - \theta.$$
If $\mathrm{Bias}(\delta) = 0$, the estimator is unbiased. Otherwise, it is biased.

### 1.2 Examples

**Example 1.1.** Let $X_1, X_2, \ldots, X_n$ be a random sample from some population distribution with an unknown and finite mean $\mu$. Show that the sample mean
$$\bar{X} = \frac{1}{n}\sum_{i=1}^n X_i$$
is an unbiased estimator for $\mu$.

◇

<!-- page 3 -->
**Example 1.2.** Given a random sample $X_1, X_2, \ldots, X_n$ from some population distribution with finite mean $\mu$ and finite variance $\sigma^2$, show that
$$S^2 = \frac{1}{n-1}\sum_{i=1}^n (X_i - \bar{X})^2.$$
is an unbiased estimator for $\sigma^2$.

◇

<!-- page 4 -->
**Example 1.3.** Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. from a uniform distribution over the interval $[0, \theta]$. Find an unbiased estimator of $\theta$.

◇

## 2 Mean Squared Error

### 2.1 Definition

As mentioned earlier, even if an estimator is unbiased, it may still have a high variance. The mean squared error is another commonly used criteria that measures the estimator's accuracy and precision.

**Definition 2.1.** Suppose that $\delta(\mathbf{X})$ is an estimator for some parameter $\theta$. Then, the **mean squared error** (MSE) of $\delta(\mathbf{X})$ is defined as
$$\mathbb{E}[(\delta(\mathbf{X}) - \theta)^2].$$

**Theorem 2.1.** The MSE of an estimator can be decomposed as
$$\mathbb{E}[(\delta(\mathbf{X}) - \theta)^2] = \mathrm{Var}(\delta(\mathbf{X})) + \mathrm{Bias}^2(\delta(\mathbf{X})).$$

<!-- page 5 -->
*Proof.* Thm. 2.1

[Blank space for the proof, filled in during lecture.] □

Thus, the MSE can be interpreted as having two components:

1. The first component is the variance of the estimator, measuring how precise it is.
2. The second component involves bias, measuring how accurate the estimator is.

Notice that for unbiased estimators, $\mathrm{Bias}^2(\delta(\mathbf{X})) = 0$, so:
$$\mathrm{MSE}(\delta(\mathbf{X})) = \mathrm{Var}(\delta(\mathbf{X})).$$

[Figure: "Mean Squared Error Decomposition: Bias-Variance Tradeoff", four histograms of estimates (counts, values 0 to 14) each with a dashed red line at the true parameter $\theta = 5$. "Unbiased, Low Variance": a tall narrow peak centered on 5. "Unbiased, High Variance": a wide bell centered on 5. "Biased, Low Variance": a narrow peak centered near 7, to the right of $\theta$. "Biased, High Variance": a wide bell centered near 7.]

<!-- page 6 -->
### 2.2 Example

**Example 2.1.** Suppose that $X_1, \ldots, X_n$ form a random sample from the normal distribution with unknown mean $\mu$ and unknown variance $\sigma^2$. Let $\widehat{\sigma^2_1}$ and $\widehat{\sigma^2_2}$ be the two estimators of $\sigma^2$, which are defined as follows:
$$\widehat{\sigma^2_1} = \frac{1}{n}\sum_{i=1}^n (X_i - \bar{X})^2 \quad \text{and} \quad \widehat{\sigma^2_2} = \frac{1}{n-1}\sum_{i=1}^n (X_i - \bar{X})^2.$$
Which estimator has lower MSE?

◇
