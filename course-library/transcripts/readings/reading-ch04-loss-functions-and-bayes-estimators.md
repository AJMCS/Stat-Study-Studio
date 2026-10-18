---
source: readings/reading-ch04-loss-functions-and-bayes-estimators.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 26
kind: reading
confidence: 0.95
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
4 Loss Functions and Bayes Estimators
Suppose a campus dining hall needs to decide how many meals to prepare for an evening
event. The staff may have a probability distribution describing the possible attendance, but
they still need to choose one number. Preparing too few meals could leave students without
food. Preparing too many could create waste. The distribution describes uncertainty, while
the final choice requires a decision.
The same issue appears when estimating an unknown parameter. A posterior distribution
gives us a complete description of which parameter values are plausible after observing the
data. However, we often need to report one number as an estimate. To choose that number
carefully, we need to describe what makes one estimation error more serious than another.
A loss function provides this description. It assigns a numerical cost to the difference between
the true parameter and the estimate we report. A Bayes estimator is the rule that makes
posterior expected loss as small as possible.
4.1 Point estimators and point estimates
Ĺ Note
δ(Greek delta) names a rule that calculates an estimate. δ(X) is the random result of
applying the rule to a random sample; δ(x) is the numerical result for observed data.
Bold letters refer to the entire sample. Xand xare the random sample mean and its
observed value, respectively.
Let
X = (X1, X2, ... , Xn)
represent the random sample before the data are observed. A point estimator of an unknown
parameter θis a function of the sample that returns one number. We can write it as
δ(X).
71

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
The symbol δrepresents a rule. It tells us what number to calculate for every sample we could
possibly observe.
After the data are observed, the random vector X becomes the known data vector
x = (x1, x2, ... , xn).
The number
δ(x)
is called a point estimate. The distinction is small but important:
• An estimator is the rule before we observe the data.
• An estimate is the numerical result after we apply the rule to the observed data.
For example, the sample mean
X= 1
n
n
∑
i=1
Xi
is an estimator. If the observed sample is 7, 9, and 8, then
x= 7 + 9 + 8
3
= 8
is the estimate.
An estimator must be a function of the data and known quantities. It cannot depend on the
unknown value of θ. If we knew θ, there would be nothing left to estimate.
4.1.1 Why one number is not automatic
A posterior distribution does not always point to one obvious estimate. A distribution may
have a mean, median, and most concentrated region that do not line up. Even when one value
has the highest posterior density, a nearby value might lead to better decisions if certain errors
are especially costly.
Choosing a point estimate therefore requires more than looking at the posterior and selecting
a value that seems reasonable. We need a rule for comparing the consequences of different
estimates. This is the role of loss.
72

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
4.2 Loss functions
Ĺ Note
anames the action, or proposed estimate, and L(θ, a) names the loss for choosing awhen
the true parameter is θ. The comma separates the function’s two inputs. Here capital L
means loss; in likelihood chapters, L(θ∣x) means likelihood. The arguments and context
distinguish these uses.
A loss function is a function
L(θ, a),
where θis the true parameter value and ais the action or estimate we report. The value
L(θ, a) describes the loss we experience when the truth is actually θbut we choose aas our
estimate.
In an estimation problem, the action ais usually a possible numerical estimate. A useful loss
function often has the following features:
• The loss is smallest (often zero) when a= θ.
• The loss increases as the estimate moves farther from the truth.
• The way the loss increases reflects how estimation errors matter in the context of the
problem.
Loss does not have to represent money. It can represent wasted time, poor planning, inaccurate
scientific conclusions, or a mathematical penalty chosen to compare estimation rules.
Its
purpose is to state what we mean by a good or bad estimate.
4.2.1 Loss depends on the unknown truth
If we knew the true value of θ, we could choose a= θand obtain the smallest possible loss.
Of course, θis unknown. That is why the estimation problem exists.
In the Bayesian framework, the posterior distribution describes our uncertainty about θafter
observing the data. We can average the loss over this distribution. The resulting quantity is
the posterior expected loss:
Ĺ Note
ρ(a∣x) (read “rho of agiven the data”) names the posterior expected loss for action
a. E[L(θ, a) ∣x] averages the loss over the posterior distribution of θ, keeping aand the
observed data fixed.
73

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
ρ(a∣x) = E[L(θ, a) ∣x].
For a continuous parameter,
ρ(a∣x) = ∫
Θ
L(θ, a)π(θ∣x) dθ.
For a discrete parameter, the integral is replaced by a sum.
The posterior expected loss considers every possible value of θ. Values with more posterior
probability receive more weight. Instead of pretending that one value is already known to be
true, we evaluate each action across the uncertainty that remains.
Before observing data, we could average loss over the prior distribution:
E[L(θ, a)] = ∫
Θ
L(θ, a)π(θ) dθ.
For statistical estimation, the posterior expected loss is usually more relevant because it incor-
porates the information in the observed sample.
4.3 Bayes estimators
Ĺ Note
δ∗(read “delta star”) labels an optimal estimation rule for the specified loss. The star is
a label, not multiplication.
argminameans “the value of athat makes the following expression smallest.” It returns
the action attaining the minimum, rather than the minimum loss itself. An index below
the operator identifies the quantity we are allowed to vary.
A Bayes estimator is an estimator that minimizes posterior expected loss. For each possible
dataset, we choose the action with the smallest posterior expected loss:
δ∗(x) = argmin
a
E[L(θ, a) ∣x].
The notation argmin can be read as “the argument that minimizes” and means “the value of
athat makes the expression as small as possible.” The minimum value itself is the smallest
posterior expected loss. The argument of the minimum is the action that achieves it.
It is helpful to separate the pieces of this decision:
74

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
1. The posterior distribution describes what we know about θafter observing the data.
2. The loss function describes how we evaluate estimation errors.
3. The Bayes estimator chooses the action that performs best on average when loss is
averaged over the posterior.
The posterior distribution alone does not determine a unique Bayes estimator. The answer
also depends on the loss function. Two people can use the same posterior distribution and
choose different estimates if the consequences of error are different for their decisions.
4.4 Squared error loss
The most common loss function for point estimation is squared error loss:
L(θ, a) = (θ−a)2.
The loss is zero when a= θ. An error of 2 produces a loss of 4, while an error of 4 produces a
loss of 16. Doubling the size of an error makes the loss four times as large.
Squared error loss therefore gives substantial weight to large errors. This can be useful when
an estimate far from the truth would be especially undesirable. It also leads to calculations
that are mathematically convenient.
error <- seq(-5, 5, length.out = 300)
plot(
error,
error^2,
type = "l",
lwd = 2,
col = "steelblue",
xlab = "Estimation error",
ylab = "Loss",
ylim = c(0, 25),
main = "Two common loss functions"
)
lines(error, abs(error), col = "darkorange", lwd = 2)
legend(
"top",
legend = c("Squared error", "Absolute error"),
col = c("steelblue", "darkorange"),
lwd = 2,
75

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
bty = "n"
)
−4
−2
0
2
4
0
5
10
15
20
25
Two common loss functions
Estimation error
Loss
Squared error
Absolute error
Figure 4.1: Squared error loss grows more quickly than absolute error loss as an estimate moves
away from the truth.
Both curves in Figure 4.1 are smallest at an error of zero. The squared error curve rises much
more quickly. The graph is symmetric because overestimating by a certain amount produces
the same loss as underestimating by that amount.
4.4.1 The Bayes estimator under squared error loss
Ĺ Note
μpost names the posterior mean E[θ∣x]. The text subscript “post” is a label for “poste-
rior”.
Under squared error loss, the posterior expected loss is
E[(θ−a)2 ∣x].
76

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
Let
μpost = E[θ∣x]
be the posterior mean. We can rewrite the posterior expected loss as
E[(θ−a)2 ∣x] = Var(θ∣x) + (μpost −a)2.
This expression has two parts. The posterior variance does not depend on the action a. It
represents uncertainty that remains no matter which estimate we report. The second term
measures the squared distance between our action and the posterior mean.
The second term is smallest when
a= μpost.
Therefore, the Bayes estimator under squared error loss is the posterior mean:
δ∗(X) = E[θ∣X] .
This result explains why the posterior mean is used so often. It is not automatically the best
summary in every situation, but it is the optimal point estimate when estimation errors are
evaluated using squared error loss.
4.4.2 Beta-Bernoulli model
Ĺ Note
iid∼means “are independent and identically distributed.”
Independence means the ob-
servations do not provide information about one another when the parameter is given;
identically distributed means they follow the same distribution.
In X1, ... , Xn∣p
iid∼
Bernoulli(p), these properties apply conditional on p.
In Beta(A, B), capital Aand Bare placeholders for the distribution’s two shape param-
eters. Here they do not name events.
Suppose
X1, ... , Xn∣p
iid∼Bernoulli(p)
and the prior is
77

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
p∼Beta(α, β).
If s= ∑
n
i=1 xisuccesses are observed, Chapter 3 showed that
p∣x ∼Beta(α+ s, β+ n−s).
The mean of a Beta(A, B) distribution is A/(A+ B). Under squared error loss, the Bayes
estimate is therefore
δ∗(x) = E[p∣x] =
α+ s
α+ β+ n.
The formula combines the prior information with the observed successes and failures. The loss
function tells us why the mean of this posterior is the estimate we choose.
4.4.3 Gamma-Poisson model
Suppose counts follow a Poisson distribution with unknown rate λand the prior is
Gamma(α, β) using the shape-rate form. After observing counts x1, ... , xn, the posterior is
λ∣x ∼Gamma (α+
n
∑
i=1
xi, β+ n) .
The mean of a Gamma(A, B) distribution in the shape-rate form is A/B. Under squared error
loss, the Bayes estimate is
δ∗(x) = E[λ∣x] = α+ ∑
n
i=1 xi
β+ n
.
Again, the posterior calculation and the decision rule have separate roles.
The conjugate
update tells us which posterior distribution we have. Squared error loss tells us to use its
mean.
78

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
4.4.4 Normal-Normal model
Suppose the data are normally distributed with unknown mean μand known variance σ2. If
the prior for μis normal, then the posterior is also normal:
μ∣x ∼N(μ1, σ2
1).
The posterior mean is μ1. Therefore, the Bayes estimate under squared error loss is
δ∗(x) = μ1.
This example is especially simple because the parameter appearing in the posterior distribution
is already its mean.
4.5 Absolute error loss
Ĺ Note
|θ−a| means the absolute value of the estimation error: its distance from zero, without
its sign. Paired bars enclose the quantity whose magnitude is taken. They differ from
the single conditioning bar in E[θ∣x], which means “given the data.”
Another common choice is absolute error loss:
L(θ, a) = |θ−a|.
An error of 2 produces a loss of 2, and an error of 4 produces a loss of 4. Doubling the error
doubles the loss. This is the straight-line pattern shown in Figure 4.1.
Absolute error loss does not magnify large errors as strongly as squared error loss. A small
number of parameter values far out in a posterior tail can pull the posterior mean toward
them. The posterior median is less affected by how far those tail values extend.
79

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
4.5.1 The Bayes estimator under absolute error loss
Under absolute error loss, the posterior expected loss is
E[|θ−a| ∣x].
Consider moving the estimate aslightly to the right. This decreases the loss when θis to the
right of a, but it increases the loss when θis to the left. The best balance occurs when half of
the posterior probability is on each side.
Therefore, the Bayes estimator under absolute error loss is a posterior median:
δ∗(X) = Median(θ∣X) .
For a continuous posterior distribution with CDF Fθ∣x, the posterior median msatisfies
Ĺ Note
Median(θ∣X) denotes a median of the posterior distribution obtained from a random
sample. Fθ∣x(m) is the posterior probability that θ≤mgiven the observed data. The
subscript identifies which distribution this CDF describes; its argument mis the cutoff
where it is evaluated.
Fθ∣x(m) = 0.5.
The posterior median is the value with 50% of the posterior probability below it and 50%
above it.
4.5.2 When the mean and median differ
For a symmetric posterior distribution, the mean and median are the same. Squared error and
absolute error loss then lead to the same Bayes estimate.
For a skewed posterior distribution, they can differ. Consider a posterior distribution for a
positive time parameter:
θ∣x ∼Gamma(4, 0.5).
This posterior is right-skewed. Its mean is 4/0.5 = 8, while its median is smaller than 8. The
long right tail pulls the mean upward.
80

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
set.seed(132)
theta_values <- rgamma(100000, shape = 4, rate = 0.5)
actions <- seq(3, 13, length.out = 200)
squared_expected_loss <- actions
absolute_expected_loss <- actions
for (i in seq_along(actions)) {
squared_expected_loss[i] <- mean((theta_values - actions[i])^2)
absolute_expected_loss[i] <- mean(abs(theta_values - actions[i]))
}
posterior_mean <- 4 / 0.5
posterior_median <- qgamma(0.5, shape = 4, rate = 0.5)
par(mfrow = c(2, 1))
plot(
actions,
squared_expected_loss,
type = "l",
lwd = 2,
col = "steelblue",
xlab = "Possible estimate",
ylab = "Posterior expected loss",
main = "Squared error loss"
)
abline(v = posterior_mean, col = "firebrick", lwd = 2, lty = 2)
plot(
actions,
absolute_expected_loss,
type = "l",
lwd = 2,
col = "darkorange",
xlab = "Possible estimate",
ylab = "Posterior expected loss",
main = "Absolute error loss"
)
abline(v = posterior_median, col = "firebrick", lwd = 2, lty = 2)
81

