---
source: lecture-notes/lecture-02-frequentist-vs-bayesian-inference.pdf
method: manual transcription from page images (symbols and layout verified against each page)
pages: 8
kind: lecture
---

<!-- page 1 -->
# Lecture 2: Frequentist vs. Bayesian Inference

STAT 132

## Contents

1. What is Statistics? (p. 2): Basic Definitions (p. 2); Visualizing a Sample (p. 3); Frequentist vs. Bayesian Statistics (p. 4)
2. The Likelihood (p. 5): Definition (p. 5); Examples (p. 5); More on Bayesian Inference (p. 7)

<!-- page 2 -->
## 1 What is Statistics?

### 1.1 Basic Definitions

> **Definition 1.1** (Population). A **population** is a full set of units that we are interested in studying.

**Example 1.1.** Some basic examples:
- All people in California
- An entire species of bacteria
- All customer transactions at Amazon
- All possible poker hands

> **Definition 1.2** (Sample). A **sample** is a subset of the units in a population, for which we have measurements or data.

**Example 1.2.** Some basic examples:
- 1,000 randomly selected people in California
- The bacteria contained on a single petri dish
- All customer transactions at Amazon within a one hour window
- 10 hands of poker observed at a casino

> **Definition 1.3** (Parameter). A **parameter** is numerical measurement that describes some characteristic of a population.

**Example 1.3.** Some basic examples:
- The proportion of California residents with a college degree
- The average mass of bacteria from a specific species

<!-- page 3 -->
- The range of Amazon transaction amounts
- The probability of a full house in Poker

**Note:** When we choose a specific probability distribution to model a population, the parameters associated with that distribution may or may not be the actual parameters of interest. For example, if we modeled IQ as following a normal distribution, we might be interested in the mean (average) IQ in the population, which is one of the parameters of the normal distribution, but we might also be interested in something else like the probability that an IQ is greater than 140, which is not one of the normal distribution parameters.

### 1.2 Visualizing a Sample

*[Figure: "Sample vs. Population". A grid of dots. Most dots (red) are "Unobserved population unit"; a few (blue) are "Sample unit".]*

*[Figure: the same grid with a number in each dot. The blue dots show their values and the sample average is 4; the red dots are labeled "Unobserved population average" with value 4.3.]*

<!-- page 4 -->
*[Figure: "Infinite population". The same grid continuing off to the right and down with ellipses. Caption: "E.g., all possible flips of a coin, or all possible times in a day".]*

### 1.3 Frequentist vs. Bayesian Statistics

At its core, statistics is based on learning about some population parameter based on data from a sample. There are many different ways this can be done, and even different philosophical viewpoints. Two major philosophical viewpoints are frequentist and Bayesian statistics.

> **Definition 1.4** (Frequentist Statistics). In the **frequentist** approach to statistics, parameters are considered <u>fixed</u> but <u>unknown</u> values.

- Because the parameter is fixed (not random), we cannot make meaningful probabilistic statements about the parameter.
  - For example, we cannot talk about the probability of the parameter being in a calculated confidence interval.
  - The parameter is fixed, so it is either inside the interval or it is not.
  - The parameter is unknown, so we don't know which.
- Instead, frequentist statistics focuses on long run asymptotic results.
  - For example, if we were to repeat our sampling procedure many times, and calculate a confidence interval for each of these samples, what is the proportion of these intervals that would cover the true parameter?

> **Definition 1.5** (Bayesian Statistics). In the **Bayesian** framework, parameters are treated as <u>random variables</u> that have their own probability distributions. These distributions reflect your uncertainty about the parameter before seeing any data (the "prior") and are updated as data becomes available (yielding the "posterior").

<!-- page 5 -->
- Because our state of knowledge for a parameter is completely characterized by a probability distribution, we can make meaningful probabilistic statements about the parameter.

## 2 The Likelihood

Both frequentists and Bayesian use what is called the likelihood when conducting statistical inference.

