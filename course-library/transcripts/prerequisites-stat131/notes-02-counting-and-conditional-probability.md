---
source: prerequisites-stat131/notes-02-counting-and-conditional-probability.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 13
kind: prerequisite
confidence: 0.92
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 2
Winter 2024
2.1
Counting methods [DS 1.7, 1.8]
Motivated by equally likely outcome spaces, we will now discuss commonly used methods of counting
in this subsection. These are tools that can be used to compute probabilities of events. Most classical
probability calculations can be done using these methods.
Theorem 2.1 (The multiplication rule). Consider an experiment with multiple stages (k total stages);
in stage i, there are ni options. Then, in total, the number of options for the experiment is
Example 2.1. What is the total number of outcomes?
• rolling two dice
• toss one coin and roll one die
• Phone numbers
}
2.1.1
Sampling with and without replacement
Definition 2.1 (Sampling with replacement). Select k items from a total of n items with replacement.
Example 2.2. Suppose a box contains n numbered balls; for each selection, record the number and
put the selected ball back to the box. If you repeat this two times, you can get the same number
twice.
}
Example 2.3 (roll two fair dice). The experiment that two fair dice are rolled can be thought of as
the same die being independently rolled twice.
}
Definition 2.2 (Sampling without replacement). Select k items from a total of n items without
replacement.
1
 
i.IN
K 2
n
6
no 6
II
hi
6 6
36
K 2
4
2
42 6 1 4
2 6 12
K
I n 10 Hi
HI hi
10

<!-- page 2 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 2.4 (Texas Holdem). 3 common cards are dealt sequentially from a deck of cards. 2 cards
are dealt to each player from the same deck.
◇
Example 2.5 (Blackjack). 2 cards are dealt to each player from the same pile of cards.
◇
Example 2.6 (Lotto numbers). Lotto numbers are drawn sequentially.
2.1.2 Permutation, Combinations, and Partitions
We will learn three tools for counting. This is called Combinatorics, and is a branch of mathematics
that we utilize.
1. Permutations
2. Combinations
3. Partitions
First, we define a core counting operation called the factorial.
Definition 2.3 (Factorial). Factorial: , n!, is defined as
μ n! = n × (n − 1) × ... × 2 × 1.
Also, by definition, 0! = 1.
A factorial is useful for counting permutations.
Definition 2.4 (All permutations). The number of distinct orderings of n, elements is n!.
Now, suppose you are at Baskin Robins building an ice cream cone. The shop has n flavors of ice
cream, but you only want k < n scoops. How many different cones are possible if each flavor can only
be used once, and the order of the flavors matters?
Thare are n choices far the foutom flaver, (n-1) fr tle hext flawd Srd so oy...
with n-lk-il for the flna) kt5 Alaves
n!
n(n-1)(n-2) ...2x1
n·(n-1)·(n-2)...(n-(K-1)=
1
i(-4)
(n-k)!
Each ordering here is called a permutation.
Next, we define the permutation number Pn,k., This represents the number of ways to order k elements
chosen from n elements; also called k-permutation.
2

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
Definition 2.5 (Permutation number). The Permutation number Pn,k is the number of distinct
orderings such that k elements are selected from n items in order, without replacement.
Pn,k = n!/(n −k)!
Note: Order matters!
Note, the number of ways to choose n out of n elements is Pn,n simplifies to n factorial (n!). In this
case, no choosing occurs; we only need to count the ways to order.
Example 2.7 (Choosing officers). Suppose a club has 25 members, a president and a secretary are
to be chosen from the membership. How many distinct configurations can we have?
}
Example 2.8 (Bookshelf). Suppose you have 10 books on your bookshelf, how many ways are there
to arrange all of the books?
}
3
w
w
25,021nsEE
President 24 options for secreters
pres cannotbesecretary
Rsm
25.24
4 10
K
10
Pioto

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 2.9 (Birthday problem). What is the probability that at least two of the students in
STAT131 have the same birthday? We can assume that there are 365 days in a year, and being born
on any given day is equally likely.
Hint: E = {at least two of the students have the same birthday} and we are interested in P(E).
}
Approximate factorials Most computers cannot handle n! and arithmetic operations when n is big.
The trick is to complete the arithmetic operations in log-scale and exponentiate the results in the end.
To compute
Pn,k
nk , we compute log(Pn,k) −klog(n) where log(Pn,k) = log(n!) −log((n −k)!) =
Pn
i=n−k+1 log(i). Identity: Pn,k
nk = elog(Pn,k)−klog(n) where log(·) is the natural log.
Consider the Baskin Robins ice cream problem again. How many scoops are possible if the order of
the flavors in the cone does not matter?
In this case, each choice of k flavors is called a combination.
4
E
nostudents share a birthday
and PIECE
suppose 100students
PLEY If
but 1st
365
P
PCE
3 10
P E
1 PCE 0.9999997
we
P E
P3
1913651
1091265
1001051365
The number of permutations overcounts
8
If
we chose K flavors there
are
k
ways to order them
and they are
all
equivalent
Thus
we must divide the
number
of permutations 6s K
1
K
III

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
Definition 2.6 (Combination number). Suppose a set has n elements and we select k elements without
replacement. Each subset of size k is a combination of n elements taken k at a time. The number of
distinct combinations:
Cn,k = Pn,k
k!
=
n!
(n −k)!k!.
Also known as binomial coefficients
"n
k
#
. Note: Order doesn’t matter!
Example 2.10. Evaluate S1 =
"n
0
#
+
"n
1
#
+
"n
2
#
+ · · · +
"n
n
#
.
}
Example 2.11. Evaluate S2 =
"n
0
#
yn +
"n
1
#
xyn−1 +
"n
2
#
x2yn−2 + · · · +
"n
n
#
xn.
}
Theorem 2.2 (Binomial theorem).
(x + y)n =
n
X
i=0
✓n
k
◆
xkyn−k.
Example 2.12. Complete square: (x + y)2 =? and (x + y)3 =?.
}
5
wow
u
Imagine you have h elements
S
is the total numberofpossiblesubsets
All subsets of size
0
t all subsets of size I
But the total number of possible subsets is
2
s
2h
consider the expansion
Xty
The term
appears exactly
times
So
y
IF
3 5
7 xy
2 x̅
ftzxy.tk
I
3 5
4
y
3 is
3
y
3 5
3 29

