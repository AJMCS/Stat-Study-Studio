---
source: readings/reading-ch09-the-sample-mean-and-variance-together.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 24
kind: reading
confidence: 0.95
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
9 The Sample Mean and Variance Together
Imagine checking a machine that cuts cable into pieces. You would probably ask two questions.
Are the pieces centered near the intended length? And how much do their lengths vary?
The sample mean answers the first question, while the sample variance helps answer the second.
Both numbers come from the same observations. That raises a new question: if a sample has
an unusually large mean, does it also tend to have an unusually large variance?
For independent observations from a normal population, the answer is no. The sample mean
and sample variance are independent. This is a special feature of the normal model, and it is
the key connection between this chapter and the t distribution in Chapter 10.
9.1 Two estimates from one sample
Suppose we observe an independent random sample
X1, ... , Xn
iid∼N(μ, σ2),
n≥2,
where both the population mean μand population variance σ2 > 0 are unknown. Unlike the
known-mean setting in Chapter 8, we must estimate the center before calculating deviations
from it.
The MLE of the mean is the sample mean:̂
μ= X= 1
n
n
∑
i=1
Xi.
To estimate spread, we start by adding the squared distances from this sample mean. There
are two common ways to turn that sum into a variance estimate.
Ĺ Note
Let Qdenote the sum of squared deviations from the sample mean:
147

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
Q=
n
∑
i=1
(Xi−X)2.
The normal-model MLE of the variance iŝ σ2 = Q/n.
The usual sample variance is
S2 = Q/(n−1). The letter Sdenotes the sample standard deviation, so S=
√
S2.
Lowercase s2 and sdenote the variance and standard deviation calculated from observed
data. The population quantities are σ2 and σ. Neither S2 nor̂ σ2 should be confused
with the population variance itself.
Here Qhas squared measurement units. It will become a chi-square variable only after
we divide it by σ2.
Here we will focus on the MLE, which divides by n. We will keep both versions visible because
the usual sample variance, which divides by n−1, appears in the t distribution.
The estimates are related by
S2 =
n
n−1̂σ2.
9.1.1 Example: four thickness measurements
Suppose four prototype panels have measured thicknesses of 9, 10, 12, and 13 millimeters.
Their sample mean is
x= 9 + 10 + 12 + 13
4
= 11.
The deviations from the sample mean are −2, −1, 1, 2, so the sum of squared deviations is
(−2)2 + (−1)2 + 12 + 22 = 10.
The two variance estimates are thereforê
σ2 = 10
4 = 2.5,
s2 = 10
3 ≈3.333.
Both have units of square millimeters. The sample standard deviation is s= √10/3 ≈1.826
millimeters.
thickness <- c(9, 10, 12, 13)
mean(thickness)
148

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
[1] 11
mean((thickness - mean(thickness))^2)
[1] 2.5
var(thickness)
[1] 3.333333
sd(thickness)
[1] 1.825742
In R, var() uses the divisor n−1, and sd() takes the square root of that result. To calculate
the MLE directly, the code averages the squared deviations using mean().
9.2 The three results we need
Under independent normal sampling, the following statements hold exactly:
X∼N(μ, σ2
n) ,
Q
σ2 = n̂σ2
σ2 = (n−1)S2
σ2
∼χ2
n−1,
and the sample mean is independent of either version of the sample variance.
The first statement describes where sample means tend to fall.
The second describes the
sample’s spread. The third says that, under the normal model, knowing one of these summaries
does not change the sampling distribution of the other.
These are exact normal-sampling results, even for a small sample.
They do not require a
large-sample approximation.
149

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
9.3 Why the sample mean is normal
A sum of independent normal random variables is normal. Its mean is the sum of their means,
and its variance is the sum of their variances. Thus,
n
∑
i=1
Xi∼N(nμ, nσ2).
Dividing the sum by ndivides the mean by nand the variance by n2. This gives
X∼N(μ, σ2
n) .
The fact that σ2 is unknown does not change this sampling distribution. It changes what
we can calculate from the data. The true standard error is still σ/√n, but we will need to
estimate it when using the sample to make an inference.
9.4 Why estimating the mean costs one degree of freedom
In Chapter 8, we centered observations at a known population mean. There were nindependent
standardized deviations, and their squared sum had ndegrees of freedom.
Here we center at the sample mean. The resulting deviations must add to zero.
Ĺ Note
Ri= Xi−Xis called the residual for observation i. It is the difference between that
observation and the fitted center of the sample.
The identity ∑
n
i=1 Ri= 0 means that the residuals balance exactly. Once the first n−1
residuals are known, the last must be
Rn= −
n−1
∑
i=1
Ri.
For the four panels, the residuals were −2, −1, 1, 2. If we had only been told the first three,
we could already work out the fourth. It must equal 2 to make the total zero.
This explains the loss of one degree of freedom. There are nresiduals, but only n−1 can vary
freely once their sum is fixed. The residuals are not independent, so we cannot simply treat
their squared values as nindependent chi-square contributions.
150

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
9.4.1 Connecting the residuals to a chi-square distribution
Standardize the original observations using the population mean and standard deviation:
Zi= Xi−μ
σ
.
The Ziare independent standard normal variables. Their sample mean is Z= (X−μ)/σ,
so
Zi−Z= Xi−X
σ
.
A result for standard normal samples states that
n
∑
i=1
(Zi−Z)2 ∼χ2
n−1.
Applying it here gives
Q
σ2 =
n
∑
i=1
(Zi−Z)2 ∼χ2
n−1.
9.4.2 Seeing the result with just two observations
For two independent normal observations, the deviations from their sample mean are
X1 −X= X1 −X2
2
,
X2 −X= −X1 −X2
2
.
There is only one distinct piece of information about spread: the difference between the obser-
vations. Their sum of squared deviations is
Q= (X1 −X2)2
2
.
The difference X1 −X2 is normal with mean 0 and variance 2σ2. Therefore,
Q
σ2 = (X1 −X2
√
2σ
)
2
∼χ2
1.
151

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
The squared standard normal on the right makes the single remaining degree of freedom
visible.
9.5 What the variance distributions tell us
Since a chi-square variable with n−1 degrees of freedom has mean n−1,
E[Q] = (n−1)σ2.
Dividing by ngives
E[̂σ2] = n−1
n
σ2.
The MLE underestimates the population variance on average. Its bias is −σ2/n.
Dividing by n−1 corrects this bias:
E[S2] = σ2.
This is why the usual sample variance uses n−1. It is a correction for having estimated the
center from the same data.
The chi-square variance also gives
Var(Q) = 2(n−1)σ4.
Consequently,
Estimator
Expected value
Sampling variancê
σ2 = Q/n
(n−1)σ2/n
2(n−1)σ4/n2
S2 = Q/(n−1)
σ2
2σ4/(n−1)
The unbiased estimator has a slightly larger sampling variance because it multiplies the MLE
by a constant greater than one. Unbiasedness and small sampling variance describe different
properties, so neither one alone settles every comparison between estimators.
The gamma forms are useful too. Using the shape-rate convention from Chapter 8,
152

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
̂σ2 ∼Gamma (n−1
2
, n
2σ2 ) ,
S2 ∼Gamma (n−1
2
, n−1
2σ2 ) .
The two distributions have the same shape parameter. Their different rate parameters reflect
their different denominators.
9.6 Why the mean and variance are independent
It may seem surprising that two summaries of the same observations can be independent. A
useful first step is to separate a change in location from a change in spread.
If we add 3 to every observation, the sample mean increases by 3. Every residual stays the
same because the new sample mean also increases by 3. So the sample variance is unchanged.
This shows that the summaries measure different features. By itself, however, it does not prove
independence.
For the normal model, the key algebraic identity is
n
∑
i=1
(Xi−μ)2 =
n
∑
i=1
(Xi−X)2 + n(X−μ)2.
To see why this is true, write each deviation as
Xi−μ= (Xi−X) + (X−μ)
and square it. When we add over observations, the cross term is zero because the residuals
add to zero.
The identity separates total squared departure from the population mean into two pieces. One
describes spread around the sample mean. The other describes how far the sample mean is
from the population mean.
153

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
9.6.1 How the normal density separates
For fixed population parameters, the joint density of the observations is proportional to
exp [−1
2σ2
n
∑
i=1
(xi−μ)2] .
Substituting the identity above turns this into a product:
exp [−n(x−μ)2
2σ2
] × exp [−∑
n
i=1(xi−x)2
2σ2
] .
We can describe a sample by its mean and its first n−1 residuals. Those values determine
the last residual and every original observation.
In these coordinates, the first factor depends only on the mean and the second only on the
residuals. After normalization, they form separate probability densities. This factorization
proves that the sample mean and the residual vector are independent. Since either estimator
of the variance is calculated entirely from the residuals, it is independent of the sample mean
as well.
9.6.2 Independence is a special normal-model result
The same conclusion may not hold for other populations. Consider two Bernoulli observations,
each either 0 or 1. Their possible sample means and usual sample variances are
Observations
X
S2
0, 0
0
0
0, 1 or 1, 0
0.5
0.5
1, 1
1
0
Knowing the sample mean tells us the sample variance exactly.
For a success probability
strictly between 0 and 1, the two summaries are dependent.
154

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
9.7 Example: checking both the center and spread of cable lengths
A cutting machine produces independent lengths modeled as normal.
For a sampling cal-
culation, suppose the true mean is 120 centimeters and the true standard deviation is 1.5
centimeters. A technician checks a random batch of 12 pieces.
The batch meets two descriptive requirements if its sample mean is between 119.4 and 120.6
centimeters and its sample standard deviation is no greater than 1.8 centimeters. What pro-
portion of batches meet both requirements under this model?
First, the sample mean has distribution
X∼N(120, 1.52
12 ) .
Thus,
P(119.4 ≤X≤120.6) ≈0.834.
For the spread requirement, S≤1.8 is equivalent to S2 ≤1.82. Since
11S2
1.52 ∼χ2
11,
we obtain
P(S≤1.8) = P(11S2
1.52 ≤11(1.8)2
1.52
) ≈0.853.
Independence lets us multiply the probabilities:
P(119.4 ≤X≤120.6, S≤1.8) ≈0.834(0.853) ≈0.711.
About 71.1% of batches would meet both requirements. The comma inside the probability
means that both conditions must hold.
mean_probability <- pnorm(120.6, mean = 120, sd = 1.5 / sqrt(12)) -
pnorm(119.4, mean = 120, sd = 1.5 / sqrt(12))
spread_probability <- pchisq(11 * 1.8^2 / 1.5^2, df = 11)
mean_probability * spread_probability
155

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
[1] 0.7113778
Among batches satisfying the spread requirement, the chance of satisfying the mean require-
ment is still about 0.834. Selecting batches with small sample spread does not make their
sample means more accurate under this fixed normal model.
9.7.1 A simulation that separates batches by their observed spread
The following simulation asks whether batches with smaller observed standard deviations have
a different distribution of sample means. It generates 10,000 batches, then separates them
according to whether their sample standard deviation is at most 1.5 centimeters or greater
than 1.5 centimeters.
set.seed(132)
batch_means <- numeric(10000)
batch_sds <- numeric(10000)
for (i in seq_along(batch_means)) {
lengths <- rnorm(12, mean = 120, sd = 1.5)
batch_means[i] <- mean(lengths)
batch_sds[i] <- sd(lengths)
}
bin_edges <- seq(116, 124, by = 0.1)
possible_means <- seq(118, 122, length.out = 400)
par(mfrow = c(1, 2))
hist(
batch_means[batch_sds <= 1.5],
breaks = bin_edges, probability = TRUE,
col = "skyblue", border = "white",
xlim = c(118, 122), ylim = c(0, 1.1),
xlab = "Sample mean (centimeters)", main = "Sample SD at most 1.5"
)
lines(
possible_means, dnorm(possible_means, mean = 120, sd = 1.5 / sqrt(12)),
col = "steelblue", lwd = 2
)
hist(
156

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
batch_means[batch_sds > 1.5],
breaks = bin_edges, probability = TRUE,
col = "skyblue", border = "white",
xlim = c(118, 122), ylim = c(0, 1.1),
xlab = "Sample mean (centimeters)", main = "Sample SD above 1.5"
)
lines(
possible_means, dnorm(possible_means, mean = 120, sd = 1.5 / sqrt(12)),
col = "steelblue", lwd = 2
)
par(mfrow = c(1, 1))
Sample SD at most 1.5
Sample mean (centimeters)
Density
118
119
120
121
122
0.0
0.4
0.8
Sample SD above 1.5
Sample mean (centimeters)
Density
118
119
120
121
122
0.0
0.4
0.8
Figure 9.1: Sample means from batches selected by their observed spread. Both groups fol-
low the same normal sampling density, shown in blue. Differences between the
histograms reflect simulation variability.
The similar distributions in Figure 9.1 illustrate what independence means.
Conditioning
on one of these spread groups leaves the sampling distribution of the mean unchanged. The
simulation supports the theoretical result, but a picture alone would not prove independence.
157

