---
source: readings/reading-ch01-probability-and-logic-of-inference.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 25
kind: reading
confidence: 0.95
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
1 Probability and the Logic of Statistical
Inference
Imagine that you open a weather app and see a 30% chance of rain. You see the probability
but you are wondering what might actually happen. Now consider a different situation. You
know that it rained on 7 of the last 10 days, and you want to learn something about the usual
weather here in Santa Cruz. That reversal from using a probability to anticipate data, to
using data to learn about a probability, is the move from probability theory to statistical
inference.
This chapter reviews the probability ideas that will be most important as we study statistical
inference. The aim is not to rederive every formula. Instead, we will focus on what each object
describes, how the pieces fit together, and why they will matter later in the course.
1.1 Probability begins with uncertainty
A random experiment is any repeatable process whose outcome is not known in advance.
The word experiment is used broadly. Rolling a die is an experiment, but so is recording the
time until the next bus arrives, selecting a student at random and asking how long they slept,
or observing whether a customer renews a subscription.
The sample space, usually written Ω, is the collection of every possible outcome. Its form
depends on what we choose to record.
• If we record the result of one coin toss, Ω = {H, T}.
• If we record a student’s commute time in minutes, a useful sample space might be
Ω = [0, ∞).
• If we record the outcomes of two coin tosses in order, Ω = {HH, HT, TH, TT}.
The sample space is not simply “everything that could happen in the universe.” It is everything
our experiment is designed to record. For two coin tosses, “the second toss falls onto the floor”
is not part of the mathematical model unless we decide to include it.
An event is a collection of outcomes (i.e., a subset of the sample space). In the two-toss
example, the event “exactly one head” is
8

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
A= {HT, TH}.
An event occurs when the observed outcome belongs to its set. This language lets us ask prob-
ability questions about features of outcomes rather than only about individual outcomes.
1.1.1 What a probability measure does
A probability measure Passigns a number to each event. The number P(A) describes how
likely event Ais under the model. Probabilities obey three basic rules:
1. 0 ≤P(A) ≤1 for every event A.
2. P(Ω) = 1 because some outcome in the sample space must occur.
3. If Aand Bcannot occur together, then P(A∪B) = P(A) + P(B).
The third rule applies directly only to disjoint events. For example, on one die roll, the events
“roll a 1” and “roll a 2” cannot both happen, so their probabilities can simply be added. In
contrast, “roll an even number” and “roll a number greater than 3” overlap at 4 and 6. Adding
their probabilities without correcting for that overlap would count those outcomes twice.
Probabilities can be interpreted as long-run proportions. If a process is repeated many times
under stable conditions, an event with probability 0.30 should occur on roughly 30% of repe-
titions. This does not mean it must occur exactly 3 times in every 10 trials. Randomness will
typically create short-run variation.
set.seed(132)
tosses <- sample(c(0, 1), size = 1000, replace = TRUE)
running_proportion <- cumsum(tosses) / seq_along(tosses)
plot(
running_proportion,
type = "l",
xlab = "Number of tosses",
ylab = "Proportion of heads",
ylim = c(0, 1),
col = "steelblue",
lwd = 2
)
abline(h = 0.5, col = "firebrick", lty = 2, lwd = 2)
9

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
0
200
400
600
800
1000
0.0
0.2
0.4
0.6
0.8
1.0
Number of tosses
Proportion of heads
Figure 1.1: The proportion of heads fluctuates at first and then settles near 0.50.
In Figure 1.1, a head is coded as 1 and a tail as 0. After only a few tosses, one additional head
can change the proportion substantially. After hundreds of tosses, one result has little effect,
and the proportion tends to remain near 0.50.
1.2 Conditional probability
Often a probability changes when we learn something new. The conditional probability of
Agiven Bis
P(A∣B) = P(A∩B)
P(B)
,
P(B) > 0.
The vertical bar is read as “given.” The formula says that once we know Boccurred, outcomes
outside Bare no longer relevant. We restrict attention to Band ask what fraction of its
probability also belongs to A.
Suppose a campus survey finds that 40% of students commute, 25% commute and have an 8
a.m. class, and 50% have an 8 a.m. class. Let
• Cbe the event that a student commutes, and
10

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
• Ebe the event that a student has an 8 a.m. class.
Then
P(C∣E) = P(C∩E)
P(E)
= 0.25
0.50 = 0.50.
Among students with an 8 a.m. class, half commute. Notice that P(C∣E) = 0.50 differs from
the unconditional probability P(C) = 0.40. Knowing about the class schedule changed the
relevant group.
The order matters. In the same example,
P(E∣C) = P(C∩E)
P(C)
= 0.25
0.40 = 0.625.
“The probability a commuter has an 8 a.m. class” is not the same question as “the probability
an 8 a.m. student commutes.” Confusing these two directions is a common source of incorrect
reasoning.
1.2.1 Bayes’ rule
Bayes’ rule provides a way to reverse the direction of a conditional probability:
P(A∣B) = P(B∣A)P(A)
P(B)
.
For an event Aand its complement Ac, the denominator can be expanded as
P(B) = P(B∣A)P(A) + P(B∣Ac)P(Ac).
Each part has a useful interpretation:
• P(A) describes how plausible Awas before observing B.
• P(B∣A) describes how compatible the observation Bis with A.
• P(A∣B) describes how plausible Ais after observing B.
11

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
Consider an automated plagiarism-screening tool. Suppose 2% of submitted papers actually
contain copied passages. The tool flags 90% of papers that contain copied material, but it also
flags 5% of papers that do not. If a paper is flagged, what is the probability that it actually
contains copied material?
Let Cmean that the paper contains copied material and Fmean that it is flagged. Then
P(C∣F) =
P(F∣C)P(C)
P(F∣C)P(C) + P(F∣Cc)P(Cc)
=
(0.90)(0.02)
(0.90)(0.02) + (0.05)(0.98)
≈0.269.
Despite the tool’s high detection rate, only about 27% of flagged papers actually contain copied
material under these assumptions. The reason is the low starting rate. There are many more
papers without copied material, so even a 5% false-positive rate creates many flags. This is
why the base rate P(C) matters.
Bayes’ rule will later become the foundation of Bayesian inference, where data can be used to
update what we believe about unknown parameters.
1.3 Random variables turn outcomes into numbers
A random variable is a function that assigns a numerical value to each outcome:
X∶Ω ⟶R.
The formal definition can sound more mysterious than the idea. A random variable is simply
a numerical measurement determined by a random outcome.
For two coin tosses, define Xas the number of heads. Then
X(HH) = 2,
X(HT) = X(TH) = 1,
X(TT) = 0.
The randomness comes from not knowing which outcome will occur. Once the experiment is
performed, the observed value is an ordinary number. We typically use an uppercase letter
such as Xfor the random variable and a lowercase letter such as xfor a possible or observed
value.
12

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
1.3.1 Discrete and continuous random variables
A discrete random variable takes values that can be listed, even if the list is infinite.
Examples include the number of unread emails you have, the number of customers arriving in
an hour, and the number of attempts needed to pass a driving test.
A continuous random variable can take any value in an interval. Examples include reaction
time, temperature, distance, and battery life.
A recorded measurement may be rounded
(perhaps battery life is reported to the nearest minute) but the underlying quantity is still
modeled as continuous.
The distinction matters because probabilities are assigned differently in the two cases.
1.4 Three ways to describe a distribution
A probability distribution describes which values a random variable can take and how prob-
ability is allocated among them (i.e., how likely are different values to occur). A distribution
is often used as a model for random variation.
1.4.1 Probability mass functions
For a discrete random variable, the probability mass function (PMF) is
f(x) = P(X= x).
The PMF gives the probability of each possible value directly. All values are nonnegative and
their probabilities sum to 1.
For the number of heads in two fair tosses,
x
0
1
2
P(X= x)
1/4
1/2
1/4
The middle value has more probability because two different outcomes, HTand TH, produce
one head.
13

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
1.4.2 Probability density functions
For a continuous random variable, a probability density function (PDF) is a curve f(x)
for which probability is represented by area:
P(a≤X≤b) = ∫
b
a
f(x) dx.
The height of a density curve is not itself a probability. A tall part of the curve indicates
that values are relatively concentrated nearby, but probability comes from the area over an
interval. This distinction also explains why, for a continuous random variable,
P(X= x) = 0
for any single exact value x. An interval with zero width has zero area.
1.4.3 Cumulative distribution functions
The cumulative distribution function (CDF) works for both discrete and continuous ran-
dom variables:
F(x) = P(X≤x).
It accumulates all probability at or below some value x. A CDF never decreases, starts at 0
on the far left, and approaches 1 on the far right.
Suppose commute time is normally distributed with mean 25 minutes and standard deviation
6 minutes. In R, pnorm() evaluates the normal CDF:
mean_commute <- 25
sd_commute <- 6
# Probability that a commute takes at most 30 minutes
pnorm(30, mean = mean_commute, sd = sd_commute)
[1] 0.7976716
# Probability that a commute takes between 20 and 30 minutes
pnorm(30, mean = mean_commute, sd = sd_commute) -
pnorm(20, mean = mean_commute, sd = sd_commute)
14

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
[1] 0.5953432
The first calculation collects all probability to the left of 30. The second subtracts the area to
the left of 20 from the area to the left of 30, leaving only the area between them.
commute_times <- seq(5, 45, length.out = 300)
density_values <- dnorm(commute_times, mean = 25, sd = 6)
cdf_values <- pnorm(commute_times, mean = 25, sd = 6)
par(mfrow = c(1, 2))
plot(
commute_times, density_values,
type = "l", lwd = 2, col = "steelblue",
xlab = "Commute time (minutes)", ylab = "Density",
main = "Probability density function"
)
plot(
commute_times, cdf_values,
type = "l", lwd = 2, col = "darkorange",
xlab = "Commute time (minutes)", ylab = "Cumulative probability",
main = "Cumulative distribution function"
)
par(mfrow = c(1, 1))
15

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
10
20
30
40
0.00
0.02
0.04
0.06
Probability density function
Commute time (minutes)
Density
10
20
30
40
0.0
0.2
0.4
0.6
0.8
1.0
Cumulative distribution function
Commute time (minutes)
Cumulative probability
Figure 1.2: A density describes local concentration while a CDF shows accumulated probabil-
ity.
In Figure 1.2, the density rises and falls, while the CDF can only rise. At 25 minutes, the
CDF equals 0.5 meaning half of this distribution lies at or below its mean.
1.5 Expectation and variance summarize a distribution
A full distribution contains a great deal of information. Two numerical summaries (expectation
and variance) can be used describe its center and spread.
1.5.1 Expected value
For a discrete random variable,
E[X] = ∑
x
xP(X= x),
and for a continuous random variable,
E[X] = ∫
∞
−∞
xf(x) dx.
16

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
The expected value, or mean, is a probability-weighted average of the possible values. Values
with more probability exert more influence on the mean.
Expectation is best understood as a long-run average, not a guaranteed result from one or a
few trials. If a café gives a digital reward worth $0, $2, or $10 with probabilities 0.70, 0.25,
and 0.05, respectively, then
E[X] = (0)(0.70) + (2)(0.25) + (10)(0.05) = 1.
No customer receives exactly $1, yet the average reward over many customers should be close
to $1. An expected value does not need to be one of the possible individual outcomes.
1.5.2 Variance and standard deviation
The variance of Xis
Var(X) = E[(X−E[X])2] = E[X2] −(E[X])2.
Variance measures how far values tend to fall from the mean. The deviations are squared so
that distances below and above the mean do not cancel. Squaring also gives greater weight to
unusually large deviations.
Because variance is expressed in squared units, we often interpret the standard deviation
instead:
SD(X) = √Var(X).
If commute time is measured in minutes, its variance is measured in squared minutes, but its
standard deviation is again measured in minutes.
Two courses could both have an average exam score of 75 while differing greatly in variability.
In one, nearly everyone may score between 70 and 80. In the other, scores may range from 40
to 100. The same mean does not imply the same distribution.
1.6 Some common distributions
Probability distributions are reusable models for common forms of random variation. Choosing
a distribution means making assumptions about the values that are possible and how their
probabilities behave. Below are some commonly used distributions that describe frequently
occuring patterns of variation.
17

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
1.6.1 Binomial
If X∼Bin(n, p), then
P(X= x) = (n
x)px(1 −p)n−x,
x= 0, 1, ... , n.
The binomial distribution applies when there are ntrials, each trial has two categorized out-
comes, the success probability pstays constant, and the trials are independent. “Success” is
only a label for the outcome being counted. It could mean a student answers correctly, a
package arrives on time, or a free throw is made.
The term (n
x) counts the number of different arrangements that contain xsuccesses. The term
px(1 −p)n−xgives the probability of any one such arrangement.
Its mean and variance are
E[X] = np,
Var(X) = np(1 −p).
For example, if a person receives 20 legitimate emails and independently has a 10% chance of
overlooking each one, the expected number overlooked is 20(0.10) = 2.
1.6.2 Poisson
If X∼Poisson(λ), then
P(X= x) = λxe−λ
x!
,
x= 0, 1, 2, ... .
The Poisson distribution often models the number of events occurring in a fixed interval of
time or space. For example, customers arriving in the next ten minutes, potholes along a mile
of road, or support requests received overnight. The parameter λ> 0 is the average number
of events in that interval.
For a Poisson random variable,
E[X] = λ,
Var(X) = λ.
That equality is a recognizable feature of the Poisson model. Real count data with variance
much larger than the mean may need a different model.
18

