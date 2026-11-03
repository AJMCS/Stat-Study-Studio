---
source: lecture-notes/lecture-11-interval-estimation.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 8
kind: lecture
---

<!-- page 1 -->
# Lecture 11: Interval Estimation

STAT 132

## Contents

1. Background and Definition (p. 2): Definition (p. 2)
2. Confidence Intervals for the Mean of a Normal Distribution (p. 2): Known Variance (p. 2); Unknown Variance (p. 3)
3. Interpretation of Confidence Intervals (p. 5)
4. Confidence Intervals for Other Parameters (p. 6)
5. Bayesian Credible Intervals (p. 8)

<!-- page 2 -->
## 1 Background and Definition

So far, the only type of estimates that we have talked about are point estimates. Point estimates can serve as a good guess for the population parameter, but they will almost never actually be equal to the true population parameter due to the randomness of the sample.

Today, we will talk about interval estimates, specifically confidence intervals. The basic idea is to construct an interval with lower and upper bounds that are likely to contain the parameter value.

### 1.1 Definition

**Definition 1.1.** Let $X_1, \ldots, X_n$ be a random sample from some population that depends on the parameter $\theta$. Let $L$ and $U$ be two statistics calculated from the data (with $L < U$). Then if
$$\mathbb{P}(L < \theta < U) = 1 - \alpha$$
the **random interval** $(L, U)$ is called a $1 - \alpha$ confidence interval. For example, if $\alpha = 0.05$, this would result in a 0.95 or 95% confidence interval.

## 2 Confidence Intervals for the Mean of a Normal Distribution

### 2.1 Known Variance

**Theorem 2.1.** Let $X_1, X_2, \ldots, X_n \overset{iid}{\sim} N(\mu, \sigma^2)$ with known $\sigma$. Then a $1 - \alpha$ confidence interval for $\mu$ can be constructed as
$$\bar{X} \pm z_{1-\alpha/2} \cdot \frac{\sigma}{\sqrt{n}},$$
where $z_{1-\alpha/2}$ is the $1 - \alpha$ quantile of the standard normal distribution.

<!-- page 3 -->
*Proof.* Thm. 2.1

[Blank space for the proof, filled in during lecture.] □

**Example 2.1.** Suppose $X_1, \ldots, X_n$ represent a random sample of daily rainfall measurements for Santa Cruz in the month of February, where $n = 26$. After collecting the data, you calculate $\bar{X} = 1.3$ inches. Suppose you know that rainfall in February is normally distributed with a variance of $\frac{1}{4}$, but you don't know what the daily average rainfall is. Use this information to construct a 95% confidence interval for the average daily rainfall in February.

◇

### 2.2 Unknown Variance

**Theorem 2.2.** Let $X_1, X_2, \ldots, X_n \overset{iid}{\sim} N(\mu, \sigma^2)$ with unknown $\sigma$. Then a $1 - \alpha$ confidence

<!-- page 4 -->
interval for $\mu$ can be constructed as
$$\bar{X} \pm t_{n-1, 1-\alpha/2} \cdot \frac{S}{\sqrt{n}}.$$
where $t_{n-1, 1-\alpha/2}$ is the $1 - \alpha$ quantile of the t-distribution with $n - 1$ degrees of freedom, and
$$S = \sqrt{S^2} = \sqrt{\frac{1}{n-1}\sum_{i=1}^n (X_i - \bar{X})^2}.$$

*Proof.* Thm. 2.2

[Blank space for the proof, filled in during lecture.] □

**Example 2.2.** Suppose $X_1, \ldots, X_n$ represent a random sample of daily rainfall measurements for Santa Cruz in the month of February, where $n = 26$. After collecting the data, you calculate $\bar{X} = 1.3$ inches and $S^2 = 0.45$. Suppose you know that rainfall in February is normally

<!-- page 5 -->
distributed but you don't know what the daily average rainfall is or the variance. Use this information to construct a 95% confidence interval for the average daily rainfall in February.

◇

## 3 Interpretation of Confidence Intervals

- $\mathbb{P}(L < \theta < U) = 1 - \alpha$ is a statement about the random variables $L$ and $U$.
- Once we have computed specific values using the data, $L = l$ and $U = u$, these are no longer random.
  - After computing the specific interval ($L = l$, $U = u$), we can no longer make probability statements about the interval. It either contains the parameter or it doesn't (it is no longer random).
- Instead, we can interpret the long run frequency of intervals that cover the parameter—if we took many different samples and computed confidence intervals for each sample, we would expect about $1 - \alpha$ percent of these to cover the true parameter.

