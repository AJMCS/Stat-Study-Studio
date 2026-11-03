---
source: readings/reading-ch11-interval-estimation.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 27
kind: reading
confidence: 0.95
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
11 Interval Estimation
A point estimate gives us one number. It does not tell us how much that number might change
if we collected another sample. An interval estimate adds this missing information by giving
a range with a carefully defined measure of uncertainty.
The main challenge is understanding what that measure means. A confidence interval describes
the long-run performance of a sampling procedure.
A Bayesian credible interval describes
uncertainty in a posterior distribution. Both give ranges, but they answer different probability
questions.
This chapter builds confidence intervals from the normal, t, and chi-square distributions we
have already studied. We will also return to posterior distributions to see how credible intervals
are constructed.
11.1 From a point estimate to a random interval
Imagine estimating a population mean from a sample.
Before collecting the observations,
the sample mean is random. An interval built around it is random too. A different sample
generally gives different endpoints.
Ĺ Notation: interval endpoints and confidence level
θdenotes the fixed, unknown parameter we want to estimate. The bold symbol X =
(X1, ... , Xn) represents the entire random sample.
L(X) and U(X) are statistics that give the lower and upper endpoints of an interval. We
often shorten them to Land U. The expression [L, U] includes all numbers between the
endpoints, including the endpoints themselves.
The Greek letter αis the chosen probability of failing to cover the parameter.
The
confidence level is 1 −α. For a 95% confidence level, α= 0.05.
Pθdenotes probability when the population parameter has the particular value θ. Its
subscript tells us which sampling distribution is being used.
An exact confidence interval procedure satisfies
Pθ{L(X) ≤θ≤U(X)} = 1 −α
171

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
for every allowed value of θ. The parameter stays fixed in this probability statement. The
sample, and therefore the interval, varies.
The probability that the interval contains the parameter is called its coverage probability.
Some procedures have coverage at least 1−α, rather than exactly 1−α. Others have coverage
only approximately equal to the stated level. In this chapter, our normal-model confidence
intervals have exact coverage under their stated assumptions.
After observing a sample, we substitute the data into the endpoint formulas. The resulting
numerical interval is the observed confidence interval.
Ĺ Notation: random endpoints and observed endpoints
Lowercase x = (x1, ... , xn) denotes the observed data.
The numbers l= L(x) and
u= U(x) are the observed endpoints.
Uppercase Land Uemphasize what varies across possible samples. Lowercase land u
refer to the values calculated from the sample we actually obtained.
11.2 A normal mean when the variance is known
Suppose the observations are independent and each has a normal distribution with mean μ
and variance σ2. For now, assume that σis known.
Ĺ Notation: a mean interval and its normal cutoff
X= 1
n∑
n
i=1 Xiis the sample mean.
μis the population mean, σ2 is the population variance, and σis its positive square root,
the population standard deviation. The quantity σ/√nis the standard deviation of the
sample mean, also called its standard error.
zpis the standard normal quantile with probability pto its left. Thus P(Z≤zp) = pfor
Z∼N(0, 1).
The expression a± bdescribes the interval from a−bto a+ b. The positive quantity b
is its margin of error, or half-width.
We know that
Z= X−μ
σ/√n∼N(0, 1).
Leaving probability α/2 in each tail gives
172

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
P{−z1−α/2 ≤X−μ
σ/√n≤z1−α/2} = 1 −α.
To turn this into an interval for μ, multiply through by the positive standard error. Then
rearrange both inequalities so that μis in the middle:
P{X−z1−α/2
σ
√n≤μ≤X+ z1−α/2
σ
√n} = 1 −α.
The confidence interval is therefore
X± z1−α/2
σ
√n.
For 95% confidence, the positive cutoff is z0.975 ≈1.96. We use 0.975 because the upper tail has
probability 0.025. Using z0.95 instead would produce a central (equal-tailed) 90% interval.
11.2.1 Worked example: planning for a desired precision
A laboratory will measure the concentration of a reference solution.
Assume independent
normal measurements with a known standard deviation of 4.5 units. Before collecting data,
the laboratory wants to choose a sample size so that its 95% confidence interval for the mean
has a margin of error no greater than 1.2 units.
This is a planning question. We do not need a sample mean because the margin of error in
the known-variance setting does not depend on the observed measurements.
The requirement is
z0.975
4.5
√n≤1.2.
Both sides are positive, so we can rearrange and square to obtain
n≥(z0.975 × 4.5
1.2
)
2
≈54.021.
A sample size must be a whole number. We round upward and plan for 55 measurements.
With 54 measurements, the margin is about 1.2002, just above the target. With 55, it is about
1.1893.
173

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
required_size <- (qnorm(0.975) * 4.5 / 1.2)^2
required_size
[1] 54.02051
qnorm(0.975) * 4.5 / sqrt(54)
[1] 1.200228
qnorm(0.975) * 4.5 / sqrt(55)
[1] 1.189267
The formula also shows the cost of greater precision. To cut the margin of error in half while
keeping the confidence level and population standard deviation unchanged, we need four times
as many observations.
sample_sizes <- 10:150
margin_90 <- qnorm(0.95) * 4.5 / sqrt(sample_sizes)
margin_95 <- qnorm(0.975) * 4.5 / sqrt(sample_sizes)
margin_99 <- qnorm(0.995) * 4.5 / sqrt(sample_sizes)
plot(
sample_sizes, margin_99,
type = "l", col = "darkorange", lty = 3, lwd = 2,
ylim = c(0, 4), xlab = "Number of measurements",
ylab = "Margin of error"
)
lines(sample_sizes, margin_95, col = "steelblue", lwd = 2)
lines(sample_sizes, margin_90, col = "gray40", lty = 2, lwd = 2)
abline(h = 1.2, col = "gray65", lty = 4)
points(55, qnorm(0.975) * 4.5 / sqrt(55), pch = 16, col = "steelblue")
legend(
"topright", legend = c("99% confidence", "95% confidence", "90% confidence"),
col = c("darkorange", "steelblue", "gray40"),
lty = c(3, 1, 2), lwd = 2, bty = "n"
)
174

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
20
40
60
80
100
120
140
0
1
2
3
4
Number of measurements
Margin of error
99% confidence
95% confidence
90% confidence
Figure 11.1: More observations reduce the margin of error. A higher confidence level requires
a wider interval at every sample size. The horizontal line marks the laboratory’s
target margin of 1.2 units.
There are two ways to get a narrower interval in Figure 11.1. We can collect more data, or
we can accept a lower confidence level. The first improves precision while preserving coverage.
The second changes the coverage we are asking the procedure to achieve.
11.3 A normal mean when the variance is unknown
Usually we do not know σ. We estimate it from the sample, which introduces another source
of variation. Chapter 10 showed that the t distribution accounts for this variation.
Ĺ Notation: the estimated standard error and t cutoff
S2 =
1
n−1 ∑
n
i=1(Xi−X)2 is the sample variance, and S=
√
S2 is the sample standard
deviation. The estimated standard error of the sample mean is S/√n.
175

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
tp(m) is the quantile with probability pto its left in a t distribution with mdegrees of
freedom. The notation t1−α/2(n−1) therefore specifies both a cumulative probability
and the degrees of freedom.
Lowercase xand sdenote the observed sample mean and sample standard deviation.
For an independent normal sample with n≥2,
T= X−μ
S/√n∼tn−1.
The central probability statement is
P{−t1−α/2(n−1) ≤X−μ
S/√n≤t1−α/2(n−1)} = 1 −α.
Multiplying by S/√nand isolating μgives
X± t1−α/2(n−1) S
√n.
The t cutoff is larger than the corresponding normal cutoff. It compensates for estimating the
standard deviation. Simply replacing σby Swhile keeping the normal cutoff does not give an
exact confidence interval.
Unlike the known-variance interval, the t interval has a random width. Both its center and its
estimated standard error depend on the sample.
11.3.1 Worked example: comparing two fan settings within each computer
An engineer tests two fan settings on each of ten computers under the same workload. For
each computer, she subtracts the temperature under the new setting from the temperature
under the original setting. A positive difference means the new setting ran cooler.
The observed temperature reductions, in degrees Celsius, are
2.2, 1.4, 3.1, 0.8, 2.5, 1.7, 2.9, 1.0, 2.3, 1.6.
Assume the differences are independent across computers and normally distributed. The two
temperatures measured on the same computer can be dependent. We keep those measurements
together and analyze one difference per computer.
176

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
Ĺ Notation: paired differences
Diis the temperature reduction for computer i. The subscript identifies the computer.
μD= E[Di] is the population mean reduction. The subscript Dtells us that the mean
concerns differences rather than either temperature alone.
Dand SDare the sample mean and sample standard deviation of the differences. Their
observed values are dand sD.
Here
d= 1.95,
sD≈0.7764,
sD
√
10 ≈0.2455.
There are ten independent differences, so the t distribution has nine degrees of freedom. Since
t0.975(9) ≈2.2622, the 95% confidence interval for the mean reduction is
1.95 ± 2.2622(0.2455) ≈[1.395, 2.505].
reductions <- c(2.2, 1.4, 3.1, 0.8, 2.5, 1.7, 2.9, 1.0, 2.3, 1.6)
estimated_se <- sd(reductions) / sqrt(10)
margin <- qt(0.975, df = 9) * estimated_se
mean(reductions) + c(-1, 1) * margin
[1] 1.394606 2.505394
The interval estimates the average reduction across the population represented by these com-
puters. It does not say that 95% of individual computers have reductions between these end-
points. An interval for an individual outcome is a prediction interval, like the one developed
in Chapter 10.
11.4 What 95% confidence means
Suppose we repeatedly collect independent samples under the same model and use the same
95% confidence interval formula every time. In the long run, about 95% of those intervals will
contain the fixed population parameter.
This does not mean exactly 95 of every 100 intervals must succeed. The number that cover
is itself random.
It also does not mean that an interval contains 95% of the population
observations.
177

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
Once we have calculated an interval from observed data, both endpoints are fixed numbers. In
the frequentist model, the parameter is fixed too. The interval either contains it or it does not.
We usually do not know which, but that lack of knowledge does not turn the fixed parameter
into a random variable in this model.
Thus the phrase “we are 95% confident” refers to how the interval was constructed.
It is
shorthand for the procedure’s coverage, rather than a posterior probability that this particular
interval contains the parameter.
11.4.1 A coverage experiment with a planning consequence
The sample-size calculation above raises a useful question. Does a larger sample make a 95%
interval more likely to cover the mean, or does it make the interval more precise?
We can investigate by simulating the laboratory’s measurements with a true mean of 30 and
standard deviation 4.5. The value 30 is chosen only so that we can check coverage. It is not
supplied to the interval formula.
set.seed(11132)
sample_sizes <- c(15, 55, 150)
repetitions <- 10000
coverage <- numeric(3)
interval_width <- numeric(3)
for (j in seq_along(sample_sizes)) {
n <- sample_sizes[j]
sample_means <- replicate(repetitions, mean(rnorm(n, mean = 30, sd = 4.5)))
margin <- qnorm(0.975) * 4.5 / sqrt(n)
lower <- sample_means - margin
upper <- sample_means + margin
coverage[j] <- mean(lower <= 30 & 30 <= upper)
interval_width[j] <- 2 * margin
}
data.frame(
sample_size = sample_sizes,
estimated_coverage = round(coverage, 3),
interval_width = round(interval_width, 3)
)
sample_size estimated_coverage interval_width
1
15
0.948
4.555
178

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
2
55
0.950
2.379
3
150
0.954
1.440
The coverage estimates should all be close to 0.95. The widths decrease as the sample size
grows. The larger samples give more precise intervals while retaining the same confidence
level.
Exact coverage depends on the model assumptions.
The normal and t calculations above
assume independent normal observations. With a nonnormal population, a mean interval may
still be a useful large-sample approximation, but its exact coverage no longer follows from
these formulas.
11.5 Pivotal quantities: a general way to build intervals
The normal and t constructions used the same idea. We combined the data and the unknown
parameter into a quantity with a known distribution. We then rearranged a probability state-
ment about that quantity.
Ĺ Notation: a pivotal quantity
Q(X, θ) denotes a function of the random sample and the parameter we want to estimate.
It is called a pivotal quantity, or pivot, if its sampling distribution does not depend on
any unknown parameter.
The symbols c1 and c2 denote fixed cutoffs chosen from that known distribution. The
subscripts distinguish the lower and upper cutoffs.
A pivot can contain an unknown parameter even though its distribution does not depend on
that parameter.
For example, (X−μ)/(σ/√n) contains μ, but it has a standard normal
distribution for every value of μunder the model.
To construct an interval, choose cutoffs satisfying
P{c1 ≤Q(X, θ) ≤c2} = 1 −α.
Then solve the inequalities for θ. When the resulting set is an interval, its endpoints give a
confidence interval.
An equal-tail choice leaves probability α/2 below c1 and α/2 above c2. This is a convenient
convention. It is not the only possible choice, and it does not always produce the shortest
interval.
179

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
11.5.1 A confidence interval for a normal population variance
For an independent normal sample with unknown mean and variance, Chapter 9 gives the
pivot
Q= (n−1)S2
σ2
∼χ2
n−1.
Ĺ Notation: chi-square cutoffs
qp(m) denotes the chi-square quantile with mdegrees of freedom and probability pto its
left, following the convention in Chapter 8.
An equal-tail probability statement is
P{qα/2(n−1) ≤(n−1)S2
σ2
≤q1−α/2(n−1)} = 1 −α.
All the quantities in the inequalities are positive. Taking reciprocals reverses the inequalities.
Multiplying by (n−1)S2 then gives
[
(n−1)S2
q1−α/2(n−1), (n−1)S2
qα/2(n−1)] .
Notice the order of the denominators.
The larger quantile belongs in the lower endpoint
because dividing by a larger positive number gives a smaller result.
The interval need not be symmetric around S2. The chi-square distribution is not symmet-
ric, and the reciprocal transformation changes the spacing further. To obtain a confidence
interval for the standard deviation σ, take the positive square root of each endpoint. This pre-
serves coverage because squaring and taking positive square roots preserve order for positive
numbers.
11.5.2 Worked example: estimating shared measurement noise
Two independent calibration sessions measure different reference objects. The objects have
different unknown mean readings, but suppose the instrument has the same unknown noise
variance in both sessions. Assume independent normal readings within and between sessions.
The first session has seven readings and a sample standard deviation of 0.8 millimeters. The
second has ten readings and a sample standard deviation of 1.1 millimeters. We want a 95%
confidence interval for the common noise standard deviation.
180

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
We should not calculate deviations from one overall mean. That would mix differences between
the reference objects with the instrument’s measurement noise. Instead, we measure variation
around each session’s own mean.
Ĺ Notation: pooling variation from separate groups
S2
Aand S2
Bare the sample variances in sessions Aand B. Their observed values are s2
A
and s2
B.
Wdenotes the sum of the squared deviations calculated separately within the two sessions.
Its observed value is w.
mdenotes the total degrees of freedom after estimating one mean in each session. Here
m= (7 −1) + (10 −1) = 15.
Each session provides a chi-square quantity:
6S2
A
σ2 ∼χ2
6,
9S2
B
σ2 ∼χ2
9.
These quantities are independent because the sessions are independent. By the addition rule
from Chapter 8,
W
σ2 = 6S2
A+ 9S2
B
σ2
∼χ2
15.
The observed squared-deviation sum is
w= 6(0.8)2 + 9(1.1)2 = 14.73.
Using q0.025(15) ≈6.2621 and q0.975(15) ≈27.4884, the confidence interval for the common
variance is
[ 14.73
27.4884, 14.73
6.2621] ≈[0.5359, 2.3522]
in squared millimeters.
Taking square roots gives the requested interval for the common
standard deviation:
[0.732, 1.534] millimeters.
within_sum <- 6 * 0.8^2 + 9 * 1.1^2
variance_interval <- within_sum / qchisq(c(0.975, 0.025), df = 15)
181