<!-- page 12 -->
<!-- extracted via text-layer confidence=0.95 -->
9.8 Looking ahead: estimating the standard error
The sample mean has true standard error σ/√n. When σis unknown, a natural estimate is
S/√n.
Replacing the fixed population standard deviation by the random sample standard deviation
changes the distribution of a standardized mean. Chapter 10 will use the independence result
from this chapter to work out that distribution exactly.
9.9 Chapter summary
• For independent normal observations, the sample mean is exactly normal with mean μ
and variance σ2/n.
• The MLE of variance divides the squared-deviation sum by n. The usual sample variance
S2 divides it by n−1.
• Estimating the mean forces the residuals to add to zero, leaving n−1 degrees of freedom.
• Both n̂σ2/σ2 and (n−1)S2/σ2 have a chi-square distribution with n−1 degrees of
freedom.
• The variance MLE is biased downward, while S2 is unbiased.
• Under normal sampling, the sample mean and either sample variance are independent.
• Independence allows joint probabilities about sample location and spread to be calculated
by multiplication.
• These exact results depend on the normal model. They do not hold for every population
distribution.
158

<!-- page 13 -->
<!-- extracted via text-layer confidence=0.95 -->
10 The t Distribution
Suppose you estimate an average from a small sample. You know that sample means vary,
so you want to express your estimation error in standard error units. There is one complica-
tion: the population standard deviation is unknown. You have to estimate it from the same
observations.
Some samples will make that standard deviation look too large. Others will make it look too
small. When the estimated standard error is small, even an ordinary difference between the
sample mean and population mean can look large.
The t distribution accounts for this extra uncertainty. It looks much like a standard normal
distribution near the center, but it allows more probability far from zero. This chapter explains
where it comes from and why it appears when a normal population’s standard deviation is
estimated from data.
10.1 A normal variable divided by an estimated scale
Chapter 9 gave us two independent quantities from a normal sample: the sample mean and
the sample variance. To see how they combine, we first define a distribution using a simpler
pair of random variables.
Ĺ Note
Zdenotes a standard normal random variable, and Ydenotes a chi-square variable with
mdegrees of freedom. We assume that Zand Yare independent.
T∼tmmeans that the random variable Thas a t distribution with mdegrees of freedom.
The lowercase tnames the distribution, while its subscript gives the degrees of freedom.
It is also called Student’s t distribution.
If
Z∼N(0, 1),
Y∼χ2
m,
independently, then
159

