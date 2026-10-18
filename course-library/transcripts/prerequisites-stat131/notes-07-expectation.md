---
source: prerequisites-stat131/notes-07-expectation.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 7
kind: prerequisite
confidence: 0.94
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 7
Winter 2024
7.1
Expectation [DS 4.1-4.2]
The distribution of a random variable tells us everything we may want to know about the behaviour
of the random variable. However, we may want a more succinct summary of the random variable.
Similar to how you might compute an average of a list of numbers to summarize them, we will discuss
the average of a distribution, which is known as an expected value.
Example 7.1. Suppose you are an investor choosing between two startups to invest in. Startup A
has a 10% chance of earning you $10,000,000 and a 90% chance of losing you $1,000,000. Meanwhile,
Startup B has 50% chance of earning you $1,000,000 and a 50% chance of losing you $500,000. How
would you choose which startup to invest in?
}
Definition 7.1 (Expectation of a discrete random variable). The expectation of a discrete random
variable X, is the sum of the possible values of X, each weighted by its probability:
E[X] =
X
x
xP(X = x) =
X
x
xf(x)
as long as the sum is finite. The mean of the distribution is another term for E[X].
Example 7.2. Suppose X ⇠Bernoulli(p). What is E[X]?
}
1
 
Fxx
P Ex
Find PIXES
ECS
FxX
f
x
fxH
Startup A
10,000,000 0.1
1,000,000 X 0.9
109000
startup B
1009000 40.5
500,000 as
250,000
e
w
w
E X
X PX x
O
1 P
I P
I

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 7.3. Suppose a disk has probability of 1/3 of failing each year. Let X be the random
variable that represents the number of years until the disk fails, with pmf f(x) = 1
3
"
1 −1
3
#x−1. What
is the average number of years that it takes for the disk to fail?
}
Example 7.4. Suppose X ⇠Poisson(λ). What is E[X]?
}
In some cases, the expectation of a random variable may not exist (i.e., the sum may not converge).
Example 7.5. Suppose X is a random variable with pmf f(x) =
6
⇡2k2 for x = 1, 2, 3, . . .. Then E[X]
does not exist.
}
Definition 7.2 (Expectation of a continuous random variable). The expectation of a continuous
random variable X, is
E[X] =
Z 1
−1
x · f(x)dx
as long as the integral is finite.
2
ELD
x.PE
tÑ
1
2
3 35 4
Ep
D
ELD
RED
et
et
A
et
t.EE
tetet
D
IN
but fig
I
A
U

<!-- page 3 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
7
9
Example 7.6. Suppose X ∼ Uniform(a, b). What is E[X]?
E[x]=5xf1)dx=5
x2
dx
X
6-91
G
2(6-s)
9
62-a2
(b-a)(b+s)
6+9
2(6-s)
2(6-s)
Example 7.7. Suppose X ∼ Exponential(λ). What is E[X]?
u=Axdv=e
—axax
xxx=xx=[x3
B
x化-
du=Adxv=
-7x
0
e
Ax
二
VU
-vdy =-x
e
X
—Ax
(0-0)
e
二
◇
The expectation of the transformation of a random variable can be computed by the Law of the
Unconscious Statistician (LOTUS).
Theorem 7.1 (LOTUS). Suppose X is discrete. Then for any function h(·),
E[h(X)] = ∑ h(x) f(x),
x
if the sum is finite.
Suppose X is continuous. Then for any function h(·),
E[h(X)] =
*∞
h(x)f(x)dx,
-∞
if the integral is nite.
3

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 7.8 (Volume of a sphere). Consider a sphere, where the radius is a random variable R, with
f(r) = P(R = r) = 1
3 for r = 1, 2, 3.
What is the expected value of the volume of the sphere?
}
Example 7.9. Suppose X is a random variable with P(X = 0) = 0.2, P(X = 1) = 0.5, and P(X =
2) = 0.3. What is E[X]? What is E[2X2 + 3]?
}
Example 7.10. Suppose X ⇠Uniform(a, b). What is E[X2]?
}
4
w
w
w
E volume
E
ITR
P P RF
IT P P R D
IT
P R
2
IT33 PIR 3
ITP
IT
3
16IT
E X
P X x
0 10 2
1
0 5
2
0 3
1 I
E 2
3
2 2 3 PX x
2.0 3
0 2
2.53
05
2.2 3 0.3
6.4
E XD
F ANax
adx
3
62
9,6
42

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 7.11. Suppose the failure rate X for a server has pdf
f(x) = 3x2. for 0 < x < 1.
What is the expected value of Y = 1/X, the time until failure?
}
The LOTUS can also be extended to functions of two di↵erent random variables X and Y .
Theorem 7.2 (Bivariate LOTUS). Suppose X and Y are discrete. Then for any function h(·),
E[h(X, Y )] =
X
x
X
y
h(x, y)f(x, y),
if the sum is finite.
Suppose X and Y are continuous. Then for any function h(·),
E[h(X, Y )] =
Z 1
−1
Z 1
−1
h(x, y)f(x, y)dxdy,
if the integral is finite.
Example 7.12. Suppose a point (X, Y ) follows the uniform distribution on the square [0, 1]2. Notice
that X and Y make up two sides of a rectangle, and their product XY is the area of the rectangle.
Find E[XY ], the expected area of the rectangle.
5
Fx X
3Ed
X
E Y
EC
1
fiddx
3 4
3 dx
RI
3 2
Hardware Pkg
P key
P x ty
1 PIE's
1 El's
1 HEED
fyly
1 53 354
for 971
E
yf.ly dy fy35tdy
w
w
w
w
KIF
fly g
for
o
x
and 0
52
4111 0
E XY
fhlxisl.flx.gdxdy ffxdy f.li
l'day f'Idy­
E1

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
}
7.1.1
Properties of Expectation
Theorem 7.3 (Linearity). Expectation of a linear function of a single random varaible X:
E[aX + b] = aE[X] + b.
Expectation of a linear function of many random variables X1, X2, . . . , Xn:
E
hXn
i=1 aiXi + bi
i
=
Xn
i=1 aiE[Xi] + bi
Example 7.13. Let X ⇠Binomial(n, p). What is E[X]?
}
Example 7.14. At a party, n people put their drink on a table.
Later in the evening, nobody
remembers which cup is theirs, so they just each grab a cup at random. Let X denote the number of
people who pick back up their own cup. What is E[X]? Do you think E[X] will be larger when n is
big or small?
}
Theorem 7.4. Let X1, ...Xn be independent random variables. Then
E[
Yn
i=1 Xi] =
Yn
i=1 E[Xi].
6
I
u
u
own
of successes in
n trials
X
txet.it X
where XinBernoullip
E X
E X
tE
E
E Xn
p
P
i
xp
u
u
2
at
tan
where 2i
ftp.nsonsetstheircun
EX
EG
E
2
t.it
ER
an E 2
but EE
1
0 ch
h.ty D
Doesn'tdepend on
n
W
w

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
A special case of this tells us that for random variables X and Y , where X ? Y ,
E[XY ] = E[X] · E[Y ].
Example 7.15 (Question?). If E[XY ] = E[X] · E[Y ] does that mean that X ? Y ?
}
7
U
u
w
www
Consider Tfollowing example
P X 1
P x 0
P X
1
and
let Y
X
Then
P Y 1
and P 4
0
Notice that P X
1
s
PX
PC
1
So
X and Y
are winded
but E XD
E XX
E x
0
and
E X
0
EX
ELD
O
So
E XY
ELD ELD