<!-- page 12 -->
<!-- extracted via text-layer confidence=0.95 -->
sqrt(variance_interval)
[1] 0.7320263 1.5336987
The total degrees of freedom are 15 because two means were estimated from seventeen readings.
This shared interval relies on the assumption of a common variance. Independence alone would
not justify pooling the sessions in this way.
11.6 Bayesian credible intervals
Bayesian inference gives a probability distribution for the unknown parameter after combining
a prior with the observed data. An interval can then be chosen to contain a specified amount
of posterior probability.
Ĺ Notation: posterior probability and credible endpoints
π(θ∣x) denotes the posterior density of θgiven the observed data x. The vertical bar
means “given,” and πhere names a density rather than the mathematical constant.
lBand uBdenote numerical endpoints of a Bayesian credible interval. The subscript B
distinguishes these endpoints from the confidence interval endpoints discussed earlier.
The expression ∫
uB
lB
π(θ∣x) dθis the area under the posterior density between the two
endpoints. It is a posterior probability.
A 100(1 −α)% credible interval satisfies
P(lB≤θ≤uB∣x) = ∫
uB
lB
π(θ∣x) dθ= 1 −α.
For a continuous posterior, an equal-tail credible interval uses the posterior α/2 and 1 −α/2
quantiles. It leaves the same posterior probability outside each end.
Here it is appropriate to say that the parameter has posterior probability 1 −αof lying in
the observed interval, given the data and the specified model and prior. This interpretation
follows from the Bayesian view of probability.
182