<!-- page 12 -->
<!-- extracted via text-layer confidence=0.95 -->
1.6.3 Normal
If X∼N(μ, σ2), its density is
f(x) =
1
√
2πσ2 exp [−(x−μ)2
2σ2
] ,
−∞< x< ∞.
The normal distribution is symmetric and bell-shaped. The parameter μsets its center and
σ2 controls its spread:
E[X] = μ,
Var(X) = σ2.
It can be a useful model for measurements produced by many small sources of variation, such as
manufacturing dimensions or repeated measurement error. It is not automatically appropriate
for every continuous variable. Income, waiting time, and other strongly right-skewed variables
are usually not well represented by a symmetric normal curve.
1.6.4 Exponential
If X∼Exp(λ), then
f(x) = λe−λx,
x≥0.
The exponential distribution is often used for waiting times when events occur at a constant
average rate. If requests reach a server at an average rate of 3 per minute, an exponential
model may describe the time until the next request.
Its mean and variance are
E[X] = 1
λ,
Var(X) = 1
λ2 .
19

<!-- page 13 -->
<!-- extracted via text-layer confidence=0.95 -->
1.6.5 Gamma
One common rate-parameter form of the gamma density is
f(x) =
βα
Γ(α)xα−1e−βx,
x> 0,
where α> 0 is the shape and β> 0 is the rate. Its mean and variance are
E[X] = α
β,
Var(X) = α
β2 .
The gamma distribution is flexible and right-skewed. It can model positive quantities such as
service times or the time until several events have occurred. The exponential distribution is
the special case α= 1.
The gamma function in the denominator extends the factorial to positive real numbers:
Γ(x) = ∫
∞
0
tx−1e−tdt,
Γ(n) = (n−1)!
for a positive integer n. In a density formula, its main role is normalization, meaning it allows
the total area under the curve to be equal to 1.
1.6.6 Beta
If X∼Beta(α, β), then
f(x) = xα−1(1 −x)β−1
B(α, β)
,
0 < x< 1.
Because its possible values lie between 0 and 1, the beta distribution is especially useful for pro-
portions and probabilities. Depending on αand β, it can be symmetric, skewed, concentrated
near the middle, or concentrated near the endpoints.
Its mean is
E[X] =
α
α+ β,
and its variance is
20