<!-- page 12 -->
<!-- extracted via text-layer confidence=0.95 -->
par(mfrow = c(1, 1))
4
6
8
10
12
20
30
40
Squared error loss
Possible estimate
Posterior expected loss
4
6
8
10
12
3.0
4.0
5.0
Absolute error loss
Possible estimate
Posterior expected loss
Figure 4.2: Squared error loss is minimized at the posterior mean, while absolute error loss is
minimized at the posterior median.
The curves in Figure 4.2 are created by drawing many values from the posterior distribution
and averaging the loss for each possible estimate. The squared error curve reaches its minimum
at the posterior mean of 8. The absolute error curve reaches its minimum at the posterior
median, which is about 7.34.
The difference between the two estimates is not caused by different data or different posterior
distributions. It comes entirely from how the two loss functions evaluate error.
82

<!-- page 13 -->
<!-- extracted via text-layer confidence=0.95 -->
4.6 Choosing a loss function
The loss function should reflect what estimation errors mean in the problem. Squared error
loss is common and gives a clear reason to use the posterior mean. Absolute error loss gives a
clear reason to use the posterior median.
Neither loss function is universally correct. Squared error loss may be reasonable when large
errors are much more serious than small errors. Absolute error loss may be reasonable when
the consequence grows roughly in direct proportion to the size of the error.
The units also differ. If θis measured in minutes, absolute error loss is measured in minutes,
while squared error loss is measured in squared minutes. The numerical values of two different
loss functions should not be compared directly. What matters is which action minimizes the
chosen loss.
A loss function is a model for consequences. Like a probability model or prior distribution, it
should be selected thoughtfully and explained in context.
4.7 Chapter summary
• A point estimator is a rule δ(X) that maps a random sample to one numerical value.
• A point estimate is the observed value δ(x) after the data have been collected.
• A loss function L(θ, a) describes the cost of reporting awhen the true parameter is θ.
• Posterior expected loss averages a loss function over the posterior distribution.
• A Bayes estimator chooses the action that minimizes posterior expected loss for each
possible sample.
• Squared error loss is L(θ, a) = (θ−a)2 and gives greater weight to large errors.
• The Bayes estimator under squared error loss is the posterior mean.
• Absolute error loss is L(θ, a) = |θ−a| and grows in direct proportion to the size of the
error.
• The Bayes estimator under absolute error loss is a posterior median.
• The same posterior distribution can produce different Bayes estimates under different
loss functions.
83