<!-- page 14 -->
<!-- extracted via text-layer confidence=0.95 -->
T=
Z
√Y/m
∼tm.
The numerator is standard normal. The denominator is positive and random. Since E[Y] = m,
the quantity Y/mis centered at 1. But in any one realization of the random variable Y, it
can be smaller or larger than 1.
When Y/mis small, division by its square root makes the magnitude of Tlarger. This is why
the t distribution has heavier tails than a standard normal distribution. A large ratio can
result from a large numerator, a small denominator, or both.
Independence is an important part of the definition.
A ratio involving a normal variable
and a chi-square variable does not automatically have a t distribution if those variables are
dependent.
10.2 Shape, center, and spread
The t distribution is symmetric about zero. A positive numerator and an equally large negative
numerator are equally likely, and the denominator is always positive.
Thus positive and
negative values of the same magnitude receive the same density.
The degrees of freedom control how heavy the tails are. With few degrees of freedom, large
magnitudes are more common. As the degrees of freedom increase, the t distribution becomes
closer to the standard normal distribution.
10.2.1 Why the normal distribution appears as a limit
For Y∼χ2
m,
E[ Y
m] = 1,
Var ( Y
m) = 2
m.
As mgrows, Y/mbecomes concentrated near 1. The denominator √Y/mis then usually
close to 1, so the ratio behaves increasingly like its standard normal numerator.
This explains why a normal approximation to a t distribution improves as the degrees of
freedom grow. There is no sudden switch at a particular number of observations. The change
is gradual.
160