<!-- page 13 -->
<!-- extracted via text-layer confidence=0.95 -->
11.6.1 Worked example: an interval for a seed germination probability
A greenhouse tests 24 seeds under a new storage protocol, and 18 germinate.
Model the
outcomes as independent Bernoulli trials with a common germination probability.
Before
seeing these observations, suppose the greenhouse uses a Beta(2, 2) prior.
Ĺ Notation: the germination model
pis the probability that a seed germinates.
Kis the number that germinate among the 24 seeds.
The notation K
∣p∼
Binomial(24, p) describes its distribution when pis given.
Beta(a, b) is a beta distribution with positive shape parameters aand b, as in Chapter 3.
These shape parameters determine the density on the interval from 0 to 1.
The beta-binomial update from Chapter 3 gives
p∣K= 18 ∼Beta(2 + 18, 2 + 6) = Beta(20, 8).
The equal-tail 90% credible interval uses the 0.05 and 0.95 posterior quantiles:
qbeta(c(0.05, 0.95), shape1 = 20, shape2 = 8)
[1] 0.567698 0.843181
The resulting interval is approximately
[0.568, 0.843].
Under this model and prior, the posterior probability that the germination probability lies
between these endpoints is 0.90. The interval describes uncertainty about a probability, rather
than a range containing 90% of future seed outcomes.
Suppose the greenhouse is also interested in whether the germination probability exceeds 0.60.
The posterior can answer that question directly:
pbeta(0.60, shape1 = 20, shape2 = 8, lower.tail = FALSE)
[1] 0.9047121
183