<!-- page 14 -->
<!-- extracted via text-layer confidence=0.95 -->
Var(X) =
αβ
(α+ β)2(α+ β+ 1).
The beta function is related to the gamma function by
B(α, β) = Γ(α)Γ(β)
Γ(α+ β) .
Later, beta distributions will provide convenient models for uncertainty about an unknown
probability, such as the proportion of students who use a particular campus service.
1.6.7 Uniform
If X∼U(a, b), then
f(x) =
1
b−a,
a≤x≤b.
The uniform distribution assigns equal density everywhere within its interval. Its mean and
variance are
E[X] = a+ b
2
,
Var(X) = (b−a)2
12
.
A uniform model might represent a random arrival time known only to lie within a fixed
window, provided there is no reason to favor one part of the window over another.
par(mfrow = c(2, 2))
x_binom <- 0:15
plot(
x_binom, dbinom(x_binom, size = 15, prob = 0.4),
type = "h", lwd = 4, col = "steelblue",
xlab = "Number of successes", ylab = "Probability",
main = "Binomial(15, 0.4)"
)
x_poisson <- 0:15
plot(
x_poisson, dpois(x_poisson, lambda = 4),
type = "h", lwd = 4, col = "darkorange",
xlab = "Number of events", ylab = "Probability",
21

<!-- page 15 -->
<!-- extracted via text-layer confidence=0.95 -->
main = "Poisson(4)"
)
x_normal <- seq(-4, 4, length.out = 300)
plot(
x_normal, dnorm(x_normal),
type = "l", lwd = 2, col = "firebrick",
xlab = "Value", ylab = "Density",
main = "Normal(0, 1)"
)
x_beta <- seq(0, 1, length.out = 300)
plot(
x_beta, dbeta(x_beta, shape1 = 2, shape2 = 5),
type = "l", lwd = 2, col = "darkgreen",
xlab = "Proportion", ylab = "Density",
main = "Beta(2, 5)"
)
par(mfrow = c(1, 1))
22