<!-- page 15 -->
<!-- extracted via text-layer confidence=0.95 -->
10.2.2 A symmetric distribution may not have a mean
For m> 1, the t distribution has mean zero. For m> 2, its variance is
Var(T) =
m
m−2.
This variance is greater than 1 for every finite m> 2, and it approaches 1 as mgrows.
With very few degrees of freedom, the tails are so heavy that some expectations do not exist
as finite values. Symmetry alone does not guarantee a mean of zero.
Degrees of freedom
Mean
Variance
0 < m≤1
Does not exist
Not defined because the
mean does not exist
1 < m≤2
0
Infinite
m> 2
0
m/(m−2)
Ĺ Note
For k> 0, the expression E[|T|k] is the expected value of the kth power of the magnitude
of T. It is called an absolute moment. The paired bars mean absolute value, and kis a
positive exponent.
The statement E[|T|k] < ∞means this expectation is finite. The symbol ∞denotes
infinity.
For a t distribution, E[|T|k] is finite exactly when k< m. For example, the absolute first
moment requires more than one degree of freedom, and the second moment requires more
than two. This is a precise way to describe how the tails change with m.
10.3 The probability density
Ĺ Note
fT(t) denotes the density of the random variable Tat a possible numerical value t. The
lowercase tinside the formula is the location where we evaluate the density.
Γ is the gamma function.
The symbol πin the constant below is the mathematical
constant, rather than a prior distribution.
The density is
161