<!-- page 14 -->
<!-- extracted via text-layer confidence=0.95 -->
5 Maximum Likelihood Estimation
Suppose a music streaming service wants to estimate the proportion of recommended songs
that users save to their libraries. The company observes a sample of recommendations and
records whether each song was saved. Some possible values of the unknown proportion would
make the observed pattern more believable than others.
Maximum likelihood estimation turns this idea into an estimation rule. We compare possible
parameter values by asking how well each one explains the data we actually observed. The
parameter value that gives the observed data the largest likelihood is called the maximum
likelihood estimate.
This is a frequentist method. The unknown parameter is treated as a fixed value, and no prior
distribution is used. The likelihood is a function of possible parameter values, but it is not a
probability distribution for the parameter.
5.1 From likelihood to an estimate
Ĺ Notê
θ(read “theta hat”) denotes an estimator or estimate of θ.̂ θ(X) displays its dependence
on the random sample, whilê θ(x) is the value calculated from observed data.
argmaxθ∈Θ means “the allowed value of θmaking the following expression largest.” Low-
ercase θis a candidate value; capital Θ is the set of allowed values. The operator returns
the maximizing parameter, rather than the likelihood’s maximum height.
In L(θ∣x), the bar identifies the observed data used to construct the likelihood. This
notation does not make the likelihood a conditional probability distribution for θ.
Let
X = (X1, X2, ... , Xn)
be a random sample from a model with unknown parameter θ. Before observing the data, the
likelihood can be written as
84