<!-- page 16 -->
<!-- extracted via text-layer confidence=0.95 -->
0
5
10
15
0.00
0.10
0.20
Binomial(15, 0.4)
Number of successes
Probability
0
5
10
15
0.00
0.10
0.20
Poisson(4)
Number of events
Probability
−4
−2
0
2
4
0.0
0.1
0.2
0.3
0.4
Normal(0, 1)
Value
Density
0.0
0.2
0.4
0.6
0.8
1.0
0.0
1.0
2.0
Beta(2, 5)
Proportion
Density
Figure 1.3: Several common distributions model distinctly different kinds of variation.
The plots in Figure 1.3 are not just different shapes. They live on different sets of possible val-
ues and answer different modeling needs. Binomial and Poisson variables are counts. Normal
variables can take any real value. Beta variables are restricted to the interval from 0 to 1.
1.7 From individual observations to sample averages
Suppose X1, X2, ... , Xnare observations from the same population. Their sample mean is̄
X= 1
n
n
∑
i=1
Xi.
Notice that the sample mean is also a random variable. Two important probability results
explain why sample means are so important in statistics. They answer different questions and
23

<!-- page 17 -->
<!-- extracted via text-layer confidence=0.95 -->
should not be confused.
1.7.1 The law of large numbers
The law of large numbers says that the sample mean̄ Xgets closer to the population mean
E[X] as the sample size grows.
This is a statement about where the sample mean goes. A small sample mean can be far
from the population mean because of random variation. A large sample averages over more of
that variation, making major departures less likely.
The running coin-toss proportion in Figure 1.1 is an example. Since a toss was coded 1 for heads
and 0 for tails, its sample mean is exactly the sample proportion of heads. The population
mean is 0.5, so the sample proportion settles near 0.5.
The law does not say that more data make every observation less variable. Individual coin
tosses remain just as unpredictable. It says that the average becomes more stable as more
and more data points are being included in that average.
1.7.2 The central limit theorem
The central limit theorem (CLT) says that the sampling distribution of the sample mean
becomes approximately normal as ngrows, even when the original population that generates
the data is not normal.
This is a statement about the shape of the distribution of sample means. If the popu-
lation distribution (the distribution that generates the data) has mean μand finite standard
deviation σ, then for a sufficiently large sample,̄
Xis approximately N(μ, σ2
n) .
Equivalently, the standard deviation of the sample mean is
SD(̄X) =
σ
√n.
This formula explains why averages become less variable as the sample size grows.
To see the CLT, consider individual waiting times drawn from a strongly right-skewed expo-
nential distribution. We repeatedly draw samples and save their means.
24

