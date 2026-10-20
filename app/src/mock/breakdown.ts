import type { Breakdown, BreakdownPart, BreakdownPartKey } from "../types";
import { HW2, lec, src } from "./cite";
import { TOPICS } from "./topics";

/**
 * "Break down a question": exam-style problems (from each topic's exam bank and the homework) taken apart into the
 * same five parts every time. The learner tries each part, then reveals the model answer; the full worked solution
 * comes at the end. Prompts and solutions are reused from the exam bank so there is one source of truth.
 */

const m = String.raw;

/** The method itself, taught once on every breakdown page: the same five questions transfer to any problem. */
export const METHOD: { key: BreakdownPartKey; title: string; short: string; ask: string }[] = [
  { key: "ask", title: "What is being asked?", short: "Asked", ask: "Name the target quantity, in notation. Is it a number, a distribution, a formula, or an explanation?" },
  { key: "given", title: "What is given?", short: "Given", ask: "List the data, the model for the data, any prior, and what is known or unknown." },
  { key: "tool", title: "Which tool, and why?", short: "Tool", ask: "Pick the model or result from lecture that fits, and say what in the question points to it." },
  { key: "plan", title: "The plan", short: "Plan", ask: "The steps in order, before you compute anything." },
  { key: "pitfalls", title: "Pitfalls to check", short: "Pitfalls", ask: "What could go wrong, and how will you check the answer makes sense?" },
];

const exam = (id: string) => {
  const q = TOPICS.flatMap((t) => t.examBank).find((x) => x.id === id);
  if (!q) throw new Error(`no exam question ${id}`);
  return q;
};

const text = (model: string): BreakdownPart => ({ model });
const pick = (options: string[], answer: number, model: string): BreakdownPart => ({ options, answer, model });

/** A breakdown of an exam-bank question: its prompt and reference solution are the exam bank's. */
const fromExam = (id: string, examId: string, title: string, parts: Breakdown["parts"], sources: Breakdown["sources"], prompt?: string): Breakdown => {
  const q = exam(examId);
  return { id, title, prompt: prompt ?? q.prompt, examId, solution: q.solution, parts, sources };
};

