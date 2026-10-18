---
source: prerequisites-stat131/notes-03-independent-events.pdf
method: automatic extraction (text layer, with OCR where the layer was missing or corrupted); not hand-verified
pages: 7
kind: prerequisite
confidence: 0.94
---

<!-- page 1 -->
<!-- extracted via text-layer confidence=0.95 -->
STAT 131: Lecture Notes 3
Winter 2024
3.1
Independent events [DS 2.2]
Definition 3.1 (Two independent events). Two events A and B are independent if
P(A \ B) = P(A)P(B).
Write A ? B.
Example 3.1 (coin flipping). Flip two di↵erent fair coins.
Assume H and T are equally likely.
A = {first coin = T}, B = {second coin = T}. Then A ? B.
}
Definition 3.2 (Alternative definition of independence). Assume that P(B) 6= 0. Two events A and
B are independent if
P(A|B) = P(A).
Lemma 3.1. Both definitions of independence are equivalent.
Proof. Using both definitions.
1
 
u
u
u
13.1
3 2
pH
PCAp
PALFF PH
3.2
3 1 PLAY P B PIA B
PIBSPIAL

<!-- page 2 -->
<!-- extracted via text-layer confidence=0.95 -->
The second definition is more intuitive. It tells us that under independence, the probability of A does
not change based on our knowledge of B. However, it required us to assume that P(B) 6= 0.
Example 3.2. Can two mutually exclusive (non-null) events be independent?
}
Example 3.3. Suppose you roll a die two times. Which of the following pairs of events are indepen-
dent?
• E1 = “First roll is a 6” and E2 = “Second roll is a 6”
• E1 = “Sum of the rolls is 7” and E2 = “Second roll is a 4”
}
For multiple events, the definition of independence is trickier.
Definition 3.3 (Mutual Independence). Events A1, . . . , An, are mutually independent if, for any
subset S of {1, ..., n},
P
 \
i2S
Ai
!
=
Y
i2S
P(Ai).
Pairwise independence is another form of independence that is weaker than mutual independence.
Definition 3.4 (Pairwise independence). Events A1, . . . , An are pairwise independent if every pair
of events is independent, i.e.,
8i 6= j,
P(Ai \ Aj) = P(Ai)P(Aj).
2
P A
70
and P B 70
P AIB Papff
0
PIA P B
1 P E
V6 P Ez V6 PIE P Ez
1 36 P E ME2
1 36
P E
P Ez
PCENED
E
Ez
2 P E
136 16 P E
1 6 PIE PEz136 PE nEz P 3,43
136
P E P Ez
PCE AEs
E
Ez

<!-- page 3 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 3.4 (Pairwise independent but not mutually independent). Suppose a fair coin is tossed
twice. Define the following three events:
A = {H on first toss},
B = {T on second toss},
C = {Both tosses are the same},
Are the events mutually independent? Pairwise independent? Prove this.
}
Properties and facts
If A and B are independent, then their complements are also independent.
Disjoint events are not independent.
⌦and ; are independent with any event.
Definition
3.5
(Conditional
independence).
Two
events
A
and
B
are
said
to
be
conditionally independent given event C, where P(C) > 0, if
P(A \ B|C) = P(A|C)P(B|C).
Example 3.5. Flip the same coin twice, Let C = {the coin is biased, such that P(T) = 1/3}; what
is the probability you will see two heads given that the coin is biased?
}
3.2
Random Variables [DS 3.1]
We have defined probability for events. In the framework of set theory, operations on sets are limited
and we are in need of a more flexible modeling strategy. In contrast to the set theory, the mathemat-
ical theory of functions is mature and provides a convenient way for characterizing uncertainty and
randomness.
3
PCA
V2
P B
PC
1 2
PLANB
P
HT
V4
PCAP B
P Anc
P
HH
V4
PCAPCC
Pa
P BAC
P
TT
14
PCBPCD
PCAnBnc
P 03
PCAPCBPCD
Not
s
W
L
u
P H C
73
PIT C
1 3
Let A
first coin is H
B
second coin is H
P AnB
C
PAIDPCBC

