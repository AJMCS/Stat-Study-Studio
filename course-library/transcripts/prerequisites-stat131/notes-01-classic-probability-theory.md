---
source: prerequisites-stat131/notes-01-classic-probability-theory.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 10
kind: prerequisite
confidence: 0.93
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 1
Winter 2024
1
Classical Probability Theory
1.1
Sample spaces and events
Definition 1.1 (Experiment). An experiment is any process where the possible outcomes can be
identified ahead of time.
Definition 1.2 (Sample space). The sample space ⌦is the set of all possible outcomes of an experi-
ment.
Example 1.1 (Coin tossing). What is the sample space of tossing a coin twice?
}
Example 1.2 (Coin tossing). What is the sample space of tossing a coin three times?
}
Example 1.3 (Letter grades). What is the sample space of a student’s letter grade in a class?
}
Example 1.4 (Human height). What is the sample space of a person’s height (in feet)?
}
Definition 1.3 (Events). An event is a set of possible outcomes of the experiment of the sample
space.
Example 1.5 (Letter grades). Events could be: (1) get an A in the class; (2) pass the course; (3) fail
the course; etc..
}
1
 
HH
HT
TH TT
HH
HHT HTH THH HTTITHT TTH TTT
A B C D F
0
x

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
1.2
Basic Set Theory
Definition 1.4. Set
Definition 1.5. Containment
Definition 1.6. Empty Set
Definition 1.7. Complement
Properties of complement
• (AC)C = A
• ;C = ⌦, ⌦C = ;
2
A set
is
a collection of different possible outcomes
A set
A
also
belongs
He
p
other set β
if everyelement of theset a
we Xpress this
using the notation A CB
or
B
A
The subset
of
S
that
contains noelements is
called
the emptier
or
at
It is denoted by
of
a set A is defined to be
the
set that containts
of
a
which donot
belongto A
this is denoted by A

<!-- page 3 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Example 1.6. Venn Diagram of Complement
◇
C
A
A
Definition 1.8. Union The union of n Sets Al /..., An is dofined
to be the set that contains all atcones that belong to st
lest I of the n sets..
we dendte th.s as A, UA2V...VAy cr
ν
A:
Properties of union
• A ∪B = B∪A,
A∪A=A,A∪AC =Ω,A∪∅=A,A∪Ω=Ω
β, if A ⊂ B.
A∪B =
Example 1.7. Venn Diagram of Union
Definition 1.9. Intersection The inter Section of n Sets A, ... As is dofined
to be te set that cantirs tb eements that are conna to
all n sefs.
we donote this as A^A2^^An or  Ai
n
i=
Properties of intersection
• A∩B = B∩ A,
A∩A= A, A∩Ac = , A∩∅= , A∩Ω= A
A ∩ B = A, if A ⊂ B.
3

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 1.8. Venn Diagram of Intersection
}
Definition 1.10 (Disjoint). Two sets are disjoint, if their intersection is empty.
Theorem 1.1. De Morgan’s law
Theorem 1.2. Associative properties
Theorem 1.3. Distributive properties
Definition 1.11 (Partition). The collection of sets {Ei}i=1 is a partition of A, if
A = [i=1Ei, and Ei \ Ej = ; for all i 6= j.
Example 1.9. The collection can be either finite or infinite. Also, partition is not unique.
• Define Ei = {i} for i = 1, 2, .... Then, {Ei}1
i=1 is a partition of strictly positive integers.
4
AUB
A
n B
And
A
B
AUBUC
AUB UC
A
BUC
An Bnc
AND NC
An
Bnc
An
Buc
And
v Anc
Au BMC
AUB
A
C
n

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
• Define E1 = {1, 2} and E2 = {3, 4, ...}. Then, B1 and B2 is also a partition of strictly positive
integers.
}
Lemma 1.4 (Partition identities).
A = (A \ B) [ (A \ BC)
A [ B = A [ (B \ AC)
Note: Partitioning components must be disjoint.
Example 1.10. Venn Diagram of a Partition
}
5
ÉI Ñ
If
f
A naints

<!-- page 6 -->
<!-- extracted via text-layer confidence=0.95 -->
1.3
Probability
What is probability and how might we interpret it? Two ways:
• long run relative frequency.
– Examples: Probability of rolling a 2 on a die, probability of winning a bet on red in Roulette
• subjective belief
Example 1.11. What is the chance of raining tomorrow? As we cannot repeat tomorrow, the long
run relative frequency interpretation is not convincing. In contrast, the subjective belief approach is
more sensible.
}
In either case, we may use the framework in this class without inconsistency. For example, the way
we’d calculate the chances of raining two days in a row would be the same, regardless of which
interpretation of probability we took.
Now, towards the rigorous formulation of probability, the mathematical theory of probability is based
on the following axioms.
Definition 1.12 (Axioms of probability). Any probability (measure) should satisfy the following
axioms.
• Axiom 1 (positivity): for every event A, P(A) ≥0.
• Axiom 2 (unity): P(⌦) = 1.
• Axiom 3 (countable additivity): For every infinite sequence of disjoint events A1, A2, ...,
P([1
i=1Ai) =
X1
i=1 P(Ai).
Definition 1.13. A probability measure, or simply a probability, on a sample space ⌦is a specification
of numbers P(A) for all events A that satisfy Axioms 1, 2, and 3.
By the definition, probability is a mapping from sets (events) to [0, 1]. Simply put, probability is a
set-valued function, mapping sets to real numbers.
Example 1.12 (Roll one die). Let’s say we roll one six-sided dice, and define the probability measure
to be P(A) =
No. of elements in event A
No. of elements in sample space. Is this a valid probability measure?
}
6
suppose A
2,413
A
1,23 Az
3,43 A
563
PLA
A
a As
PCA
0 foreveryA
PIA
tot
O
PCs
m
I
P a
P It

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
Now, let’s build some basic properties of probability measures.
Lemma 1.5 (Empty set). P(;) = 0.
Proof. By Axiom 1 and Axiom 3.
Lemma 1.6 (Finite additivity). For every finite sequence of disjoint events A1, A2, ..., An,
P([n
i=1Ai) =
Xn
i=1 P(Ai).
Proof. By Axiom 3 and P(;) = 0.
7
Pls
and
6
0
Let A
R
Az
A3 0
Then
Ai
s
PEEA
PIA
PCs
PCs
PCO
PCO t
O
PCO
PCO t
PIO
O
Let A
A
I Az Az
AnAn
and A
for
177
Then
Ai
Ai
and
PC
A
PCIAi
PIA
EPIA
PCA
PCA
O
PIA

<!-- page 8 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
The following properties can be shown via the Axioms.
Theorem 1.7. Complement: P(AC) = 1 − P(A).
Proof. AAc=Q Gnd A^Ac=β (disjoint)
()d+()d=(σ)°
⇒1=P(A) +P(AC) = P(Ac)=1-P(A)
Theorem 1.8. Inclusion: If A ⊂ B, then P(A) ≤ P(B).
Proof.
B=Aν(B^Ac)
BΛAc
V
So P(B)=P(A)+P(BAA9))
B
A
= P(B) PCA)
Since P[B^Ac)≥0
Theorem 1.9. Regularity: for every event A, P(A) ∈ [0, 1].
Proof: PCA) 20 (ayim 1)
Now ACΩ for ans A
So P(A)≤ P()= 1 (Thn. 1.8)
Lemma 1.10 (Decomposition identities). For every two events A and B,
• P(A∩BC) = P(A) −P(A∩B).
()d-()d()d = (∩)d·
8