<!-- page 14 -->
<!-- extracted via text-layer confidence=0.95 -->
This posterior probability is about 0.905. It comes from the posterior area above 0.60. It is a
different calculation from asking for an interval with 90% posterior probability.
A different prior can give a different credible interval from the same observations. The prior
is part of the probability model, so the interpretation should acknowledge it. Also, a 90%
credible interval does not automatically have 90% frequentist coverage for every fixed value of
the parameter.
11.7 Choosing and explaining an interval
Before calculating endpoints, identify the quantity you want to estimate and the sampling
assumptions you are making. A population mean, a population standard deviation, and a
future observation require different intervals.
Goal and assumptions
Interval construction
Mean of a normal population, known
standard deviation
Sample mean plus or minus a normal cutoff
times the known standard error
Mean of a normal population, unknown
standard deviation
Sample mean plus or minus a t cutoff times
the estimated standard error
Variance of a normal population
Invert a chi-square probability statement
Parameter with a specified continuous
posterior
Choose endpoints containing the desired
posterior probability
For a confidence interval, explain the coverage of the procedure. For a credible interval, explain
the posterior probability conditional on the observed data. In either case, include the units,
the confidence or credibility level, and the assumptions needed to support the calculation.
184

<!-- page 15 -->
<!-- extracted via text-layer confidence=0.95 -->
12 Unbiased Estimators
An estimator is a rule for turning a sample into a guess about an unknown population quantity.
If we collect a different sample, the rule usually gives a different answer. To judge the rule, we
need to consider how it behaves across possible samples.
One appealing property is that its answers average to the correct value. An estimator with
this property is called unbiased. Some samples produce estimates that are too large, and
others produce estimates that are too small, but the signed errors balance in expectation.
Unbiasedness is useful, but it does not tell the whole story.
An estimator can be correct
on average while making large errors in both directions. This chapter develops two ways to
describe an estimator: its bias, which measures systematic displacement, and its mean squared
error, which measures the overall size of its errors.
12.1 What unbiasedness means
Ĺ Notation: an estimator and its sampling expectation
θis the fixed, unknown parameter to be estimated. The bold symbol X = (X1, ... , Xn)
represents the random sample.
δ(X) is an estimator, meaning a rule applied to the sample. The Greek letter δ, pro-
nounced “delta,” names the rule. We may also write an estimator aŝ θ. The hat marks
a quantity used to estimate the parameter below it.
Eθ[δ(X)] is the mean of the estimator’s sampling distribution when the true parameter
is θ. The subscript reminds us that the distribution of the data depends on θ.
An estimator is unbiased for θif
Eθ[δ(X)] = θ
for every allowed value of θ. We assume the expectation exists.
The phrase “for every allowed value” matters. An estimator that happens to be centered cor-
rectly at one parameter value is not necessarily unbiased throughout the model. For instance,
185