<!-- page 6 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 2.13. Evaluate S3 = (0) + (D)x + (2)x2 + · . . + (n) x .
l=G yt!m s s 2uos ats) ;n1
S0S3=(x+11}
◇
Lemma 2.3. A few frequently used properties of binomial coefficients:
(n)
=
= 1,
(nk)
=
n
(k)
+
• Vandermonde's identity:
(m + n)
k
m
n
k
j=0
To understand Vandermonde's identity, suppose you are trying to pick k leaders from a group of m,
women and ,n men. We know that there are m + n ,members of the group, thus there are
(m+n)
ways to pick the k leaders. This is the left-side of Vandermonde's identity. However we can also view
the problem in a different way. We first pick j leaders from from the set of m women (0 ≤ j ≤ k)
and then we pick k − j ,leaders from the set of n men. This can be done for any of the possible val-
ues of j, so we must sum over the possible values of j. This is the right-side of Vandermonde's identity.
Example 2.14 (Poker). A 5-card hand is dealt from a standard, well-shuffled 52-card deck. The hand
is called a full house in poker if it consists of three cards of some rank and two cards of another rank.
e.g. three K's + two 7's, where ordering does not matter. What is the probability of a full house?
=(sy rd)d
Ifull house|
152) = (s)
52
1521
13(3)·12·(2)
|full houe| =13-
h
12
(2) 
wasto so P(full huse)
S21
3
Efrst
P
cheoce
S
wass
rec ord
2cut
rank
≈0.00141
30AC
◇
Example 2.15 (Fair coin tossed). A fair coin is to be tossed 10 times. Determine the probability
that exactly 3 heads will occur? Also determine the probability that three or fewer heads will occur?
P(3heads) = | 3hecds|
(5)
210
101
6
P(3or Pewer hecds) = P(Oheads) + P(1 head) + P( 2heads) + P(3 hads)

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
}
Example 2.16 (Sampling without replacement). Suppose an urn contains 15 yellow and 30 blue balls,
from which 10 balls will be selected at random. What is the probability that exactly three yellow balls
will be selected?
}
Next, suppose we want to partition a set of n elements into k subsets so that the ith subset contains
ni elements, and P
i ni = n. How many ways can this be done?
Definition 2.7 (Partitions). The number of ways to partition n elements into r groups of size
n1, · · · , nr is
✓
n
n1, · · · , nk
◆
=
This is the multinomial coefficient.
Can you see how the combinations are a specific case of partitions, so that the binomial coefficient is
a specific case of the multinomial coefficient?
Example 2.17. How many di↵erent words (even meaningless) can be obtained by rearranging the
word PEPPER?
}
Next, how many ways are there to put n identical balls into k numbered (distinguishable) bins? There
is an elegant solution to this, called the stars and bars argument.
7
1
1 411
1
2
P 3yellow
P 3gellowand
blue
13eygmdsdud­.fi
U
u
w
It
1
I
n.tk
ni
n 6nfrEEkE
n.inns
600

<!-- page 8 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 2.18 (Stars and bars argument). How to distribute n cookies to k kids?
• Each kid receives at least one cookie:
"n−1
k−1
#
• Some kids may get zero cookies:
"n+k−1
k−1
#
}
8
nt
ka
111,2
www
N
N
N
1,211
There
are
my
agaps
where
we
can place
K 1
bars
11
1,013
11
8
2
012
4
12K
416
There
are
nt
K
1
positions
of these
we
are
selecting
k l
of
the positions
to be
bars