<!-- page 15 -->
<!-- extracted via text-layer confidence=0.95 -->
L(θ∣X).
The maximum likelihood estimator, or MLE, iŝ
θ(X) = argmax
θ∈Θ
L(θ∣X),
provided that a maximizing value exists. The parameter space Θ contains all values allowed
by the model.
After observing
X = x,
the numerical valuê
θ(x) = argmax
θ∈Θ
L(θ∣x)
is the maximum likelihood estimate.
As in Chapter 4, an estimator is a rule that can be applied to any possible sample. An estimate
is the result for the specific sample that we observed. The abbreviation MLE is commonly
used for both, so the context must tell us which meaning is intended.
5.1.1 What “most likely” means
The phrase “most likely parameter” is common but can be misleading in a frequentist analysis.
The likelihood does not assign probabilities to parameter values. Instead, it compares how
well different fixed parameter values account for the observed data.
Suppose one parameter value gives twice the likelihood of another. Under the model, the
observed data are twice as compatible with the first value as with the second. This is a relative
comparison. It does not mean there is twice as much probability that the first parameter value
is true.
The MLE only identifies the location where the likelihood is largest. It does not tell us by
itself whether the likelihood is sharply peaked or nearly flat around that value. A likelihood
plot can therefore be more informative than reporting only the maximizer.
85

