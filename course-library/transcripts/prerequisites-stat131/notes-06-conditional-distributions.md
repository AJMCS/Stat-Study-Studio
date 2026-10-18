---
source: prerequisites-stat131/notes-06-conditional-distributions.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 8
kind: prerequisite
confidence: 0.90
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 6
Winter 2024
6.1
Conditional Distributions [DS 3.6]
Recall our definition of conditional probability
P(A|B) = P(A \ B)
P(B)
.
We now want to extend this concept to random variables. Suppose we have a bivariate random variable
(X, Y ) ⇠F, what can be said about X if Y is known?
Example 6.1 (auto insurance). Suppose we have the following joint pmf:
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
With the joint pmf, we can answer the following questions.
• What is the probability of a car being stolen?
• What is the probability that a car is Brand 3 and is stolen?
• Given a car is stolen, what is the probability that the stolen car is Brand 3?
}
1
 
I
00
a
P X 1
0.024
PX 14 3
0 001
PCH 1
1
I
Eo
0.042

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
Definition
6.1
(Conditional
pmf). For
two
discrete
random
variables
X
and
Y ,
the
conditional probability mass function (pmf) of X given Y = y is
fX|Y (x|y) = P(X = x|Y = y) = fX,Y (x, y)
fY (y)
,
provided fY (y) > 0.
In conditional probability, let A = {X = x} and B = {Y = y} and we will obtain the conditional pmf.
Conditional probability calculation:
P(X 2 E|Y = y) =
X
x2E
fX|Y (x|y).
Theorem 6.1. The conditional pmf fX|Y (x|y) is a valid pmf. In other words,
X
X
fX|Y (x|y) = 1.
Proof. Use the definition of conditional pmf.
Example 6.2. Suppose we have the following joint pmf:
y = 1
y = 2
y = 3
y = 4
Total
x = 1
0.1
0
0.1
0
0.2
x = 2
0.3
0
0.1
0.2
0.6
x = 3
0
0.2
0
0
0.2
Total
0.4
0.2
0.2
0.2
1.0
Find the conditional pmf of Y given X = 2.
2
w
w
w
NS
FIND
fly
00000
fix 512
PCH
E
PLY21
0
P 431 7
8 16
PEI
2
s
Fix 91
2
to the

<!-- page 3 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
We can also deal with conditional probabilities for continuous random variables.
Definition 6.2 (Conditional pdf). For two continuous random variables , X and Y, the
s  = x u   t uong  nin ciiotn
fx,Y(x, y)
fx|r(x|y) =,
fy(y)
provided fr(y) > 0.,
Example 6.3. Visualizing a conditional pdf
◇
Using the conditional pdf, a particular conditional probability can be computed:
P(X ∈ E|Y = y) =
fx| (x|y)dx.
E
For a fixed Y = y, fx|r(x|y) is a valid pdf of x.
Example 6.4. Suppose f(x, y) = e−x for 0 ≤ y ≤ x < ∞.
• Find fx|r(x|y).
• Find P(X > 9|Y = 4)
• Find fγ|x(y|x).
1) fyls) = Se
00
00
-y
fr0≤y
x = -e
e
y
f(x(5)
=fx(×16)=
e4
fery≤x∠
ey
fy(s)
2) P(X >9|y=4) =S
S=x(=人(x)
大口
dx
9
9
ey
-9
-S
ex
二
e
e
二
e
-4
19
3)f(x)=e
dy
-x
X
= xe
e
3
f(x(y)
-1X
⇒fy(x(y1x)
二
K0
0≤y≤x
f1)
Xex

<!-- page 4 -->
<!-- extracted via ocr confidence=0.84 flags=text-layer-corrupted -->
◇
For conditional distribution functions, similar conclusions to those of conditional probability also hold.
Theorem 6.2 (Multiplication rule).
f(x,Y)(x, y) = fx|Y(x|y)fy(y) = fy|x(y|x) fx(x).
Example 6.5. Suppose X ∼ Uni f[0, 1], Y|X = x ∼ Uni f [x, 1].
• Find the joint pdf f(x, y).
• Find the marginal distribution of Y.
fcr 0∠x∠y<1
1-X
2)1==109
y
0
fer0<g2)
◇
Example 6.6. Suppose (X, Y) is uniformly distributed on the semicircle
{(x, y) : x2 + y2 ≤ 1,x ≥ 0}. X≤ √1-y}
Find fx|r(x|y). In particular, what is fx|r(x|0)?
J1-2
25-10
Y
hー10つ=
x>=xっS=(S1っ=(9x)
0
1/2
X
())
fcr0≤x≤√1-y
fx1y (xlg)
二
二
fy(y)
fx1g (x19=0) =-=1fcr0≤x≤)
◇
Theorem 6.3 (Law of total probability). Suppose Y is continuous,
fx(x) = 
f(x,Y)(x, y)dy =
fx|r(x|y)fr(y)dy,
Suppose Y is discrete,
fx(x) = ∑f(x,y)(x,y) = ∑fx(|Y(x|y)fY(y).
y
y
4

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
Theorem 6.4 (Bayes theorem). Given two random variables X and Y , we can find the conditional
pdf/pmf of X given Y = y as
fX|Y (x, y) = fY |X(y|x)fX(x)
fY (y)
where fY (y) > 0.
Example 6.7. Suppose we have the following conditional pmf
fY |X(y|x) = x2 + y2
2x2 + 1, for y = 0, 1
and the following two marginal pmfs
fY (y) = 14 + 3y2
31
, for y = 0, 1
fX(x) = 2x2 + 1
31
, for x = 1, 2, 3.
Find the conditional distribution of X given Y and show that this is a valid distribution.
}
Theorem 6.5. X ? Y i↵fX|Y (x|y) = fX(x) with fY (y) > 0.
Proof. Use definition of conditional distribution.
5
f
fly g
w
WE fI
7
let X
Y
Then ANY
fxlx
E
Let fxylus
fxlx
Iff
f
x
fix b
fxlx fly
14

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
6.2
Transformations of Random Variables [DS 3.8]
In many cases, we know the distribution of some random variable X, but we really care about some
transformation of function of X. For example if X is the rate that customers are lining up in a queue,
then 1/X corresponds to the average waiting time. If we know the distribution of X, we should also
be able to find the distribution of 1/X, which is the problem we will study now.
Example 6.8 (Distance from the middle). Let X be a random variable that follows a uniform dis-
tribution on the integers 1, 2, . . . , 9. Suppose that we are interested in how for X is from the middle
of the distribution (i.e., 5). We could define Y = |X −5| and then consider probabilities involving Y.
What is P(Y = 1)?
}
Theorem 6.6 (Transformation of a discrete random variable). Let X have a discrete distribution with
pmf fX(x) and let Y = r(X) for some function of r(·) defined on the support of X. For each possible
value y of Y , the pmf of Y is
fY (y) = P(Y = y) = P(r(X) = y) =
X
x:r(x)=y
fX(x).
Example 6.9 (Distance from the middle). Let X be a random variable that follows a uniform distri-
bution on the integers 1, 2, . . . , 9 and Y = |X −5|. What is the pmf of Y ?
}
We can also consider transformations in the continuous case, however for continuous random variables,
it is often more convenient to work with the cdf.
Theorem 6.7 (Transformation of a continuous random variable). Let X have a continuous distribution
with cdf FX(x) and let Y = r(X) for some function of r(·) defined on the support of X. Then, the cdf
of Y is
FY (y) = P(Y y) = P(r(X) y) =
Z
x:r(x)y
fX(x)dx.
6
PI
P X
4163
19
w
w
www.w
Possible values of Y
bit
P 1 0
P X S
1 9
PLY1
2 9
P
2
P XE 3,73
PM
P XE 4833
29
P 4 4
P XE 1193 19
g fly 19 3 3 34 1
w
u
un
w