<!-- page 18 -->
<!-- extracted via text-layer confidence=0.95 -->
set.seed(132)
one_wait <- rexp(5000, rate = 1)
sample_means <- replicate(
5000,
mean(rexp(30, rate = 1))
)
par(mfrow = c(1, 2))
hist(
one_wait,
breaks = 35,
probability = TRUE,
col = "skyblue",
border = "white",
main = "Individual waiting times",
xlab = "Waiting time"
)
hist(
sample_means,
breaks = 30,
probability = TRUE,
col = "wheat",
border = "white",
main = "Means of 30 waiting times",
xlab = "Sample mean"
)
curve(
dnorm(x, mean = 1, sd = 1 / sqrt(30)),
add = TRUE,
col = "firebrick",
lwd = 2
)
par(mfrow = c(1, 1))
25

<!-- page 19 -->
<!-- extracted via text-layer confidence=0.95 -->
Individual waiting times
Waiting time
Density
0
2
4
6
8
0.0
0.2
0.4
0.6
0.8
Means of 30 waiting times
Sample mean
Density
0.5
1.0
1.5
2.0
0.0
0.5
1.0
1.5
2.0
Figure 1.4: Individual waiting times are strongly skewed, but means of 30 waiting times have
an approximately normal shape.
The left side of Figure 1.4 shows the population shape: most waits are short, but a few are
quite long. The right side shows the distribution of averages from many samples of size 30.
Those averages are more symmetric, concentrated near the population mean of 1, and closely
matched by the normal curve.
The CLT does not say that the original population becomes normal, nor does it say that a large
dataset must have a bell-shaped histogram. It describes the behavior of a statistic (specifically
the sample mean) across repeated samples.
1.8 From probability to statistical inference
Probability and inference use the same mathematical model in opposite directions.
Probability starts with a model and asks about data. If a coin has probability p= 0.5
of heads, what is the probability of observing exactly 6 heads in 10 tosses?
With X∼
Bin(10, 0.5),
P(X= 6) = (10
6 )(0.5)6(0.5)4 ≈0.205.
In R:
26