<!-- page 16 -->
<!-- extracted via text-layer confidence=0.95 -->
5.2 A likelihood example
Suppose 14 of 20 users save a recommended song. Let pbe the unknown probability that
a recommendation is saved. If the outcomes are modeled as independent Bernoulli random
variables with the same probability p, then the likelihood is proportional to
L(p∣x) ∝p14(1 −p)6,
0 ≤p≤1.
A value of pnear zero has trouble explaining the 14 saved songs. A value near one has trouble
explaining the 6 songs that were not saved. The likelihood balances both parts of the sample.
p <- seq(0, 1, length.out = 500)
likelihood <- dbinom(14, size = 20, prob = p)
plot(
p,
likelihood,
type = "l",
lwd = 2,
col = "steelblue",
xlab = "Possible value of p",
ylab = "Likelihood",
main = "Likelihood for the save probability"
)
abline(v = 14 / 20, col = "firebrick", lwd = 2, lty = 2)
86

<!-- page 17 -->
<!-- extracted via text-layer confidence=0.95 -->
0.0
0.2
0.4
0.6
0.8
1.0
0.00
0.05
0.10
0.15
Likelihood for the save probability
Possible value of p
Likelihood
Figure 5.1: The likelihood is largest at the observed proportion of saved recommendations.
The likelihood in Figure 5.1 is largest at̂
p= 14
20 = 0.70.
This value matches the observed sample proportion. Among all possible Bernoulli probabilities,
p= 0.70 gives the observed combination of successes and failures the largest likelihood.
5.3 The log-likelihood
Likelihoods often contain products. For an independent random sample,
L(θ∣x) =
n
∏
i=1
f(xi∣θ).
Products can be inconvenient to differentiate and may become extremely small when the
sample contains many observations. We therefore often work with the log-likelihood:
l(θ∣x) = log L(θ∣x).
87