export const BREAKDOWNS: Record<string, Breakdown[]> = {
  /* ------------------------------------------------------------------ Lecture 1 */
  "probability-review-and-inference": [
    fromExam("pr-b1", "pr-e1", "Ten coin tosses", {
      ask: text(m`(a) A probability: $P(X=6)$ for $X\sim\text{Bin}(10,\ 0.5)$. (b) An explanation of why the second question is inference, plus a point estimate $\hat p$ of the unknown $p$ with a justification.`),
      given: text(m`(a) $n=10$ independent tosses and $p=0.5$ **known**. (b) $x=8$ heads observed in $10$ tosses, and $p$ **unknown**.`),
      tool: pick(
        ["(a) a binomial probability with $p = 0.5$; (b) estimate $p$ from the data", "Both parts: a binomial probability, with $p = 0.8$ in (b)", "Both parts: a hypothesis test of whether $p = 0.5$"],
        0,
        m`(a) is **probability**: the parameter is known and we compute the chance of data with the binomial pmf. (b) is **inference**: the data are observed and $p$ is unknown, so we give a single best guess of $p$. No prior is given, so this is not a Bayesian question.`,
      ),
      plan: text(m`1. Write $P(X=6)=\binom{10}{6}p^6(1-p)^4$ with $p=0.5$.
2. Evaluate it: $210/1024$.
3. For (b), say what is known (the data) and what is unknown ($p$).
4. Propose $\hat p=8/10$ and justify it: the sample proportion, and the $p$ that makes the observed data most probable.`),
      pitfalls: text(m`- Part (a) is about a **fair** coin and $6$ heads; don't bring in the $8$ heads from (b).
- Use $\binom{10}{6}=210$ and $2^{10}=1024$.
- In (b), justify the estimate rather than just stating it.`),
    }, [
      lec("b-pr-b1-0", 1, 4, "Probability vs. inferential statistics", "Starts with observed events (data) and makes inferences about the unknown parameters"),
      lec("b-pr-b1-1", 1, 6, "Estimation", "Provides a single best guess of a parameter."),
    ]),
    fromExam("pr-b2", "pr-e2", "Four quantities from a normal sample", {
      ask: text(m`For each of $\bar X$, $S^2$, $\bar X-\mu$ and $\max_i X_i$: a yes or no on "is it a statistic?", each with a one-line reason from the definition.`),
      given: text(m`$X_1,\dots,X_n$ i.i.d. $N(\mu,\sigma^2)$ with **both** $\mu$ and $\sigma^2$ unknown; four candidate quantities.`),
      tool: pick(
        ["Ask of each: can it be computed from the sample alone?", "Ask of each: is it random before the data are seen?", m`Ask of each: does its distribution involve $\mu$?`],
        0,
        m`A definition question. A statistic is a function of the data that does not depend on any unknown parameter, so the test for each quantity is: could you compute it with only the sample in hand?`,
      ),
      plan: text(m`1. State the definition.
2. For each quantity, list what it needs to be computed.
3. If it needs $\mu$ or $\sigma^2$, it is not a statistic.
4. Give the reason for each in one line.`),
      pitfalls: text(m`- $S^2$ uses $\bar X$, which is itself computed from the data, so $S^2$ is still a statistic.
- A statistic's **distribution** may depend on $\mu$, as ‹L07› shows; that doesn't stop it being a statistic.
- Don't confuse "unknown" with "random": $\bar X$ is random but computable.`),
    }, [
      lec("b-pr-b2-0", 1, 5, "Statistics", "a function of the data that does not depend on any unknown parameters"),
      lec("b-pr-b2-1", 1, 6, "Sample mean and variance"),
    ]),
  ],

  /* ------------------------------------------------------------------ Lecture 2 */
  "frequentist-vs-bayesian": [
    fromExam("fb-b1", "fb-e1", "Lamp lifetimes", {
      ask: text(m`(a) The prior's parameters $\alpha$ and $\beta$. (b) The prior density $\pi(\theta)$ written out, and what it represents.`),
      given: text(m`Lamp lifetimes are exponential with rate $\theta$. The prior is $\mathrm{Gamma}(\alpha,\beta)$ with mean $0.0002$ and **standard deviation** $0.0001$. No data yet.`),
      tool: pick(
        [m`Set $\alpha/\beta = 0.0002$ and $\alpha/\beta^2 = 0.0001^2$, then solve`, m`Read $\alpha = 0.0002$ and $\beta = 0.0001$ straight off`, m`Set $\alpha/\beta = 0.0002$ and $\alpha/\beta^2 = 0.0001$, then solve`],
        0,
        m`The prior is described by its mean and spread, so match moments: for $\mathrm{Gamma}(\alpha,\beta)$ the mean is $\alpha/\beta$ and the variance $\alpha/\beta^2$, from ‹L01 · P3›. Two equations, two unknowns.`,
      ),
      plan: text(m`1. Turn the standard deviation into a variance: $0.0001^2=10^{-8}$.
2. Set $\alpha/\beta=0.0002$ and $\alpha/\beta^2=10^{-8}$.
3. Divide the first by the second: $\beta=20000$; then $\alpha=4$.
4. Write $\pi(\theta)=\frac{\beta^\alpha}{\Gamma(\alpha)}\theta^{\alpha-1}e^{-\beta\theta}$ with those values, for $\theta>0$.
5. Say in words what the prior expresses.`),
      pitfalls: text(m`- Use the **variance** in $\alpha/\beta^2$, not the standard deviation.
- Use the rate form $e^{-\beta\theta}$, as in the notes.
- The exponential data model plays no part until data arrive.`),
    }, [
      lec("b-fb-b1-0", 2, 7, "Prior distributions", "In this case, we might construct a prior with a small standard deviation (low uncertainty)."),
      lec("b-fb-b1-1", 1, 3, "Important distributions"),
    ]),
    fromExam("fb-b2", "fb-e2", "Personality test scores", {
      ask: text(m`The likelihood $L(\mu)$; the value of $\mu$ where it is largest, with a reason; and how a frequentist and a Bayesian each use it.`),
      given: text(m`Scores are $N(\mu,10^2)$: $\sigma=10$ known, $\mu$ unknown. Three independent observations: $45$, $55$, $50$.`),
      tool: pick(
        [m`Multiply the three normal densities; read it as a function of $\mu$`, m`Write one $N(\mu, 100)$ density and plug in $\bar x = 50$`, m`Put a flat prior on $\mu$ and find its posterior`],
        0,
        m`A random sample from $f(x\mid\mu)$, so $L(\mu)=\prod_{i=1}^3 f(x_i\mid\mu)$. Independence is what turns the joint density into a product.`,
      ),
      plan: text(m`1. Write one normal density with $\sigma=10$.
2. Multiply the three, plugging in $45$, $55$ and $50$.
3. Collect the exponent into a sum of squares in $\mu$.
4. The sum of squares is smallest at the sample mean, so $L$ is largest at $\mu=50$.
5. Contrast: a frequentist maximizes $L$; a Bayesian multiplies it by a prior $\pi(\mu)$.`),
      pitfalls: text(m`- The variance is $10^2=100$, so the exponent has $2\sigma^2=200$.
- Keep $\mu$ as the variable and the data as numbers.
- Don't call $L$ a probability distribution for $\mu$.`),
    }, [
      lec("b-fb-b2-0", 2, 5, "The likelihood", "Both frequentists and Bayesian use what is called the likelihood when conducting statistical inference."),
      lec("b-fb-b2-1", 2, 6, "The likelihood", "It does not integrate to one. However, it does give us an idea of which parameter values may be more likely to generate data like the data we observed."),
    ]),
  ],

  /* ------------------------------------------------------------------ Lecture 3 */
  "posterior-distribution": [
    fromExam("po-b1", "po-e1", "Calorie labels", {
      ask: text(m`(a) The posterior distribution of $\mu$: its family and both parameters $\mu_1,\sigma_1^2$. (b) $\mu_1$ written as a weighted average. (c) What happens as $n\to\infty$.`),
      given: text(m`Data model $N(\mu,100)$ with the variance **known**; prior $\mu\sim N(0,60)$; $n=20$ and $\bar x=0.125$.`),
      tool: pick(
        [m`Normal prior, normal data: the posterior is $N(\mu_1, \sigma_1^2)$`, "With $n = 20$ the data win: the posterior centres on $0.125$", m`Average the prior mean and $\bar x$ with equal weights`],
        0,
        m`Normal data with known variance and a normal prior on the mean: the normal prior is conjugate, so the posterior is $N(\mu_1,\sigma_1^2)$ by Theorem ‹1.4›.`,
      ),
      plan: text(m`1. Label everything: $\sigma^2=100$, $\mu_0=0$, $\sigma_0^2=60$, $n=20$, $\bar x_n=0.125$.
2. Plug into $\mu_1$ and $\sigma_1^2$.
3. Rewrite $\mu_1=w\,\bar x_n+(1-w)\,\mu_0$ and read off $w=\frac{n\sigma_0^2}{\sigma^2+n\sigma_0^2}$.
4. Let $n\to\infty$: $w\to1$ and $\sigma_1^2\to0$.`),
      pitfalls: text(m`- Don't swap $\sigma^2$ (data variance, $100$) and $\sigma_0^2$ (prior variance, $60$).
- The formulas use variances, not standard deviations.
- Check that $\mu_1$ lies between $\mu_0$ and $\bar x$.`),
    }, [
      lec("b-po-b1-0", 3, 6, "Normal sampling", "that is the normal distribution with mean 0 and a variance of 60."),
      lec("b-po-b1-1", 3, 7, "Effect of the prior", "When the sample size is large, the posterior mean is pulled closer to the sample mean"),
    ]),
    fromExam("po-b2", "po-e2", "Defective items in a lot", {
      ask: text(m`(a) A derivation: show the posterior is $\mathrm{Beta}(1+\sum x_i,\ 1+n-\sum x_i)$, starting from "posterior is proportional to likelihood times prior". (b) Why the Beta prior is called conjugate.`),
      given: text(m`$X_1,\dots,X_n$ i.i.d. $\mathrm{Bernoulli}(p)$; a uniform prior on $p$ (which is $\mathrm{Beta}(1,\,1)$); $p\in[0,1]$.`),
      tool: pick(
        ["Multiply likelihood by prior, then recognize the family", m`Compute the marginal $m_n(x)$ by integrating first`, m`Find $\hat p = \bar x$ and centre a Beta distribution there`],
        0,
        m`Bayes' theorem in proportional form, then recognize the family, so no integral is needed. Part (b) is the definition of conjugacy.`,
      ),
      plan: text(m`1. Likelihood: $\prod p^{x_i}(1-p)^{1-x_i}=p^{\sum x_i}(1-p)^{n-\sum x_i}$.
2. Prior: $\pi(p)=1$ on $[0,1]$.
3. Multiply them.
4. Write the exponents as $(a-1)$ and $(b-1)$ and recognize a $\mathrm{Beta}(a,b)$ shape.
5. Prior and posterior are both Beta: conjugate.`),
      pitfalls: text(m`- Show the "$-1$" bookkeeping: $p^{\sum x_i}=p^{(1+\sum x_i)-1}$.
- Only constants can be dropped; never a factor containing $p$.
- State the support $[0,1]$.`),
    }, [
      lec("b-po-b2-0", 3, 3, "Bayesian inference", "The posterior distribution is then proportional to the likelihood times the prior distribution"),
      lec("b-po-b2-1", 3, 4, "Conjugate priors", "if the prior and posterior distribution belong to the same family"),
    ]),
  ],

  /* ------------------------------------------------------------------ Lecture 4 */
  "loss-functions-bayes-estimators": [
    fromExam("lf-b1", "lf-e2", "Fifty electronic components", {
      ask: text(m`(a) The posterior of $p$. (b) The Bayes estimate under squared error loss. (c) A comparison with the sample proportion, and what it says about the prior.`),
      given: text(m`Bernoulli data with $n=50$ and $\sum x_i=7$; prior $\mathrm{Beta}(2,\,2)$; squared error loss.`),
      tool: pick(
        ["Update to a Beta posterior, then report its mean", "Report the sample proportion; $50$ items swamp the prior", "Update to a Beta posterior, then report its median"],
        0,
        m`A conjugate Beta-Bernoulli update gives the posterior; under squared error loss the Bayes estimator is the posterior mean (Theorem ‹2.1›).`,
      ),
      plan: text(m`1. Update: $\mathrm{Beta}(2+7,\ 2+50-7)$.
2. Posterior mean $\alpha/(\alpha+\beta)$.
3. Sample proportion $7/50$.
4. Compare, and explain the pull toward the prior mean $1/2$.`),
      pitfalls: text(m`- The failures are $n-\sum x_i=43$, not $50$.
- The prior mean ($1/2$) and the MLE ($7/50$) are not the answer to (b).
- Say explicitly which loss leads to which estimator.`),
    }, [
      lec("b-lf-b1-0", 3, 4, "Bernoulli sampling", "form a random sample from the Bernoulli distribution with parameter"),
      lec("b-lf-b1-1", 4, 3, "Squared error loss", "Suppose that the squared error loss function is used and that the posterior mean of"),
    ]),
    fromExam("lf-b2", "lf-e3", "Homework times", {
      ask: text(m`(a) The prior's parameters. (b) The posterior of $\lambda$. (c) The Bayes estimate of $\lambda$ under squared error loss.`),
      given: text(m`Homework times are exponential with rate $\lambda$. Gamma prior with mean $0.2$ and variance $1$. $n=10$ students with mean time $3$ hours, so $\sum x_i=30$. Squared error loss.`),
      tool: pick(
        ["Multiply the exponential likelihood by the Gamma prior", m`Use the Gamma-Poisson rule: $\alpha + \sum x_i$ and $\beta + n$`, m`Report $1/\bar x = 1/3$; ten students outweigh the prior`],
        0,
        m`These are not Poisson counts, so don't reuse the Gamma-Poisson rule: multiply the exponential likelihood by the Gamma prior and recognize a Gamma. Then squared error loss means the posterior mean.`,
      ),
      plan: text(m`1. Solve $\alpha/\beta=0.2$ and $\alpha/\beta^2=1$.
2. Likelihood: $\lambda^n e^{-\lambda\sum x_i}=\lambda^{10}e^{-30\lambda}$.
3. Multiply by $\lambda^{\alpha-1}e^{-\beta\lambda}$ and read off $\mathrm{Gamma}(\alpha+10,\ \beta+30)$.
4. Posterior mean = shape / rate.`),
      pitfalls: text(m`- For exponential data the update is $\alpha+n$ and $\beta+\sum x_i$, the reverse of the Poisson rule.
- Turn the average ($3$ hours) into the total: $\sum x_i=30$.
- A rate near $1/3$ per hour matches a mean time near $3$ hours, so check the estimate is near that.`),
    }, [
      src("b-lf-b2-0", "Homework 2 · Bayes estimate for an exponential rate", HW2, 1, "Using a squared error loss function, what is the Bayes estimate of"),
      lec("b-lf-b2-1", 4, 3, "Squared error loss", "Suppose that the squared error loss function is used and that the posterior mean of"),
      lec("b-lf-b2-2", 3, 3, "Example", "corresponding to a specific family of distributions, then we know what our posterior distribution is"),
    ]),
  ],

  /* ------------------------------------------------------------------ Lecture 5 */
  "maximum-likelihood-estimation": [
    fromExam("ml-b1", "ml-e2", "Three waiting times", {
      ask: text(m`One number estimating $\theta$, a check on it, and its meaning in terms of $\bar x$.`),
      given: text(m`Exponential model with parameter $\theta$: $f(x\mid\theta)=\theta e^{-\theta x}$ for $x>0$. Data $3$, $1.5$, $2.1$, so $n=3$ and $\sum x_i=6.6$. No prior.`),
      tool: pick(
        ["Maximize the likelihood: log, differentiate, solve", m`Least squares: minimize $\sum(x_i - \theta)^2$ over $\theta$`, m`Find the sampling distribution of $\bar X$ first`],
        0,
        m`The task is to **estimate** $\theta$ from the data with no prior: the value of $\theta$ that makes the observed sample most probable, found by maximizing the likelihood.

- Least squares fits $\theta$ as if it were the **mean** of $X$, giving $2.2$. But $\theta$ is a **rate**: the mean is $1/\theta$, so this answers a different question.
- The sampling distribution of $\bar X$ describes how $\bar X$ would vary from sample to sample. It is useful later, in ‹L07›, but on its own it does not produce an estimate of $\theta$.`,
      ),
      plan: text(m`1. $L(\theta)=\theta^n e^{-\theta\sum x_i}$.
2. $\ell(\theta)=n\log\theta-\theta\sum x_i$.
3. $\ell'(\theta)=n/\theta-\sum x_i=0$.
4. $\hat\theta=n/\sum x_i=3/6.6$.
5. $\ell''(\theta)=-n/\theta^2<0$, so a maximum.
6. Note $\hat\theta=1/\bar x$.`),
      pitfalls: text(m`- The notes write the exponential with a rate, $\theta e^{-\theta x}$; with a mean parameter you'd get the reciprocal.
- Do the second-derivative check; don't stop at the candidate.
- Simplify: $3/6.6=5/11$.`),
    }, [
      lec("b-ml-b1-0", 5, 2, "Procedure", "the argument that maximizes the likelihood is the same as the argument that maximizes the log likelihood"),
      lec("b-ml-b1-1", 1, 3, "Important distributions"),
    ], m`Waiting times follow the exponential density $f(x\mid\theta)=\theta e^{-\theta x}$, $x>0$. You observe $3$, $1.5$ and $2.1$. Estimate $\theta$ from these three waiting times, check your estimate, and interpret it in terms of the sample mean.`),
    fromExam("ml-b2", "ml-e1", "A moving edge", {
      ask: text(m`(a) The likelihood, including the support constraint. (b) The value of $\theta$ that maximizes it. (c) What goes wrong with $\ell'(\theta)=0$.`),
      given: text(m`$f(x\mid\theta)=\frac{2}{\theta^2}x$ for $0\le x\le\theta$, and a random sample $X_1,\dots,X_n$. The support **depends on** $\theta$.`),
      tool: pick(
        [m`Look at the edge: $L$ is monotone wherever it is nonzero`, m`Set $\ell'(\theta) = 0$ and solve, as for any MLE`, m`Match the mean: $E[X] = 2\theta/3$, so $\theta = 3\bar x/2$`],
        0,
        m`The support $0\le x\le\theta$ depends on $\theta$: a sign the maximum may sit on the edge of the parameter space, as for $\mathrm{Uniform}[0,\theta]$. Setting $\ell'(\theta)=0$ finds nothing, since $\ell'(\theta)=-2n/\theta$ is never zero. Matching the mean gives $3\bar x/2$, a different estimator (method of moments), not the maximizer of the likelihood.`,
      ),
      plan: text(m`1. $L(\theta)=2^n\left(\prod x_i\right)\theta^{-2n}\,\mathbf{1}\{\theta\ge\max x_i\}$.
2. For allowed $\theta$, $\ell'(\theta)=-2n/\theta\ne0$.
3. So $L$ decreases for $\theta\ge\max x_i$ and is $0$ below.
4. Largest at the smallest allowed $\theta$: $\hat\theta=\max_i X_i$.`),
      pitfalls: text(m`- Forgetting the indicator makes the likelihood look like it grows without limit as $\theta\to0$.
- A derivative that is never zero is the signal to look at the edges.
- Check the answer is allowed: $\hat\theta$ can't be below any observation.`),
    }, [
      lec("b-ml-b2-0", 5, 4, "Edge cases", "a global maximum could lie on the edge of the parameter space"),
      lec("b-ml-b2-1", 2, 5, "The likelihood", "If the parameter space has a constraint, we can use indicator functions to signify this in the likelihood."),
    ], m`A random variable has density $f(x\mid\theta)=\tfrac{2}{\theta^2}x$ for $0\le x\le\theta$. For a sample $X_1,\dots,X_n$ with no prior information: (a) write the likelihood, (b) find the value of $\theta$ the data support best, and (c) explain what happens if you set the derivative of the log likelihood to zero.`),
    {
      id: "ml-b3",
      title: "Counting failures",
      prompt: m`(Adapted from ‹HW02›.) The number of failures $X$ in a quality-control test has pmf $f(x\mid\theta)=(1-\theta)^x\theta$ with $0<\theta<1$. From a random sample $X_1,\dots,X_n$, with no prior information, estimate $\theta$ as a formula in the data, and check that your formula gives the best-supported value.`,
      solution: m`$L(\theta)=\prod_{i=1}^n(1-\theta)^{x_i}\theta=\theta^n(1-\theta)^{\sum x_i}$, so $\ell(\theta)=n\log\theta+\sum x_i\log(1-\theta)$.

$\ell'(\theta)=\dfrac{n}{\theta}-\dfrac{\sum x_i}{1-\theta}=0$ gives $n(1-\theta)=\theta\sum x_i$, so
$$\hat\theta=\frac{n}{n+\sum x_i}=\frac{1}{1+\bar x}.$$

Check: $\ell''(\theta)=-\dfrac{n}{\theta^2}-\dfrac{\sum x_i}{(1-\theta)^2}<0$, so it is a maximum.`,
      parts: {
        ask: text(m`An estimate $\hat\theta$ written as a formula in $n$ and $\sum x_i$, plus a check that it is a maximum.`),
        given: text(m`The pmf $(1-\theta)^x\theta$ with $0<\theta<1$, and a random sample of size $n$. There are no numbers, so the answer is a formula in $n$ and $\sum x_i$.`),
        tool: pick(
          ["Maximize the likelihood: log, differentiate, solve, check", m`Use $1/\bar x$, as for exponential waiting times`, m`Update a uniform prior on $\theta$ with the failures`],
          0,
          m`No prior, and a smooth likelihood on the open interval $0<\theta<1$: maximize it the standard way. $1/\bar x$ is the answer for a different model (exponential); here the answer turns out to be $1/(1+\bar x)$.`,
        ),
        plan: text(m`1. $L(\theta)=\theta^n(1-\theta)^{\sum x_i}$.
2. $\ell(\theta)=n\log\theta+\sum x_i\log(1-\theta)$.
3. $\ell'(\theta)=n/\theta-\sum x_i/(1-\theta)=0$.
4. Solve: $\hat\theta=n/(n+\sum x_i)$.
5. Check $\ell''<0$.`),
        pitfalls: text(m`- Chain rule: $\frac{d}{d\theta}\log(1-\theta)=-\frac{1}{1-\theta}$.
- The product over $n$ observations gives $\theta^n$, not $\theta$.
- The sheet says "for $k=1,2,\dots$": read it as the values $x$ can take.`),
      },
      sources: [
        src("b-ml-b3-0", "Homework 2 · MLE problems", HW2, 1, "Suppose you observe the random sample"),
        lec("b-ml-b3-1", 5, 2, "Procedure", "to ensure that this is a maximum and not a minimum"),
      ],
    },
  ],

  /* ------------------------------------------------------------------ Lecture 6 */
  "maximum-likelihood-properties": [
    fromExam("mp-b1", "mp-e2", "Support-center wait times", {
      ask: text(m`The MLEs of three functions of $\lambda$: the mean, the variance and $P(X>2)$, and why no new maximization is needed.`),
      given: text(m`Exponential waiting times with rate $\lambda$, and the MLE $\hat\lambda=1/\bar x$ already known.`),
      tool: pick(
        [m`Plug $\hat\lambda = 1/\bar x$ into each quantity, as a function of $\lambda$`, m`Use the sample mean and sample variance $S^2$ directly`, "Average each quantity over the sampling distribution"],
        0,
        m`Each target is a function of $\lambda$ and $\hat\lambda$ is known: invariance (Theorem ‹1.1›).`,
      ),
      plan: text(m`1. Write each target as $g(\lambda)$: $1/\lambda$, $1/\lambda^2$, $e^{-2\lambda}$.
2. Plug in $\hat\lambda=1/\bar x$.
3. Simplify: $\bar x$, $\bar x^2$, $e^{-2/\bar x}$.
4. Name invariance as the reason.`),
      pitfalls: text(m`- You need $P(X>2)=e^{-2\lambda}$ from the exponential distribution first.
- Invariance gives the MLE; it does not make $g(\hat\lambda)$ unbiased.`),
    }, [
      lec("b-mp-b1-0", 6, 2, "Invariance", "This means that as long as we can compute an MLE for the parameter"),
      lec("b-mp-b1-1", 1, 3, "Important distributions"),
    ]),
    fromExam("mp-b2", "mp-e1", "The largest of the uniforms", {
      ask: text(m`(a) The density of $\hat\theta=\max_i X_i$. (b) $\mathbb{E}[\hat\theta]$ and the bias. (c) The limit of the bias. (d) An unbiased version, and the MLE of the median.`),
      given: text(m`$X_1,\dots,X_n$ i.i.d. $\mathrm{Uniform}(0,\theta)$; $\hat\theta=\max_i X_i$; each $X_i$ has CDF $x/\theta$ on $[0,\theta]$.`),
      tool: pick(
        [m`Find the CDF of the maximum, $(m/\theta)^n$, then $\mathbb{E}$ and bias`, "The MLE is consistent, so its bias is already zero", m`The CLT: treat the maximum as normal around $\theta$`],
        0,
        m`The maximum is at most $m$ exactly when every observation is at most $m$: that gives its CDF, then its density and mean. Bias $=\mathbb{E}[\hat\theta]-\theta$. The median is a function of $\theta$: invariance.`,
      ),
      plan: text(m`1. $P(\hat\theta\le m)=(m/\theta)^n$.
2. Differentiate: $f(m)=n\,m^{n-1}/\theta^n$.
3. $\mathbb{E}[\hat\theta]=\int_0^\theta m\,f(m)\,dm=\frac{n}{n+1}\theta$.
4. Bias $=-\theta/(n+1)\to0$.
5. Scale by $(n+1)/n$ to remove the bias.
6. Median $\theta/2$, so its MLE is $\max_i X_i/2$.`),
      pitfalls: text(m`- Independence is what lets you multiply the $n$ CDFs.
- The bias is negative: the maximum never exceeds $\theta$.
- The unbiased version is no longer the MLE.`),
    }, [
      lec("b-mp-b2-0", 6, 4, "Is the MLE unbiased?", "This means that the bias tends to zero as the sample size grows."),
      lec("b-mp-b2-1", 6, 3, "Is the MLE unbiased?", "of an estimator is the difference between its expected value (on average, what it estimates) and the true value of the parameter"),
    ]),
  ],

  /* ------------------------------------------------------------------ Lecture 7 */
  "sampling-distributions": [
    fromExam("sd-b1", "sd-e1", "Tree heights", {
      ask: text(m`(a) The sampling distribution of $\bar X$ and its standard error. (b) $P(\bar X<20)$. (c) $P(\bar X>21)$, and how it changes if $n$ is quadrupled.`),
      given: text(m`Population $N(20,25)$, so $\mu=20$, $\sigma^2=25$, $\sigma=5$; $n=40$ independent measurements.`),
      tool: pick(
        [m`$\bar X \sim  N(20, 25/40)$, then standardize with its SE`, m`Standardize with $\sigma = 5$, as for a single tree`, m`Put a flat prior on $\mu$ and use its posterior`],
        0,
        m`Normal data and a sample mean: $\bar X\sim N(\mu,\sigma^2/n)$ exactly, as ‹L07› shows in Example ‹1.2›, with standard error $\sigma/\sqrt n$.`,
      ),
      plan: text(m`1. $\bar X\sim N(20,\ 25/40)$; SE $=5/\sqrt{40}$.
2. (b) $20$ is the centre, so symmetry gives $0.5$.
3. (c) $z=(21-20)/\text{SE}$; read the normal table.
4. Quadruple $n$: the SE halves and $z$ doubles.`),
      pitfalls: text(m`- $N(20,25)$ gives the **variance** $25$, so $\sigma=5$.
- Standardize $\bar X$ with the SE $\sigma/\sqrt n$, not with $\sigma$.
- Don't divide by $n$ twice.`),
    }, [
      lec("b-sd-b1-0", 7, 3, "Some MLE sampling distributions", "as the sample size increases, the sampling variance of"),
      lec("b-sd-b1-1", 7, 2, "Properties", "The standard deviation of the sampling distribution is called the"),
    ]),
    fromExam("sd-b2", "sd-e2", "Relapse after treatment", {
      ask: text(m`(a) $\mathbb{E}[T]$, $\mathrm{Var}(T)$ and the standard error. (b) How shape and spread change with $n$ and with $p$. (c) The smallest $n$ with SE $\le0.05$ when $p=0.5$.`),
      given: text(m`$X_i$ i.i.d. $\mathrm{Bernoulli}(p)$; $T=\frac1n\sum X_i$; a target SE of $0.05$ when $p=0.5$.`),
      tool: pick(
        [m`$\mathrm{Var}(T) = p(1-p)/n$ by independence; read shape off the figure`, m`$\mathrm{Var}(T) = p(1-p)$, the variance of one Bernoulli`, "Use a uniform prior and the Beta posterior variance"],
        0,
        m`$T$ is a statistic: find its mean and variance from $\mathrm{Var}(X_i)=p(1-p)$ and independence, then read the shape off the figure on ‹L07 · P5›.`,
      ),
      plan: text(m`1. $\mathbb{E}[T]=p$.
2. $\mathrm{Var}(T)=\frac{1}{n^2}\cdot n\,p(1-p)$.
3. SE $=\sqrt{p(1-p)/n}$.
4. Describe: narrower and more normal as $n$ grows; skewed near $p=0$ or $1$.
5. Solve $\sqrt{0.25/n}\le0.05$.`),
      pitfalls: text(m`- $p(1-p)$ is one observation's variance; divide by $n$ for $T$.
- Square both sides carefully: $0.25/n\le0.0025$.
- Give a whole number of observations.`),
    }, [
      lec("b-sd-b2-0", 7, 2, "Definition", "is a statistic that can be used to estimate"),
      lec("b-sd-b2-1", 7, 5, "Visualizing a sampling distribution", "close to zero (or one) the sampling distribution is skewed and approaches normality more slowly"),
    ]),
  ],
};