<!-- page 16 -->
<!-- extracted via text-layer confidence=0.95 -->
the rule that always returns zero has the correct expectation when θ= 0, but it is not an
unbiased estimator of an unrestricted population mean.
Unbiasedness concerns the rule before the data are observed. After seeing the data, we obtain
one numerical estimate. We cannot tell whether that estimate is close to the truth just by
knowing that the rule is unbiased.
It also matters which quantity we are estimating. A statistic can be unbiased for a variance
and biased for a standard deviation. The target must be stated before an unbiasedness claim
has a clear meaning.
12.2 Bias measures systematic displacement
Ĺ Notation: bias
Biasθ(̂θ) denotes the bias of an estimator when the parameter is θ:
Biasθ(̂θ) = Eθ[̂θ] −θ.
The expression̂ θ−θis the estimation error in one sample. Bias is the expectation of
that signed error across samples.
A positive bias means the estimator is too large on average. A negative bias means it is too
small on average. Zero bias means the positive and negative errors balance in expectation.
Bias and estimation error are different. An unbiased estimator usually has a nonzero error in
any particular sample. A biased estimator can sometimes give an estimate very close to the
true parameter.
Nor does zero bias guarantee equal probabilities of overestimation and underestimation. Ex-
pectations account for the sizes of errors as well as their probabilities. Many small negative
errors can balance a few large positive errors.
12.2.1 Two familiar results, with their assumptions
We have already encountered two important unbiased estimators. It helps to separate what
follows from expectations alone from what requires a normal population.
Ĺ Notation: sample mean and sample variance
μ= E[Xi] is the common population mean, and σ2 = Var(Xi) is the common population
variance.
186

<!-- page 17 -->
<!-- extracted via text-layer confidence=0.95 -->
X= 1
n∑
n
i=1 Xiis the sample mean.
S2 =
1
n−1 ∑
n
i=1(Xi−X)2 is the sample variance for n≥2.
If all the observations have the same finite mean μ, linearity of expectation gives
E[X] = 1
n
n
∑
i=1
E[Xi] = nμ
n= μ.
Thus the sample mean is unbiased. Independence is not needed for this expectation calculation,
although it is needed for many of the usual formulas for the sample mean’s variance.
For independent observations from the same population with finite variance σ2, the sample
variance is also unbiased:
E[S2] = σ2.
Here is why the divisor is n−1. The squared-deviation identity from Chapter 9 gives
n
∑
i=1
(Xi−X)2 =
n
∑
i=1
(Xi−μ)2 −n(X−μ)2.
The expected value of the first term on the right is nσ2. Since Xhas mean μand variance
σ2/n, the expected value of the second term is
nE[(X−μ)2] = nσ2
n= σ2.
The expected squared-deviation sum is therefore (n−1)σ2. Dividing by n−1 gives the desired
result.
These unbiasedness results do not require a normal distribution. Normality was needed in
Chapter 9 for the exact chi-square distribution of the scaled sample variance and for indepen-
dence of the sample mean and variance. Those are stronger conclusions.
Taking square roots does not carry unbiasedness from S2 to S. In general, the expectation of
a nonlinear function is not the same as that function applied to the expectation. We will see
this issue in a worked example below.
187

