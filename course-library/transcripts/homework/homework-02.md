---
source: homework/homework-02.pdf
method: manual transcription from the rendered page (the PDF text layer has wrong symbols)
pages: 1
kind: problem-set
---

<!-- page 1 -->
# Homework 2

STAT 132

1. Suppose that a random sample of size $n$ is taken from a Poisson distribution for which the value of the mean $\theta$ is unknown, and the prior distribution of $\theta$ is a gamma distribution for which the mean is $\mu_0$. Show that the mean of the posterior distribution of $\theta$ will be a weighted average having the form $\gamma_n \bar{X}_n + (1 - \gamma_n)\mu_0$, and show that $\gamma_n \to 1$ as $n \to \infty$.

2. Suppose that the time it takes for a student to complete a homework assignment in STAT 132 follows an exponential distribution with unknown parameter $\lambda$. Before observing any data, you have a gamma prior distribution for $\lambda$ for which the prior mean is 0.2 and the prior variance is 1. After randomly sampling 10 students in the class, you found their average time to complete the homework to be 3 hours. Using a squared error loss function, what is the Bayes estimate of $\lambda$?

3. A food delivery service is trying to estimate its average delivery time $\theta$ (in minutes) across a city. Delivery times are modeled as following a normal distribution with an unknown mean $\theta$ and a variance of 1. A random sample of $n = 22$ deliveries is taken, and the observed sample mean is $\bar{X}_n = 32$ minutes. The posterior distribution of $\theta$ is a normal distribution with a mean of 30 minutes and a variance of $\frac{1}{30}$. What was the prior distribution of $\theta$?

4. A factory produces phone chargers, and the proportion $\theta$ of faulty chargers in a large batch is unknown. Based on past data, the quality assurance team models $\theta$ using a Beta prior distribution with parameters $\alpha = 2$ and $\beta = 200$. A random sample of 100 chargers is tested, and 3 defective chargers are found. What is the posterior distribution of $\theta$?

5. The time until decay of a radioactive particle is modeled as a random variable with the following PDF:
$$f(x|\theta) = \frac{1}{\theta^2}\,x\,e^{-x/\theta} \quad \text{for } x > 0,$$
where $\theta > 0$. You observe decay times $X_1 = 2$, $X_2 = 3$, and $X_3 = 4$. Find the MLE for $\theta$.

6. The number of failures $X$ during a quality control test is modeled as a random variable with the following PMF:
$$f(x|\theta) = (1 - \theta)^x\,\theta, \quad \text{for } k = 1, 2, \ldots,$$
where $0 < \theta < 1$. Suppose you observe the random sample $X_1, \ldots, X_n$. What is the MLE of $\theta$?

*(Transcribed as printed: the support is written "for $k = 1, 2, \ldots$" although the variable in the PMF is $x$.)*
