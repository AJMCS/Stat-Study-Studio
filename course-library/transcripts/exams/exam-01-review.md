---
source: exams/exam-01-review.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 3
kind: answer-key
confidence: 0.85
---

<!-- page 1 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Midterm 1 Review Guide
STAT 132; Winter 2025
1 Basics
• Population: A population is a full set of units that we are interested in studying.
• Sample: A sample is a subset of the units in a population, for which we have measurements
or data.
• Parameter: A parameter is numerical measurement that describes some characteristic of a
population.
• Frequentist Inference: In the frequentist approach to statistics, parameters are considered
fixed but unknown values.
• Bayesian Inference: In the Bayesian framework, parameters are treated as random variables
that have their own probability distributions. These distributions reflect your uncertainty
about the parameter before seeing any data (the "prior") and are updated as data becomes
available (yielding the "posterior").
• Likelihood Function:
n
L(θ|X) = ∏ f(Xi|θ)
i=1
2 Bayesian Inference
• Prior: Suppose that you have a statistical model with parameter θ. If you treat θ as ran-
dom, then the distribution that you assign to θ before observing the data is called its prior
distribution.
• Posterior: Consider a statistical inference problem with parameter θ and random variables
X1, . . . , Xn to be observed. The conditional distribution of θ given X1, . . . , Xn is called the
posterior distribution of θ .
• Bayes Theorem: Suppose that the n random variables X1, . . . , Xn form a random sample from
a distribution for which the pdf or pmf is f(x|θ). Suppose also that the value of the parameter
θ is unknown and the prior pdf or pmf of θ is π(θ), with parameter space θ ∈ Θ. Then the
posterior pdf or pmf of θ is
f(x1|θ) · · · f(xn|θ)π(θ)
π(θ|x1, . . . , xn) =
mn(x1, . . . , xn)
where mn(x1, . . . , xn) is the joint marginal distribution of the data, x1, . . . , xn.

<!-- page 2 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
• Conjugacy: For a given likelihood, if the prior and posterior distribution belong to the same
family, this is said to be a conjugate prior distribution. In this case, posterior updating can
g  t  tas sn ts n q s t li
• Beta-Bernoulli Conjugacy: Suppose that X1, . . . , Xn form a random sample from the Bernoulli
distribution with parameter p , which is unknown (0 < p < 1). Suppose also that the prior
distribution of p is the beta distribution with parameters α > 0 and β > 0. Then the posterior
xt=13−u+g
• Gamma-Poisson Conjugacy: Suppose that X1, . . . , Xn form a random sample from the Poisson
distribution with parameter λ , which is unknown (λ > 0). Suppose also that the prior
distribution of is the gamma distribution with parameters α > 0 and β > 0. Then the posterior
β + n.
• Normal-Normal Conjugacy: Suppose that X1, . . . , Xn form a random sample from a normal
distribution for which the value of the mean μ is unknown and the value of the variance
σ2 > 0 is known. Suppose also that the prior distribution for μ is the normal distribution with
mean μ0 and variance σ2. Then the posterior distribution of μ given x1, . . . , xn is the normal
distribution with mean μ1 and variance σ2 where
σ2μ0 + nσ2xn
μ1 =
σ2 + nσ0
and
σ2σ2
σ2
二
0ou + τ0
• Loss Function: A loss function is a real-valued function of two variables, L(θ, a), where θ ∈ Θ
and a is a real number. The interpretation is that the statistician "loses" by L(θ, a) if the
parameter equals θ and the estimate equals a.
• Posterior Expected Loss: E [L(θ, a)|x] = ∫ L(θ, a)π(θ|x)dθ.
• Bayes Estimator: Let L(θ, a) be a loss function. For each possible value x, let δ*(x) = a be
such that E [L(θ, a)|x] is minimized. Then δ*(x) is called a Bayes estimator of θ. Once
X = x is observed, δ*(x) is called a Bayes estimate of θ.
• Bayes Estimator for Squared Error Loss: Let θ be a real-valued parameter. Suppose that the
squared error loss function is used and that the posterior mean of θ, E(θ|x), is finite. Then,
the Bayes estimator of θ is δ(X) = E(θ|X).
• Bayes Estimator for Absolute Error Loss: Let θ be a real-valued parameter. Suppose that the
absolute error loss function is used. Then, the Bayes estimator of θ is the posterior median.
3 Maximum Likelihood Estimation
• MLE: The maximum likelihood estimator is defined as
θ(X) = argθ max L(θ|X),
provided it exists. After X = x is observed, ê(x) is called the maximum likelihood esti-
mate of θ.

<!-- page 3 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
• General Procedure for MLE:
1. Compute the log likelihood function: l(θ|x) = log [L(θ|X)]
3. Solve this expression for θ - this is your candidate MLE (θ)
4. Check that
d2
l(θ|x)| < 0 to ensure that this is a maximum and not a minimum
dθ2
5. Consider edge cases (i.e., does the MLE fall on the boundary of the parameter support)
• Invariance: Let ê be a maximum likelihood estimate of some parameter θ. Also let g(θ) be any
function of the parameter θ. Then the maximum likelihood estimate of g(θ) is g(ê).
• Consistency: Let ên be the maximum likelihood estimate for some parameter θ using a sample
size of n. Also, let θπ represent the true unknown parameter value. Then, as n → ∞, we have
that θn ⇒ θT.
