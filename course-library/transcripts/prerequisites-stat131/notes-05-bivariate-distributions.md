---
source: prerequisites-stat131/notes-05-bivariate-distributions.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 9
kind: prerequisite
confidence: 0.88
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 5
Winter 2024
5.1
Bivariate distributions [DS 3.4]
So far, we have worked with a single random variable at a time. In many cases we will have two
(or more) random variables that we deal with together. For example, a doctor may measure both a
person’s height and weight, or a company might record both the number of hires and fires in a given
year.
Definition 5.1 (Joint distribution). The joint distribution of two random variables X and Y is defined
as the collection of all probabilities of the form P ((X, Y ) 2 E) for all E ⇢R2 such that {(X, Y ) 2 E}
is an event.
Definition 5.2 (Discrete joint distribution). A discrete joint distribution is the joint distribution of
two random variables X and Y where both X and Y are discrete.
Example 5.1. Outcomes of soccer/basketball games;
}
Definition 5.3 (Joint pmf). The joint probability mass function (pmf) of two discrete random vari-
ables X and Y is defined as the function f such that
f(x, y) = P(X = x&Y = y).
for all (x, y) 2 R2. This may equivalently be written as P(X = x, Y = y) or P(X = x \ Y = y).
Note that f(x, y) ≥0 for all (x, y) 2 R2 and P
x
P
y f(x, y) = 1.
Example 5.2 (auto insurance). Suppose we have the following joint pmf:
Stolen
Brand 1
Brand 2
Brand 3
Brand 4
Brand 5
Total
No
0.129
0.298
0.161
0.280
0.108
0.976
Yes
0.010
0.010
0.001
0.002
0.001
0.024
Total
0.139
0.308
0.162
0.282
0.109
1.000
1
 
v
w
If
p x448
f x y
flx y

<!-- page 2 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
◇
Example 5.3. Use the below joint pmf to answer the following questions:
Y = 1 Y = 2 Y = 3
X = 0
1/8
1/4
1/8
X = 1
1/8
0
3/8
1. What is P(X = 0, Y = 1)?
2. What is P(X = 0)?
3. What is P(Y = 1)?
1)P(x=01Y=1)=1/8
3
P(x=01y=y)P=)=P(x=0,y=y)=+4+=
(0=x)d(
二
3) P(Y=1) =± P(X=x14=1) = V8+ 18 =
0X
◇
Definition 5.4 (Continuous joint distribution). A continuous joint distribution is the joint distribu-
tion of two random variables X and Y where both X and Y are continuous.
Example 5.4. Stock prices of Google and Apple, precipitation and wind speed, human height and
weight, etc..
◇
Definition 5.5 (Joint pdf). The joint probability density function (pdf) of two continuous random
variables X and Y is the non-negative function f(x, y), where
C
P(a ≤ X ≤ b, ≤ Y ≤ d) =.
f(x, y)dxdy.
Note that
f(x, y)dxdy = 1.
(51x)t)
fy)
C
2
X
X
ら

<!-- page 3 -->
<!-- extracted via ocr confidence=0.82 flags=text-layer-corrupted -->
Example 5.5. Suppose the joint pdf of (X, Y) is
cx2y.
for x2 ≤ y < 1
 f(x, y) =
0, otherwise
• Find c.
• Calculate P(X > Y).
1=f=
• Calculate P(X = Y).
Cx^y bydx
[|]
一一
フh
+
りラ
#=A(x)=
z=っに
y[]
2) P(x>y)=5
=3/20
21
21
#
(x-x)dx=
21
90
S6
yo
9s
8
3) P(x=y)=0
The line X=y has ho ares!
3

