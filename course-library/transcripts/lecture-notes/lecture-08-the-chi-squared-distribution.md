---
source: lecture-notes/lecture-08-the-chi-squared-distribution.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 8
kind: lecture
---

<!-- page 1 -->
# Lecture 8: The $\chi^2$ Distribution

STAT 132

## Contents

1. The $\chi^2$ (Chi-squared) Distribution (p. 2): Definition (p. 2); Visualizing the $\chi^2$ Distributions (p. 3); Relation to Gamma Distribution (p. 3); Relation to Normal Distribution (p. 4)
2. Applications (p. 5)
3. $\chi^2$ Table (p. 7)

<!-- page 2 -->
## 1 The $\chi^2$ (Chi-squared) Distribution

The chi-square ($\chi^2$) distribution is important for many statistics applications. It is often used to analyze variance, test hypotheses, and evaluate goodness-of-fit. Here, we will introduce this distribution and look at some of its properties.

### 1.1 Definition

**Definition 1.1.** A continuous random variable $X$ is said to follow a chi-square distribution with $m$ degrees of freedom if it has the following pdf:
$$f(x|m) = \frac{1}{2^{m/2}\Gamma(m/2)} x^{(m/2)-1} e^{-x/2}, \quad x > 0.$$
This is denoted as $X \sim \chi^2_m$.

**Key Properties:**

- **Mean:** $E(X) = m$.
- **Variance:** $\mathrm{Var}(X) = 2m$.
- **Additivity:** If $X_1 \sim \chi^2_{m_1}$ and $X_2 \sim \chi^2_{m_2}$, and $X_1$ is independent of $X_2$, then $X_1 + X_2 \sim \chi^2_{m_1+m_2}$. Conversely, if $X_3 \sim \chi^2_{m_1+m_2}$ with $X_1 \sim \chi^2_{m_1}$, $X_2 \sim \chi^2_{m_2}$, and $X_3 = X_1 + X_2$, then $X_1$ and $X_2$ must be independent.
- **Origin:** The chi-square distribution is the sum of independent squared standard normal variables: $Z_1^2 + Z_2^2 + \cdots + Z_m^2 \sim \chi^2_m$.

**Note:** Although the parameter $m$ (degrees of freedom) does not necessarily have to be an integer, in most cases it will be. We will see examples of this later.

<!-- page 3 -->
### 1.2 Visualizing the $\chi^2$ Distributions

[Figure: "Chi-Square Distributions by Degrees of Freedom", six density plots for $m = 1, 3, 5, 10, 30, 50$. For $m = 1$ the density starts near 2.0 at zero and falls steeply; for $m = 3$ it peaks around 0.24 near 1; for $m = 5$ it peaks around 0.15 near 3; for $m = 10$ it peaks near 8 (values 0 to 40); for $m = 30$ it is a nearly symmetric bump centered near 28 (values 0 to 80); for $m = 50$ a nearly symmetric bump centered near 48.]

The shape of the $\chi^2$ distribution changes with degrees of freedom:

- For $m = 1$, the distribution is heavily skewed.
- As $m$ increases, it becomes more symmetric, approaching a normal distribution.

### 1.3 Relation to Gamma Distribution

The pdf for the $\chi^2$ distribution should look very familiar. It is actually just a special case of the Gamma distribution where $\alpha = m/2$ and $\beta = 1/2$.

**Theorem 1.1.** Suppose $X \sim \chi^2_m$. Then, for some constant $c$, the random variable $Y = cX$ will have a $\mathrm{Gamma}\left(\frac{m}{2}, \frac{1}{2c}\right)$ distribution.

<!-- page 4 -->
### 1.4 Relation to Normal Distribution

**Theorem 1.2.** Suppose $X$ follows a standard normal distribution. Then the random variable $Y = X^2$ will follow the $\chi^2_1$ distribution.

This theorem, along with the additivity property of $\chi^2$ random variables, gives us a method to generate or sample $\chi^2$ random variables, using samples from a standard normal distribution. More specifically, if the random variables $X_1, \ldots, X_m$ are i.i.d. standard normal, then $\sum_{i=1}^m X_i^2 = X_1^2 + \cdots + X_m^2$ will follow a $\chi^2_m$ distribution.

**Example 1.1.** Below, we simulate 10,000 instances of $Y = X_1^2 + X_2^2 + X_3^2$, where $X_i \overset{iid}{\sim} N(0, 1)$, and compare the histogram to the theoretical $\chi^2_3$ density.