<!-- page 16 -->
<!-- extracted via text-layer confidence=0.95 -->
fT(t) = Γ ((m+ 1)/2)
√mπΓ(m/2) (1 + t2
m)
−(m+1)/2
,
−∞< t< ∞.
The first factor makes the total area equal to 1. The second determines the shape. Because t
appears through t2, the density is the same at tand −t.
We usually calculate t probabilities with a table or software rather than integrating this formula
by hand. Still, the density helps explain why a t curve has a familiar bell shape with more
probability in its tails.
center_values <- seq(-4, 4, length.out = 600)
tail_values <- seq(2, 6, length.out = 400)
par(mfrow = c(1, 2))
plot(
center_values, dnorm(center_values),
type = "l", col = "gray40", lwd = 2,
xlab = "Value", ylab = "Density", main = "Center and tails"
)
lines(center_values, dt(center_values, df = 2), col = "darkorange", lwd = 2, lty = 2)
lines(center_values, dt(center_values, df = 8), col = "steelblue", lwd = 2, lty = 3)
legend(
"topright", legend = c("Normal", "t, df = 2", "t, df = 8"),
col = c("gray40", "darkorange", "steelblue"),
lwd = 2, lty = c(1, 2, 3), bty = "n"
)
plot(
tail_values, dnorm(tail_values),
type = "l", col = "gray40", lwd = 2,
ylim = c(0, 0.075),
xlab = "Value", ylab = "Density", main = "A closer look at the tail"
)
lines(tail_values, dt(tail_values, df = 2), col = "darkorange", lwd = 2, lty = 2)
lines(tail_values, dt(tail_values, df = 8), col = "steelblue", lwd = 2, lty = 3)
par(mfrow = c(1, 1))
162