<!-- page 4 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
F(x)=P(X≤x)
◇
Definition 5.6 (Joint CDF). The joint cumulative distribution function (cdf) of two random variables
X and Y is the function F such that for all (x, y) ∈ R2,
F (x, y) = P(X ≤ x, Y ≤ y).
Theorem 5.1. For two continuous random variables X and Y, the following relationship exists be-
tween the joint cdf and the joint pdf:
∂2
F(x, y) = f (x, y).
∂x∂y
Note that,
txyg(·) is notation that means we take the derivative of g(·) with respect to the variable y,
∂2
and then we take a derivative again, with respect to x. We can also change the order of differentiation.
Example 5.6. F(x, y) = 1xy(x + y) for x ∈ [0, 2] and y ∈ [0, 2]. Find joint pdf.
xy(x#()(2x+)
16
rx
#(2xy+)=(2x+2)=f(x
dy
16
for X∈[012]
◇
Gnd y∈[012]
Check that this integrates to
4

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
5.2
Marginal Distributions [DS 3.5]
The joint pmf/pdf tells us how two variables X and Y vary jointly. However, sometimes we just want
to know how one variable (say X) varies, regardless of the other variable Y. In other words we are
interested in the marginal distribution, which is just the distribution of a single random variable. We
can use the joint pmf/pdf to find this marginal pmf/pdf.
Theorem 5.2. For two discrete random variables X and Y , with joint pmf f(x, y), the marginal pmf
of X is
fX(x) =
X
y
f(x, y).
Note, we use the notation fX(x) just to clarify that the marginal distribution is for the variable X.
We may also use fY (y) to denote the marginal distribution of Y .
Proof. Use the law of total probability.
Theorem 5.3. For two continuous random variables X and Y , with joint pdf f(x, y), the marginal
pdf of X is
fX(x) =
Z 1
−1
f(x, y)dy.
Similarly, the marginal pdf of Y is
fY (y) =
Z 1
−1
f(x, y)dx.
5
w
w
W
f
x P X x
PX x Kg P YF
PX x A
g
Egfx y
w
w
w

<!-- page 6 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 5.7. For two continuous random variables X and Y, let
(x + y, for 0 ≤ x ≤ 1, 0 ≤ y ≤ 1
f(x, y)
0, otherwise
Find the marginal density of X.
-80
y=0
for 0≤x≤1
0, othorwise
◇
5.3 Independent Random Variables [DS 3.6]
Recall that for a pair of events A and B, they are independent if and only if
P(A∩ B) = P(A)P(B).)
We will now extend the concept of independence to random variables.
Definition 5.7 (Independence of two random variables). We say that two random variables X, and
Y, are independent, denoted as X ⊥ Y, if and only if
C
f(x, y) = fx(x)fy(y).
Note that this is true for both discrete random variables (pmfs) and continuous random variables
(pdfs).
Example 5.8. For two continuous random variables X and Y, let
(x + y, for 0 ≤ x ≤ 1, 0 ≤ y ≤ 1
f(x, y)
0, otherwise
Is X ⊥ Y?.
fx(x)=x+k2
f(y)=x+yx=y+k2
fx(x)·fy(y)=(x+kz)(y+k)=xy+kx++4≠x+y=f(x(y)
So X is not indep. of Y.
6

<!-- page 7 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
◇
Theorem 5.4 (Factorization). If the joint pdf of X and Y, satisfies
fx,Y(x, y) = h(x)g(y)
for all x, y ∈ R, where h(·) and g(·) are two univariate functions, then X ⊥ Y
Special case: let hx (x) = fx (x) and hY(y) = fY(y), so
f(x, y) = fx(x) fY(y).
Example 5.9. For two continuous random variables X and Y, let
∫4xy, for 0 ≤ x ≤ 1, 0 ≤ y ≤ 1
f(x, y)
0, otherwise
Is X ⊥ Y?.
fx(x)=54xydy=2xy21=2x
Fy(y)=∫ 4xy dx= 2y
f(x)·fy(y)=2x2y=4xy=f(xy)
h(x)=4x
ヨX⊥ソ
g(y)=y
f(x1b)=4xy=4xy=h(x)g(y)
◇
=7X⊥Y
Note that if the Support of ove varig tle
deperds on the otorl tlen they
cannot be ind ep.
7

<!-- page 8 -->
<!-- extracted via ocr confidence=0.84 flags=text-layer-corrupted -->
x⊥Y⇒f(x(5)=fx(x)·fy(y)
Example 5.10. Suppose that the time until server 1 crashes is denoted by X, ∼ Exp(λ) and the time
until server 2 crashes is denoted by Y, ∼ Exp(μ). Assume that X ⊥ Y, What is the probability that
y
server 1 crashes before server 2?
8
A
P(x<y)=∫∫Axw)dyN
x=6
0
X
=∫∫aeedydy
-λx-My
>X
e
X
X
B
XV
A
GW-
dy dx
二
Me
0
X
A
-(a+M)X
=∫
e
0
-(a+M)x
0
1
w+kd
A+M
◇
Theorem 5.5. If X and Y are independent, then g(X) and h(Y) are independent for any function g
and h.
8

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
Given the following
joint
Pmf
f
x y
92
for
1,43 and
go
1 otherwise
1 Find fx
x
2 Find fy
y
3
Is
XLY
1 fx x
AH g
1
If
for
1,213
2 Fy g
flag If
FYI 742145
for 9 91
3 fly fly
2
I
fix g
Iff
So X and Y
are not indep