```r
set.seed(123)
simulated_chi2 <- replicate(10000, sum(rnorm(3)^2))
hist(simulated_chi2, probability = TRUE,
     main = "Simulated Chi-Square Distribution (df = 3)",
     xlab = "Value", ylim = c(0, 0.3))
curve(dchisq(x, df = 3), add = TRUE, col = "red", lwd = 2)
legend("topright", legend = c("Simulated", "Theoretical"),
       col = c("black", "red"), lwd = 2)
```

<!-- page 5 -->
[Figure: "Simulated Chi-Square Distribution (df = 3)": histogram of the 10,000 simulated values (0 to 20, density up to about 0.23) with the theoretical $\chi^2_3$ density drawn in red over it; the curve peaks near 1 and the histogram follows it closely.] ◇

## 2 Applications

**Example 2.1 (Variance Estimation).** Suppose that $X_1, \ldots, X_n$ form a random sample from a normal distribution with known mean $\mu$ and unknown variance $\sigma^2$. Then, the MLE for $\sigma^2$ is
$$\widehat{\sigma^2} = \frac{1}{n}\sum_{i=1}^n (X_i - \mu)^2.$$
Find the distribution of $n\widehat{\sigma^2}/\sigma^2$.

<!-- page 6 -->
◇

**Example 2.2.** Consider the same setup as the previous example. Now, find the sampling distribution of $\widehat{\sigma^2}$.

◇

**Example 2.3 (Sampling Distribution of Variance).** A manufacturer measures the weights $X_1, \ldots, X_n$ of $n = 10$ boxes of cereal. It is known that the cereal boxes are normally distributed and have a mean weight of $\mu = 12$ ounces. The manufacturer is interested in estimating the variance of this distribution. Accordingly, they calculated the MLE:
$$\widehat{\sigma^2} = \frac{1}{10}\sum_{i=1}^{10} (X_i - 12)^2.$$
Suppose that the true variance was actually $\sigma^2 = 0.25$. Find the probability that the MLE is between 0.2 and 0.4.

◇

<!-- page 7 -->
## 3 $\chi^2$ Table

**Table of the $\chi^2$ Distribution.** If $X$ has a $\chi^2$ distribution with $m$ degrees of freedom, this table gives the value of $x$ such that $\Pr(X \le x) = p$, the $p$ quantile of $X$.