<!-- page 18 -->
<!-- extracted via text-layer confidence=0.95 -->
The logarithm turns products into sums:
l(θ∣x) =
n
∑
i=1
log f(xi∣θ).
The logarithm function is a strictly increasing function. Thus, if one likelihood value is larger
than another, its logarithm is also larger. Therefore,
argmax
θ∈Θ
L(θ∣x) = argmax
θ∈Θ
l(θ∣x).
The likelihood and log-likelihood have different vertical scales, but they reach their maximum
at the same parameter value.
p <- seq(0.01, 0.99, length.out = 500)
likelihood <- dbinom(14, size = 20, prob = p)
log_likelihood <- log(likelihood)
par(mfrow = c(1, 2))
plot(
p,
likelihood,
type = "l",
lwd = 2,
col = "steelblue",
xlab = "Possible value of p",
ylab = "Likelihood",
main = "Likelihood"
)
abline(v = 0.70, col = "firebrick", lwd = 2, lty = 2)
plot(
p,
log_likelihood,
type = "l",
lwd = 2,
col = "darkorange",
xlab = "Possible value of p",
ylab = "Log-likelihood",
main = "Log-likelihood"
)
88

<!-- page 19 -->
<!-- extracted via text-layer confidence=0.95 -->
abline(v = 0.70, col = "firebrick", lwd = 2, lty = 2)
par(mfrow = c(1, 1))
0.0
0.2
0.4
0.6
0.8
1.0
0.00
0.05
0.10
0.15
Likelihood
Possible value of p
Likelihood
0.0
0.2
0.4
0.6
0.8
1.0
−50
−30
−10
0
Log−likelihood
Possible value of p
Log−likelihood
Figure 5.2: The likelihood and log-likelihood have different shapes but the same maximizing
value.
Both panels in Figure 5.2 reach their maximum at 0.70. The log transformation changes the
vertical scale and makes small likelihood values easier to distinguish. It does not change the
MLE.
5.4 A common calculus procedure
Ĺ Note
d
dθl(θ∣x) is the first derivative of the log-likelihood with respect to θ, holding the data
fixed.
d2
dθ2 denotes the second derivative, which describes curvature.
An expression followed by |θ=̂θmeans “evaluate this expression at θ=̂ θ.” This evaluation
bar is different from a conditioning bar. The inequality < 0 says that the resulting value
is negative.
89

<!-- page 20 -->
<!-- extracted via text-layer confidence=0.95 -->
When the log-likelihood is differentiable and its maximum occurs inside the parameter space,
the following procedure often finds the MLE.
1. Write the likelihood and identify the parameter space.
2. Take the logarithm to obtain l(θ∣x).
3. Differentiate the log-likelihood with respect to θ.
4. Set the derivative equal to zero and solve for a candidate value.
5. Check that the candidate is a maximum and compare it with any relevant boundaries.
The first derivative
d
dθl(θ∣x)
is sometimes called the score. At an interior maximum, the graph is typically flat, so the score
equals zero.
A negative second derivative at a candidate,
d2
dθ2 l(θ∣x)∣
θ=̂θ
< 0,
shows that the log-likelihood curves downward there. This confirms a local maximum. It does
not automatically prove that the candidate is the largest value over the entire parameter space.
We still need to consider the shape of the function and any boundaries.
5.4.1 Example: a Bernoulli probability
Suppose X1, ... , Xnare independent Bernoulli random variables with unknown success proba-
bility p. Let
s=
n
∑
i=1
xi
be the observed number of successes. The likelihood is
L(p∣x) = ps(1 −p)n−s,
0 ≤p≤1,
after removing factors that do not depend on p. The log-likelihood is
l(p∣x) = slog p+ (n−s) log(1 −p).
90