<!-- page 18 -->
<!-- extracted via text-layer confidence=0.95 -->
12.3 Unbiased estimators can have very different variability
If two estimators are both unbiased, knowing their biases does not help us choose between
them. We also need to examine how widely their estimates vary.
12.3.1 Worked example: combining instruments with different precision
Two instruments measure the same temperature. Both are correctly calibrated, but the first
is more precise. Suppose the readings are independent, each has expectation equal to the true
temperature, and their variances are 0.16 and 0.64 squared degrees Celsius.
How should we combine the readings?
Ĺ Notation: a weighted estimate
Aand Bare the readings from the first and second instruments. The unknown true
temperature is θ, so E[A] = E[B] = θ.
wis a fixed weight between 0 and 1. The estimator̂
θw= wA+ (1 −w)B
places weight won the first reading and weight 1 −won the second. The subscript w
labels which weighting rule we use.
Because the weights sum to 1,
E[̂θw] = wE[A] + (1 −w)E[B] = wθ+ (1 −w)θ= θ.
Every fixed choice of wgives an unbiased estimator. Unbiasedness alone leaves us with many
choices.
Independence gives the variance
Var(̂θw) = 0.16w2 + 0.64(1 −w)2.
Using equal weights, w= 0.5, gives
Var(̂θ0.5) = 0.16(0.5)2 + 0.64(0.5)2 = 0.20.
To find the best weight within this family, rewrite the variance as
0.16w2 + 0.64(1 −w)2 = 0.80(w−0.80)2 + 0.128.
188

<!-- page 19 -->
<!-- extracted via text-layer confidence=0.95 -->
The squared term cannot be negative. It is zero at w= 0.80, so this choice gives the smallest
variance, 0.128. The more precise instrument receives more weight.
If the observed readings are 20.4 and 19.8 degrees, the equal-weight estimate is 20.1 degrees,
while the lower-variance estimate is
0.8(20.4) + 0.2(19.8) = 20.28 degrees.
We cannot know which numerical answer is closer to the true temperature from these readings
alone. What we can say is that the 0.8 weighting rule has smaller sampling variance under the
assumptions. It is more precise across repeated measurements.
12.4 Transforming an unbiased estimator can introduce bias
Linearity of expectation makes sums and fixed multiples relatively easy to handle. Squaring,
taking a square root, or taking a reciprocal requires more care.
For a random variable with finite variance,
E[X
2] = Var(X) + (E[X])2.
Even if Xis unbiased for a mean, its square is generally too large on average as an estimator
of the squared mean. The extra term is the variance of X.
12.4.1 Worked example: estimating the expected product of two event counts
A monitoring system records the number of requests arriving in each one-minute period. Model
counts from separate periods as independent Poisson random variables with the same unknown
mean rate.
The quantity of interest is the expected product of the counts in two independent future
periods. Independence makes this expected product equal to the square of the mean rate. We
want to estimate that squared rate from past observations.
Ĺ Notation: a squared rate and estimates of it
Xi∼Poisson(λ) means that the count in period ihas a Poisson distribution with mean
and variance both equal to λ.
ψ= λ2 names the quantity we want to estimate. The Greek letter ψis pronounced “psi.”
Using a different symbol helps distinguish the squared rate from the rate itself.̂
ψ0 and̂ ψ1 are two estimators of ψ. The hats identify estimators, and the subscripts 0
189

<!-- page 20 -->
<!-- extracted via text-layer confidence=0.95 -->
and 1 label the two rules.
K= ∑
n
i=1 Xiis the total count over the nobserved periods, so X= K/n.
The sample mean is unbiased for λand has variance λ/n. A natural first attempt is to square
it:̂
ψ0 = X
2.
Its expectation is
Eλ[̂ψ0] = Varλ(X) + (Eλ[X])2 = λ
n+ λ2.
The subscript λplays the same role that the subscript θdid earlier. It identifies the parameter
governing the sampling distribution. The bias for estimating ψ= λ2 is λ/n.
We cannot subtract λ/nfrom our estimate because λis unknown. However, X/nhas expec-
tation λ/n. Subtracting that statistic removes the bias:̂
ψ1 = X
2 −X
n.
Indeed,
Eλ[̂ψ1] = (λ2 + λ
n) −λ
n= λ2.
This establishes unbiasedness for every allowed rate, rather than for just one numerical
choice.
In terms of the total count, the corrected estimator iŝ
ψ1 = K2 −K
n2
= K(K−1)
n2
.
Because Kis a nonnegative integer, this estimate is nonnegative. When the total count is zero
or one, it equals zero.
Suppose the five observed counts are 0, 1, 2, 0, 1. Then K= 4 and x= 0.8. The uncorrected
estimate of the squared rate is 0.82 = 0.64, while the unbiased estimate is
0.82 −0.8
5 = 0.48.
190