<!-- page 7 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 6.10 (Average waiting time). Let Z be the rate at which customers are served in a queue
and assume that Z ∼ Exp(λ), The average waiting time is Y = 1/Z, Find the cdf and pdf of Y.
F_212)=1-e
-λ2
we want Fy(y) =P(y≤y)
Poss,b1e
vcloos ofs)
P(y≤b)=P(立≤0)=P(2≥Vy)
y70
-1/y
=1-P(2≤6)=1-E(Vs)=1-(1-e^)=0
fer y 70
—A/y-Ny
—Ny
fy()
Fy(s)
d
—2
Ae
for y70
dy
ds
e
=0
二
y2
Example 6.11. Suppose that X follows a uniform distribution on the interval [−1, 1]. Find the pdf
of the random variable Y = X2
x+1
Possible vclus
fx()=2fr-1Ex1⇒2dt=
X
1
2
∂f y?0≤≤1
P(xE5)
P(xE-√u)
=(丙)一辰(一√5)
Fy1b)=P(y≤y)=P(x≤s)=P(-√y≤x≤)
2y2
=y2Ar0≤y≤)
=g/2+1
1
2
2
-1/2
fy15)=
人
Fyly)
V2
y
fer0≤y≤)
y
方
Ay
◇
Theorem 6.8 (Linear transformation). Suppose,X_ is a continuous random variable with pdf fx(x)
and Y = aX + b for a ≠ 0. Then the pdf of Y is
fy (y) =
1
fx
Y − b
|a|
a
7

<!-- page 8 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
y=#x+0
9=
0
Example 6.12. Suppose X ∼ Exp(1). Find the pdf of Y = X.
fx(x)=ex
f)=()=Se
 Y~Exp(S)
◇
Example 6.13. Suppose X ∼ Exp(1). Then fx(x) = e−x and Fx(x) = 1 − e−x for x > 0. Find the
pdf of Y = Fx(x);
Fx(s)=P(y≤b)=P(F(x)=5)=P(反1x(x)≤+()
=P(x≤Fx(s))=Fx(反(s)=y
f)=1
◇
Theorem 6.9 (Probability integral transformation). Suppose X is a continuous random variable with
cdf Fx(x), and Y = Fx(X). Then Y ∼ Uni f[0, 1];
This theorem implies that we can use an inverse CDF method in random number simulation. Suppose
 ( -  (- tt nb   nt  ·   ' f  
To be more specific, the following is an algorithm to simulate random numbers from a distribution
with cdf F(·):
(1) first generate random numbers Ui's from Uni f[0, 1]; 
(2) then, apply inverse-CDF transform F−1(Ui). 
The resulting random numbers {F−1(Ui)}n=1 follow the distribution F.
8
