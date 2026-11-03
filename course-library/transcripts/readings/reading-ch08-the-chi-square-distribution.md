---
source: readings/reading-ch08-the-chi-square-distribution.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 16
kind: reading
confidence: 0.95
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
8 The Chi-Square Distribution
Suppose a small robot is programmed to stop at a marked location. Each attempt ends a little
to the left or right and a little ahead of or behind the target. We could describe these errors
separately, but we might also want one number that summarizes how far an attempt missed
its target.
Squaring the errors prevents positive and negative deviations from canceling.
Adding the
squared errors produces a measure of overall departure from the target. Similar calculations
appear when we estimate a variance, combine measurements from different calibration runs,
or decide whether a collection of errors is unusually large.
The chi-square distribution describes a particular kind of sum of squares. It connects nor-
mal observations to the sampling distributions of variance estimators. This chapter develops
that connection and uses it to study positioning errors, combine calibration data, and plan
how many measurements to collect.
8.1 From normal errors to a sum of squares
A standard normal random variable has mean 0 and variance 1. If we square it, the result
is always nonnegative. Small squared values occur when the original observation is near zero.
Large squared values occur when the observation is far from zero in either direction.
Ĺ Note
χis the Greek letter chi, pronounced “kye.” The notation Q∼χ2
mmeans that the random
variable Qhas a chi-square distribution with mdegrees of freedom. The superscript 2
belongs to the distribution’s name. It does not instruct us to square Qagain.
Zidenotes a standard normal random variable, with Zi∼N(0, 1). The expression Z2
i
does mean to square that variable. The subscript ilabels one variable in a collection.
The quantity mis the distribution’s degrees of freedom.
In the sum-of-squares con-
struction below, it counts the independent standard normal variables being squared and
added.
If Z∼N(0, 1), then
129

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
Z2 ∼χ2
1.
More generally, if Z1, ... , Zmare independent standard normal random variables, then
Q=
m
∑
i=1
Z2
i= Z2
1 + ⋯+ Z2
m∼χ2
m.
The independence and standardization requirements both matter. Squaring arbitrary normal
observations does not automatically produce this distribution. Each observation must first
have mean 0 and variance 1, and the squared contributions must come from independent
variables.
8.1.1 Standardizing a normal observation
Ĺ Note
For Xi∼N(μ, σ2), the variable
Zi= Xi−μ
σ
is a standardized deviation. Subtracting μcenters the observation at zero. Dividing
by the standard deviation σexpresses the deviation in standard deviation units. The
denominator is σ, while the denominator of the squared deviation is σ2.
For independent observations from the same normal population,
n
∑
i=1
(Xi−μ
σ
)
2
= ∑
n
i=1(Xi−μ)2
σ2
∼χ2
n.
The raw sum of squared deviations has the squared units of the measurements. Dividing by
the population variance removes those units and produces a chi-square variable.
This statement describes a sampling distribution under the population model. If σ2 is unknown,
we cannot directly calculate this standardized sum from the observations alone. We can still
use its distribution to understand how an estimator behaves for any proposed true variance.
130

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
8.2 The density and its shape
Ĺ Note
fQ(q) denotes the density of Qevaluated at a possible value q. The subscript identifies
which variable the density describes. The function Γ is the gamma function introduced
in Chapter 1. Here it supplies part of the normalizing constant that makes the density
integrate to 1.
The density of Q∼χ2
mis
fQ(q) =
1
2m/2Γ(m/2)qm/2−1e−q/2,
q> 0.
The distribution assigns probability only to positive values, although values can be arbitrarily
close to zero.
The sum-of-squares construction uses a positive integer m. The density itself also defines a
valid distribution for any positive real m. The examples in this chapter use integer degrees of
freedom because they arise from counting independent normal contributions.
For small degrees of freedom, the distribution is strongly skewed to the right. With one degree
of freedom, the density increases without bound as we approach zero, but the total area under
the curve is still 1. As the degrees of freedom increase, the distribution becomes less skewed
and its center moves to the right.
possible_values <- seq(0.02, 45, length.out = 1000)
degrees_of_freedom <- c(1, 2, 6, 18)
par(mfrow = c(2, 2))
for (m in degrees_of_freedom) {
plot(
possible_values,
dchisq(possible_values, df = m),
type = "l",
col = "steelblue",
lwd = 2,
xlab = "Possible value",
ylab = "Density",
main = paste("Degrees of freedom =", m)
)
131

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
abline(v = m, col = "firebrick", lty = 2)
}
par(mfrow = c(1, 1))
0
10
20
30
40
0.0
1.0
2.0
Degrees of freedom = 1
Possible value
Density
0
10
20
30
40
0.0
0.2
0.4
Degrees of freedom = 2
Possible value
Density
0
10
20
30
40
0.00
0.04
0.08
0.12
Degrees of freedom = 6
Possible value
Density
0
10
20
30
40
0.00
0.02
0.04
0.06
Degrees of freedom = 18
Possible value
Density
Figure 8.1: Chi-square densities for four choices of degrees of freedom. Horizontal scales are
shared, while vertical scales adjust to show each shape. The curve for one degree
of freedom continues upward as it approaches zero.
The dashed lines in Figure 8.1 mark the means.
8.3 A chi-square distribution is a gamma distribution
Chapter 1 introduced the gamma family using a shape parameter and a rate parameter. Its
density is
132

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
f(x) =
βα
Γ(α)xα−1e−βx,
x> 0.
Setting α= m/2 and β= 1/2 gives the chi-square density. Therefore,
χ2
m= Gamma (m
2 , 1
2) ,
where the equality means that these names describe the same probability distribution.
Ĺ Note
In Gamma(α, β), αis the shape and βis the rate. This book uses the shape-rate conven-
tion. A gamma distribution can also be described using a scale, which is the reciprocal
of the rate.
Thus a chi-square distribution has shape m/2, rate 1/2, and scale 2. A rate of 1/2 and
a scale of 1/2 describe different distributions.
8.3.1 Mean and variance
The gamma mean and variance give
E[Q] = m/2
1/2 = m
and
Var(Q) =
m/2
(1/2)2 = 2m.
Consequently, the standard deviation is
√
2m. Both the mean and the standard deviation
grow with m. However, the standard deviation relative to the mean is
SD(Q)
E[Q] =
√
2m
m
= √2
m,
which decreases as mgrows. The distribution becomes more concentrated relative to the size
of its mean.
For large integer m, the central limit theorem applied to the independent squared normal
terms suggests
133

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
Q−m
√
2m
is approximately N(0, 1).
Here we subtract the mean and divide by the standard deviation of Q. This explains the
increasingly symmetric shape without suggesting that Qitself has a fixed center or spread as
mchanges.
8.3.2 Multiplying by a positive constant
Suppose Q∼χ2
mand c> 0 is a fixed constant. Multiplying by cstretches the distribution
horizontally:
cQ∼Gamma (m
2 , 1
2c) .
The gamma shape stays the same, while the rate is divided by c. The mean becomes cmand
the variance becomes 2c2m.
The restriction c> 0 matters. A zero multiplier gives a constant, and a negative multiplier
produces negative values rather than a gamma distribution. Also, cQgenerally has a gamma
distribution rather than another chi-square distribution. Changing the scale does not simply
change the degrees of freedom.
8.4 Adding independent chi-square variables
Ĺ Note
Q1 and Q2 name two random quantities. Their degrees of freedom are m1 and m2. The
subscripts distinguish the quantities and their parameters. They are labels rather than
exponents.
If
Q1 ∼χ2
m1,
Q2 ∼χ2
m2,
and Q1 and Q2 are independent, then
Q1 + Q2 ∼χ2
m1+m2.
134

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
For integer degrees of freedom, we can understand this by collecting the squared standard
normal terms from both sums. The combined sum has m1 + m2 independent contributions.
Independence is an assumption that is very important here. For example, reusing the same
random observation does not create another independent contribution. If both Q1 and Q2
are constructed using the same Z2, their sum is 2Z2. Its variance is 8, whereas a chi-square
variable with two degrees of freedom has variance 4. The two distributions are different.
8.5 Example: a robot’s combined positioning error
A robot’s horizontal and vertical stopping errors, measured in centimeters, are modeled as
X∼N(0, 0.42),
Y∼N(0, 0.72),
with Xand Yindependent. The robot is less precise in the vertical direction. A vertical error
and a horizontal error of the same physical size therefore represent different departures from
their usual behavior.
To compare them on the same scale, define the combined score
Q= ( X
0.4)
2
+ ( Y
0.7)
2
.
Each standardized error is standard normal, and the two errors are independent. Thus Q∼
χ2
2.
The engineering team wants to mark a region containing 95% of stopping locations under this
model. This requires a cutoff with 95% of the chi-square probability to its left.
Ĺ Note
qp(m) denotes the pquantile of a chi-square distribution with mdegrees of freedom. It
satisfies
P(Q≤qp(m)) = p,
Q∼χ2
m.
The subscript plabels the cumulative probability. The argument mspecifies degrees of
freedom. This pis a probability used to choose a cutoff, rather than an unknown success
probability being estimated.
For two degrees of freedom,
q0.95(2) ≈5.991.
135

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
The desired region is therefore
( x
0.4)
2
+ ( y
0.7)
2
≤5.991.
This describes an ellipse centered on the target. Along the horizontal axis it extends about
0.4
√
5.991 = 0.979 centimeters in either direction. Along the vertical axis it extends about
0.7
√
5.991 = 1.713 centimeters. The shape allows larger vertical errors because the vertical
error distribution is more spread out.
qchisq(0.95, df = 2)
[1] 5.991465
For a particular stop with errors x= 0.8 and y= 0.7, the score is
q= (0.8
0.4)
2
+ (0.7
0.7)
2
= 5.
This stop is inside the region. The probability of a score at least this large under the model
is
pchisq(5, df = 2, lower.tail = FALSE)
[1] 0.082085
The result is about 0.082. Roughly 8.2% of stops would have a combined standardized error
score at least 5 if the model were an accurate representation of the process.
Note that the unstandardized squared distance X2 + Y2 would not have this chi-square dis-
tribution because the two error variances differ. Standardization is what makes their squared
contributions comparable.
136

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
8.6 Using chi-square tables and R
The chi-square table supplied with Lecture 8 reports left-tail quantiles. Its column label p
means the probability to the left of the tabulated value. To find the robot’s cutoff, use the row
for two degrees of freedom and the column for p= 0.95. The entry is approximately 5.991.
For a cutoff with 5% of the probability to its right, the required left-tail probability is 1−0.05 =
0.95.
Reading the 0.05 column instead would give a cutoff near the opposite end of the
distribution.
In R, the relevant functions follow the distribution naming pattern introduced in the ap-
pendix:
Function
Input and purpose
dchisq(x, df = m)
Evaluate the density at x
pchisq(x, df = m)
Find the probability at or below x
pchisq(x, df = m, lower.tail = FALSE)
Find the probability above x
qchisq(p, df = m)
Find the cutoff with cumulative probability p
rchisq(n, df = m)
Generate n random values with m degrees of
freedom
The argument df stands for degrees of freedom. It is not automatically equal to the number
of random values requested from rchisq().
A density height is not a tail probability.
Use pchisq() when the cutoff is known and a
probability is wanted. Use qchisq() when the probability is known and the cutoff is wanted.
8.7 Why chi-square distributions appear in variance estimation
Consider independent observations from N(μ, σ2) with known mean μand unknown variance
σ2. The maximum likelihood estimator of the variance iŝ
σ2 = 1
n
n
∑
i=1
(Xi−μ)2.
Ĺ Notê
σ2 denotes an estimator of the population variance σ2.
This is also written̂ σ2.
Its
observed value is obtained by substituting the recorded observations into the formula.
137

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
The notation σ4 means (σ2)2, the square of the population variance. It appears when
calculating the variance of a variance estimator, which has fourth-power measurement
units.
Multiplying by n/σ2 recovers the standardized sum of squares:
n̂σ2
σ2 =
n
∑
i=1
(Xi−μ
σ
)
2
∼χ2
n.
Equivalently, the estimator has the distribution of a chi-square variable multiplied by σ2/n.
The gamma scaling rule giveŝ
σ2 ∼Gamma (n
2 , n
2σ2 ) .
Its mean and variance are
E[̂σ2] = σ2,
Var(̂σ2) = 2σ4
n.
Thus the variance MLE is unbiased in this known-mean setting, with standard error
SE(̂σ2) = σ2√2
n.
The known mean is essential to the degrees-of-freedom count here. Later we will investigate
what happens when the mean is not known.
8.8 Example: combining two calibration runs
A sensor is calibrated at two reference settings. At the first setting, its measurements have
a known mean of 10 units. At the second, they have a known mean of 40 units. Assume
both sets of readings are normal with the same unknown variance σ2, and all readings are
independent.
The first run contains 6 readings and the second contains 18. The question is how to combine
their information about the common variance. Should the two estimated variances receive
equal weight, or should the longer run contribute more?
138

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
Ĺ Note
VAand VBdenote the variance estimates from calibration runs A and B. Their subscripts
identify the runs. The random observations are X1, ... , X6 for A and Y1, ... , Y18 for B.
VPdenotes the pooled estimate that uses all squared deviations together. VEdenotes an
estimate that gives the two runs equal weight. Lowercase vA, vB, and vPdenote numerical
values computed from observed data. Here Vis simply a name for an estimator.
Using the known reference means,
VA= 1
6
6
∑
i=1
(Xi−10)2,
VB= 1
18
18
∑
j=1
(Yj−40)2.
Their standardized sums of squares satisfy
6VA
σ2 ∼χ2
6,
18VB
σ2
∼χ2
18.
The two sums are independent because the runs are independent. Adding them gives
6VA+ 18VB
σ2
∼χ2
24.
The pooled estimate is
VP= 6VA+ 18VB
24
= 1
4VA+ 3
4VB.
It averages all 24 squared deviations from their respective known means. The second run
receives three times the weight because it contains three times as many observations. The
known-mean likelihood calculation also makes this the MLE of the common variance.
If the observed estimates are vA= 0.09 and vB= 0.25 squared units, then
vP= 6(0.09) + 18(0.25)
24
= 0.21.
The sampling distribution of the pooled estimate is
24VP
σ2
∼χ2
24,
VP∼Gamma (12, 12
σ2 ) .
Consequently,
139

