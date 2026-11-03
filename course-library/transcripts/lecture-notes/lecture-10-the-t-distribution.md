---
source: lecture-notes/lecture-10-the-t-distribution.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 6
kind: lecture
---

<!-- page 1 -->
# Lecture 10: The $t$ Distribution

STAT 132

## Contents

1. The $t$ Distribution (p. 2): Definition and Properties (p. 2); Probability Density Function (p. 2); Visual Comparison (p. 3)
2. Relationship to Normal Sampling (p. 3): Key Idea (p. 3)
3. Examples (p. 4)
4. $t$ Table (p. 6)

<!-- page 2 -->
## 1 The $t$ Distribution

The t-distribution, often referred to as Student's t-distribution, plays a central role in statistical inference, especially when working with small sample sizes and unknown variances. Here, we will introduce the t-distribution, discuss its properties, and illustrate its connection to random samples from the normal distribution.

### 1.1 Definition and Properties

**Definition 1.1.** Let $Z \sim N(0, 1)$ and $Y \sim \chi^2_m$, where $Z$ and $Y$ are independent. The random variable
$$T = \frac{Z}{\sqrt{Y/m}} \tag{1}$$
follows a t-distribution with $m$ degrees of freedom (denoted as $T \sim t_m$).

**Key Properties**

- Symmetry: This distribution is symmetric about 0, similar to the standard normal distribution.
- Moments: If $m > k$ then $\mathbb{E}(|X|^k) < \infty$. If $m \le k$ then $\mathbb{E}(|X|^k) = \infty$.
  - For $m = 1$, the mean does not exist.
  - For $m > 1$, the mean is zero.
- Variance: For $m > 2$, $\mathrm{Var}(X) = \frac{m}{m-2}$.
- Heavier tails than the normal distribution, which decrease as degrees of freedom $m$ increase.
- As $m \to \infty$, the t-distribution converges to the standard normal distribution.

### 1.2 Probability Density Function

**Theorem 1.1.** The PDF of the $t$ distribution with $m$ degrees of freedom is
$$f(x|m) = \frac{\Gamma\left(\frac{m+1}{2}\right)}{\sqrt{m\pi}\,\Gamma(m/2)} \left(1 + \frac{x^2}{m}\right)^{-(m+1)/2}, \quad -\infty < x < \infty.$$

<!-- page 3 -->
### 1.3 Visual Comparison

[Figure: "Comparison of t-Distributions and Normal Distribution", densities on $x$ from $-4$ to $4$: the standard normal (peak 0.4), and $t$ with df = 2 (lowest peak, about 0.35, and the heaviest tails), df = 5 (peak about 0.38), and df = 30 (almost indistinguishable from the normal). The curves cross near $x = \pm 1.5$: the $t$ densities sit below the normal in the middle and above it in the tails.]

## 2 Relationship to Normal Sampling

### 2.1 Key Idea

**Theorem 2.1.** Suppose that $X_1, \ldots, X_n$ form a random sample from a normal distribution with mean $\mu$ and variance $\sigma^2$. Let $\bar{X}$ denote the sample mean and define
$$S^2 = \frac{1}{n-1}\sum_{i=1}^n (X_i - \bar{X})^2.$$
Then, the quantity
$$U = \frac{\sqrt{n}(\bar{X} - \mu)}{\sqrt{S^2}}$$
will follow the $t$ distribution with $n - 1$ degrees of freedom.

<!-- page 4 -->
*Proof.* Thm. 2.1

[Blank space for the proof, filled in during lecture.] □

## 3 Examples

**Example 3.1.** For $T \sim t_5$, find $P(-2 \le T \le 2)$.

◇

**Example 3.2.** Let $X_1, \ldots, X_{10} \sim N(50, 4)$. Compute the distribution of $\frac{\sqrt{10}(\bar{X} - 50)}{S}$.

◇

<!-- page 5 -->
**Example 3.3.** Suppose that a random sample of $n = 26$ rainfall measurements, $X_1, \ldots, X_n$, is taken from a normal distribution with unknown mean $\mu$ and unknown variance $\sigma^2$. We are interested in how far the sample mean $\bar{X}$ will be from the true mean $\mu$. We will use the quantity
$$U = \frac{\sqrt{n}(\bar{X} - \mu)}{\sqrt{S^2}}$$
here. Find the 90th percentile of $\bar{X}$ in terms of $\mu$ and $S^2$.

◇

**Example 3.4.** Suppose that we observe $n = 20$ cheese chunks with lactic acid concentrations $X_1, \ldots, X_n$ coming from a normal distribution with unknown mean $\mu$ and variance $\sigma^2$. Find a value of $c$ such that
$$\mathbb{P}\left(\bar{X} \le \mu + c\sqrt{S^2}\right)$$

◇

<!-- page 6 -->
## 4 $t$ Table

**Table of the $t$ Distribution.** If $X$ has a $t$ distribution with $m$ degrees of freedom, the table gives the value of $x$ such that $\Pr(X \le x) = p$.

