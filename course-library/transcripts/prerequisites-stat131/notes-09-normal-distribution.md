---
source: prerequisites-stat131/notes-09-normal-distribution.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 9
kind: prerequisite
confidence: 0.88
---

<!-- page 1 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
STAT 131: Lecture Notes 9
Winter 2024
8.1 The Normal Distribution
M
Definition 8.1. A continuous random variable X is said to follow a Normal or Gaussian distribution
if X has pdf
1
= (x)f ←
for
,−∞<x<∞,
σ√2π
where,σ > 0, The parameter, μ is called the mean and the parameter σ is called the standard deviation.
We can write X ∼ Normal(μ, σ2).
Definition 8.2. A continuous random variable X is said to follow a standard Normal distribution if
X ∼ Normal(0, 1)., In other words,
1
 f(x) =
√2π
222
for − ∞ < x < ∞.
Properties of the Normal Distribution
• The pdf has a "bell” shape
• The pdf is symmetric around μ
• E[X] = μ ∠
• V(X) = σ 
Theorem 8.1 (Moment Generating Function). If X ∼ Normal(μ, σ2), then the moment generating
function of X is
 ψx(t) = eμt+σ2t2/2.
1

<!-- page 2 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 8.1. Find the expected value and variançe of the Normal distribution.
4x(t)=
d
= (75h
nt + 62t2/2
m=21()=×73(=(79+W).
d+
∂
4×x(t) =(m+02t)2}^
2Mt+o2t2/2
nt+02t/
+ oé
E[x]=4(+)1t=0=+2
V(x)=E∠x2]-(E[xJ2=(m2+02)-M2=02
The Normal distribution can be challenging to work with because thezcdf is not known in closed form.
We often use, Φ(x), to represent the cdf of the standard normal distribution, but this must be evaluated
numerically. Alternatively, tables are often used that report these probabilities.
Definition 8.3. Let X ∼ Normal(0, 1). Then, the cdf of X is denoted as
 Φ(x) = E(x) = P(X ≤ x) =
1
e−t2/2dt.
√2π
Example 8.2. Here is a piece of a numerical table for Φ(x). 
7
x
0.5
1.0
1.5
2.0
2.5
3.0
Φ(x)
0.6915
0.8413
0.9332
0.9772
0.9938
0.9987
Using this, find the probability that a Normal random variable is within one standard deviation of its
mean.
P(-1≤x≤1)=P(x≤1)-P(x≤-1)
6
11)
王(-)=(-Φ(1)
(1-)±-(1)王=
(1)0-1)-(1)重=
-1
0
26
89.0=1-(1)Φて=
◇
2

<!-- page 3 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 8.3. What is the probability that a Normal random variable is within k standard deviations
of the mean?
P(-K≤X≤K) =P(X≤k)−P(X≤-K)
=Φ(k)−4(一K)
1-(刚)まて
◇
The previous example leads to the following useful facts, sometimes called the, "Empirical Rule":
• The probability that a Normal random variable is within 1 standard deviation of the mean is
≈ 0.68
• The probability that a Normal random variable is within 2 standard deviations of the mean is
≈0.95
• The probability that a Normal random variable is within 3 standard deviations of the mean is
≈0.997
The empirical rule is specific to the Normal distribution. However, it is quite similar to Chebyshev's
inequality which may be used to place bounds on probabilities for random variables from general
distributions.
Theorem 8.2 (Chebyshev's Inequality). Let X be a random variable with inite mean E[X] = μ,and
finite variance (X) = σ2. Then, for any e > 0,
P(|X − μ| ≥ ∈)
o2
€2
Example 8.4. Use Chebyshev's inequality to bound that probability that a random variable is within
1, 2, and 3 standard deviations of its mean.
#
>P(1x-m|<0)≥(-1=0
1) P(1x-M|≥0) ≤
=P(1x-M|∠20)≥1-#=34
20
二
2) P(1x-M|Z2o)≤
222
4
=P(1x-M|∠36)≥1-#=8
02
⊥
9
3) P(1X-M| ≥36)≤
3202
◇
3