| $m$ | $p = .005$ | $.01$ | $.025$ | $.05$ | $.10$ | $.20$ | $.25$ | $.30$ | $.40$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | .0000 | .0002 | .0010 | .0039 | .0158 | .0642 | .1015 | .1484 | .2750 |
| 2 | .0100 | .0201 | .0506 | .1026 | .2107 | .4463 | .5754 | .7133 | 1.022 |
| 3 | .0717 | .1148 | .2158 | .3518 | .5844 | 1.005 | 1.213 | 1.424 | 1.869 |
| 4 | .2070 | .2971 | .4844 | .7107 | 1.064 | 1.649 | 1.923 | 2.195 | 2.753 |
| 5 | .4117 | .5543 | .8312 | 1.145 | 1.610 | 2.343 | 2.675 | 3.000 | 3.655 |
| 6 | .6757 | .8721 | 1.237 | 1.635 | 2.204 | 3.070 | 3.455 | 3.828 | 4.570 |
| 7 | .9893 | 1.239 | 1.690 | 2.167 | 2.833 | 3.822 | 4.255 | 4.671 | 5.493 |
| 8 | 1.344 | 1.647 | 2.180 | 2.732 | 3.490 | 4.594 | 5.071 | 5.527 | 6.423 |
| 9 | 1.735 | 2.088 | 2.700 | 3.325 | 4.168 | 5.380 | 5.899 | 6.393 | 7.357 |
| 10 | 2.156 | 2.558 | 3.247 | 3.940 | 4.865 | 6.179 | 6.737 | 7.267 | 8.295 |
| 11 | 2.603 | 3.053 | 3.816 | 4.575 | 5.578 | 6.989 | 7.584 | 8.148 | 9.237 |
| 12 | 3.074 | 3.571 | 4.404 | 5.226 | 6.304 | 7.807 | 8.438 | 9.034 | 10.18 |
| 13 | 3.565 | 4.107 | 5.009 | 5.892 | 7.042 | 8.634 | 9.299 | 9.926 | 11.13 |
| 14 | 4.075 | 4.660 | 5.629 | 6.571 | 7.790 | 9.467 | 10.17 | 10.82 | 12.08 |
| 15 | 4.601 | 5.229 | 6.262 | 7.261 | 8.547 | 10.31 | 11.04 | 11.72 | 13.03 |
| 16 | 5.142 | 5.812 | 6.908 | 7.962 | 9.312 | 11.15 | 11.91 | 12.62 | 13.98 |
| 17 | 5.697 | 6.408 | 7.564 | 8.672 | 10.09 | 12.00 | 12.79 | 13.53 | 14.94 |
| 18 | 6.265 | 7.015 | 8.231 | 9.390 | 10.86 | 12.86 | 13.68 | 14.43 | 15.89 |
| 19 | 6.844 | 7.633 | 8.907 | 10.12 | 11.65 | 13.72 | 14.56 | 15.35 | 16.85 |
| 20 | 7.434 | 8.260 | 9.591 | 10.85 | 12.44 | 14.58 | 15.45 | 16.27 | 17.81 |
| 21 | 8.034 | 8.897 | 10.28 | 11.59 | 13.24 | 15.44 | 16.34 | 17.18 | 18.77 |
| 22 | 8.643 | 9.542 | 10.98 | 12.34 | 14.04 | 16.31 | 17.24 | 18.10 | 19.73 |
| 23 | 9.260 | 10.20 | 11.69 | 13.09 | 14.85 | 17.19 | 18.14 | 19.02 | 20.69 |
| 24 | 9.886 | 10.86 | 12.40 | 13.85 | 15.66 | 18.06 | 19.04 | 19.94 | 21.65 |
| 25 | 10.52 | 11.52 | 13.12 | 14.61 | 16.47 | 18.94 | 19.94 | 20.87 | 22.62 |
| 30 | 13.79 | 14.95 | 16.79 | 18.49 | 20.60 | 23.36 | 24.48 | 25.51 | 27.44 |
| 40 | 20.71 | 22.16 | 24.43 | 26.51 | 29.05 | 32.34 | 33.66 | 34.87 | 36.16 |
| 50 | 27.99 | 29.71 | 32.36 | 34.76 | 37.69 | 41.45 | 42.94 | 44.31 | 46.86 |
| 60 | 35.53 | 37.48 | 40.48 | 43.19 | 46.46 | 50.64 | 52.29 | 53.81 | 56.62 |
| 70 | 43.27 | 45.44 | 48.76 | 51.74 | 55.33 | 59.90 | 61.70 | 63.35 | 66.40 |
| 80 | 51.17 | 53.54 | 57.15 | 60.39 | 64.28 | 69.21 | 71.14 | 72.92 | 76.19 |
| 90 | 59.20 | 61.75 | 65.65 | 69.13 | 73.29 | 78.56 | 80.62 | 82.51 | 85.99 |
| 100 | 67.33 | 70.06 | 74.22 | 77.93 | 82.86 | 87.95 | 90.13 | 92.13 | 95.81 |

"Table of the $\chi^2$ Distribution" adapted in part from "A new table of percentage points of the chi-square distribution" by H. Leon Harter. From BIOMETRIKA, vol 51 (1964), pp. 231–239. "Table of the $\chi^2$ Distribution" adapted in part from the BIOMETRIKA TABLES FOR STATISTICIANS, Vol. 1, 3rd ed., Cambridge University Press, © 1966, edited by E.S. Pearson and H.O. Hartley.

<!-- page 8 -->
**Table of the $\chi^2$ Distribution (continued).** The same rows ($m$ degrees of freedom, in the same order as the previous page: 1 to 25, then 30, 40, 50, 60, 70, 80, 90, 100), for the upper quantiles $p$.