<!-- page 21 -->
<!-- extracted via text-layer confidence=0.95 -->
Its derivative is
d
dpl(p∣x) = s
p−n−s
1 −p.
Setting this equal to zero gives
s
p= n−s
1 −p.
Solving for pgiveŝ
p= s
n= x.
The MLE is the observed proportion of successes. This makes intuitive sense because the
Bernoulli model uses pto describe the long-run proportion of successes, and the sample pro-
portion is the corresponding feature in the observed data.
If s= 0 or s= n, the derivative calculation above involves a boundary. The same final rule
still applies. The MLE is 0 when every observation is a failure and 1 when every observation
is a success.
5.4.2 Example: a Poisson rate
Ĺ Note
Cnames an additive term that does not depend on the parameter being varied. It can
depend on the observed data, which are fixed during maximization.̂ λis an estimated
rate, and xis the average of the observed counts.
Suppose X1, ... , Xnare independent Poisson random variables with unknown rate λ.
The
likelihood is proportional to
L(λ∣x) ∝λ∑n
i=1 xie−nλ,
λ> 0.
The log-likelihood is
l(λ∣x) = (
n
∑
i=1
xi) log λ−nλ+ C,
where Ccollects terms that do not depend on λ. Differentiating gives
91

<!-- page 22 -->
<!-- extracted via text-layer confidence=0.95 -->
d
dλl(λ∣x) = ∑
n
i=1 xi
λ
−n.
Setting the derivative equal to zero giveŝ
λ= 1
n
n
∑
i=1
xi= x.
The MLE of the Poisson rate is the sample mean. If λrepresents an average number of requests
per hour, the observed average number per hour is the value that maximizes the likelihood.
5.4.3 Example: the mean of a normal distribution
Suppose
Xi
iid∼N(μ, σ2),
where μis unknown and σ2 is known. After removing terms that do not depend on μ, the
log-likelihood is
l(μ∣x) = −1
2σ2
n
∑
i=1
(xi−μ)2 + C.
Maximizing this expression is the same as making the sum of squared distances
n
∑
i=1
(xi−μ)2
as small as possible. The value at the center of the observed data is the sample mean, sô
μ= x.
The same estimator appears in all three models above, but for different reasons connected to
each likelihood. Note that a sample mean is not automatically the MLE for every parameter
or every model.
92

<!-- page 23 -->
<!-- extracted via text-layer confidence=0.95 -->
5.5 Constants that can be removed
Ĺ Note
c(x) names a factor depending only on the observed data. g(θ∣x) names the remaining
function of the parameter for those data. The letters cand gare function names; writing
them side by side means multiply their values.
When maximizing a likelihood, factors that do not depend on the unknown parameter do not
affect the location of the maximum. Suppose
L(θ∣x) = c(x)g(θ∣x),
where c(x) > 0 does not depend on θ. Multiplying every likelihood value by the same positive
constant changes the vertical scale but not the maximizing value. We can write
L(θ∣x) ∝g(θ∣x).
After taking logarithms, additive terms that do not depend on θcan also be removed. In the
Poisson and normal examples, Crepresents these constant terms.
We must be careful about what is constant. The observed data are fixed when viewing the
likelihood as a function of the parameter. A term involving only x can be removed. A term
involving θmust remain, even if it looks inconvenient.
5.6 Edge cases and boundaries
The derivative procedure is useful, but it does not cover every likelihood. A maximum can
occur at the boundary of the parameter space, and the likelihood can change its allowed region
as the parameter changes.
5.6.1 A constrained probability
Suppose earlier scientific knowledge restricts a probability to
0 ≤p≤0.40.
In a sample of 20 observations, suppose 11 are successes. Without the restriction, the Bernoulli
likelihood would be maximized at 11/20 = 0.55. However, 0.55 is not in the parameter space.
93