<!-- page 9 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 1.13 (Diagnosing diseases). A patient arrives at a doctor’s office with a sore throat and
low-grade fever. After an exam, the doctor decides that the patient definitely has either a bacterial
infection (B) or a viral infection (V ) or both. The doctor determines that P(B) = 0.7 and P(V ) = 0.4.
What is the probability that the disease is due to both B and V ?
}
Lemma 1.11 (Union bound). For events A1, ..., An,
P([n
i=1Ai) 
Xn
i=1 P(Ai).
Example 1.14. Suppose you have four classes one day. The probability that you are late to any given
class is 0.05. Find an upper bound for the probability that you are late to at least one class.
}
Lemma 1.12 (Bonferroni inequality:). For all events A1, ..., An,
P(\n
i=1Ai) ≥1 −
Xn
i=1 P(AC
i )
Example 1.15. Suppose you are taking 3 exams this week. The probability that you pass any given
exam is 0.9. Find a lower bound for the probability that you pass all of your exams.
}
9
apur
we
want P Bar
PCBov
P B
PIV
P BAV
1
2
0.7
0.4
P BAV
P BnV
0.1
Ai
event that you are
late
to
class i
i
t
4
PCI Ai
P A
4 0.05
Ai
event
that yo pass exan
i
i 1,2
PIA
0.9
PCA
1 0.9
0.1
PC
Ai
1
PCA
1
3 0.1
0.7

<!-- page 10 -->
<!-- extracted via text-layer confidence=0.95 -->
1.4
Probability on finite sample spaces
In classical probability theory, sample spaces are often finite—in other words, the number of possible
outcomes is finite. For instance, rolling a die, drawing a card from a standard deck, etc..
A general probability theory can be established for the experiments where equally likely outcomes
exist.
Definition 1.14 (Equally likely outcomes). Suppose ⌦= {!i}N
i=1, P(!i) = 1
N for i = 1, .., N.
With equally likely outcomes, the probability calculation is simply counting.
Theorem 1.13. For the finite sample space ⌦with equally likely outcomes, the probability of event
E ⇢⌦is
P(E) = |E|
|⌦|,
where |E| denotes the number of outcomes in E.
Example 1.16 (Tossing coins). Suppose three fair coins are tossed simultaneously. What is the prob-
ability of obtaining exactly two heads?
}
Example 1.17 (Roll two fair dice). Two fair dice are rolled. What are the equally likely outcomes?
Which is more likely: sum is 11 or sum is 12?
}
10
E
HHT
HTH
THH
PIE
4
rel
Die
1
I
2
3
4
56
Event A
5,6
or
6,5
I
111 112
116
Event B
6,6
221
so PCA
P B
56
5
66.1
616