| $m$ | $p = .50$ | $.60$ | $.70$ | $.75$ | $.80$ | $.90$ | $.95$ | $.975$ | $.99$ | $.995$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | .4549 | .7083 | 1.074 | 1.323 | 1.642 | 2.706 | 3.841 | 5.024 | 6.635 | 7.879 |
| 2 | 1.386 | 1.833 | 2.408 | 2.773 | 3.219 | 4.605 | 5.991 | 7.378 | 9.210 | 10.60 |
| 3 | 2.366 | 2.946 | 3.665 | 4.108 | 4.642 | 6.251 | 7.815 | 9.348 | 11.34 | 12.84 |
| 4 | 3.357 | 4.045 | 4.878 | 5.385 | 5.989 | 7.779 | 9.488 | 11.14 | 13.28 | 14.86 |
| 5 | 4.351 | 5.132 | 6.064 | 6.626 | 7.289 | 9.236 | 11.07 | 12.83 | 15.09 | 16.75 |
| 6 | 5.348 | 6.211 | 7.231 | 7.841 | 8.558 | 10.64 | 12.59 | 14.45 | 16.81 | 18.55 |
| 7 | 6.346 | 7.283 | 8.383 | 9.037 | 9.803 | 12.02 | 14.07 | 16.01 | 18.48 | 20.28 |
| 8 | 7.344 | 8.351 | 9.524 | 10.22 | 11.03 | 13.36 | 15.51 | 17.53 | 20.09 | 21.95 |
| 9 | 8.343 | 9.414 | 10.66 | 11.39 | 12.24 | 14.68 | 16.92 | 19.02 | 21.67 | 23.59 |
| 10 | 9.342 | 10.47 | 11.78 | 12.55 | 13.44 | 15.99 | 18.31 | 20.48 | 23.21 | 25.19 |
| 11 | 10.34 | 11.53 | 12.90 | 13.70 | 14.63 | 17.27 | 19.68 | 21.92 | 24.72 | 26.76 |
| 12 | 11.34 | 12.58 | 14.01 | 14.85 | 15.81 | 18.55 | 21.03 | 23.34 | 26.22 | 28.30 |
| 13 | 12.34 | 13.64 | 15.12 | 15.98 | 16.98 | 19.81 | 22.36 | 24.74 | 27.69 | 29.82 |
| 14 | 13.34 | 14.69 | 16.22 | 17.12 | 18.15 | 21.06 | 23.68 | 26.12 | 29.14 | 31.32 |
| 15 | 14.34 | 15.73 | 17.32 | 18.25 | 19.31 | 22.31 | 25.00 | 27.49 | 30.58 | 32.80 |
| 16 | 15.34 | 16.78 | 18.42 | 19.37 | 20.47 | 23.54 | 26.30 | 28.85 | 32.00 | 34.27 |
| 17 | 16.34 | 17.82 | 19.51 | 20.49 | 21.61 | 24.77 | 27.59 | 30.19 | 33.41 | 35.72 |
| 18 | 17.34 | 18.87 | 20.60 | 21.60 | 22.76 | 25.99 | 28.87 | 31.53 | 34.81 | 37.16 |
| 19 | 18.34 | 19.91 | 21.69 | 22.72 | 23.90 | 27.20 | 30.14 | 32.85 | 36.19 | 38.58 |
| 20 | 19.34 | 20.95 | 22.77 | 23.83 | 25.04 | 28.41 | 31.41 | 34.17 | 37.57 | 40.00 |
| 21 | 20.34 | 21.99 | 23.86 | 24.93 | 26.17 | 29.62 | 32.67 | 35.48 | 38.93 | 41.40 |
| 22 | 21.34 | 23.03 | 24.94 | 26.04 | 27.30 | 30.81 | 33.92 | 36.78 | 40.29 | 42.80 |
| 23 | 22.34 | 24.07 | 26.02 | 27.14 | 28.43 | 32.01 | 35.17 | 38.08 | 41.64 | 44.18 |
| 24 | 23.34 | 25.11 | 27.10 | 28.24 | 29.55 | 33.20 | 36.42 | 39.36 | 42.98 | 45.56 |
| 25 | 24.34 | 26.14 | 28.17 | 29.34 | 30.68 | 34.38 | 37.65 | 40.65 | 44.31 | 46.93 |
| 30 | 29.34 | 31.32 | 33.53 | 34.80 | 36.25 | 40.26 | 43.77 | 46.98 | 50.89 | 53.67 |
| 40 | 39.34 | 41.62 | 44.16 | 45.62 | 47.27 | 51.81 | 55.76 | 59.34 | 63.69 | 66.77 |
| 50 | 49.33 | 51.89 | 54.72 | 56.33 | 58.16 | 63.17 | 67.51 | 71.42 | 76.15 | 79.49 |
| 60 | 59.33 | 62.13 | 65.23 | 66.98 | 68.97 | 74.40 | 79.08 | 83.30 | 88.38 | 91.95 |
| 70 | 69.33 | 72.36 | 75.69 | 77.58 | 79.71 | 85.53 | 90.53 | 95.02 | 100.4 | 104.2 |
| 80 | 79.33 | 82.57 | 86.12 | 88.13 | 90.41 | 96.58 | 101.9 | 106.6 | 112.3 | 116.3 |
| 90 | 89.33 | 92.76 | 96.52 | 98.65 | 101.1 | 107.6 | 113.1 | 118.1 | 124.1 | 128.3 |
| 100 | 99.33 | 102.9 | 106.9 | 109.1 | 111.7 | 118.5 | 124.3 | 129.6 | 135.8 | 140.2 |