<!-- page 24 -->
<!-- extracted via text-layer confidence=0.95 -->
Within the allowed interval, the likelihood continues to increase all the way to p= 0.40.
Therefore, the constrained MLE iŝ
p= 0.40.
p <- seq(0, 0.40, length.out = 400)
likelihood <- dbinom(11, size = 20, prob = p)
plot(
p,
likelihood,
type = "l",
lwd = 2,
col = "steelblue",
xlab = "Allowed value of p",
ylab = "Likelihood",
main = "A maximum at the boundary"
)
abline(v = 0.40, col = "firebrick", lwd = 2, lty = 2)
0.0
0.1
0.2
0.3
0.4
0.00
0.02
0.04
0.06
A maximum at the boundary
Allowed value of p
Likelihood
Figure 5.3: When the unconstrained maximizer is outside the parameter space, the MLE can
occur at a boundary.
94

<!-- page 25 -->
<!-- extracted via text-layer confidence=0.95 -->
The likelihood in Figure 5.3 has no interior turning point over the allowed parameter space.
It is still possible to identify the maximum by checking the boundary.
5.6.2 When the support depends on the parameter
Ĺ Note
maxiximeans “the largest observed value among all indices i= 1, ... , n.” It is shorthand
for max(x1, ... , xn). With uppercase observations, max(X1, ... , Xn) is the random sample
maximum. The indicator I(θ≥maxixi) requires the proposed endpoint to be at least
as large as every observation.
Suppose observations are modeled as uniform on [0, θ], where θ> 0.
The density of one
observation is
f(x∣θ) = 1
θI(0 ≤x≤θ).
For the full sample, the likelihood is
L(θ∣x) = 1
θnI(θ≥max
i
xi) .
The indicator matters.
Any value of θbelow the largest observation gives likelihood zero
because the model says that observation would be impossible. Among values at or above the
sample maximum, 1/θndecreases as θincreases. The likelihood is therefore largest at the
smallest allowed value:̂
θ= max(X1, X2, ... , Xn).
Differentiating −nlog θand setting the result equal to zero would not find this answer. Its
derivative is never zero. The maximum comes from the boundary created by the parameter-
dependent support.
This example shows why we should write the full likelihood, including indicator functions or
parameter restrictions, before using calculus.
95

<!-- page 26 -->
<!-- extracted via text-layer confidence=0.95 -->
5.7 A practical checklist
When finding an MLE, the following questions help prevent common mistakes:
1. What is the parameter, and what values are allowed?
2. What is the likelihood for the complete observed data vector?
3. Does the support of the model depend on the parameter?
4. Which factors or terms are constant with respect to the parameter?
5. Would the log-likelihood be easier to work with?
6. Does solving the first derivative produce an allowed candidate?
7. Is the candidate a local maximum?
8. Could a boundary produce a larger likelihood?
The calculus procedure is a tool, not the definition of maximum likelihood estimation. The
definition is always to find the allowed parameter value that makes the likelihood as large as
possible.
5.8 Chapter summary
• Maximum likelihood estimation is a frequentist method that treats the parameter as
fixed and unknown.
• The MLE is the parameter value that maximizes the likelihood of the observed data.
• Likelihood compares parameter values but is not a probability distribution for the pa-
rameter.
• The likelihood and log-likelihood have the same maximizer because the logarithm is
strictly increasing.
• Differentiating the log-likelihood often produces a candidate MLE when the maximum
is in the interior of the parameter space.
• A negative second derivative confirms a local maximum but does not replace checking
the full parameter space.
• For Bernoulli, Poisson, and normal-mean models, the MLE is the corresponding sample
proportion or sample mean.
• Factors that do not depend on the parameter can be removed when maximizing a likeli-
hood.
• Parameter restrictions and parameter-dependent support can place the MLE at a bound-
ary.
• The definition of the MLE is more general than the usual derivative procedure.
96
