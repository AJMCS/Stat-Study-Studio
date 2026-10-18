---
source: lecture-notes/lecture-01-probability-review-and-intro-to-inference.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 6
kind: lecture
---

<!-- page 1 -->
# Lecture 1: Probability Review & Introduction to Statistical Inference

STAT 132

## Contents

1. Review of Probability Theory (p. 2): Basic Concepts; Random Variables; Probability Distributions; Expectation and Variance (p. 3); Important Distributions (p. 3); Law of Large Numbers and Central Limit Theorem (p. 4)
2. Introduction to Statistical Inference (p. 4): What is Statistical Inference?; Difference Between Probability and Inferential Statistics; Example: Coin Tossing
3. Parametric vs Non-Parametric Inference (p. 5): Parametric Inference; Non-Parametric Inference
4. Parameters and Parameter Space (p. 5): Parameters; Parameter Space
5. Statistics (p. 5): Example: Sample Mean and Variance (p. 6)
6. Estimation and Prediction (p. 6): Estimation; Prediction
7. Hypothesis Testing (p. 6): Example: Testing a Mean

<!-- page 2 -->
## 1 Review of Probability Theory

### 1.1 Basic Concepts

- **Random Experiments**: An action or process that leads to one of several possible outcomes.
- **Sample Space ($\Omega$)**: The set of all possible outcomes.
- **Events**: Subsets of the sample space.
- **Probability Measure ($\mathbb{P}$)**: A function assigning probabilities to events, satisfying:
  1. $0 \le \mathbb{P}(A) \le 1$ for any event $A$.
  2. $\mathbb{P}(\Omega) = 1$.
  3. For disjoint events $A$ and $B$, $\mathbb{P}(A \cup B) = \mathbb{P}(A) + \mathbb{P}(B)$.
- **Conditional probability**: The probability of event $A$ given event $B$ has occurred is denoted as $\mathbb{P}(A|B)$. If $\mathbb{P}(B) > 0$,
$$\mathbb{P}(A|B) = \frac{\mathbb{P}(A \cap B)}{\mathbb{P}(B)}.$$
- **Bayes rule**: Let $A, B$ be two events. If $\mathbb{P}(B) > 0$,
$$\mathbb{P}(A|B) = \frac{\mathbb{P}(B|A)\mathbb{P}(A)}{\mathbb{P}(B)},$$
where the denominator $\mathbb{P}(B) = \mathbb{P}(B|A)\mathbb{P}(A) + \mathbb{P}(B|A^c)\mathbb{P}(A^c)$.

### 1.2 Random Variables

- A **Random Variable** is a function $X : \Omega \to \mathbb{R}$.
- **Discrete Random Variables**: Take on countable values.
- **Continuous Random Variables**: Take on values in an interval of $\mathbb{R}$.

### 1.3 Probability Distributions

- **Probability Mass Function (PMF)** for discrete variables: $f(x) = \mathbb{P}(X = x)$.
- **Probability Density Function (PDF)** for continuous variables: $f(x)$ such that $\mathbb{P}(a \le X \le b) = \int_a^b f(x)\,dx$.
- **Cumulative Distribution Function (CDF)**: $F(x) = P(X \le x)$.

<!-- page 3 -->
### 1.4 Expectation and Variance

- **Expectation (Mean)**:
  - Discrete: $E[X] = \sum_x x\,\mathbb{P}(X = x)$.
  - Continuous: $E[X] = \int_{-\infty}^{\infty} x f(x)\,dx$.
- **Variance**: $\mathrm{Var}(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2$.

### 1.5 Important Distributions

| Name | Density/Mass Function | Mean | Variance | Parameter Restrictions |
| --- | --- | --- | --- | --- |
| Binomial $\mathrm{Bin}(n,p)$ | $P(X=x) = \binom{n}{x} p^x (1-p)^{n-x}$ | $np$ | $np(1-p)$ | $n \in \mathbb{N},\ 0 \le p \le 1$ |
| Poisson $\mathrm{Poisson}(\lambda)$ | $P(X=x) = \dfrac{\lambda^x e^{-\lambda}}{x!}$ | $\lambda$ | $\lambda$ | $\lambda > 0$ |
| Normal $\mathcal{N}(\mu,\sigma^2)$ | $f(x) = \dfrac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$ | $\mu$ | $\sigma^2$ | $\sigma > 0$ |
| Gamma $\mathrm{Gamma}(\alpha,\beta)$ | $f(x) = \dfrac{\beta^\alpha x^{\alpha-1} e^{-\beta x}}{\Gamma(\alpha)}$ | $\alpha/\beta$ | $\alpha/\beta^2$ | $\alpha > 0,\ \beta > 0$ |
| Beta $\mathrm{Beta}(\alpha,\beta)$ | $f(x) = \dfrac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha,\beta)}$ | $\dfrac{\alpha}{\alpha+\beta}$ | $\dfrac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}$ | $\alpha > 0,\ \beta > 0$ |
| Exponential $\mathrm{Exp}(\lambda)$ | $f(x) = \lambda e^{-\lambda x}$ | $\dfrac{1}{\lambda}$ | $\dfrac{1}{\lambda^2}$ | $\lambda > 0$ |
| Uniform $U(a,b)$ | $f(x) = \dfrac{1}{b-a}$ | $\dfrac{a+b}{2}$ | $\dfrac{(b-a)^2}{12}$ | $a < b$ |