### 2.1 Definition

> **Definition 2.1** (Likelihood Function). Given a random sample $X_1, X_2, \ldots, X_n$ drawn from a population with probability density function (pdf) $f(x|\theta)$ (or probability mass function for discrete variables), the **likelihood function** $L(\theta)$ is defined as:
> $$L(\theta) = \prod_{i=1}^{n} f(X_i|\theta)$$
> Here, $\theta$ is the parameter (or vector of parameters) to be estimated.

Notice that in probability theory, we usually know the parameters, but have not observed data. Thus, the pdf or pmf is a function of the data ($X$). However, for statistical inference, we have observed the data, but want to infer something about the parameters. Thus, even though the mathematical expression is the same, the likelihood function is now a function of the unknown parameter $\theta$, since the data ($X$) has been observed.

**Note:** If the parameter space has a constraint, we can use indicator functions to signify this in the likelihood.

### 2.2 Examples

**Example 2.1** (Coin Flips). Suppose you have observed 10 independent flips of a coin, and observed 8 heads. You are interested in the true probability of heads, $p$. Write the likelihood function for this problem.

*(Worked solution left blank in the notes; the plot on the next page shows the answer.)*

<!-- page 6 -->
*[Figure: "Likelihood for 10 coin flips with 8 heads". A curve of likelihood against $p$ from 0 to 1, labeled $L(p) = \binom{10}{8} p^8 (1-p)^2$. The curve is near zero below about 0.3, rises to a maximum of about 0.30 at $p = 0.8$, and falls to zero at $p = 1$.]*

**Note:** The likelihood function is <u>not</u> a probability distribution. It does not integrate to one. However, it does give us an idea of which parameter values may be more likely to generate data like the data we observed.

**Example 2.2** (Test Scores). Suppose that scores for a specific personality test are normally distributed with a mean of $\mu$ and a standard deviation of 10, where $\mu$ is unknown. You randomly select 3 individuals and they had scores 45, 55, and 50. Write the likelihood function for this problem.

*(Worked solution left blank in the notes.)*

<!-- page 7 -->
### 2.3 More on Bayesian Inference

> **Definition 2.2** (Prior). Suppose that you have a statistical model with parameter $\theta$. If you treat $\theta$ as random, then the distribution that you assign to $\theta$ before observing the data is called its **prior distribution**.
>
> We will use $\pi(\theta)$ to denote the prior distribution. This is either a pdf or a pmf depending on whether $\theta$ is continuous or discrete.

**Example 2.3.** Let $\theta$ denote the probability of obtaining a head when a certain coin is tossed, and suppose that it is known that the coin either is fair or has a head on each side. What is an appropriate prior distribution in this case?

**Example 2.4.** Suppose that $\theta$ represents the proportion of defective iPhones in an Apple warehouse. Then, the parameter space is the interval $[0, 1]$. If we have absolutely no idea or prior information to go off of, then we might choose a uniform prior on the interval $[0, 1]$ for $\theta$.

In some cases we might have more information about a parameter. For example, we might have information from past experiments, or we might ask a scientific collaborator about their thoughts and experience for a parameter. In this case, we might construct a prior with a small standard deviation (low uncertainty).

**Example 2.5.** Suppose that the lifetimes (in hours) of fluorescent lamps of a certain type are to be observed and that the lifetime of any particular lamp has the exponential distribution with parameter $\theta$. Suppose also that the exact value of $\theta$ is unknown, but on the basis of previous experience, you want to use a gamma prior distribution for which the mean is 0.0002 and the standard deviation is 0.0001. Write $\pi(\theta)$ for this problem. Recall that the pdf of a gamma($\alpha, \beta$) distribution is
$$f(x) = \frac{\beta^\alpha}{\Gamma(\alpha)} x^{\alpha-1} e^{-x\beta}$$

<!-- page 8 -->
*(Blank page: the worked solution space for Example 2.5.)*