<!-- page 4 -->
<!-- extracted via text-layer confidence=0.95 -->
Definition 3.6 (Random variable). Let ⌦be a sample space. A random variable (r.v.) is defined as
a real-valued function from the sample space ⌦to real numbers R. Suppose the random variable X is
associated with the sample space ⌦,
X(!) : ⌦! R.
Example 3.6. Define random variables to represent the outcomes of the experiment.
• Toss a coin, ⌦= {H, T}, count the number of heads X(H) = 1, X(T) = 0.
• Toss a coin multiple times, count the number of heads ⌦= {HHH, . . . , TTT}, X(HHH) = 3,
X(THT) = 1.
}
Definition 3.7 (Distribution). Let X be a random variable. The distribution of X is the collection
of all probabilities of the form P(X 2 E) for all sets E ⇢R such that {X 2 E} is an event.
It helps to put this in words.
When a probability measure has been specified on the sample space of an experiment, we can determine
probabilities associated with the possible values of each random variable X.
Let A be a subset of the real line such that {X 2 A} is an event, and let P(X 2 A) denote the
probability that the value of X will belong to the subset A. Then P(X 2 A) is equal to the probability
that the outcome s of the experiment will be such that X(s) 2 A. In symbols,
P(X 2 A) = P({s : X(s) 2 A})
Lastly, the distribution of X is the collection of all probabilities of the form P(X 2 A) for all sets A of
real numbers such that {X 2 A} is an event.
Now equipped with the notion of a distribution, we can consider events in terms of values of the
random variables, e.g. E = {X : X ≥3}.
The theory of random variable is developed in two parts. The first part is devoted to the discrete
random variables, the second part is devoted to the continuous random variables.
4
U
u
w
w
w
u
u

<!-- page 5 -->
<!-- extracted via text-layer confidence=0.95 -->
3.3
Discrete random variables [DS 3.1]
3.3.1
Definition and Properties
Definition 3.8 (Discrete distribution). We say that a random variable X has a discrete distribution,
or that X is a discrete random variable if X can take only a finite number k of di↵erent values, or a
countably infinite sequence of di↵erent values.
Example 3.7. Discrete distributions are very common in our daily life.
• Toss a coin: heads or tails
• Traffic lights: green, yellow, red
• Number of hurricanes in a year
• Letter grades: {A+,A,A-,...,D,F}
}
Definition 3.9 (Continuous random variables). Random variables that can take every value in an
interval are said to have continuous distributions.
We will discuss continuous random variables later in the course, but one example is the height of a
person.
Recap: An experiment has random outcomes. Events are collections of outcomes. Random variables
encode the values associated with outcomes (maps it to the real line). Probability P(A) measures
the chances of a random variable X being in set A (e.g. A = {x : x ≥3} for rv X that counts the
number of heads in an experiment of three coin flips), and implicitly measures the chances of the event
(collection of outcomes in the sample space, e.g. {HHH}). X is a discrete random variable.
Definition 3.10. For a discrete random variable X, the probability function (pf) is
f(x) = P(X = x)
where P
x f(x) = 1. The pf is also called probability mass function (pmf).
How is pmf related to events’ probability? To compute the probability of event E,
P(E) =
X
x2E f(x).
3.3.2
Important Discrete Random Variables
5
we
w
u

<!-- page 6 -->
<!-- extracted via ocr confidence=0.85 flags=text-layer-corrupted -->
Definition 3.11 (Uniform distribution on integers). Let a ≤ b be integers. Suppose the value of a
random variable X is equally likely to be each of the integers a, . . . , b. Then we say that X has the
uniform distribution on the integers a, . . . , b. The pmf of X, is
f(x) = P(X = x) =
1
for x = a, . . . , b. 
f(x)=0 otlern'se
b − a + 1′
Consider an experiment involving a single coin flip, where the coin has probability p of showing heads
and 1 − pof tails. Let X be a random variable that is 1 if the coin shows heads and 0 if the coin shows
tails. We say that this type of random variable follows a Bernoulli distribution.
Definition 3.12 (Bernoulli distribution). A random variable X is said to come from a
P
f(x) = P(X = x) = px(1 − p)1−x,
for x = 0, 1.
We can also write X ∼ Bernoulli(p).
f(0)
Consider another experiment where we again have a coin with probability p of showing heads. Now
instead of a single flip, we independently flip the coin n times and let X be the number of heads that
occurs. We say that this type of random variable follows a Binomial distribution.
Definition 3.13 (Binomial distribution). A random variable X is said to come from a
Binomial distribution with probability p and number of trials n if the pmf has the form
f (x) = P(X = x) =
n
px (1 − p)n−x
 for x = 0, 1, . . . , n.
x
We can also write X ∼ Bin(n, p)
In order to recognize that a random variable has a Binomial distribution, we must check that
• The random variable corresponds to the sum of n independent Bernoulli trials,
n is fixed (not random)
• p is fixed and constant across trials
6

<!-- page 7 -->
<!-- extracted via text-layer confidence=0.95 -->
Example 3.8. Show that P
x f(x) = 1 for the Binomial distribution.
}
Here is another important discrete distribution.
Definition 3.14 (Poisson distribution). A random variable X has the Poisson distribution with mean
λ > 0 if the pmf of X is as follows:
f(x) = P(X = x) =
(
λxe−λ
x!
for x = 0, 1, · · · ,
0
otherwise.
Example 3.9. Show that P
x f(x) = 1 for the Poisson distribution.
}
This was just an introduction to some common discrete distributions. We will study these in more
detail later in the course.WE also k
7
AN
PX
x
4 8 IS
P
P
1
I
n
u
w
0
A
EAT
é
e
é
I