<!-- page 21 -->
<!-- extracted via text-layer confidence=0.95 -->
counts <- c(0, 1, 2, 0, 1)
estimated_rate <- mean(counts)
estimated_rate^2
[1] 0.64
estimated_rate^2 - estimated_rate / 5
[1] 0.48
Removing bias does not yet establish that the corrected rule has smaller overall estimation
error. That requires a measure that accounts for variability as well as bias.
12.5 Mean squared error
An estimator can make errors in either direction. If we average the signed errors, positive and
negative values can cancel. Squaring the errors makes them nonnegative and gives greater
weight to large mistakes.
Ĺ Notation: mean squared error
MSEθ(̂θ) denotes the mean squared error of an estimator:
MSEθ(̂θ) = Eθ[(̂θ−θ)2].
The abbreviation MSE stands for mean squared error. Its units are the squared units
of the parameter. For example, estimating a length in centimeters produces an MSE in
squared centimeters.
Varθ(̂θ) is the sampling variance of the estimator. It measures spread around the estima-
tor’s own expectation, which need not equal θ.
MSE is an average over possible samples at a fixed true parameter value. It is not the squared
error of just the observed estimate. Since the true parameter is unknown, we usually study
MSE as a function of that parameter.
This connects to the squared error loss in Chapter 4. The loss for an estimate is its squared
error. Here we average that loss over repeated samples while holding the parameter fixed. In
a Bayesian posterior expected loss calculation, we instead hold the observed data fixed and
average over the posterior distribution of the parameter.
191

<!-- page 22 -->
<!-- extracted via text-layer confidence=0.95 -->
12.5.1 Separating variance and squared bias
The key identity is
MSEθ(̂θ) = Varθ(̂θ) + [Biasθ(̂θ)]
2
.
To see where it comes from, add and subtract the estimator’s expectation inside its error:̂
θ−θ= (̂θ−Eθ[̂θ]) + (Eθ[̂θ] −θ) .
The first term describes random variation around the estimator’s own center. The second is
its bias. At a fixed parameter value, that second term is a constant.
Squaring and taking expectations produces three terms:
Eθ[(̂θ−θ)2] = Eθ[(̂θ−Eθ[̂θ])
2
]
+ 2 (Eθ[̂θ] −θ) Eθ[̂θ−Eθ[̂θ]]
+ (Eθ[̂θ] −θ)
2
.
The first term is the variance. The middle term is zero because a random variable minus its
own expectation has expectation zero. The last term is the squared bias. This proves the
identity whenever the estimator has a finite second moment.
For an unbiased estimator, MSE equals variance. In the instrument example, the two weighting
rules therefore have MSEs 0.20 and 0.128.
For a biased estimator, MSE is larger than its own variance by the amount of its squared bias.
That does not mean it has larger MSE than every unbiased estimator. A sufficiently large
reduction in variance can more than compensate for a nonzero bias.
12.6 A biased estimator can have smaller MSE
12.6.1 Worked example: stabilizing an estimate from eight trials
A small pilot study tests a new automatic door mechanism eight times under the same condi-
tions. Each trial either completes successfully or fails. Suppose the outcomes are independent
with a common success probability.
With only eight trials, the sample proportion can vary substantially. We will compare it with
an estimator that pulls the result toward one-half.
192

<!-- page 23 -->
<!-- extracted via text-layer confidence=0.95 -->
Ĺ Notation: the sample proportion and a smoothed estimate
pis the unknown success probability, and K∼Binomial(8, p) is the number of successes
in eight trials. For this distribution, Ep[K] = 8pand Varp(K) = 8p(1 −p).̂
p= K/8 is the sample proportion. Its hat identifies it as an estimator of p.̃
p= (K+ 1)/10 is a second estimator. The tilde, the small wavy mark over p, distin-
guishes this smoothed estimator from the sample proportion. It does not imply a general
statistical property.
The sample proportion is unbiased:
Ep[̂p] = p,
Varp(̂p) = p(1 −p)
8
.
Its MSE is therefore
MSEp(̂p) = p(1 −p)
8
.
The smoothed estimate can be written as̃
p= 0.8̂p+ 0.2 (1
2) .
It places 80% of its weight on the sample proportion and 20% on the fixed value one-half. For
example, eight successes give a sample proportion of 1 but a smoothed estimate of 0.9. Zero
successes give 0 and 0.1, respectively.
The expectation of the smoothed estimator is
Ep[̃p] = 8p+ 1
10
.
Its bias is
Biasp(̃p) = 8p+ 1
10
−p= 1 −2p
10
.
When p< 1/2, this bias is positive. When p> 1/2, it is negative. In both cases, the estimator’s
expectation is pulled toward one-half. At p= 1/2 the bias is zero, but the estimator is not
unbiased across the whole model.
Adding a constant does not change variance, while dividing by 10 divides variance by 100.
Thus
193

