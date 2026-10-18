---
source: prerequisites-stat131/notes-08-variance-and-higher-moments.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 13
kind: prerequisite
confidence: 0.89
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 8
Winter 2024
8.1
Variance and Higher Moments [DS 4.3]
Previously we discussed how the mean, or expected value, can be used to summarize a distribution.
The mean gives us an idea of what the average value for a random variable might be. Notice that it
doesn’t really tell us how far away from the mean a random variable might be. We will now introduce
the concept of variance for this purpose.
Definition 8.1 (Variance). The variance of a random variable X, written as V (X) is defined as the
expected squared di↵erence of X from its mean:
V (X) = E[(X −E[X])2].
Note that we may also use V ar(X), σ2
X or σ2 to denote the variance.
Example 8.1 (Variance of a Bernoulli). Let X ⇠Bernoulli(p). Find V (X).
}
Lemma 8.1 (Alternative expression of variance). The variance of a random variable X can equiva-
lently be expressed as follows:
V (X) = E[X2] −(E[X])2.
1
 
ti
w
w
E X
1 P
O
i P
P
E
X
E
I
E
x ppy
EM
F P 04H
p
E X
Xp
p
E X
2E X P
P
P
2 P P
p
p p
P t P
U

<!-- page 2 -->
<!-- extracted via ocr confidence=0.84 flags=text-layer-corrupted -->
Proof. By definition.
V(x)=E[(x-E[×])]=E[x-2X·E[]+E[x72]
=E[x2]-2E[·E[+(E[]){2
τ([×73) -(]3 =
□
Example 8.2 (Variance of a Bernoulli). Let X ∼ Bernoulli(p). Find V(X).
d= [x3
d=[2x]3
V(x)=E[x2)-(E[x])2
(d-1)d = τd − d =
◇
Example 8.3 (Variance of a Uniform). Let X ∼ Uniform(a, b). Find V(X).
E[x]#
62+ 96 +q2
1E[x] =
3
V(x) =E[x]-(Ex]){=
62+9b+q2
(G+6)
3
力
462+496+4a2
5+9-7+90+9
(6-9)2
二
12
12
12
12
◇
Definition 8.2 (Standard deviation). The standard deviation of a random variable X is defined as
C = √V(X),
2

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
8.1.1
Properties of Variance
Elementary properties:
• V (X) ≥0 for all X.
• V (X) = 0 i↵P(X = c) = 1 for some constant c.
Theorem 8.2 (Variance of a linear function of X). Suppose X is a random variable, while a and b
are two constants. Then
V [aX + b] = a2V [X]
Example 8.4. Suppose you are playing a game where you flip a coin. If the coin lands on heads, you
win $5, but if the coin lands on tails, you win nothing. Let X represent the amount of money you
receive from the game. Find V (X).
}
Theorem 8.3 (Linearity of Variance under Independence). Let X and Y be random variables where
X ? Y. Then,
V (X + Y ) = V (X) + V (Y ).
This generalizes to show that if X1, X2, . . . , Xn are independent, then,
V (X1 + X2 + · · · + Xn) = V (X1) + V (X2) + · · · + V (Xn).
Proof. First statement only
3
E
X
EX 4
4
9
6
u
u
u
Let
2
11s
Then
5
2
2
Bernoulli
vz
V
2
1 12
V4
V X
V 5 2
52 V12
2540
EE
w
w
XH
E
IT
E
Y
E R 2XY Y
EX
ELDT
EEt2E XDt
EM ZEE ELD
IELX
ELXJTHELYY
EOTTTZEEXD 2 EC ECD
V4
UH
ZEE ZELDELD
V 4
V17
iFX Y
E XD ELDELY

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 8.5. Suppose that X ⇠Binomial(n, p). Find E[X2].
}
Example 8.6. Suppose that X1, X2, . . . , Xn are independent and identically distributed (i.i.d) Xi ⇠
Exponential(λ). Find the variance of the sample mean,  ̄X = 1
n
Pn
i=1 Xi. Hint: You may use that fact
that the exponential distribution has variance
1
λ2 .
}
8.2
Covariance and Correlation [DS 4.6]
Suppose now that X and Y are two random variables that are not independent. Working with such
random variables will require us to introduce the notion of covariance.
Definition 8.3 (Covariance). The covariance of any two random variables X and Y , denoted by
Cov(X, Y ), is defined as
Cov(X, Y ) = E[(X −E[X])(Y −E[Y ]],
provided the expectation exists.
For two random variables, covariance is a numerical summary of their relationship—how do they vary
together?
• If the larger than average values of X tend to happen with larger than average values of Y , then
Cov(X, Y ) will be positive and we say X and Y are positively correlated.
4
EX
PLEX
X 4
ftp.T
hardtodo
X XtXet.itXn
where Xi
Bernoulli P
so V
Xi
e t
Xn
n
Xi
nPHP
but VIX EY EE
EX
lnpt np.lt
E x
np 1 p
npp
w
x̅
U t.LX.txut.tt
tFU X
Xat
Xn
tt
V x
VE
t.it Van
ftp.nVCX
ftp.na
ntp
This goes to
as
h
becomes large
I

<!-- page 5 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
• If the larger than average values of X tend to happen with smaller than average values of Y,
then Cov(X, Y), will be negative and we say X and Y are negatively correlated.
Example 8.7. Often times, people are interested in the relationship between two random variables.
• Verbal score and quant score of the GRE
• GRE score and the future academic GPA 
• Number of classes missed and score on a final exam
◇
Lemma 8.4 (Alternative definition of covariance). Alternatively, we can write
Cov(X, Y) = E[XY] − E[X]E[Y].
Proof. Use the definition of covariance.
Cov(x,y) = E[(x-E[)(y-E[])]
[[+人[对-[X-人X]3
=E[xy]-[]E[]-[][]+[x]曰[]
=E[Xy] -[]
□
Example 8.8. Suppose the joint pdf of (X, Y) is
 f (x, y) = 2xy + 1/2 for 0 ≤ x ≤ 1 and 0 ≤ y ≤ 1.
Show that Cov(X, Y) = 1/144.
fx)=52x+kdy=xy+21=x+2=Ex=x()x=x(x+b)x=
十
二
+
3
4
0
e
Sim:lar1ECy]=7/(2
E[xY)=S
xy(2xy+b)dxdy=
2x2y
2+
xy
dxdy
Ay
2
h
C
1
2y2
3
十
y
y
dy
9
g
3
十
1
8
J
2
二
2
9
+yq
2S
22
二
h1
50
5
Cov(x,y)=E[x√]-E[)E=
So
50
49
/144
二
199
hb1
h

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
}
Elementary properties of covariance
1. In contrast to variances which are non-negative, covariance can be negative.
2. Cov(X, X) = V (X);
3. If X ? Y , then Cov(X, Y ) = 0.
4. It is also possible for Cov(X, Y ) = 0 but X and Y are dependent.
Theorem 8.5 (Variance of a sum). Let X and Y be two random variables. Then,
V (X + Y ) = V (X) + V (Y ) + 2Cov(X, Y ).
Notice that this formula does not require any assumptions about the relationship between X and Y.
A key drawback of covariance is that it is not unit free. For example, the covariance between two
random distance variables will be di↵erent depending on whether you measure distance in feet vs.
inches. A solution is to rescale the covariance.
Definition 8.4 (Correlation). The correlation between two random variables X and Y is defined as
corr(X, Y ) =
cov(X, Y )
p
V (X)
p
V (Y )
,
Alternatively, we may write ⇢(X, Y ) = cov(X,Y )
σXσY
. Note that correlation will always be between −1 and
1.
8.3
Conditional Expectations [DS 4.7]
We are often interested in the expected value of a random variable conditioned on some event. For
example, if X is the price of a hotel room on the beach, and A is the event that the current month
is June, we might want to calculated E[X|A], or the expected value of the hotel room given that the
month is June.
Definition 8.5. Given two random variables X and Y ,
• If Y |X = x is discrete, E[Y |X = x] = P yfY |X(y|x)
• If Y |X = x is continuous, E[Y |X = x] =
R
yfY |X(y|x)dy
6
w
e
w
we
E
U
EG
EXAM
F
TIE
ELD SXfNdX

<!-- page 7 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 8.9. Suppose the random variable X has the following pmf:
(0.1, for x = 1
4-1
0.2, for x = 2
fx(x) =
0.3, for x = 3
0.2, for x = 4
Y=0
0.2, for x = 5
Now suppose that Y is a random variable that is equal to 1 if X ≤ 3 and 0 otherwise. What is E[X]?
What is E[X|Y = 1]?
[]=
x(x)=1.0.1+2.0.2·S.(02)
メ
E[X1y=1]=x·fxy(x1y=1)=
f(x14=1)
X
X
X
(=N)y
0.1
0.2
+3
0.3
+2
0.6
6.6
0.6
=1
一1
+2
216
316
二
14/6
9
Example 8.10. Suppose that two random variables X and Y have the following joint pdf:
f (x, y) = x + y for 0 ≤ x ≤ 1 and 0 ≤ y ≤ 1.
Compute E[Y|X = 1].
f(xi5)
x+5
fx(x)=∫x+ydy=xy+
9
=x+12
f{1x(s1x)=
fx(x)
二
x+2
0
2
6
=7fx(51x=k)=
12+5
=y+z
12+2
Gp(x+G)G=(x=x19×6=[3=x173E
y{
B
72
二
十
二
3
Y
0
◇
Consider that if we know the value of X = x, then E[Y|X = x] is just some constant value that we
can calculate. However, if we don't know the value ofX, then E[Y|X], is also a random variable, and
a function of X (it will change for different values of X). Since E[YX is itself a random variable, we
can find its expected value by integrating/summing over all possible values of X. This leads to the
law of iterated expectation.
Theorem 8.6 (Law of Iterated Expectation (LIE)).
E[E[Y|x] =[E[Y]!
7

<!-- page 8 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Proof. Continuous case.
x√x.[x173=[[x1从]3]3
-80
y fnx( ) (xk) ds dx
8
=yf(xs)dsax=ELD
Example 8.11. Suppose n patients are recruited for a clinical trial of a new medication. Let X be
the number of patients that had successful treatment. Also suppose that the probability of success p
follows a uniform distribution (i.e., p ∼ Uniform(0, 1)). What is E[X]?
[X|P] ~ Binonicl (n,p)
1 P~ Uniform(0.1)
E[x1p]=np
X
E[E[x10]=E[n0]=nE[ρ]=n·k2=[m2
◇
[]  ( 'x)f ∼ [x = X|] '( ') f ∼ X s  · xT)
E[E[Y\x]]=E[Y]
E[YIx]=
x+1
X
2
6
[]
=+2E=2+2
3/4
2
◇
8.4 Conditional Variance [DS 4.7]
Definition 8.6. For any given value of x, let V(Y|X = x), denote the variance of the conditional
distribution of Y given X = x. In other words,
·τ([x = X|λ]T) − [x = X|,λ]T = [x = X|7((x = X|X)T − λ)]T = (x = X|X)Λ
We call this the conditional variance of Y given X = x.
V(x)=E[(y-E()}]
8

<!-- page 9 -->
<!-- extracted via ocr confidence=0.84 flags=text-layer-corrupted -->
Example 8.13. Suppose the random variables X and Y have the following joint pdf:
f(x, y) = x + y for 0 ≤ x ≤ 1 and 0 ≤ y ≤ 1.
Find V(Y|X);
x+y
fy1x (s1x)=
x+1/2
2+1/3
ELYI]=∫y
x+5
dy
二
x+2
X+V2
E[X]=5.#
x+5
dy=
X/3 + V4
2+x
x+k2
/2+13
N3+W
V(Y|ω)=E[y1x)-(EL1x)=(
21+x
x+V2
◇
Theorem 8.7 (Law of total variance). Eve's law:
v() = (V(x) + ((IX).
9

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 8.14. Suppose that the number of customers that shop at a store on any given day is
denoted as N, where E[N] = 10 and V (N) = 10. Let Xi represent the amount of money that the ith
customer spends at the store. Also assume that the customers shop independently with E[Xi] = 5 and
V (Xi) = 2. Finally let Y = PN
i=1 Xi represent the stores total sales. Find E[Y ] and V (Y ).
}
8.5
Moment Generating Functions [DS 4.4]
Definition 8.7 (Moments). E[Xk] for k = 1, 2, ...
Definition 8.8 (Central moments). E[(X −E(X))k] for k = 2, 3, ...
• The mean or expectation of X is E[X] = E[Xk] with k = 1. In other words, the mean is the first
moment.
• The variance of X is V (X) = E[(X −E[X])2] = E[(X −E[X])k] with k = 2, so the variance is
the second central moment.
• We can also find the variance as V (X) = E[X2] −(E[X])2, using the first two moments.
We may want to summarize all the information about moments with one single function.
Definition 8.9. The moment generating function (mgf) of a random variable X is defined as
 X(t) = E(etX)
for any real number t.
10
v
w
w
w
ELYIN
EG
5N
V YIN
VIX
2 N
E VIAND
E 2N
2 ELN
2 10
21
FLYIN
V 5 N
25 V N
25 10
250
VY
E V YIN
V E YIN
20
250
w
u
w

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
We see immediately that X(0) = 1 for all random variable X.
As the moment generating function is the expectation of a function of X, it is possible that the mgf
does not exist for certain random variables. It turns out the moment generating function is a defining
feature of random variables, provided its existence. In other words, if two random variables have the
same moment generating function, then they both follow the same distribution.
Example 8.15. Suppose X ⇠Bernoulli(p). Find the mgf of X.
}
Example 8.16. Suppose X ⇠Exponential(λ). Find the mgf of X.
}
Theorem 8.8. If (t) < 1 for all values of t in some open interval around t = 0, then
E[Xk] < 1,
and, for k = 1, 2, ...,
E[Xk] = (k)(0).
In other words, E[Xk] is equal to the kth derivative of (t) evaluated at the point t = 0.
11
u
Yx t
E et
fix
et
1 p
etp
tp
pet
414
E et P e yé dx
e
ax
e't
7 0
as long as 17

<!-- page 12 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 8.17. Suppose X ∼ Bernoulli(p). Find E[X] and E[X2].
t=0
t
d
4
x lt) =
d
(1-p)+ pe
t
=pe
t
∂d =(x73
d =
dt
r
tp
d
4
4x(t)
d
t
=pe
t
ELx2]=pet
t
t=0
=ρ
pe
dte
dt
◇
Example 8.18. Suppose X ∼ Exponential(λ). Find E[X] and E[X2].
d
(4)
d
A
A
习=
1
t=0
1
二
dt
dt
A-t
(7-t)2
(A-t)
二
a
d2
4
d
a
2A(a-t)
(a-t)y
E[x]=
27(a-t)
(2-l)
t=c
22
ay
A2
2
dt2
x
dt
(7t){2
◇
8.6 Properties of moment generating functions
Theorem 8.9 (Linear Transformation). Let X be a random variable with mgf ψx(t) and Y = aX + b
for constants a and b. Then,
L
ψr(t)
 ebtaψx(at),
for all values of t such that ψx(at) is inite.
Example 8.19. Suppose X ∼ Exponential(1) and Y = 3 – 2X. Find the mgf of Y.
4x(t) =
9=-2
6=3
1-t
= (7) 'h
6t
(at)
e
X
3t
2
e
7て+1
◇
12

<!-- page 13 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Theorem 8.10 (MGF of Independent Sums). Let X1,. .. , X be independent random variables, each
with mgf ψxi(t), for i = 1, . . . , n. Also let Y = X1 + · . · + Xn. Then,
n
ψr(t) = ∏ψxi(t).
i=1
Example 8.20. Suppose X ∼ Binomial(n, p). Find the mgf of X.
X=X,+X2+-+ xs
where X; ind Bemaull! (p)
4y(4 =#x()
i=1
=#[(1-p)+pe]
n
=(1-p+pe))
13