export const breakdownsFor = (topicId: string): Breakdown[] => BREAKDOWNS[topicId] ?? [];

/* ------------------------------------------------------------------ "Which tool?": a mixed set */

/**
 * Three unlabeled problems where the tool is the whole question: maximum likelihood, a posterior and Bayes
 * estimator, or a sampling distribution. Shared by every topic's breakdown page (progress is kept under MIXED_ID).
 */
export const MIXED_ID = "which-tool";
const TOOLS = [
  "Maximize the likelihood of the observed data",
  "Find the posterior, then a Bayes estimate",
  m`Work out the sampling distribution of $\bar X$`,
];

export const MIXED: Breakdown[] = [
  {
    id: "wt-1",
    title: "Website clicks",
    prompt: m`A website's clicks per hour follow a Poisson distribution with unknown rate $\lambda$. Over four hours you count $3$, $5$, $4$ and $8$ clicks. A colleague's past experience with similar sites is summarized as a $\mathrm{Gamma}(\alpha=2,\ \beta=1)$ distribution for $\lambda$, with $\beta$ a rate as in the notes. Your manager wants one number for $\lambda$, with a penalty equal to the square of the miss. What number do you report?`,
    solution: m`The prior $\mathrm{Gamma}(\alpha=2,\ \beta=1)$ (rate $\beta$) and Poisson counts give the posterior $\mathrm{Gamma}(2+\sum x_i,\ 1+n)=\mathrm{Gamma}(2+20,\ 1+4)=\mathrm{Gamma}(22,\ 5)$.

Under squared error loss the Bayes estimate is the posterior mean:
$$\mathbb{E}(\lambda\mid\mathbf{x})=\frac{22}{5}=4.4.$$

(For comparison, the MLE would be $\bar x=20/4=5$, which ignores the colleague's prior.)`,
    parts: {
      ask: text(m`One number for the click rate $\lambda$.`),
      given: text(m`Poisson counts $3,5,4,8$ over four hours, so $n=4$ and $\sum x_i=20$; a $\mathrm{Gamma}(\alpha=2,\ \beta=1)$ distribution for $\lambda$ from a colleague, with $\beta$ a rate; a penalty equal to the square of the miss.`),
      tool: pick(TOOLS, 1, m`Notice what is given beyond the data: a distribution for $\lambda$ before any clicks were counted, and a cost for a miss. The Gamma distribution is a **prior** (belief before the data), and the cost of a miss is a **loss**. Prior plus loss is Bayesian: update to the posterior, then take the Bayes estimate, which under squared error loss is the posterior mean. Maximizing the likelihood would ignore the prior you were given; the sampling distribution of $\bar X$ describes variability, not a single number to report.`),
      plan: text(m`1. Recognize Gamma-Poisson conjugacy.
2. Update: $\mathrm{Gamma}(2+20,\ 1+4)=\mathrm{Gamma}(22,\ 5)$.
3. Squared error loss: report the posterior mean, shape / rate $=22/5=4.4$.`),
      pitfalls: text(m`- Reporting $\bar x=5$ (the MLE) throws away the prior you were given.
- $\beta$ gets $n=4$ observations, not the $20$ clicks.
- The estimate $4.4$ should lie between the prior mean $2$ and the sample mean $5$.`),
    },
    sources: [
      lec("b-wt-1-0", 3, 5, "Poisson sampling", "form a random sample from the Poisson distribution with parameter"),
      lec("b-wt-1-1", 4, 3, "Squared error loss", "Suppose that the squared error loss function is used and that the posterior mean of"),
    ],
  },
  {
    id: "wt-2",
    title: "Light bulb lifetimes",
    prompt: m`Bulb lifetimes (in hundreds of hours) are exponential with unknown rate $\theta$, density $\theta e^{-\theta x}$. You test five bulbs; they last $2$, $4$, $1$, $3$ and $5$. The maker wants a value of $\theta$ for the spec sheet. What do you give them?`,
    solution: m`$L(\theta)=\theta^5e^{-\theta\sum x_i}=\theta^5e^{-15\theta}$, so $\ell(\theta)=5\log\theta-15\theta$.

$\ell'(\theta)=\dfrac{5}{\theta}-15=0$ gives $\hat\theta=\dfrac{5}{15}=\dfrac13$ (per hundred hours).

Check: $\ell''(\theta)=-5/\theta^2<0$, a maximum. Equivalently $\hat\theta=1/\bar x$ with $\bar x=3$.`,
    parts: {
      ask: text(m`A single value of the rate $\theta$.`),
      given: text(m`Exponential model $\theta e^{-\theta x}$; five lifetimes $2,4,1,3,5$, so $n=5$ and $\sum x_i=15$.`),
      tool: pick(TOOLS, 0, m`Notice what is missing: no belief about $\theta$ before the test, and no cost attached to a wrong value. The problem gives data and a model, and nothing else: no prior to update and no loss to minimize, so there is no posterior and no Bayes estimate to take. What is left is the value of $\theta$ that makes these five lifetimes most probable, the MLE. The likelihood is smooth with a peak inside $\theta>0$, so the usual procedure works.`),
      plan: text(m`1. $L(\theta)=\theta^5e^{-15\theta}$.
2. $\ell(\theta)=5\log\theta-15\theta$.
3. Set $\ell'(\theta)=5/\theta-15=0$: $\hat\theta=5/15=1/3$, which is $1/\bar x$ with $\bar x=3$.
4. Check $\ell''<0$.`),
      pitfalls: text(m`- With rate $\theta$, the MLE is $1/\bar x$, not $\bar x$.
- Don't invent a prior: none was given.
- Units: a rate per hundred hours.`),
    },
    sources: [
      lec("b-wt-2-0", 5, 2, "Procedure", "the argument that maximizes the likelihood is the same as the argument that maximizes the log likelihood"),
      lec("b-wt-2-1", 1, 3, "Important distributions"),
    ],
  },
  {
    id: "wt-3",
    title: "Battery voltages",
    prompt: m`Battery voltages are $N(\mu,\ 0.04)$, with variance $0.04$ (so $\sigma=0.2$), and the maker says $\mu=1.5$. You will measure $16$ batteries and average them. If the maker is right, how likely is your average to land more than $0.05$ volts away from $1.5$?`,
    solution: m`If $\mu=1.5$, then $\bar X\sim N\!\left(1.5,\ \dfrac{\sigma^2}{n}\right)=N\!\left(1.5,\ \dfrac{0.04}{16}\right)=N(1.5,\ 0.0025)$, so the standard error is $\sigma/\sqrt n=0.2/\sqrt{16}=0.2/4=0.05$.

$$P(|\bar X-1.5|>0.05)=P(|Z|>1)=2\,(1-\Phi(1))\approx 2(0.1587)\approx 0.317.$$`,
    parts: {
      ask: text(m`A probability about the average of the $16$ readings: $P(|\bar X-1.5|>0.05)$.`),
      given: text(m`Normal voltages with variance $0.04$, so $\sigma=0.2$; the maker's value $\mu=1.5$; $n=16$ batteries, averaged.`),
      tool: pick(TOOLS, 2, m`Notice what is missing: nothing to estimate. The maker's $\mu=1.5$ is taken as known, there is no prior and no loss, and the question is how a **statistic** ($\bar X$) varies from sample to sample. That is the sampling distribution of $\bar X$: $N(\mu,\sigma^2/n)$.`),
      plan: text(m`1. $\bar X\sim N(1.5,\ \sigma^2/n)=N(1.5,\ 0.04/16)$.
2. SE $=\sigma/\sqrt n=0.2/\sqrt{16}=0.05$.
3. Standardize: $0.05/0.05=1$.
4. $P(|Z|>1)=2\,(1-\Phi(1))\approx 0.317$ from the normal table.`),
      pitfalls: text(m`- Scale the SD $\sigma=0.2$ by $\sqrt{16}=4$, not the variance $0.04$.
- Standardize with the SE $\sigma/\sqrt n=0.05$, not with $\sigma$.
- "More than $0.05$ away" is two-sided.`),
    },
    sources: [
      lec("b-wt-3-0", 7, 3, "Some MLE sampling distributions", "as the sample size increases, the sampling variance of"),
      lec("b-wt-3-1", 7, 2, "Properties", "The standard deviation of the sampling distribution is called the"),
    ],
  },
];