<!-- page 12 -->
<!-- extracted via text-layer confidence=0.95 -->
E[VP] = σ2,
Var(VP) = σ4
12.
8.8.1 What happens if we weight the runs equally?
An alternative is
VE= VA+ VB
2
.
It is also unbiased because both run-specific estimates have mean σ2. For the observed esti-
mates above, it gives (0.09 + 0.25)/2 = 0.17 squared units.
However, the estimate from the shorter run has more sampling variability. Equal weighting
gives that less precise estimate half the influence. Using independence,
Var(VE) = 1
4 Var(VA) + 1
4 Var(VB)
= 1
4 (2σ4
6
+ 2σ4
18 )
= σ4
9 .
This is larger than σ4/12, the variance of the pooled estimate. Both rules are correct on average,
but pooling gives more stable estimates under the assumed common-variance model. If the
two settings actually have different variances, that common-variance interpretation would no
longer apply.
8.8.2 Simulating the two estimation rules
To see the difference, suppose the true common variance is 0.16 squared units. The following
simulation generates both calibration runs and calculates both estimates from each pair of
runs.
set.seed(132)
true_variance <- 0.16
pooled_estimates <- numeric(8000)
equal_estimates <- numeric(8000)
for (i in seq_along(pooled_estimates)) {
readings_a <- rnorm(6, mean = 10, sd = sqrt(true_variance))
140

<!-- page 13 -->
<!-- extracted via text-layer confidence=0.95 -->
readings_b <- rnorm(18, mean = 40, sd = sqrt(true_variance))
estimate_a <- mean((readings_a - 10)^2)
estimate_b <- mean((readings_b - 40)^2)
pooled_estimates[i] <- (6 * estimate_a + 18 * estimate_b) / 24
equal_estimates[i] <- (estimate_a + estimate_b) / 2
}
bin_edges <- seq(
0, max(pooled_estimates, equal_estimates) + 0.01, by = 0.01
)
possible_variances <- seq(0, max(bin_edges), length.out = 500)
par(mfrow = c(1, 2))
hist(
pooled_estimates,
breaks = bin_edges,
probability = TRUE,
col = "skyblue", border = "white",
ylim = c(0, 11),
xlab = "Estimated variance", main = "Pool all 24 readings"
)
lines(
possible_variances,
dgamma(possible_variances, shape = 12, rate = 12 / true_variance),
col = "steelblue", lwd = 2
)
abline(v = true_variance, col = "firebrick", lty = 2, lwd = 2)
hist(
equal_estimates,
breaks = bin_edges,
probability = TRUE,
col = "skyblue", border = "white",
ylim = c(0, 11),
xlab = "Estimated variance", main = "Weight the two runs equally"
)
abline(v = true_variance, col = "firebrick", lty = 2, lwd = 2)
par(mfrow = c(1, 1))
141