<!-- page 9 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
2.2 Conditional Probability [DS 2.1]
Compare the following scenarios:
• COVID infection rate 
• COVID infection rate if the person is fully vaccinated. 
The two probabilities should be different. When more information is available, the probability calcu-
lation should reflect it.
Definition 2.8 (Conditional probability). The probability of event A given event B has occurred is
denoted as P(A|B), If P(B) > 0,
P(A∩B)
P(A|B), =
P(B)
We can interpret P(A)as the "prior" probability of A without any other information. In contrast, we
interpretP(A|B)as the posterior probability of A given B has occurred.
Example 2.19. Visualizing conditional probability:
=()d
S
P(A)
2
16
16
P))
ρ(ANS)
r
=(0|t)d
二
ρ(0)
1
P(A^B)
(216)=2/5
5
=(a|)d
P(B)
(S/16)
A
G
◇
Example 2.20 (Two Offspring ). The offspring of a cow is called a calf. A calf is equally likely to
be a heifer or a bull. Suppose that Cindy the Cow has two calves and we know that at least one is a
bull. What is the probability that both calves are bulls?
Pl60th 6u11| at least I is s 6u11)
BH
BB
= P( both 6ulls and at lest 1 6011)
1/4
3
3/4
(1  p ts )d
◇
9

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 2.21 (Two O↵spring part 2). Suppose that Cindy the Cow has two calves and we know
that the first born is a bull. What is the probability that both calves are bulls?
}
Lemma 2.4 (Multiplicative rule). Let A, B be two events. If P(B) > 0,
P(A \ B) = P(A|B)P(B).
Further, let Ai be a sequence of events such that P(\n−1
i=1 Ai) > 0. Then,
P(\n
i=1Ai) = P(A1)P(A2|A1)P(A3|A1 \ A2)...P(An| \n−1
i=1 Ai).
Proof. Proof by induction. First verify the case n = 2 holds. Then suppose the case n −1 holds, and
show the case n also holds.
10
P
both bulls I first is
a bull
www
w
w
Now
assume PCA Ai
Ann
PCA P AIA
PA Ac A
Then
PCAin
An
PCA
Ai PLIAI
P
CAIA.ly
tAE
PCAn ItifPCAnlEAi

<!-- page 11 -->
<!-- extracted via text-layer confidence=0.95 -->
Theorem 2.5 (Bayes rule). Let A, B be two events. If P(B) > 0,
P(A|B) = P(B|A)P(A)
P(B)
,
where the denominator P(B) = P(B|A)P(A) + P(B|Ac)P(Ac).
Proof. By definition of conditional probability and the multiplicative rule.
We will revisit this more in detail in the next section.
Theorem 2.6 (The law of total probability). Suppose events {Bj} form a partition of the sample
space ⌦and P(Bj) > 0 for all j = 1, ..., k. Then, for every event A ⇢⌦,
P(A) =
Xk
j=1 P(Bj)P(A|Bj).
Proof. By the definition of partition and the multiplicative rule.
The number of partitions k is allowed to be infinite.
There is a “conditional” version of the law of total probability:
P(A|C) =
Xk
j=1 P(Bj|C)P(A|Bj \ C).
11
PLANB
PII PPAf
PCAIB
PIBIALYI
w
u
Be
A
AIB
and
An B
are disjoint
Then PCA
PLAN ÉPAID PCB

<!-- page 12 -->
<!-- extracted via text-layer confidence=0.95 -->
If A ⇢B with P(B) > 0, P(A|B) =
.
If A and B are disjoint events with P(B) > 0, P(A|B) =
.
If P(A) > 0, P(A|A) =
Example 2.22 (Rare disease). Overall disease rate: P(D = 1) = 1%. The test’s accuracy is 95%:
P(T = 1|D = 1) = P(T = 0|D = 0) = 0.95.
• Suppose John Doe tests positive, what is the probability that he actually has the disease?
• Suppose John Doe tests negative, what is the probability that he does not have the disease?
• Suppose John Doe is tests negative, what is the probability that he have the disease?
}
12
ay
O
P AIB
PlAp
If ACB then PLANB
P A
If A and B are disjoint then PlanB
0
PLAIA
PATI
PHI 1
w
w
w
1
PID ITH
P
f
but PITA
PCA PH P D
PCEI D 0 PID D
0.95
0.01
o.us
0.99
so PCD IT 1
aa
I
gg
2
PCD01
P
and
P T
0
1
P T
3
P D
5
0
1
P D 015
0

<!-- page 13 -->
<!-- extracted via ocr confidence=0.91 -->
-T=1|O=1
0.9s
0=1
0.0S
0.01
T=0|D=1
0.99
#=110=0
0.0S
D=0
0.9s
0=0|ρ=1