```r
set.seed(123)
n <- 26  # Sample size
mu <- 5.1  # True mean
sigma <- 1.6  # True standard deviation
num_sim <- 100

# Simulating confidence intervals
samples <- replicate(num_sim, rnorm(n, mean=mu, sd=sigma))
sample_means <- colMeans(samples)
sample_sds <- apply(samples, 2, sd)
margin_of_error <- qt(0.975, df=n-1) * sample_sds / sqrt(n)

# Creating data frame
ci_data <- data.frame(
  lower = sample_means - margin_of_error,
  upper = sample_means + margin_of_error,
  contains_mu = (sample_means - margin_of_error <= mu) & (sample_means + margin_of_error >= mu)
```

<!-- page 6 -->
```r
)

# Plot
library(ggplot2)
ggplot(ci_data, aes(y=1:num_sim, x=lower, xend=upper, color=contains_mu)) +
  geom_segment(aes(yend=1:num_sim), size=1) +
  geom_vline(xintercept=mu, linetype="dashed") +
  labs(title="Simulated 95% Confidence Intervals", x="Mean", y="Sample") +
  theme_minimal()
```

[Figure: "Simulated 95% Confidence Intervals": 100 horizontal interval segments stacked by sample number (0 to 100) over a Mean axis from about 4 to 6.5, with a dashed vertical line at the true mean 5.1. Intervals that contain $\mu$ are teal (TRUE); the handful that miss it are red (FALSE), about five of the hundred.]

## 4 Confidence Intervals for Other Parameters

Notice that when constructing a confidence interval for $\mu$ using data from a normal population, we used one of the following facts:

- For $\sigma^2$ known – $\frac{\sqrt{n}(\bar{X} - \mu)}{\sqrt{\sigma^2}} \sim N(0, 1)$
- For $\sigma^2$ known – $\frac{\sqrt{n}(\bar{X} - \mu)}{\sqrt{S^2}} \sim t_{n-1}$

<!-- page 7 -->
Notice that both of these distributions do not depend on the population parameter $\mu$! This allowed us to find appropriate quantiles of the distribution, and then rearrange the probability inequality to isolate $\mu$. This same general strategy can work for finding many other confidence intervals.

**Definition 4.1.** Let $\mathbf{X} = (X_1, \ldots, X_n)$ be a random sample from some population that depends on the parameter $\theta$. If $Q(\mathbf{X}, \theta)$ is a function of the data/parameter with a distribution does not depend on $\theta$ (i.e., the distribution is the same for any value of $\theta$), then $Q(\mathbf{X}, \theta)$ is called a pivotal quantity.

If you can find a pivotal quantity involving your parameter of interest, this gives you a way to construct a confidence interval.

1. Find $c_1$ and $c_2$ such that $\mathbb{P}(c_1 \le Q(\mathbf{X}, \theta) \le c_2) = 1 - \alpha$. These will correspond to quantiles of the distribution of $Q(\mathbf{X}, \theta)$.
2. Find a way to isolate the parameter $\theta$ from the pivotal quantity. In other words find $g(\cdot)$ such that $g(Q(\mathbf{X}, \theta)) = \theta$.
3. Rearrange your probability statement to result in a confidence interval: $\mathbb{P}(g(c_1) \le g(Q(\mathbf{X}, \theta)) \le g(c_2)) = \mathbb{P}(g(c_1) \le \theta \le g(c_2)) = 1 - \alpha$

Note: The constants $c_1$ and $c_2$ are not unique. In practice, we often let $c_1$ correspond to the $\frac{\alpha}{2}$ quantile of the distribution and $c_2$ correspond to the $1 - \frac{\alpha}{2}$ quantile. This results in what is called an equal tailed interval.

**Example 4.1.** Suppose that $X_1, \ldots, X_n$ form a random sample from the normal distribution with unknown mean $\mu$ and unknown variance $\sigma^2$. Find a $1 - \alpha$ confidence interval for $\sigma^2$.

<!-- page 8 -->
◇

**Example 4.2.** Suppose $X_1, \ldots, X_n$ represent a random sample of daily rainfall measurements for Santa Cruz in the month of February, where $n = 26$. After collecting the data, you calculate $\bar{X} = 1.3$ inches and $S^2 = 0.45$. Suppose you know that rainfall in February is normally distributed but you don't know what the daily average rainfall is or the variance. Use this information to construct a 95% confidence interval for the variance of daily rainfall in February.

◇

## 5 Bayesian Credible Intervals

Interval estimation in the Bayesian setting is straightforward. We can work directly with the posterior distribution to construct an interval that has $1 - \alpha$ for the parameter. In this case this is called a credible interval.

**Definition 5.1.** Suppose that $\mathbf{X} = (X_1, \ldots, X_n)$ form a random sample from some distribution with parameter $\theta$. Then, for values $L$ and $U$ such that
$$\mathbb{P}(L \le \theta \le U | \mathbf{X}) = \int_L^U \pi(\theta|\mathbf{X})\,d\theta = 1 - \alpha$$
the interval $(L, U)$ is called a $1 - \alpha$ credible interval.

Note: Again, the bounds $L$ and $U$ are not unique, but it is common to use equal-tail credible intervals.