<!-- page 14 -->
<!-- extracted via text-layer confidence=0.95 -->
Pool all 24 readings
Estimated variance
Density
0.0
0.1
0.2
0.3
0.4
0
2
4
6
8
10
Weight the two runs equally
Estimated variance
Density
0.0
0.1
0.2
0.3
0.4
0
2
4
6
8
10
Figure 8.2: Sampling distributions of two variance estimates from calibration runs of sizes 6
and 18. Both are centered at the true variance, but the pooled estimate is less
variable. The blue curve is the exact gamma density for the pooled estimate.
The panels in Figure 8.2 use the same axes and histogram bins. The exact standard errors
are about 0.0462 squared units for pooling and 0.0533 squared units for equal weighting. The
agreement between the left histogram and its gamma curve illustrates how normal measure-
ments lead to a gamma sampling distribution after squaring and averaging deviations.
8.9 Example: planning the size of a calibration study
Suppose the calibration team wants its variance estimate to be within 25% of the true variance
with probability at least 0.90. It can afford a total of 24, 48, or 96 independent readings. Each
reading will be centered at its known reference mean, and the common normal variance model
is assumed to hold.
Ĺ Note
Vndenotes the pooled variance estimate based on a total of nreadings. The ratio Vn/σ2
expresses the estimated variance as a fraction of the true variance. A ratio of 1 is exact
agreement, while 0.75 and 1.25 mark errors of 25% below and above the truth.
The interval condition 0.75σ2 ≤Vn≤1.25σ2 concerns the random estimator for a fixed
true variance. It is a sampling probability used for planning.
142