| $m$ | $p = .55$ | $.60$ | $.65$ | $.70$ | $.75$ | $.80$ | $.85$ | $.90$ | $.95$ | $.975$ | $.99$ | $.995$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | .158 | .325 | .510 | .727 | 1.000 | 1.376 | 1.963 | 3.078 | 6.314 | 12.706 | 31.821 | 63.657 |
| 2 | .142 | .289 | .445 | .617 | .816 | 1.061 | 1.386 | 1.886 | 2.920 | 4.303 | 6.965 | 9.925 |
| 3 | .137 | .277 | .424 | .584 | .765 | .978 | 1.250 | 1.638 | 2.353 | 3.182 | 4.541 | 5.841 |
| 4 | .134 | .271 | .414 | .569 | .741 | .941 | 1.190 | 1.533 | 2.132 | 2.776 | 3.747 | 4.604 |
| 5 | .132 | .267 | .408 | .559 | .727 | .920 | 1.156 | 1.476 | 2.015 | 2.571 | 3.365 | 4.032 |
| 6 | .131 | .265 | .404 | .553 | .718 | .906 | 1.134 | 1.440 | 1.943 | 2.447 | 3.143 | 3.707 |
| 7 | .130 | .263 | .402 | .549 | .711 | .896 | 1.119 | 1.415 | 1.895 | 2.365 | 2.998 | 3.499 |
| 8 | .130 | .262 | .399 | .546 | .706 | .889 | 1.108 | 1.397 | 1.860 | 2.306 | 2.896 | 3.355 |
| 9 | .129 | .261 | .398 | .543 | .703 | .883 | 1.100 | 1.383 | 1.833 | 2.262 | 2.821 | 3.250 |
| 10 | .129 | .260 | .397 | .542 | .700 | .879 | 1.093 | 1.372 | 1.812 | 2.228 | 2.764 | 3.169 |
| 11 | .129 | .260 | .396 | .540 | .697 | .876 | 1.088 | 1.363 | 1.796 | 2.201 | 2.718 | 3.106 |
| 12 | .128 | .259 | .395 | .539 | .695 | .873 | 1.083 | 1.356 | 1.782 | 2.179 | 2.681 | 3.055 |
| 13 | .128 | .259 | .394 | .538 | .694 | .870 | 1.079 | 1.350 | 1.771 | 2.160 | 2.650 | 3.012 |
| 14 | .128 | .258 | .393 | .537 | .692 | .868 | 1.076 | 1.345 | 1.761 | 2.145 | 2.624 | 2.977 |
| 15 | .128 | .258 | .393 | .536 | .691 | .866 | 1.074 | 1.341 | 1.753 | 2.131 | 2.602 | 2.947 |
| 16 | .128 | .258 | .392 | .535 | .690 | .865 | 1.071 | 1.337 | 1.746 | 2.120 | 2.583 | 2.921 |
| 17 | .128 | .257 | .392 | .534 | .689 | .863 | 1.069 | 1.333 | 1.740 | 2.110 | 2.567 | 2.898 |
| 18 | .127 | .257 | .392 | .534 | .688 | .862 | 1.067 | 1.330 | 1.734 | 2.101 | 2.552 | 2.878 |
| 19 | .127 | .257 | .391 | .533 | .688 | .861 | 1.066 | 1.328 | 1.729 | 2.093 | 2.539 | 2.861 |
| 20 | .127 | .257 | .391 | .533 | .687 | .860 | 1.064 | 1.325 | 1.725 | 2.086 | 2.528 | 2.845 |
| 21 | .127 | .257 | .391 | .532 | .686 | .859 | 1.063 | 1.323 | 1.721 | 2.080 | 2.518 | 2.831 |
| 22 | .127 | .256 | .390 | .532 | .686 | .858 | 1.061 | 1.321 | 1.717 | 2.074 | 2.508 | 2.819 |
| 23 | .127 | .256 | .390 | .532 | .685 | .858 | 1.060 | 1.319 | 1.714 | 2.069 | 2.500 | 2.807 |
| 24 | .127 | .256 | .390 | .531 | .685 | .857 | 1.059 | 1.318 | 1.711 | 2.064 | 2.492 | 2.797 |
| 25 | .127 | .256 | .390 | .531 | .684 | .856 | 1.058 | 1.316 | 1.708 | 2.060 | 2.485 | 2.787 |
| 26 | .127 | .256 | .390 | .531 | .684 | .856 | 1.058 | 1.315 | 1.706 | 2.056 | 2.479 | 2.779 |
| 27 | .127 | .256 | .389 | .531 | .684 | .855 | 1.057 | 1.314 | 1.703 | 2.052 | 2.473 | 2.771 |
| 28 | .127 | .256 | .389 | .530 | .683 | .855 | 1.056 | 1.313 | 1.701 | 2.048 | 2.467 | 2.763 |
| 29 | .127 | .256 | .389 | .530 | .683 | .854 | 1.055 | 1.311 | 1.699 | 2.045 | 2.462 | 2.756 |
| 30 | .127 | .256 | .389 | .530 | .683 | .854 | 1.055 | 1.310 | 1.697 | 2.042 | 2.457 | 2.750 |
| 40 | .126 | .255 | .388 | .529 | .681 | .851 | 1.050 | 1.303 | 1.684 | 2.021 | 2.423 | 2.704 |
| 60 | .126 | .254 | .387 | .527 | .679 | .848 | 1.046 | 1.296 | 1.671 | 2.000 | 2.390 | 2.660 |
| 120 | .126 | .254 | .386 | .526 | .677 | .845 | 1.041 | 1.289 | 1.658 | 1.980 | 2.358 | 2.617 |
| $\infty$ | .126 | .253 | .385 | .524 | .674 | .842 | 1.036 | 1.282 | 1.645 | 1.960 | 2.326 | 2.576 |

Table III, "Table of the t Distribution" from STATISTICAL TABLES FOR BIOLOGICAL, AGRICULTURAL, AND MEDICAL RESEARCH by R.A. Fisher and F. Yates. © 1963 by Pearson Education, Ltd.