<!-- page 17 -->
<!-- extracted via text-layer confidence=0.95 -->
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
Center and tails
Value
Density
Normal
t, df = 2
t, df = 8
2
3
4
5
6
0.00
0.02
0.04
0.06
A closer look at the tail
Value
Density
Figure 10.1: The t and standard normal densities have similar centers, but the t densities have
more probability in the tails. The right panel shows the positive tail in more
detail.
The right panel in Figure 10.1 makes a difference visible that is easy to miss near the center.
Using a normal curve in place of a t curve can substantially understate the probability of a
large standardized error when the degrees of freedom are small.
10.4 How the t distribution arises from a normal sample
Suppose X1, ... , Xnare independent normal observations with unknown mean μand unknown
variance σ2, with n≥2. Recall that
S2 =
1
n−1
n
∑
i=1
(Xi−X)2.
If the population standard deviation were known, we could standardize the sample mean
using
Z= X−μ
σ/√n∼N(0, 1).
Chapter 9 also tells us that
163

<!-- page 18 -->
<!-- extracted via text-layer confidence=0.95 -->
Y= (n−1)S2
σ2
∼χ2
n−1.
The sample mean and sample variance are independent, so Zand Yare independent. These
are exactly the ingredients in the definition of a t variable, with m= n−1.
Substituting them into the ratio gives
Z
√Y/(n−1)
= (X−μ)/(σ/√n)
√S2/σ2
= X−μ
S/√n.
The unknown population standard deviation cancels. Therefore,
T= X−μ
S/√n=
√n(X−μ)
S
∼tn−1.
Ĺ Note
S/√nestimates the standard error of the sample mean. Dividing X−μby it expresses
the estimation error in estimated standard error units.
Sis the square root of the sample variance with denominator n−1. It is not the square
root of the variance MLE. The degrees of freedom are n−1 because the chi-square variable
in the denominator has n−1 degrees of freedom.
For example, a value of T= 2 means the sample mean is two estimated standard errors above
the population mean. A value of T= −2 means it is two estimated standard errors below.
The sample mean itself is still normally distributed. It is this ratio, with its random denom-
inator, that has a t distribution. The exact result uses independent normal observations. A
small sample by itself does not justify a t model for arbitrary data.
10.5 Why the choice of cutoff matters
A standard normal variable falls between approximately −1.96 and 1.96 with probability 0.95.
If we divide an error by an estimated standard error, those same cutoffs generally capture less
than 95% of the probability.
The following figure shows the exact probability
164