<!-- page 15 -->
<!-- extracted via text-layer confidence=0.95 -->
The standardized pooled sum has distribution
nVn
σ2 ∼χ2
n.
Therefore,
P(0.75σ2 ≤Vn≤1.25σ2) = P(0.75n≤nVn
σ2 ≤1.25n) .
The unknown variance cancels from the bounds. We can calculate the probability for each
proposed sample size without choosing a numerical value of σ2.
candidate_sizes <- c(24, 48, 96)
within_tolerance <- pchisq(1.25 * candidate_sizes, df = candidate_sizes) -
pchisq(0.75 * candidate_sizes, df = candidate_sizes)
data.frame(
sample_size = candidate_sizes,
probability = round(within_tolerance, digits = 3)
)
sample_size probability
1
24
0.618
2
48
0.784
3
96
0.919
The probabilities are approximately 0.618, 0.784, and 0.919. Of the three proposed designs,
96 readings is the smallest that meets the 90% requirement. This does not claim that 96 is
the smallest possible integer sample size. It is the smallest among the three options being
considered.
This calculation turns a sampling distribution into a study-design decision. More observations
improve the chance of a sufficiently accurate variance estimate. The result depends on the
normal model, independent readings, a common variance, and known reference means.
8.10 Chapter summary
• A chi-square variable with integer degrees of freedom is a sum of independent squared
standard normal variables.
• The distribution χ2
mis a gamma distribution with shape m/2 and rate 1/2.
143

<!-- page 16 -->
<!-- extracted via text-layer confidence=0.95 -->
• Its mean is m, its variance is 2m, and its relative spread decreases as mgrows.
• Multiplying a chi-square variable by a positive constant changes the gamma rate while
leaving the shape unchanged.
• Independent chi-square variables add to another chi-square variable whose degrees of
freedom are the sum of the individual degrees of freedom.
• Chi-square quantiles turn a specified probability into a cutoff. The lecture table uses
cumulative probability to the left of that cutoff.
• With a known normal mean, a variance MLE has a scaled chi-square, or gamma, sampling
distribution.
144
