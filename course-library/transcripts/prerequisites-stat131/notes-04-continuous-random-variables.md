---
source: prerequisites-stat131/notes-04-continuous-random-variables.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 9
kind: prerequisite
confidence: 0.91
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 4
Winter 2024
4.1
Continuous Random Variables [DS 3.2]
4.1.1
Definition and Properties
Many random variables can take values in certain intervals. For instance, human height/weight mea-
surements, temperature, precipitation, etc..
As mentioned previously, these are called continuous
random variables.
For these types of random variables, the probability that x will be equal to a
specific value is 0. Thus, we do not calculate things like P(X = x) for continuous random variables,
and instead calculate the probability that the random variable might be in a specific interval. Con-
sequently, we do not work with probability mass functions as we did in the case of discrete random
variables, and instead work with probability density functions.
Definition 4.1 (Probability Density Function). The probability density function (pdf) of a continu-
ous random variable X is a non-negative function f(x), where
where
R 1
−1 f(x)dx = 1.
How is the pdf related to the probability of a specific event? For a continuous random variable X, the
probability of some event E is
P(E) =
Z
x2E
f(x)dx.
Probability density is not the same as probability. For a continuous random variable X, P(X = a) = 0
even though we may have f(a) > 0.
1
 
P
a
X
6
fix dx
unity
w
I
It
is also possible
flax
0
that
fix
7

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 4.1. PDF Diagram
}
Definition 4.2 (Support). The support of a continuous random variable X is defined as the set
{x : f(x) > 0} where f(x) is the pdf. In other words, it is the set of all possible values of x, where the
pdf is strictly positive.
Example 4.2 (Two-year old weights). Suppose that the weight of a two-year old can range from 15
pounds to 35 pounds. Let f(x) denote the pdf of weight for two-year olds, where
f(x) =
(
3
40 −
3
4000(x −25)2, for 15 x 35
0, otherwise
.
What is the support of this random variable? What is the probability that a two-year old will weight
more than 30 pounds?
}
Sometimes we may only know the pdf up to a constant:
f(x) = c · g(x)
where g(x) is a known function and c is an unknown constant. Write may write f(x) / g(x).
Definition 4.3 (Normalizing constant). For a pdf such that
f(x) = c · g(x),
c is called the normalizing constant.
2
temp
flt
A
P 602
270
EIEE.fi
fi I
support
is
15,35
p
730
Adx
Addy
E 1 254
0.160
verify this
C is
an
unknown constant

<!-- page 3 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
How can we compute c so that pdf is completely known? The idea is to use the unity property of pdf:
f(x)dx = 1.
8
Example 4.3. For continuous random variable X, f (x) α e−2x for x > 9; f(x) = 0 for x ≤ 0.
• Compute the normalizing constant.
-2x
• Compute P(1 < X < 2).
つ=(xC.つ=(2
0
2x
2dx
∫=
ce
e
0
=c[0-(-131]=(#
-2x
e
0
メて
C=2
flx)=2e
-2X
2) P(1<x∠2)=P(IEX≤2)=5)x=2
-2
NT
e
e
+
e
2
2
k
0.117
e
e
◇
3

<!-- page 4 -->
<!-- extracted via ocr confidence=0.83 flags=text-layer-corrupted -->
4.1.2 A Couple Types of Continuous Random Variables
Definition 4.4 (Uniform). The random variable X is uniform on [a, b] if its pdf is
公个
q  x p I
f(x) =
b−a
0, otherwise
Example 4.4. Show that ∫-∞ f(x)dx = 1 for the uniform distribution.
S
8
6
flt)dx
dx
0a-
b-9
6-9
9
9
6-5
6-9
◇
X
a
Definition 4.5 (Exponential). The random variable X follows an exponential distribution with rate
λ, if its pdf is
∫λe−λx, for x ≥ 0
f(x) =
0, otherwise
Example 4.5. Show that ∫-∞ f(x)dx = 1 for the exponential distribution.
8
4
FIx=
λe
-AX
x-
XK-
e
Q
2
[0-(-六1]=x[]=四
◇
4.2 Some Other Common Continuous Distributions
• Normal (Gaussian) distribution
• Gamma distribution
• The Beta distribution
• The student-t distribution
4

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
• Cauchy distribution
• The χ2 distribution
5

<!-- page 6 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
4.3 Cumulative distribution functions [DS 3.3]
Remember that the pmf is specific to discrete distributions and the pdf is specific to continuous
distributions. We will now study the Cumulative Distribution Function (CDF), which can be defined
for both types of random variables.
Definition 4.6 (CDF). The cumulative distribution function (CDF) is the function F(x), for all
x ∈ R, such that
F(x) = P(X ≤ x).
Definition 4.7. The CDF of a discrete random variable, X is given by
PMA
F(x) = P(X ≤ a) = ∑ f (x)dx,
x≤a
where f (x) is the probability mass function. If we know F(x), we can also find P(X > a) = 1 − F(a).
Example 4.6. Find the CDF of a Bernoulli distribution with probability p.
AX)
FA
0
X
X
4
fr x∠0
F()
for0≤x<1
21
にx月
◇
Definition 4.8. The CDF of a continuous random variable, X is given by
bpdf
F (x) = P(−∞ < X ≤ a) =
f(x)dx,
-∞
6

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
where f(x) is the probability density function. If we know F(x), we can also find P(X > a) = 1−F(a).
Example 4.7. Find the CDF of a uniform distribution on [0, 1].
}
We have seen how to construct the CDF when we know the pdf, but we can also find the pdf when
we know the CDF.
Theorem 4.1. For a continuous random variable X,
f(x) = d
dxF(x).
Proof. Use the fundamental theorem of calculus.
7
w
w
fly
Pdf
fan
of
flux
1
II
II
FW
P X
a
dx
x
fW
w
suppose
we
have
a
Cdf
F x
then
FIX
dt
FX
Afundamental
this
of
calculus

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 4.8. Suppose a random variable has the following CDF:
F(x) = 1 −e−5x.
Find the corresponding pdf. What distribution is this?
}
4.4
Properties of CDFs
• Non-decreasing: F(x1) F(x2) if x1 < x2
• limx!−1 F(x) = 0 and limx!1 F(x) = 1
• For every x 2 R, P(X > x) = 1 −F(x)
• For all x1 < x2, P(x1 < X x2) = F(x2) −F(x1)
Definition 4.9 (Quantile). Let X be a random variable with CDF F(x). For each p strictly between
0 and 1, define F −1(p) to be the smallest value x such that F(x) ≥p. Then F −1(p) is called the
p quantile of X or the 100p percentile of X. The function F −1(p) defined here on the open interval
(0, 1) is called the quantile function of X.
Definition 4.10 (Mdedian/Quartile). The 1/2 quantile or the 50th percentile of a distribution is
called its median. The 1/4 quantile or 25th percentile is the lower quartile. The 3/4 quantile or 75th
percentile is called the upper quartile.
Theorem 4.2. When the random variable X is continuous, F −1(·) is the inverse of F(·).
8
F
FIX
é
5
This
is the exponential
dist
with
7
5
w
w
w
e
median
u
u
u

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 4.9. Find the quantile function for a uniform distribution on [0, 1].
}
Example 4.10. Find the quantile function for an exponential distribution with rate λ = 2.
}
9
F X
X
Set
p
X
and
solve
for
X
Then f
p
p
The median
is F
as
O S
FA
1
e 4
Set p 1 é
and solve for X
Pt
e
1 p
log Ip
2X
X
So f
p
1094
The median
is ftp.s
18