<!-- page 19 -->
<!-- extracted via text-layer confidence=0.95 -->
P(−1.96 ≤T≤1.96),
T∼tn−1,
using the more precise standard normal cutoff in the code.
sample_sizes <- 3:60
normal_cutoff <- qnorm(0.975)
captured_probability <- 2 * pt(normal_cutoff, df = sample_sizes - 1) - 1
plot(
sample_sizes, captured_probability,
type = "l", col = "steelblue", lwd = 2,
ylim = c(0.78, 0.96),
xlab = "Sample size", ylab = "Probability between the cutoffs",
main = "Using a normal cutoff with an estimated standard error"
)
abline(h = 0.95, col = "firebrick", lty = 2, lwd = 2)
10
20
30
40
50
60
0.80
0.85
0.90
0.95
Using a normal cutoff with an estimated standard error
Sample size
Probability between the cutoffs
Figure 10.2: The usual 95% normal cutoff captures less than 95% of a t distribution. The
difference becomes smaller as sample size increases.
The curve in Figure 10.2 is below the desired probability, especially for small samples. To
165

<!-- page 20 -->
<!-- extracted via text-layer confidence=0.95 -->
capture the same central probability with a t distribution, we need cutoffs farther from zero.
10.6 Reading a t table and finding quantiles
Ĺ Note
tp(m) denotes the cutoff with cumulative probability punder a t distribution with m
degrees of freedom:
P(T≤tp(m)) = p.
The subscript pspecifies probability to the left of the cutoff, and the argument mspecifies
degrees of freedom. This notation gives a numerical cutoff, while Tdenotes a random
variable.
The table in Lecture 10 uses this left-tail convention. For a central interval containing 90% of
a symmetric distribution, 5% remains in each tail. Its positive endpoint is therefore the 0.95
quantile, not the 0.90 quantile.
For 15 degrees of freedom, the table gives
t0.95(15) ≈1.753.
By symmetry,
P(−1.753 ≤T≤1.753) ≈0.90,
T∼t15.
The same cutoff can be calculated with qt(0.95, df = 15). More generally, symmetry gives
t1−p(m) = −tp(m).
R function
Purpose
dt(x, df = m)
Evaluate a t density at x
pt(x, df = m)
Calculate probability at or below x
pt(x, df = m, lower.tail = FALSE)
Calculate probability above x
qt(p, df = m)
Find the cutoff with probability p to its left
rt(n, df = m)
Generate n random t values with m degrees of
freedom
For a positive cutoff, the probability beyond that cutoff in either direction is twice the upper-
tail probability. The two tails are equal because the distribution is symmetric.
166

<!-- page 21 -->
<!-- extracted via text-layer confidence=0.95 -->
10.7 Example: comparing two timing methods on the same
recordings
An audio lab uses an automated method and a manual method to mark the start of a sound.
Each recording is measured both ways.
Different recordings may have very different start
times, so the laboratory compares the two methods within each recording.
Ĺ Note
Diis the automated time minus the manual time for recording i. A positive difference
means the automated method places the start later.
μDand σ2
Dare the population mean and variance of these differences. Dis the sample
mean difference, and SDis the sample standard deviation of the differences, calculated
with divisor n−1.
The subscript Didentifies quantities describing the differences. Each recording supplies
one difference, so ncounts recordings rather than individual timing measurements.
Suppose the differences across recordings are independent and approximately normal. Eight
recordings give these differences, in milliseconds:
1.4,
0.8,
1.1,
−0.1,
0.6,
1.5,
0.3,
0.8.
The sample summaries are
d= 0.8,
sD≈0.540,
sD
√
8 ≈0.191.
The lab wants to compare this observed difference with the model in which the methods have
no systematic offset, so μD= 0. Under an exact normal model with that mean,
D−0
SD/
√
8 ∼t7.
The observed value is
0.8
0.540/
√
8 ≈4.19.
The estimated mean difference is about 4.19 estimated standard errors above zero.
differences <- c(1.4, 0.8, 1.1, -0.1, 0.6, 1.5, 0.3, 0.8)
mean_difference <- mean(differences)
167