<!-- page 4 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Theorem 8.3 (Converting from Normal to Standard Normal). Let1 X ∼ Normal(μ, σ2), Then, Z =
X-μ
will follow the standard Normal distribution (i.e., Z ∼ Normal(δ,1).
σ
Example 8.5. Suppose that X follows a Normal distribution with mean 5 and standard deviation 2.
Find P(1 ≤ X ≤ 8).
P(1≤x≤8)=P(1-5≤x-5≤8-s)=P(
1-5
≤
x-s
8-5
=P(-2三二≤32)=王(3z)-(-2)
◇
A very important property of the Normal distribution is the linear transformation property. This says
that if X is a Normal random variable and you take a linear transformation of X, then this too will
be a Normal random variable. This is not true for most other distributions (e.g., the Exponential).
Theorem 8.4 (Linear Transformation Property). Let X ∼ Normal(μ, σ2), and let
Y = aX + b,
for a > 0, Then, Y ∼ Normal(aμ + b, a2σ2).
4

<!-- page 5 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
#=
tle normal pdf with mesn am+t
This
S
Jmbisn Pab
9
Example 8.6. Suppose X represents the distance in feet that a long jumper jumps at a track meet.
Also suppose that X ∼ Normal(16, 2). If distance were measured in inches instead of feet, what
distribution would the jumper's distance have?
Y=12x
7b)=91.71=[x371=[x2173=[^]3
V(Y)=V(12x)=(2V(x)=144·2=288
⇒ Y ~Norma1 (192, 288)
◇
Theorem 8.5 (Sum of Independent Normals). Let X ∼ Normal(μx, σ2) and Y ∼ Normal(μy, σ2).
Assume that X ⊥ Y, If W = X + Y, then
W ∼ Normal(μx + μy, σ2 + σ2).
5

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 8.7. Let Xi denote the weight of a randomly selected prepackaged one-pound bag of car-
rots.
Of course, one-pound bags of carrots won’t weigh exactly one pound.
Instead, the weights
of “one-pound” bag of carrots are independently Normally distributed with a mean of 1.18 pounds
and a standard deviation of 0.07 pounds. Suppose you buy three such bags of carrots. What is the
distribution of the weight of all your carrots?
}
8.2
Properties of the Sample Mean
Consider sampling the heights of 1,000 random individuals in the US and taking the average. Intu-
itively, this should give us a reasonable estimate of the average height of all people in the US. However,
this average is a random variable. If we were to repeat our random sampling, we would get a di↵erent
average each time. What can be said about the quality of this sample average? This is what we will
try to answer.
Suppose X1, X2, . . . , Xn are independent and identically distributed random variables (we call this a
random sample) that have some mean μ and some variance σ2. We are not assuming that these are
Normally distributed. We are not even assuming that they are continuous random variables...they
could be discrete.
Definition 8.4 (Sample Mean). The sample mean of n random variables X1, X2, . . . , Xn is their
average:
 ̄Xn = 1
n(X1 + X2 + · · · + Xn).
Theorem 8.6 (Mean and Variance of the Sample Mean). Let X1, X2, . . . , Xn be a random sample
from a distribution with mean μ and variance σ2. Let  ̄Xn be the sample mean. Then E[  ̄Xn] = μ and
V ( ̄xn) = σ2/n.
6
W
X
X
X intNormal 1 18 0.072
and T
X tktX
T
Normal 3.1.18 3.0.072
T Normal
3 54
0.0147
u
u
n
w
w
w
w

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
Proof. Use independent sums of variances.
Notice that the sample mean depends on the sample size n. In other words, as we collect more data
and n grows, the sample mean changes. In this way, we can think of  ̄Xn as a sequence of random
variables (similar to a sequence of numbers in calculus, but random now). We might want to think
about what happens for this sequence as n ! 1.
Definition 8.5 (Convergence in Probability). An infinite sequence of random variables X1, X2, X3, . . .
is said to converge to b in probability if for every number ✏> 0,
lim
n!1 P(|Xn −b| < ✏) = 1.
This property can be expressed as Xn
p! b, and we say that Xn converges to b in probability.
Theorem 8.7 (Law of Large Numbers). Let X1, X2, . . . , Xn be a random sample from a distribution
with mean μ and variance σ2 < 1. Let  ̄Xn be the sample mean. Then,
 ̄Xn
p! μ.
In other words, the sample mean converges in probability to the true distribution mean.
Proof. Use Chebyshev’s Inequality.
.
7
E In
ELI
X
x
t
Xn
LEND EX
E XD
n M
μ
In
V t x
kt
Xn
VA Uk
Van
n
62
6
u
V Tn
E x̅
M
so P
In M
E 21
10
1
Liz P Ix̅ n
n
E
I

<!-- page 8 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Theorem 8.8 (Central Limit Theorem). Let X1, X2, . .., Xn be a random sample from a distribution
with mean μ and variance σ2 < ∞. Let Xn be the sampte mean. Then,
(Xn −μ
lim P
≤ x
) = Φ(x).
n→∞
σ/√n
In other words, if we take a random sample from any population (distribution) with mean μ and
variance σ2, then as n becomes large, the sample mean, n will be approximately Normal distributed
with meanμ and variance (σ/√n)2 Similarly, the sum Σi=1 Xi = n· Xn, will also have an approximate
Normal distribution with mean u and variance nσ2. Notice that it doesn't matter whether or not the
original distribution we sample from is discrete or continuous!
Example 8.8 (Tossing a Coin). Suppose a fair coin is tossed 900 times. Use the central limit theorem
to approximate the probability of obtaining more than 495 heads.
M=( 3=[7 00=14(21)10
900
Let S = 2 x
E[5]=900Ex)=450,V(S)=900·14=22S
i=1
0s=√225s=15
495-450
P(s >49s) = P(≤=450 >
IS
S)
≈P(Z>3)=1-P(2≤3)=1-Φ(3)=0.0012)
◇
Example 8.9 (Sampling from a Uniform Distribution). Suppose that a random sample of size n = 12 ,
is taken from a uniform distribution on the interval [0, 1]. Use the central limit theorem to approximate
the value of P (|Xn − 1| ≤ 0.1).
v(xi) = 1/12
21=C∵73
Xn is spro Normal (V2)
P(IX -1⁄22|≤0.1)=P(-0.1≤X-12≤0.1)
1/12
=2Φ(1.2)-)=0.7698
8

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 8.10 (Signal and Noise). Imagine that we are trying to transmit a signal. During the
transmission there are 100 sources that independently add a little bit of noise to the signal. Each
noise source produces an amount of noise that is uniformly distributed between a = −1 and b = 1. If
the total amount of noise is greater than 10 or less than -10, then the entire signal will be corrupted.
However, if the absolute value of the total amount of noise is less then 10, then the signal will be
transmitted without issue. What is the approximate probability that the signal will be transmitted
without an issue?
}
9
Xiii uniform 1,1
EX
0
UXi E
5 É X
ELS
100.0
0
V5 100.1 3
1003
S
is approx Normal
0
100 3
we
want PGo
10
PC
g
PFB
z
B
2
B
I
0.91
