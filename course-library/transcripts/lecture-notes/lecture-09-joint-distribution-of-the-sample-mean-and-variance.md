---
source: lecture-notes/lecture-09-joint-distribution-of-the-sample-mean-and-variance.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 8
kind: lecture
---

<!-- page 1 -->
# Lecture 9: The Joint Distribution of the Sample Mean and Variance

STAT 132

## Contents

1. The Sample Mean and Variance (p. 2): Key Results (p. 2); Distribution of the Sample Mean (p. 4); Distribution of the Sample Variance (p. 5); Independence (p. 6)

<!-- page 2 -->
## 1 The Sample Mean and Variance

The normal distribution is the most commonly used distribution. Many natural random phenomena such as heights, test scores, crop yields, rainfall, etc. tend to be approximated well by a Normal distribution. Our goal here is to better understand estimation in this setting.

Consider the setting where we observe a random sample from a Normal distribution with mean $\mu$ and variance $\sigma^2$, where both of these parameters are unknown. Then, the maximum likelihood estimators are the sample mean,
$$\hat{\mu} = \bar{X} = \frac{1}{n}\sum_{i=1}^n X_i$$
and the sample variance,
$$\widehat{\sigma^2} = \frac{1}{n}\sum_{i=1}^n (X_i - \hat{\mu})^2.$$
We want to see how these statistics behave when we take a random sample from a normal distribution. That is, we want to study the sampling distribution of these estimators. Note that we are jointly estimating two quantities here, so this sampling distribution will be a joint distribution.

### 1.1 Key Results

**Theorem 1.1.** Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. random variables from $N(\mu, \sigma^2)$. Then:

1. The sample mean, $\hat{\mu} = \bar{X} = \frac{1}{n}\sum_{i=1}^n X_i$, follows a normal distribution:
$$\bar{X} \sim N\left(\mu, \frac{\sigma^2}{n}\right).$$
2. The sample variance, $\widehat{\sigma^2} = \frac{1}{n}\sum_{i=1}^n (X_i - \bar{X})^2$, satisfies:
$$\frac{n\widehat{\sigma^2}}{\sigma^2} \sim \chi^2_{n-1}.$$
3. $\bar{X}$ and $\widehat{\sigma^2}$ are independent.

This is the crux of today's lecture, and we will show each of these properties.

We will also use the below fact about standard normal random variables.

<!-- page 3 -->
**Theorem 1.2.** Suppose $Z_1, \ldots, Z_n$ are i.i.d. standard normal random variables. Then
$$\sum_{i=1}^n (Z_i - \bar{Z})^2 \sim \chi^2_{n-1}$$
where $\bar{Z} = \frac{1}{n}\sum_{i=1}^n Z_i$.

*Proof.* Thm 1.2

[Blank space for the proof, filled in during lecture.] □

<!-- page 4 -->
### 1.2 Distribution of the Sample Mean

*Proof.* Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. random variables from $N(\mu, \sigma^2)$. Show that $\bar{X} \sim N\left(\mu, \frac{\sigma^2}{n}\right)$.

[Blank space for the proof, filled in during lecture.] □

**Example 1.1.** Below we take repeated samples of size $n = 10$ from a $N(50, 4)$ distribution, and compute the sample mean each time. We then create a histogram of these sample means. This is compared the the PDF of a $N(50, 4/10)$ distribution, which is the true sampling distribution of the sample mean.

```r
# Simulate the sample mean distribution
set.seed(123)
sample_means <- replicate(10000, mean(rnorm(10, mean = 50, sd = 2)))

# Plot the histogram and theoretical density
hist(sample_means, probability = TRUE, breaks = 30, col = "skyblue",
     main = "Distribution of Sample Mean", xlab = "Sample Mean")
curve(dnorm(x, mean = 50, sd = sqrt(0.4)), add = TRUE, col = "red", lwd = 2)
```

<!-- page 5 -->
[Figure: "Distribution of Sample Mean": sky-blue histogram of the 10,000 sample means, from about 48 to 52, bell-shaped and centered at 50 with density up to about 0.63, with the $N(50, 0.4)$ density in red matching it closely.] ◇

### 1.3 Distribution of the Sample Variance

*Proof.* Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. random variables from $N(\mu, \sigma^2)$. Show that $\frac{n\widehat{\sigma^2}}{\sigma^2} \sim \chi^2_{n-1}$.

[Blank space for the proof, filled in during lecture.] □

**Example 1.2.** Below we take repeated samples of size $n = 15$ from a $N(20, 9)$ distribution. For each sample, we compute the statistics $T = \frac{15}{9}\widehat{\sigma^2}$, where $\widehat{\sigma^2} = \frac{1}{n}\sum_{i=1}^n (X_i - \bar{X})^2$. We plot

<!-- page 6 -->
a histogram of the samples from $T$, along with the PDF of a $\chi^2_{14}$ distribution.

```r
# Simulate the chi-square distribution of scaled variance
set.seed(123)
sample_vars <- replicate(10000, var(rnorm(15, mean = 20, sd = 3)))
scaled_vars <- (14 * sample_vars) / 9

# Plot the histogram and theoretical density
hist(scaled_vars, probability = TRUE, breaks = 30, col = "lightgreen",
     main = "Scaled Sample Variance", xlab = "Scaled Variance")
curve(dchisq(x, df = 14), add = TRUE, col = "blue", lwd = 2)
```

[Figure: "Scaled Sample Variance": light-green histogram of the scaled variances from about 2 to 40, right-skewed with its peak near 12 (density about 0.08), with the $\chi^2_{14}$ density in blue following it closely.] ◇

### 1.4 Independence

Note that the course textbook uses ideas related to linear algebra and orthogonality to prove the independence of $\bar{X}$ and $\widehat{\sigma^2}$. Since linear algebra is not a prerequisite for this course, we will take a different approach.

<!-- page 7 -->
*Proof.* Suppose $X_1, X_2, \ldots, X_n$ are i.i.d. random variables from $N(\mu, \sigma^2)$. Show that $\bar{X}$ and $\widehat{\sigma^2}$ are independent.

[Blank space for the proof, filled in during lecture.] □

**Example 1.3.** Below we take repeated samples of size $n = 10$ from a $N(10, 4)$ distribution, and compute the sample mean and sample variance each time. We then create a scatterplot of the sample means and variances. We can see there is no relationship between the two random variables.

```r
# Simulate sample mean and variance pairs
set.seed(123)
n <- 10
simulated_data <- replicate(1000, {
  sample <- rnorm(n, mean = 10, sd = 2)
  c(mean(sample), var(sample))
})

plot(simulated_data[1, ], simulated_data[2, ], col="red", pch=4,
     xlab="Sample Mean", ylab="Sample Variance")  # Scatterplot
```

<!-- page 8 -->
[Figure: scatterplot of 1,000 (sample mean, sample variance) pairs drawn as red crosses; sample means run from about 8.5 to 12 and sample variances from 0 to 14, forming a shapeless cloud centered near (10, 3.5) with no trend.] ◇