<!-- page 20 -->
<!-- extracted via text-layer confidence=0.95 -->
dbinom(6, size = 10, prob = 0.5)
[1] 0.2050781
Here the model and its parameter are known but the data are uncertain.
Statistical inference starts with data and asks about the model. If we toss a particular
coin 10 times and observe 8 heads, what should we conclude about its unknown probability p
of heads? Is p= 0.5 still plausible? What values of pare reasonably consistent with what we
observed?
Here the data are known but the model or its parameters are uncertain. A natural initial
estimate iŝ p= 8/10 = 0.8, but ten tosses contain limited information. Even a fair coin can
occasionally produce eight or more heads:
# Probability of at least 8 heads if the coin is fair
pbinom(7, size = 10, prob = 0.5, lower.tail = FALSE)
[1] 0.0546875
Statistical inference gives us tools to express that uncertainty rather than treating 0.8 as some
unquestionable truth.
1.8.1 Population, sample, and model
The population is the full collection we want to understand. It might be all currently enrolled
students at a university, every battery produced by a factory this week, or all future requests
handled by a web service under stable conditions.
A sample is the subset we actually observe. We use the sample because measuring the entire
population may be too costly, too slow, impossible, or conceptually inappropriate when the
population includes future outcomes.
A statistical model is a set of probability distributions proposed as plausible descriptions
of how the data were generated. The model connects the question about the population that
we are interested in to the mathematics of probability. Every model simplifies reality in some
way. The important question is whether its simplifications are reasonable for the purpose at
hand.
27

<!-- page 21 -->
<!-- extracted via text-layer confidence=0.95 -->
1.9 Parametric and nonparametric approaches
A parametric model assumes that the population distribution belongs to a specified family
described by a finite set of unknown parameters. For example,
Xi∼N(μ, σ2)
assumes a normal population whose central tendency and spread are governed by two unknown
numbers, μand σ2.
Parametric models can be efficient and interpretable because the model reduces a complicated
distribution to a few quantities. That benefit depends on the assumptions being reasonable.
A normal model may be useful for adult heights in a fairly homogeneous population, but
it would be a poor model for personal income because income is bounded below and often
strongly right-skewed.
A nonparametric approach makes fewer assumptions about the population’s distributional
form. Estimating a population median by using the sample median does not require us to
assume that the population is normal, gamma, or any other particular shape.
“Nonparametric” does not mean “no parameters,” and it does not mean “no assumptions.” It
means that we do not restrict the entire population distribution to a family indexed by a fixed,
finite set of parameters. Stronger assumptions can give more precise conclusions when they
are appropriate, while weaker assumptions provide flexibility and robustness.
1.10 Parameters, parameter spaces, and statistics
These three terms are closely related but refer to different things.
1.10.1 Parameters describe the population model
A parameter is an unknown numerical feature of a population or probability model. Examples
include:
• the proportion pof students who commute by public transit
• the mean μbattery life for a model of laptop
• the variance σ2 of delivery times
• the Poisson rate λof help-desk requests per hour.
28

