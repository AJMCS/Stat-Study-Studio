---
source: prerequisites-stat131/notes-00-calculus-review.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 7
kind: prerequisite
confidence: 0.92
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 0
Winter 2024
0
Calculus Review
0.1
Review of Simple Series
Example 0.1. Evaluate S = 1 + x + x2 + x3 + · · · + xn
}
Example 0.2. Evaluate S = 1 + x + x2 + x3 + · · · , where |x| < 1
}
Example 0.3. Evaluate S = 1 + 2x + 3x2 + 4x3 + · · · + nxn−1
1
 
I X S
S
XS
I
A
A t
x
A A
x
htt
I x't
S
assuming
x
1
if 4 1
5
4 H
S dig It x tx tx't
t y
II
s day
Hx
Rtx
t
X
II
cnet.IE
t
tt
Y

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
}
Example 0.4. Evaluate S = 1 + 2x + 3x2 + 4x3 + · · · , where |x| < 1
}
0.2
Integration
Definition 0.1. Integration by parts can be useful when we are integrating the product of two
functions
Z b
a
udv = (uv)
"""
b
a −
Z b
a
vdu
Example 0.5 (Integration by Parts). Find:
R 1
0 ye−ydy
}
Definition 0.2 (Double Integrals). Sometimes we may work with a double integral, where we are
integrating with respect to two di↵erent variables. One approach is to just view this as a sequence of
two integrations. We first integrate with respect to one variable, and then integrate again with respect
to the other variable.
2
5 4
Itxtxtx't
Ix
p
Let
u g
and
du e'dy
du dy
e's
Fgésdg
yet
I f et dy
o
o
est
co o
o 1 D

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 0.6 (Double Integral). Find:
R 1
0
R y
0 e−ydxdy
}
Definition 0.3 (Order of Integration). When working with double integrals, we can also change the
order of integration. If we do so, we need to first understand the space that we are integrating over.
Example 0.7 (Changing the Order). Find:
R 1
0
R y
0 e−ydxdy
}
3
I
IIF
dy p
xe II
as
f
y e dy
I
lÉÉ
I f é dxdy IfI
e dydx
f e I
ax
It lo
te
ax
Eli
D

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 0.8. Find:
R e
1
R ln(x)
0
1dydx
}
Theorem 0.1 (Fundamental Theorem of Calculus). Let f(t) be a continuous function defined on the
interval [a, b]. Then for any x, where a < x < b,
d
dx
Z x
a
f(t)dt = f(x).
4
I S
Idgdx fie en dy
n en't
ar ax
due dx
V X
end x El TIX
dx
e o
e it
1
is
Éii
I'fields f
x Ties ay file
e dy
les es É
e e
o 11 1
D
X
is the
area under the curve
É
I
I float
from
ten to FX

<!-- page 5 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
We will use the fundamental theorem of calculus later in the course. We will not prove it, but instead
focus on intuition here:
Box (x) =f
f(t)dt
Box(x+A)-Bos(x)
d
X
dx
Box (x)
lin
7p(7))
二
∆0
G
xtA
lin
S
一Hp(7)t
X
f (t)dt
Δ0
9
∆
二
lin
f(t)dt
N lin
f()·
=x(x)
∆>0
~Δ30
Theorem 0.2 (Extension of the FTC). For any differentiable function g(x),
d
fg(x)
dx Ja
f(t)dt = f(g(x))) · g′(x).
0.3 Review of Taylor Series and Limits
Definition 0.4 (Euler's number). Euler's number or e is defined as a limit:
1
n
lim
1+
= e.
n→∞
n
This comes up in many places and is a good thing to remember.
5

<!-- page 6 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 0.9. If x is a constant, find
lim
1+
n
∞←u
n
51×
Let a=
than ss n→n0
we slso have q0
X
So lin
X
n
二
lim
1
ax
= lin
9
X
n→900
n
二
e
9900
930
◇
Definition 0.5 (Taylor Series). For a function f(x) that is infinitely differentiable at 0, the Taylor
series expansion around 0 is
f′(0)
f′′(0)
f′"(0)
p(x) = f(0) +
-x +
×
1!
2!
22
3!
23
Under the right conditions, p(x) is a good approximation for f(x) and and p(x) will approach f(x) as
we use more and more terms. If we express p(x) with an infinite number of terms, then p(x) = f(x).
6

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 0.10. Find an infinite expansion representation of the function f(x) = ex.
}
Example 0.11. Find an infinite expansion representation of the function f(x) = e−x.
}
7
fly ex
f ly ex
f
x ex
o
efflo fief FYI
f
t
I
t
I
t
fly ie
f ly
e
f ly é
ex fool t flog
f
f
t
I
I
E
t
I
Y E E
YI
a