<!-- page 22 -->
<!-- extracted via text-layer confidence=0.95 -->
standard_error <- sd(differences) / sqrt(8)
observed_t <- mean_difference / standard_error
observed_t
[1] 4.191495
2 * pt(abs(observed_t), df = 7, lower.tail = FALSE)
[1] 0.004078467
The probability of a ratio at least this far from zero in either direction is about 0.0041 under
the zero-offset normal model. This tells us that the observed standardized difference would
be unusual under that model. It is not the probability that the population mean difference
equals zero.
Note that the two measurements on a single recording could be dependent.
However, we
analyze one difference per recording and only require independence across those differences.
We also require the normal model to describe the differences well for the exact t result to
apply.
10.8 Example: allowing for one future processing delay
A technician records processing delays from 16 independent runs of a device. Suppose the
delays follow a normal distribution with unknown mean and variance. The observed sample
mean is 42 milliseconds and the sample standard deviation is 4 milliseconds.
The technician wants a range for the delay on the next run. Predicting a single future ob-
servation requires allowing for its own variability as well as the uncertainty in the estimated
mean.
Ĺ Note
Xnew denotes a future observation from the same population, independent of the current
sample. The text subscript “new” is a label.
Xnew −Xis the error made when predicting that observation with the current sample
mean. Its standard deviation is σ√1 + 1/n. We estimate this by S√1 + 1/n.
Because the new observation and the sample mean are independent normal quantities,
168

<!-- page 23 -->
<!-- extracted via text-layer confidence=0.95 -->
Xnew −X∼N(0, σ2 (1 + 1
n)) .
The variance is a sum. The term σ2 comes from the new observation and the term σ2/ncomes
from the sample mean.
The sample mean is independent of S, and the new observation is independent of the entire
current sample.
Thus the prediction error is independent of S.
Dividing its standardized
normal version by the same chi-square scale as before gives
Xnew −X
S√1 + 1/n
∼tn−1.
For n= 16, the central 90% cutoff is t0.95(15) ≈1.753. Rearranging the probability statement
gives
P(X−1.753S√1 + 1/16 ≤Xnew ≤X+ 1.753S√1 + 1/16) ≈0.90.
Using the observed sample summaries, the endpoints are
42 −1.753(4)√1 + 1/16 ≈34.77,
42 + 1.753(4)√1 + 1/16 ≈49.23.
prediction_margin <- qt(0.95, df = 15) * 4 * sqrt(1 + 1 / 16)
c(42 - prediction_margin, 42 + prediction_margin)
[1] 34.77199 49.22801
This gives a prediction interval from about 34.77 to 49.23 milliseconds. Under repeated sam-
pling and future observations from the normal model, this construction contains the future
delay 90% of the time.
The margin is about 7.23 milliseconds. Using the mean’s estimated standard error, 4/
√
16 = 1,
would give a much smaller margin of about 1.75 milliseconds with the same t cutoff. That
smaller scale describes uncertainty about the population mean. It leaves out the variation of
the next individual delay.
Even with a very large sample, a single future observation still varies around the popula-
tion mean. More observations help us locate that mean, but they do not remove individual
variation.
169

<!-- page 24 -->
<!-- extracted via text-layer confidence=0.95 -->
10.9 Chapter summary
• A t variable is a standard normal variable divided by the square root of an independent
chi-square variable divided by its degrees of freedom.
• The t distribution is symmetric about zero and has heavier tails than the standard normal
distribution.
• Its mean exists for more than one degree of freedom. Its variance is finite only for more
than two degrees of freedom.
• As the degrees of freedom grow, the t distribution approaches the standard normal
distribution.
• For independent normal observations, (X−μ)/(S/√n) has a t distribution with n−1
degrees of freedom.
• The denominator n−1 in S2 matters. Substituting the variance MLE without adjusting
the formula changes the statistic’s distribution.
• A central probability uses two tails. A central 90% interval requires the positive 0.95
quantile.
170