<!-- page 22 -->
<!-- extracted via text-layer confidence=0.95 -->
In this class, a parameter is fixed but unknown. It does not change from one random sample
to another. However our information about it changes as we collect data.
The parameter space is the collection of values a parameter is allowed to take. The restric-
tions should match the meaning of the parameter. For a normal model N(μ, σ2),
μ∈R,
σ2 > 0.
A mean can be any real number in the Normal probability model, while a variance must be
positive. For a probability p, the parameter space is [0, 1]. Declaring the parameter space
prevents nonsensical possibilities such as a probability of 1.4 or a negative variance.
1.10.2 Statistics are calculated from the sample
A statistic is any function of the observed data that does not depend on an unknown param-
eter:
T= t(X1, X2, ... , Xn).
Two essential statistics are the sample mean̄
X= 1
n
n
∑
i=1
Xi
and the sample variance
S2 =
1
n−1
n
∑
i=1
(Xi−̄ X)2.
The sample mean describes the center of the observed values. The sample variance describes
their spread around that observed center.
Before data are collected, a statistic is also a random variable because its value depends on
the random sample. After data are collected, we can calculate its realized value.
1.11 The main jobs of statistical inference
Most of this course can be organized around estimation, prediction, and hypothesis testing.
29

<!-- page 23 -->
<!-- extracted via text-layer confidence=0.95 -->
1.11.1 Point estimation
A point estimate is a single best guess for an unknown parameter. If 84 of 120 surveyed
students support extending library hours, the sample proportion̂
p= 84
120 = 0.70
is a natural point estimate of the population proportion p.
A point estimate is useful but incomplete. Another random sample would probably produce
a slightly different value. Reporting only 0.70 can hide how much uncertainty remains.
1.11.2 Interval estimation
An interval estimate gives a range of parameter values supported by the data, together with
a framework-specific measure of uncertainty. A confidence interval and a Bayesian credible
interval may look similar numerically, but they attach probability to different objects and
require different interpretations. We will develop both ideas later.
The essential motivation is the same though. An interval acknowledges that a sample cannot
usually identify an unknown population quantity exactly.
1.11.3 Prediction
Prediction concerns an unobserved or future outcome rather than a fixed parameter. For
example, enrollment data from the last ten years might be used to predict next year’s STAT
132 enrollment.
Estimation and prediction are related but distinct. Estimating the average enrollment asks
about a feature of the process. Predicting next year’s enrollment asks about a new outcome,
which can deviate from that average. A good prediction must account for both uncertainty
about the model and natural year-to-year variation.
1.11.4 Hypothesis testing
A hypothesis test uses sample data to evaluate a claim about a parameter. Suppose a fruit
distributor claims that the mean weight of a type of fruit is 100 grams. We might express the
competing claims as
H0 ∶μ= 100
and
H1 ∶μ≠100.
30

<!-- page 24 -->
<!-- extracted via text-layer confidence=0.95 -->
The null hypothesis H0 is the specific claim being assessed. The alternative H1 represents
departures of interest. We ask whether the observed sample would be unusually inconsistent
with H0.
A test does not prove that one statement is true. Data contain randomness, so decisions can
be wrong.
A sample mean of 98 grams does not by itself refute a mean of 100: whether
that difference is compelling depends on the sample size and the natural variability of fruit
weights. Hypothesis testing provides a disciplined way to measure the evidence and control
error rates.
1.12 How the pieces fit together
Statistical inference is possible because statistics have probability distributions. We begin with
a population model containing unknown parameters, draw a random sample, and calculate a
statistic. Probability theory describes how that statistic would vary across repeated samples.
Inference then uses the statistic we actually observed to learn about the unknown parameter
or predict a new observation.
The logic can be summarized as
population model ⟶random sample ⟶statistic ⟶inference about the population.
The first arrows describe the data-generating direction studied by probability. The final arrow
uses observed data to reason about what could have generated them.
1.13 Chapter summary
• A sample space lists possible outcomes, while events collect outcomes of interest.
• Conditional probability restricts attention to outcomes consistent with known informa-
tion. Bayes’ rule reverses the direction of conditioning while accounting for base rates.
• A random variable converts random outcomes into numerical values. Its distribution
describes how probability is allocated.
• PMFs assign probability to discrete values, PDFs assign probability through area, and
CDFs accumulate probability up to a value.
• Expectation describes a distribution’s long-run center. Variance and standard deviation
describe its spread.
• Common distributions represent different data types and mechanisms. Choosing one is
a substantive modeling decision.
31

<!-- page 25 -->
<!-- extracted via text-layer confidence=0.95 -->
• The law of large numbers explains why sample averages stabilize.
The central limit
theorem explains why the distribution of many sample averages becomes approximately
normal.
• Probability reasons from a model toward possible data. Statistical inference uses ob-
served data to learn about an unknown model or parameter.
• Parameters describe populations or models. Statistics are computed from samples.
• Estimation, prediction, and hypothesis testing are three central goals of inference.
32