<!-- page 24 -->
<!-- extracted via text-layer confidence=0.95 -->
Varp(̃p) = 8p(1 −p)
100
.
This is 64% of the sample proportion’s variance. Adding the squared bias to the variance
gives
MSEp(̃p) = 8p(1 −p) + (1 −2p)2
100
.
Now compare the MSEs at two possible parameter values:
True success
probability
MSE of̂ p
Bias of̃ p
MSE of̃ p
Smaller MSE
p= 0.50
0.03125
0
0.02000
Smoothed
estimator
p= 0.05
0.00594
0.09
0.01190
Sample
proportion
Near one-half, the reduction in variance outweighs the squared bias. Near zero or one, pulling
toward one-half can introduce too much bias. Neither estimator has smaller MSE at every
parameter value.
probabilities <- seq(0, 1, length.out = 501)
mse_proportion <- probabilities * (1 - probabilities) / 8
variance_smoothed <- 8 * probabilities * (1 - probabilities) / 100
bias_smoothed <- (1 - 2 * probabilities) / 10
mse_smoothed <- variance_smoothed + bias_smoothed^2
plot(
probabilities, mse_proportion,
type = "l", col = "steelblue", lwd = 2,
ylim = c(0, 0.04), xlab = "True success probability",
ylab = "Mean squared error"
)
lines(probabilities, mse_smoothed, col = "darkorange", lwd = 2, lty = 2)
legend(
"topright", legend = c("Sample proportion", "Smoothed estimate"),
col = c("steelblue", "darkorange"), lwd = 2, lty = c(1, 2), bty = "n"
)
194

<!-- page 25 -->
<!-- extracted via text-layer confidence=0.95 -->
0.0
0.2
0.4
0.6
0.8
1.0
0.00
0.01
0.02
0.03
0.04
True success probability
Mean squared error
Sample proportion
Smoothed estimate
Figure 12.1: Smoothing reduces variance at every success probability, but it also introduces
bias. The smoothed estimate has smaller MSE in the middle of the parameter
range and larger MSE near its ends.
Figure 12.1 compares procedures across possible true values of p. The horizontal axis is not
an observed estimate. In practice, we do not know where the true parameter lies on that axis.
The graph tells us how the relative performance depends on that unknown value.
12.6.2 Checking the MSE calculation by simulation
We can also generate many pilot studies at a chosen success probability and average the squared
errors. The simulation uses a known value of pso that the errors can be calculated.
set.seed(12132)
probabilities_to_check <- c(0.05, 0.50)
simulated_mse_proportion <- numeric(2)
simulated_mse_smoothed <- numeric(2)
for (j in seq_along(probabilities_to_check)) {
195

<!-- page 26 -->
<!-- extracted via text-layer confidence=0.95 -->
true_probability <- probabilities_to_check[j]
successes <- rbinom(100000, size = 8, prob = true_probability)
proportion_estimates <- successes / 8
smoothed_estimates <- (successes + 1) / 10
simulated_mse_proportion[j] <- mean((proportion_estimates - true_probability)^2)
simulated_mse_smoothed[j] <- mean((smoothed_estimates - true_probability)^2)
}
data.frame(
true_probability = probabilities_to_check,
mse_proportion = round(simulated_mse_proportion, 5),
mse_smoothed = round(simulated_mse_smoothed, 5)
)
true_probability mse_proportion mse_smoothed
1
0.05
0.00594
0.01185
2
0.50
0.03147
0.02014
The simulated values should be close to the exact MSEs in the table. Small differences are or-
dinary simulation variation. Increasing the number of repetitions makes that variation smaller,
but does not change either estimator or the size of each pilot study.
12.7 How to evaluate an estimator
When studying an estimator, first state the target.
Then find its expectation under the
sampling model. Subtracting the target gives the bias. Next find the variance, and combine
variance with squared bias to obtain MSE.
Quantity
What it measures
Question it answers
Bias
Displacement of the
estimator’s expectation from
the target
Is the rule systematically
high or low?
Variance
Spread around the
estimator’s own expectation
How much does the estimate
change across samples?
Mean squared error
Average squared distance
from the target
How large are the errors
overall under squared error
loss?
196

<!-- page 27 -->
<!-- extracted via text-layer confidence=0.95 -->
Unbiasedness is one useful property of a procedure. It does not guarantee that a particular
estimate is accurate, and it does not settle a comparison between procedures. To understand
how well an estimator works, we need to consider both where its sampling distribution is
centered and how widely it spreads.
197