Table 1: Common Probability Distributions

> **Aside 1.1.** The Gamma function, denoted as $\Gamma(x)$, is a mathematical function that extends the concept of factorials to non-integer and real numbers. You know:
> $$n! = n \times (n-1) \times (n-2) \times \cdots \times 1$$
> for a positive integer $n$. The Gamma function does something similar but works for all positive real numbers, not just integers.
>
> The Gamma function is defined as:
> $$\Gamma(x) = \int_0^\infty t^{x-1} e^{-t}\,dt, \quad x > 0.$$
> While this might look complicated, you can think of it as a formula that calculates a value based on $x$, just like a factorial.
>
> For positive integers $n$, the Gamma function is related to the factorial as follows:
> $$\Gamma(n) = (n-1)!$$

<!-- page 4 -->
> For example:
> $$\Gamma(1) = 0! = 1,\quad \Gamma(2) = 1! = 1,\quad \Gamma(3) = 2! = 2 \times 1 = 2.$$
> In probability, the Gamma function appears in the probability density functions (PDFs) of distributions like the Gamma distribution.
>
> The Beta function shows up in the PDF of the Beta distribution and is closely related to the Gamma function:
> $$B(x,y) = \frac{\Gamma(x)\Gamma(y)}{\Gamma(x+y)}.$$

### 1.6 Law of Large Numbers and Central Limit Theorem

- **Law of Large Numbers**: As $n \to \infty$, the sample mean $\bar{X}$ converges to $E[X]$.
- **Central Limit Theorem**: For large $n$, the distribution of $\bar{X}$ approaches a normal distribution regardless of the original distribution of $X$.

## 2 Introduction to Statistical Inference

### 2.1 What is Statistical Inference?

Statistical inference involves making conclusions about populations using a sample of data drawn from the population. It bridges the gap between probability theory and real-world observations.

### 2.2 Difference Between Probability and Inferential Statistics

- **Probability Theory**: Starts with known parameters of a distribution and computes probabilities of events (data).
- **Inferential Statistics**: Starts with observed events (data) and makes inferences about the unknown parameters of the population distribution.

### 2.3 Example: Coin Tossing

**Probability Problem:** Given a fair coin (probability of heads $p = 0.5$), what is the probability of getting 6 heads in 10 tosses?

<!-- page 5 -->
**Inference Problem:** You toss a coin 10 times and observe 8 heads. Can we infer whether the coin is fair? What is a good guess for the probability of heads for this coin?

## 3 Parametric vs Non-Parametric Inference

### 3.1 Parametric Inference

Assumes that the data follows a distribution characterized by a finite set of parameters.

**Example:** Assuming heights in a population are normally distributed with unknown mean $\mu$ and variance $\sigma^2$.

### 3.2 Non-Parametric Inference

Makes minimal assumptions about the form of the distribution.

**Example:** Estimating the median of a distribution without assuming a specific form.

## 4 Parameters and Parameter Space

### 4.1 Parameters

Quantities that index a family of probability distributions.

**Example:** In a normal distribution $N(\mu,\sigma^2)$, $\mu$ and $\sigma^2$ are parameters.

### 4.2 Parameter Space

The set of all possible values that parameters can take.

**Example:** For $N(\mu,\sigma^2)$, the parameter space is $\mu \in \mathbb{R}$, $\sigma^2 > 0$.

## 5 Statistics

> **Definition 5.1** (Statistic). A **statistic** is a function of the data that does not depend on any unknown parameters.
> $$T = t(X_1, X_2, \ldots, X_n)$$

<!-- page 6 -->
### 5.1 Example: Sample Mean and Variance

- **Sample Mean:**
$$\bar{X} = \frac{1}{n}\sum_{i=1}^{n} X_i$$
- **Sample Variance:**
$$S^2 = \frac{1}{n-1}\sum_{i=1}^{n}(X_i - \bar{X})^2$$

## 6 Estimation and Prediction

### 6.1 Estimation

- **Point Estimation**: Provides a single best guess of a parameter. We would like this point estimate to be "close" to the true (unknown) parameter value.
- **Interval Estimation**: Provides a range within which the parameter is expected to lie with a certain confidence level or probability.

### 6.2 Prediction

Using the model to predict future observations.

**Example:** Given the STAT 132 enrollment for the last 10 years, can we predict the enrollment for next year?

## 7 Hypothesis Testing

Hypothesis testing is a type of decision theory used to test a claim about a parameter using sample data.

### 7.1 Example: Testing a Mean

**Problem:** Is the average weight of a type of fruit equal to 100 grams?

- $H_0 : \mu = 100$
- $H_1 : \mu \ne 100$
