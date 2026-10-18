import type { Topic, SourceRef, QuizQuestion } from "../types";

/**
 * STAT 132 topics, one per lecture, grounded in course-library/ (see course-library/manifest.json).
 * Notation follows the lecture notes: π(θ) prior, π(θ|x) posterior, L(θ) likelihood, θ̂ MLE, δ(X) estimator.
 * Worked solutions in the PDFs are blank (filled in live), so the explanations here are written to match the
 * notes' definitions and procedures; the annotated lecture notes will refine them when they are available.
 */

const m = String.raw;

const LEC = {
  1: "lecture-notes/lecture-01-probability-review-and-intro-to-inference.pdf",
  2: "lecture-notes/lecture-02-frequentist-vs-bayesian-inference.pdf",
  3: "lecture-notes/lecture-03-the-posterior-distribution.pdf",
  4: "lecture-notes/lecture-04-loss-functions-and-bayes-estimators.pdf",
  5: "lecture-notes/lecture-05-maximum-likelihood-estimation.pdf",
  6: "lecture-notes/lecture-06-maximum-likelihood-properties.pdf",
  7: "lecture-notes/lecture-07-sampling-distributions.pdf",
} as const;
const QUIZ2 = "quizzes/quiz-02-bayesian-estimation.pdf";
const QUIZ3 = "quizzes/quiz-03-mle-and-sampling-distributions.pdf";
const HW1 = "homework/homework-01.pdf";
const HW2 = "homework/homework-02.pdf";

/** A citation into the shared library. `highlight` is verbatim text on that page (checked by topics.test.ts). */
const src = (id: string, title: string, filename: string, page: number, highlight?: string): SourceRef => ({
  id,
  kind: "Shared",
  title,
  filename,
  page,
  highlight,
});

const open = (
  id: string,
  concept: string,
  prompt: string,
  explanation: string,
  sourceId?: string,
): QuizQuestion => ({ id, kind: "open", concept, prompt, explanation, sourceId });

const mc = (
  id: string,
  concept: string,
  prompt: string,
  choices: string[],
  answer: number,
  explanation: string,
  sourceId?: string,
): QuizQuestion => ({ id, kind: "mc", concept, prompt, choices, answer, explanation, sourceId });

/* ------------------------------------------------------------------ Lecture 1 */

const l1 = [
  src("l1-prob-vs-inf", "Lecture 1 · Probability vs. inferential statistics", LEC[1], 4, "Starts with observed events (data) and makes inferences about the unknown parameters"),
  src("l1-statistic", "Lecture 1 · Statistics", LEC[1], 5, "a function of the data that does not depend on any unknown parameters"),
  src("l1-estimation", "Lecture 1 · Estimation and prediction", LEC[1], 6, "Provides a single best guess of a parameter"),
  src("l1-parametric", "Lecture 1 · Parametric vs. non-parametric", LEC[1], 5, "Assumes that the data follows a distribution characterized by a finite set of parameters."),
];

/* ------------------------------------------------------------------ Lecture 2 */

const l2 = [
  src("l2-freq", "Lecture 2 · Frequentist statistics", LEC[2], 4, "Because the parameter is fixed (not random), we cannot make meaningful probabilistic statements about the parameter."),
  src("l2-bayes", "Lecture 2 · Bayesian statistics", LEC[2], 4, "that have their own probability distributions. These distributions reflect your uncertainty about the parameter before seeing any data (the \"prior\") and are updated as data becomes available (yielding the \"posterior\")."),
  src("l2-likelihood", "Lecture 2 · The likelihood", LEC[2], 6, "It does not integrate to one. However, it does give us an idea of which parameter values may be more likely to generate data like the data we observed."),
  src("l2-prior", "Lecture 2 · Prior distributions", LEC[2], 7, "In this case, we might construct a prior with a small standard deviation (low uncertainty)."),
  src("hw1-priors", "Homework 1 · Priors from moments, and prior reasonableness", HW1, 1, "Your friend suggests a normal prior distribution with mean 1 and variance 10 for"),
  src("hw1-likelihood", "Homework 1 · Writing and sketching likelihoods", HW1, 1, "Suppose you flip a possibly weighted coin 100 times and observe 60 heads. Write the likelihood function for"),
];

/* ------------------------------------------------------------------ Lecture 3 */

const l3 = [
  src("l3-posterior", "Lecture 3 · Posterior distribution", LEC[3], 2, "High posterior variance means that we still are not very certain what a likely value is for the parameter"),
  src("l3-bayes", "Lecture 3 · Bayes' theorem for inference", LEC[3], 3, "The posterior distribution is then proportional to the likelihood times the prior distribution"),
  src("l3-conjugate", "Lecture 3 · Conjugate priors", LEC[3], 4, "if the prior and posterior distribution belong to the same family"),
  src("l3-beta", "Lecture 3 · Beta-Bernoulli updating", LEC[3], 4, "form a random sample from the Bernoulli distribution with parameter"),
  src("l3-gamma", "Lecture 3 · Gamma-Poisson updating", LEC[3], 5, "form a random sample from the Poisson distribution with parameter"),
  src("l3-normal", "Lecture 3 · Normal sampling", LEC[3], 6, "that is the normal distribution with mean 0 and a variance of 60."),
  src("l3-prior-effect", "Lecture 3 · Effect of the prior", LEC[3], 7, "When the sample size is large, the posterior mean is pulled closer to the sample mean"),
  src("hw2-weighted", "Homework 2 · Posterior mean as a weighted average", HW2, 1, "Show that the mean of the posterior distribution"),
  src("hw2-posterior", "Homework 2 · Normal and Beta posteriors", HW2, 1, "A random sample of 100 chargers is tested, and 3 defective chargers are found. What is the posterior distribution of"),
  src("q2-conjugacy", "Quiz 2 · Beta-Binomial and Gamma-Poisson conjugacy", QUIZ2, 1, "The Beta prior is conjugate to the Bernoulli likelihood, so the posterior is Beta("),
];

/* ------------------------------------------------------------------ Lecture 4 */

const l4 = [
  src("l4-loss", "Lecture 4 · Loss functions", LEC[4], 2, "is a real number. The interpretation is that the statistician \"loses\" by"),
  src("l4-bayes-est", "Lecture 4 · Bayes estimator", LEC[4], 3, "be a loss function. For each possible value"),
  src("l4-squared", "Lecture 4 · Squared error loss", LEC[4], 3, "Suppose that the squared error loss function is used and that the posterior mean of"),
  src("l4-absolute", "Lecture 4 · Absolute error loss", LEC[4], 5, "Suppose that the absolute error loss function is used. Then, the Bayes estimator of"),
  src("hw2-bayes-exp", "Homework 2 · Bayes estimate for an exponential rate", HW2, 1, "Using a squared error loss function, what is the Bayes estimate of"),
  src("q2-loss", "Quiz 2 · Loss functions and Bayes estimators", QUIZ2, 2, "Squared error is just one choice."),
];

/* ------------------------------------------------------------------ Lecture 5 */

const l5 = [
  src("l5-def", "Lecture 5 · Maximum likelihood estimator", LEC[5], 2, "these are fixed unknown values"),
  src("l5-procedure", "Lecture 5 · Procedure", LEC[5], 2, "the argument that maximizes the likelihood is the same as the argument that maximizes the log likelihood"),
  src("l5-edge", "Lecture 5 · Edge cases", LEC[5], 4, "a global maximum could lie on the edge of the parameter space"),
  src("hw2-mle", "Homework 2 · MLE problems", HW2, 1, "The time until decay of a radioactive particle is modeled as a random variable with the following PDF:"),
  src("q3-likelihood", "Quiz 3 · Role of the likelihood", QUIZ3, 3, "that makes the observed data most probable."),
];

/* ------------------------------------------------------------------ Lecture 6 */

const l6 = [
  src("l6-invariance", "Lecture 6 · Invariance", LEC[6], 2, "we get the MLE of any function of the parameter for \"free\". For example, medians and other quantiles are typically a function of the distribution parameters."),
  src("l6-consistency", "Lecture 6 · Consistency", LEC[6], 3, "the MLE becomes a better and better approximation of the true parameter"),
  src("l6-bias", "Lecture 6 · Is the MLE unbiased?", LEC[6], 4, "This means that the bias tends to zero as the sample size grows."),
  src("q3-bias", "Quiz 3 · MLEs are not always unbiased", QUIZ3, 2, "MLEs are not guaranteed to be unbiased."),
];

/* ------------------------------------------------------------------ Lecture 7 */

const l7 = [
  src("l7-def", "Lecture 7 · Sampling distribution", LEC[7], 2, "it has some probability distribution. Since a statistic is just a function of the data, it is also random, with some distribution."),
  src("l7-props", "Lecture 7 · Properties", LEC[7], 2, "The sampling distribution provides insight into the variability of a statistic."),
  src("l7-mle", "Lecture 7 · MLE sampling distributions", LEC[7], 3, "Previously we saw that the MLE is a common point estimator with some useful properties."),
  src("l7-visual", "Lecture 7 · Visualizing a sampling distribution", LEC[7], 5, "As the sample size increases, the sampling distribution has lower variance"),
  src("q3-se", "Quiz 3 · Standard error", QUIZ3, 2, "The standard error is the standard deviation of the estimator's sampling distribution:"),
];

/* ------------------------------------------------------------------ Topics */

export const TOPICS: Topic[] = [
  {
    id: "probability-review-and-inference",
    title: "Probability Review & Introduction to Inference",
    unit: "Unit 1 · Foundations",
    intro:
      "Probability starts from a known model and asks what data to expect. Statistical inference runs the other way: it starts from observed data and asks what the model must be. This topic reviews the probability you need and sets up the vocabulary of inference.",
    willStudy: [
      "How probability and statistical inference point in opposite directions",
      "Parameters, parameter spaces and statistics",
      "Point estimation, interval estimation, prediction and hypothesis testing",
    ],
    sources: l1,
    tutorial: [
      {
        heading: "Two directions: probability and inference",
        body: "In probability, the parameters are known and we compute the chance of data. In inference, we have observed the data and want to learn the unknown parameters. For a fair coin the first question is how likely 6 heads in 10 tosses is. The second question is what 8 heads in 10 tosses tells us about the coin.",
        formula: m`P(X = 6 \mid p = 0.5) \quad\text{vs.}\quad \text{what is } p \text{ given } x = 8\,?`,
        sourceId: "l1-prob-vs-inf",
      },
      {
        heading: "Parameters and the parameter space",
        body: "A parameter indexes a family of distributions, and the parameter space is every value it could take. For a normal model the parameters are the mean and variance, and the space puts no restriction on the mean while the variance must be positive.",
        formula: m`\mu \in \mathbb{R},\;\; \sigma^2 > 0`,
        sourceId: "l1-parametric",
      },
      {
        heading: "What counts as a statistic?",
        body: "A statistic is any function of the data that does not depend on unknown parameters, so we can compute it from the sample alone. The sample mean and sample variance are statistics.",
        formula: m`\bar{X} = \frac{1}{n}\sum_{i=1}^{n} X_i, \qquad S^2 = \frac{1}{n-1}\sum_{i=1}^{n}\left(X_i - \bar{X}\right)^2`,
        sourceId: "l1-statistic",
      },
      {
        heading: "What we do with statistics",
        body: "Point estimation gives a single best guess of a parameter, interval estimation gives a range with a stated confidence, prediction forecasts future observations, and hypothesis testing checks a claim such as whether a mean equals 100.",
        formula: m`H_0:\ \mu = 100 \quad\text{vs.}\quad H_1:\ \mu \neq 100`,
        sourceId: "l1-estimation",
      },
    ],
    quiz: [
      mc("pr-1", "Probability vs. inference", "Which situation is a statistical inference problem?",
        ["Given a fair coin, find the probability of 6 heads in 10 tosses", "After seeing 8 heads in 10 tosses, judge whether the coin is fair", "Compute E[X] for a known Poisson(3)", "Find P(A | B) from P(A ∩ B) and P(B)"], 1,
        "Inference starts from observed data and asks about the unknown parameter. The other options start from a known model.", "l1-prob-vs-inf"),
      mc("pr-2", "Definition of a statistic", "Which of the following is NOT a statistic?",
        ["The sample mean", "The sample variance $S^2$", "$(\\bar{X} - \\mu)/\\sigma$ when $\\mu$ and $\\sigma$ are unknown", "The sample maximum"], 2,
        "A statistic cannot depend on unknown parameters. The standardized quantity uses μ and σ, which are unknown.", "l1-statistic"),
      mc("pr-3", "Sample variance", "Why does the sample variance $S^2$ divide by $n-1$ instead of $n$?",
        ["To make the variance smaller", "It is the definition used in the lecture notes for the sample variance", "Because the data are discrete", "Because $n$ is unknown"], 1,
        "The lecture defines S² with 1/(n−1). (Quiz 3 later shows the normal-variance MLE divides by n and is biased.)", "l1-statistic"),
      mc("pr-4", "Parametric vs. non-parametric", "Estimating the median of a distribution without assuming its shape is an example of:",
        ["Parametric inference", "Non-parametric inference", "Bayesian inference", "Hypothesis testing"], 1,
        "Non-parametric inference makes minimal assumptions about the form of the distribution.", "l1-parametric"),
      open("pr-5", "Parameter space", "For the model $N(\\mu,\\sigma^2)$, state the parameter space and explain what each parameter does.",
        "μ ∈ ℝ is the center (mean) and σ² > 0 is the spread (variance). The parameter space is the set of all allowed combinations.", "l1-parametric"),
      open("pr-6", "Point vs. interval estimation", "Describe the difference between point estimation and interval estimation, and give a situation where you would prefer each.",
        "A point estimate is a single best guess for the parameter; an interval gives a range with a stated confidence or probability. Prefer a point estimate for a quick summary and an interval when the uncertainty matters.", "l1-estimation"),
      open("pr-7", "Probability vs. inference (coin)", "You toss a coin 10 times and see 8 heads. Explain in words how asking 'what is P(8 heads) if the coin is fair?' differs from asking 'is the coin fair?'.",
        "The first fixes the parameter (p = 0.5) and computes the probability of data; the second treats the data as known and asks what it says about the unknown p.", "l1-prob-vs-inf"),
    ],
    examBank: [
      {
        id: "pr-e1",
        prompt:
          "A coin is tossed 10 times. (a) If the coin is fair, find the probability of exactly 6 heads. (b) You instead observe 8 heads and do not know whether the coin is fair. Explain why (b) is an inference problem and propose a reasonable point estimate of $p$, justifying it.",
        hint: "Part (a) uses a known p. Part (b) starts from the observed data and asks what p is.",
        concept: "Probability vs. inference",
        sourceIds: ["l1-prob-vs-inf", "l1-estimation"],
        keyPoints: ["Binomial: C(10,6)/2^10 = 210/1024 ≈ 0.205", "(b) data observed, p unknown", "point estimate 8/10 = 0.8 with justification"],
      },
      {
        id: "pr-e2",
        prompt:
          "Define a statistic. Decide whether each is a statistic when $X_1,\\dots,X_n$ are i.i.d. $N(\\mu,\\sigma^2)$ with $\\mu,\\sigma^2$ unknown: (i) $\\bar X$, (ii) $S^2$, (iii) $\\bar X-\\mu$, (iv) $\\max_i X_i$. Justify each.",
        hint: "Ask whether each quantity can be computed from the data alone.",
        concept: "Statistics",
        sourceIds: ["l1-statistic"],
        keyPoints: ["definition: function of the data, no unknown parameters", "(i),(ii),(iv) are statistics", "(iii) depends on unknown μ so it is not"],
      },
    ],
  },

  {
    id: "frequentist-vs-bayesian",
    title: "Frequentist vs. Bayesian Inference",
    unit: "Unit 1 · Foundations",
    intro:
      "Two philosophies share one tool, the likelihood. Frequentists treat the parameter as a fixed unknown number, while Bayesians describe their uncertainty about it with a prior distribution. This topic builds the likelihood and the prior that every later topic relies on.",
    willStudy: [
      "Populations, samples and parameters",
      "How the frequentist and Bayesian views differ",
      "Writing the likelihood function and choosing a prior",
    ],
    sources: l2,
    tutorial: [
      {
        heading: "Population, sample, parameter",
        body: "A population is the full set of units we care about, a sample is the subset we measure, and a parameter is a number describing the population. A distribution we choose to model the population may have parameters that are not the quantity we actually want, such as the probability that an IQ exceeds 140.",
        sourceId: "l2-freq",
      },
      {
        heading: "Two views of the parameter",
        body: "Frequentists treat the parameter as fixed but unknown, so it is either inside a calculated interval or it is not, and probability statements describe long-run repeated sampling. Bayesians treat the parameter as a random variable with a prior before data and a posterior after data, so probability statements about the parameter are meaningful.",
        sourceId: "l2-bayes",
      },
      {
        heading: "The likelihood",
        body: "For a random sample from f(x | θ), the likelihood has the same formula as the joint density but is viewed as a function of θ because the data are now observed. It is not a probability distribution and does not integrate to one. For 8 heads in 10 independent flips, the likelihood of p is below (the binomial coefficient is a constant in p).",
        formula: m`L(\theta) = \prod_{i=1}^{n} f(X_i \mid \theta), \qquad L(p) \propto p^{8}(1-p)^{2}`,
        sourceId: "l2-likelihood",
      },
      {
        heading: "Choosing a prior",
        body: "The prior π(θ) is the distribution we assign to the parameter before seeing data. With no information about a proportion, a uniform prior on [0, 1] is natural. With past experience, a prior with a small standard deviation expresses low uncertainty. For a Gamma(α, β) prior with mean 0.0002 and standard deviation 0.0001, matching moments gives α = 4 and β = 20000.",
        formula: m`\pi(\theta) = \frac{\beta^{\alpha}}{\Gamma(\alpha)}\theta^{\alpha-1}e^{-\beta\theta}`,
        sourceId: "l2-prior",
      },
    ],
    quiz: [
      mc("fb-1", "Frequentist view", "In the frequentist approach, a calculated 95% confidence interval:",
        ["Has a 95% probability of containing the parameter", "Either contains the fixed parameter or does not; 95% describes the long-run procedure", "Contains 95% of the data", "Is a posterior distribution"], 1,
        "The parameter is fixed, so the interval either covers it or not. The 95% is about repeated sampling.", "l2-freq"),
      mc("fb-2", "Bayesian view", "In the Bayesian framework the parameter is:",
        ["A fixed unknown constant", "A random variable with a prior distribution", "Always equal to the MLE", "Irrelevant once data are observed"], 1,
        "Bayesians model uncertainty about the parameter with a probability distribution that is updated by the data.", "l2-bayes"),
      mc("fb-3", "The likelihood", "The likelihood function $L(\\theta)$ is best described as:",
        ["A probability distribution over θ that integrates to 1", "The joint density of the observed data viewed as a function of θ", "The posterior distribution", "The prior times the data"], 1,
        "L(θ) uses the density formula with the data fixed. It is not a probability distribution over θ.", "l2-likelihood"),
      mc("fb-4", "Choosing a prior", "You have no information about the proportion of defective items. A reasonable prior on $[0,1]$ is:",
        ["A point mass at 0.5", "Uniform on [0, 1]", "Normal with mean 0", "Exponential"], 1,
        "A uniform prior on the parameter space spreads belief evenly when there is no prior information.", "l2-prior"),
      open("fb-5", "Likelihood (coin)", "You observe 8 heads in 10 independent flips of a coin with unknown heads probability $p$. Write the likelihood function and explain why it is not a probability distribution for $p$.",
        "L(p) ∝ p^8 (1−p)^2. Integrating over p does not give 1 in general, because L is the probability of the data as a function of p, not a distribution over p.", "l2-likelihood"),
      open("fb-6", "Likelihood (normal)", "Test scores are $N(\\mu,10^2)$ with $\\mu$ unknown. You observe 45, 55 and 50. Write the likelihood of $\\mu$.",
        "L(μ) = ∏ (1/(10√(2π))) exp(−(xi−μ)²/200) ∝ exp(−[(45−μ)²+(55−μ)²+(50−μ)²]/200).", "l2-likelihood"),
      open("fb-7", "Frequentist vs. Bayesian", "In your own words, contrast how a frequentist and a Bayesian would talk about the uncertainty in a parameter, including whether 'the probability the parameter is in this interval' is meaningful.",
        "Frequentist: parameter fixed, only procedures have probabilities, so that statement is not meaningful. Bayesian: the parameter has a distribution, so the statement is meaningful.", "l2-freq"),
    ],
    examBank: [
      {
        id: "fb-e1",
        prompt:
          "The lifetime of a lamp is exponential with unknown rate $\\theta$. Prior experience suggests a Gamma($\\alpha,\\beta$) prior for $\\theta$ with mean 0.0002 and standard deviation 0.0001. (a) Solve for $\\alpha$ and $\\beta$. (b) Write $\\pi(\\theta)$ and explain what the prior represents.",
        hint: "The Gamma mean is α/β and the variance is α/β². Use both to solve for α and β.",
        concept: "Choosing a prior",
        sourceIds: ["l2-prior"],
        keyPoints: ["α/β = 0.0002 and α/β² = 1e-8", "α = 4, β = 20000", "prior is belief about θ before data"],
      },
      {
        id: "fb-e2",
        prompt:
          "Scores are $N(\\mu,10^2)$ with $\\mu$ unknown. You observe 45, 55 and 50. Write the likelihood of $\\mu$, state what value of $\\mu$ makes it largest (and why), and explain how this likelihood is used differently by a frequentist and a Bayesian.",
        hint: "The exponent is a sum of squares; where is it smallest?",
        concept: "Likelihood",
        sourceIds: ["l2-likelihood", "l2-freq", "l2-bayes"],
        keyPoints: ["product of normal densities", "maximized at sample mean 50", "frequentist maximizes; Bayesian multiplies by prior"],
      },
      {
        id: "fb-e3",
        prompt:
          "(Adapted from Homework 1.) (a) A gamma prior for $\\theta$ has mean 5 and variance 2. Determine the prior pdf. (b) A friend suggests a normal prior with mean 1 and variance 10 for a Poisson mean $\\lambda$. Is this reasonable? Explain.",
        hint: "For a Gamma(α, β) the mean is α/β and the variance is α/β². What values can a Poisson mean take?",
        concept: "Priors from moments",
        sourceIds: ["hw1-priors", "l2-prior"],
        keyPoints: ["α/β = 5 and α/β² = 2 → β = 5/2, α = 25/2", "write π(θ) with those parameters", "normal prior puts mass on λ < 0 but λ > 0 is required", "a gamma prior respects the parameter space"],
      },
      {
        id: "fb-e4",
        prompt:
          "(Adapted from Homework 1.) You flip a possibly weighted coin 100 times and observe 60 heads. (a) Write the likelihood function of $p$. (b) Sketch it over $[0,1]$ and mark where it is largest. (c) For a Poisson mean $\\lambda$ and household sizes $x_1,\\dots,x_{10}$, write the likelihood of $\\lambda$.",
        hint: "Treat the data as fixed and write the density as a function of the parameter.",
        concept: "Writing likelihoods",
        sourceIds: ["hw1-likelihood", "l2-likelihood"],
        keyPoints: ["L(p) ∝ p^60 (1−p)^40", "peaks at p = 0.6, near zero at 0 and 1", "L(λ) ∝ e^{−10λ} λ^{Σxi}"],
      },
    ],
  },

  {
    id: "posterior-distribution",
    title: "The Posterior Distribution",
    unit: "Unit 2 · Bayesian inference",
    intro:
      "The posterior distribution is what we know about a parameter after seeing data. It is proportional to the likelihood times the prior, and for conjugate pairs the update is as simple as adding counts to the prior's parameters.",
    willStudy: [
      "Bayes' theorem for parameters and 'posterior is proportional to likelihood times prior'",
      "Conjugate updating for Beta-Bernoulli, Gamma-Poisson and Normal means",
      "How sample size and prior variance control the prior's influence",
    ],
    sources: l3,
    tutorial: [
      {
        heading: "The posterior and Bayes' theorem",
        body: "The posterior π(θ | x) is the distribution of θ given the observed data. By Bayes' theorem it equals likelihood times prior divided by the marginal of the data. The marginal does not depend on θ, so we usually drop it and write a proportionality.",
        formula: m`\pi(\theta \mid x) = \frac{f(x \mid \theta)\,\pi(\theta)}{m_n(x)} \;\propto\; f(x \mid \theta)\,\pi(\theta)`,
        sourceId: "l3-bayes",
      },
      {
        heading: "Recognize the family: conjugate priors",
        body: "If the product likelihood times prior looks like a known family, we know the posterior. A prior is conjugate when the posterior stays in the same family as the prior, so updating only changes the parameters.",
        sourceId: "l3-conjugate",
      },
      {
        heading: "Beta-Bernoulli and Gamma-Poisson",
        body: "For Bernoulli data with a Beta(α, β) prior, add the successes to α and the failures to β. For Poisson data with a Gamma(α, β) prior, add the total count to α and the number of observations to β. Example: 8 heads in 10 flips with a Beta(1, 1) prior gives Beta(9, 3), with posterior mean 3/4.",
        formula: m`p \mid x \sim \text{Beta}\!\left(\alpha+\sum x_i,\; \beta+n-\sum x_i\right), \qquad \lambda \mid x \sim \text{Gamma}\!\left(\alpha+\sum x_i,\; \beta+n\right)`,
        sourceId: "l3-beta",
      },
      {
        heading: "Normal data, known variance",
        body: "With a Normal(μ0, σ0²) prior on the mean, the posterior mean is a weighted average of the prior mean and the sample mean. As n grows or the prior variance grows, the weight moves toward the data.",
        formula: m`\mu_1 = \frac{\sigma^2\mu_0 + n\sigma_0^2\,\bar{x}_n}{\sigma^2 + n\sigma_0^2}, \qquad \sigma_1^2 = \frac{\sigma^2\sigma_0^2}{\sigma^2 + n\sigma_0^2}`,
        sourceId: "l3-normal",
      },
      {
        heading: "How much does the prior matter?",
        body: "A small sample leaves the posterior mean near the prior mean, and a large sample pulls it toward the sample mean. A small prior variance makes the prior stronger. Posterior variance decreases as n increases.",
        sourceId: "l3-prior-effect",
      },
    ],
    quiz: [
      mc("po-1", "Posterior definition", "The posterior distribution of $\\theta$ is:",
        ["The distribution of θ before seeing data", "The conditional distribution of θ given the observed data", "The distribution of the data given θ", "The marginal distribution of the data"], 1,
        "The posterior is π(θ | x), the distribution of θ after observing the data.", "l3-posterior"),
      mc("po-2", "Proportionality", "The posterior is proportional to:",
        ["The prior divided by the likelihood", "The likelihood times the prior", "The marginal times the prior", "The likelihood divided by the prior"], 1,
        "π(θ|x) ∝ f(x|θ)π(θ). The marginal of the data is a constant in θ.", "l3-bayes"),
      mc("po-3", "Beta-Binomial update", "A Beta(2, 3) prior is placed on a defect proportion and 5 of 12 items are defective. What is the posterior mean?",
        ["7/17", "7/15", "12/17", "2/5"], 0,
        "Posterior is Beta(2+5, 3+12−5) = Beta(7, 10), with mean 7/17.", "q2-conjugacy"),
      mc("po-4", "Posterior mean", "A Beta(2, 2) prior with 7 defectives out of 50 gives a posterior mean of:",
        ["8/52", "1/2", "7/50", "9/54"], 3,
        "Posterior is Beta(9, 45), so the mean is 9/54 = 1/6.", "q2-conjugacy"),
      mc("po-5", "Vague priors", "In the normal-mean model, as the prior variance $\\sigma_0^2$ becomes very large, the posterior mean:",
        ["Moves toward the prior mean", "Moves toward the sample mean", "Becomes undefined", "Becomes zero"], 1,
        "A large prior variance means low prior precision, so the data dominate.", "l3-prior-effect"),
      open("po-6", "Gamma-Poisson", "A store models arrivals as Poisson($\\lambda$) with a Gamma(3, 2) prior. It observes $X=3$ customers in one hour. Find the posterior distribution of $\\lambda$ and compare the prior and posterior variances.",
        "Posterior Gamma(3+3, 2+1) = Gamma(6, 3). Prior variance α/β² = 3/4, posterior variance 6/9 = 2/3. Observing data reduced uncertainty.", "l3-gamma"),
      open("po-7", "Beta-Bernoulli", "You observe 8 heads in 10 flips and use a Beta(1, 1) prior. Find the posterior distribution, its mean and its variance.",
        "Beta(9, 3). Mean 9/12 = 3/4. Variance αβ/((α+β)²(α+β+1)) = 27/(144·13) = 3/208 ≈ 0.0144.", "l3-beta"),
      open("po-8", "Normal posterior", "Differences in calorie labels are modeled as $N(\\mu,100)$ with a $N(0,60)$ prior on $\\mu$. For $n=20$ and $\\bar{x}=0.125$, find the posterior of $\\mu$.",
        "μ1 = (100·0 + 20·60·0.125)/(100 + 20·60) = 150/1300 = 3/26 ≈ 0.115; σ1² = (100·60)/1300 = 60/13 ≈ 4.62.", "l3-normal"),
    ],
    examBank: [
      {
        id: "po-e1",
        prompt:
          "Differences between stated and measured calorie content are modeled as $N(\\mu,100)$ (variance known). Your prior is $\\mu\\sim N(0,60)$. For $n=20$ with $\\bar{x}=0.125$: (a) derive the posterior of $\\mu$, (b) interpret the posterior mean as a weighted average, and (c) explain what happens as $n\\to\\infty$.",
        hint: "Use the normal-sampling theorem from lecture. Write the weights on the prior mean and on x̄.",
        concept: "Normal posterior",
        sourceIds: ["l3-normal", "l3-prior-effect"],
        keyPoints: ["μ1 = 150/1300 = 3/26", "σ1² = 60/13", "weight on x̄ is nσ0²/(σ²+nσ0²)", "posterior concentrates at x̄ as n grows"],
      },
      {
        id: "po-e2",
        prompt:
          "Let $X_1,\\dots,X_n$ be i.i.d. Bernoulli($p$) with a uniform prior on $p$. (a) Show that the posterior is Beta($1+\\sum x_i,\\;1+n-\\sum x_i$) starting from 'posterior is proportional to likelihood times prior'. (b) Explain why a Beta prior is called conjugate here.",
        hint: "Multiply p^{Σx}(1−p)^{n−Σx} by the prior density and recognize the kernel.",
        concept: "Conjugate updating",
        sourceIds: ["l3-bayes", "l3-conjugate", "l3-beta"],
        keyPoints: ["likelihood p^{Σx}(1−p)^{n−Σx}", "prior is constant on [0,1]", "kernel of a Beta", "prior and posterior in same family"],
      },
      {
        id: "po-e3",
        prompt:
          "(Adapted from Homework 2.) A random sample of size $n$ comes from a Poisson distribution with unknown mean $\\theta$, and $\\theta$ has a Gamma($\\alpha,\\beta$) prior with mean $\\mu_0$. Show that the posterior mean is $\\gamma_n\\bar X_n+(1-\\gamma_n)\\mu_0$ and show $\\gamma_n\\to1$ as $n\\to\\infty$.",
        hint: "Find the posterior parameters first, then split the posterior mean into a part from the data and a part from the prior.",
        concept: "Posterior mean as a weighted average",
        sourceIds: ["hw2-weighted", "l3-gamma"],
        keyPoints: ["posterior Gamma(α + Σx, β + n)", "mean (α + n x̄)/(β + n)", "μ0 = α/β so γn = n/(β + n)", "γn → 1 as n → ∞"],
      },
      {
        id: "po-e4",
        prompt:
          "(Adapted from Homework 2.) (a) Delivery times are $N(\\theta,1)$. With $n=22$ and $\\bar x=32$ the posterior of $\\theta$ is normal with mean 30 and variance $1/30$. Find the prior. (b) A Beta(2, 200) prior on a defect proportion is combined with 3 defectives in 100 chargers. Find the posterior.",
        hint: "In (a), compare the precisions: posterior precision = prior precision + n/σ². Then solve for the prior mean.",
        concept: "Working backward from a posterior",
        sourceIds: ["hw2-posterior", "l3-normal", "l3-beta"],
        keyPoints: ["30 = 1/σ0² + 22 → σ0² = 1/8", "30 = (μ0/σ0² + 22·32)/30 → μ0 = 24.5", "prior N(24.5, 1/8)", "(b) Beta(2 + 3, 200 + 97) = Beta(5, 297)"],
      },
    ],
  },

  {
    id: "loss-functions-bayes-estimators",
    title: "Loss Functions & Bayes Estimators",
    unit: "Unit 2 · Bayesian inference",
    intro:
      "A posterior is a whole distribution, but often we must report one number. A loss function says how costly each error is, and the Bayes estimator is the number that minimizes expected posterior loss. Squared error gives the posterior mean; absolute error gives the posterior median.",
    willStudy: [
      "Point estimators, estimates and loss functions L(θ, a)",
      "Bayes estimators as minimizers of expected posterior loss",
      "Why squared error leads to the mean and absolute error to the median",
    ],
    sources: l4,
    tutorial: [
      {
        heading: "Why we need a loss function",
        body: "A point estimator δ(X) is a function of the data, and δ(x) is the estimate once data are observed. We want it close to the true θ, so we need to say how bad an error is. The loss L(θ, a) is what we lose when the truth is θ and we report a.",
        formula: m`L(\theta, a) \quad\text{e.g.}\quad (\theta - a)^2 \;\;\text{or}\;\; |\theta - a|`,
        sourceId: "l4-loss",
      },
      {
        heading: "The Bayes estimator",
        body: "We never know θ, but under the posterior we can compute the expected loss of each candidate a. The Bayes estimator δ(x) is the a that minimizes this expected posterior loss.",
        formula: m`\delta(x) = \arg\min_{a}\; E\!\left[L(\theta, a)\mid x\right] = \arg\min_{a}\int L(\theta, a)\,\pi(\theta\mid x)\,d\theta`,
        sourceId: "l4-bayes-est",
      },
      {
        heading: "Squared error gives the posterior mean",
        body: "Under squared error loss, the Bayes estimator is the posterior mean. For Beta-Bernoulli with a uniform prior and 8 heads in 10 flips, the posterior is Beta(9, 3) and the estimate is 3/4. For the Gamma(3, 2) arrivals example after observing 3, the posterior is Gamma(6, 3) and the estimate is 2.",
        formula: m`\delta(X) = E(\theta \mid X)`,
        sourceId: "l4-squared",
      },
      {
        heading: "Absolute error gives the posterior median",
        body: "Absolute error does not penalize extreme deviations as much as squared error. Its Bayes estimator is the posterior median. When the posterior is symmetric, as in the normal-mean model, the median and mean agree.",
        formula: m`\delta(X) = \text{median of } \pi(\theta \mid X)`,
        sourceId: "l4-absolute",
      },
    ],
    quiz: [
      mc("lf-1", "Loss function facts", "Which statement about a loss function $L(\\theta,a)$ is incorrect?",
        ["It must be the squared difference to be non-negative", "It measures how bad it is to estimate θ with a", "If we knew θ we could choose a = θ for zero loss", "The expected prior loss is ∫ L(θ, a) π(θ) dθ"], 0,
        "Squared error is just one choice; absolute error and others are also non-negative.", "q2-loss"),
      mc("lf-2", "Definition of the Bayes estimator", "A Bayes estimator under a given loss is the value that:",
        ["Minimizes the expected posterior loss", "Maximizes the prior", "Maximizes the likelihood", "Minimizes the posterior distribution"], 0,
        "Bayes estimator: argmin of E[L(θ, a) | x]. Maximizing the likelihood gives the MLE.", "l4-bayes-est"),
      mc("lf-3", "Squared error", "Under squared error loss, the Bayes estimator of $\\theta$ is the posterior:",
        ["Mode", "Median", "Mean", "Variance"], 2,
        "Squared error leads to the posterior mean.", "l4-squared"),
      mc("lf-4", "Absolute error", "Under absolute error loss, the Bayes estimator is the posterior:",
        ["Mean", "Median", "Mode", "Variance"], 1,
        "Absolute error leads to the posterior median.", "l4-absolute"),
      mc("lf-5", "Prior mean vs. posterior mean", "A random sample of 12 items has 5 defectives, with a Beta(2, 3) prior on the defect proportion. What is the PRIOR mean?",
        ["2/5", "3/5", "1/25", "2/3"], 0,
        "The prior mean depends only on the prior: α/(α+β) = 2/5.", "q2-conjugacy"),
      open("lf-6", "Bayes estimate (Beta-Bernoulli)", "With a uniform prior and 8 heads in 10 flips, find the Bayes estimate of $p$ under squared error loss, and explain why this is the answer.",
        "Posterior is Beta(9, 3); under squared error the Bayes estimator is the posterior mean 9/12 = 3/4.", "l4-squared"),
      open("lf-7", "Bayes estimate (Gamma-Poisson)", "A Gamma(3, 2) prior on a Poisson rate and an observed $X=3$ in one hour: find the Bayes estimate of the rate under squared error loss.",
        "Posterior Gamma(6, 3), mean 6/3 = 2.", "l4-squared"),
      open("lf-8", "Mean vs. median", "For the normal-mean model with posterior $N(\\mu_1,\\sigma_1^2)$, find the Bayes estimate under (a) squared error and (b) absolute error and explain why they match.",
        "Both equal μ1 (3/26 in the calorie example), because the normal posterior is symmetric so its mean equals its median.", "l4-absolute"),
    ],
    examBank: [
      {
        id: "lf-e1",
        prompt:
          "Show that under squared error loss the Bayes estimator is the posterior mean. Then explain in words why using absolute error loss changes the answer to the posterior median and when the two coincide.",
        hint: "Expand E[(θ − a)² | x] around the posterior mean and see which a minimizes it.",
        concept: "Bayes estimator derivation",
        sourceIds: ["l4-bayes-est", "l4-squared", "l4-absolute"],
        keyPoints: ["E[(θ−a)²|x] = Var(θ|x) + (E[θ|x] − a)²", "minimized at a = E[θ|x]", "absolute error → median", "symmetric posterior: mean = median"],
      },
      {
        id: "lf-e2",
        prompt:
          "A Bernoulli sample has $n=50$ and $\\sum x_i=7$. The prior on $p$ is Beta(2, 2). (a) Find the posterior. (b) Give the Bayes estimate under squared error loss. (c) Compare it with the sample proportion and say what the difference tells you about the prior.",
        hint: "Add successes to the first Beta parameter and failures to the second.",
        concept: "Bayes estimate",
        sourceIds: ["l3-beta", "l4-squared", "q2-conjugacy"],
        keyPoints: ["Beta(9, 45)", "9/54 = 1/6 ≈ 0.167", "sample proportion 7/50 = 0.14", "prior pulls estimate toward 1/2"],
      },
      {
        id: "lf-e3",
        prompt:
          "(Adapted from Homework 2.) The time for a student to finish a homework is exponential with unknown rate $\\lambda$. Your gamma prior for $\\lambda$ has mean 0.2 and variance 1. The average time of 10 students is 3 hours. (a) Find the prior parameters. (b) Find the posterior of $\\lambda$. (c) Using squared error loss, what is the Bayes estimate?",
        hint: "Match the gamma mean α/β and variance α/β², then update with the exponential likelihood, which is proportional to λ^n e^{−λΣx}.",
        concept: "Bayes estimate (exponential data)",
        sourceIds: ["hw2-bayes-exp", "l4-squared", "l2-prior"],
        keyPoints: ["α/β = 0.2, α/β² = 1 → β = 0.2, α = 0.04", "likelihood ∝ λ^10 e^{−30λ}", "posterior Gamma(10.04, 30.2)", "estimate 10.04/30.2 ≈ 0.332"],
      },
    ],
  },

  {
    id: "maximum-likelihood-estimation",
    title: "Maximum Likelihood Estimation",
    unit: "Unit 3 · Frequentist estimation",
    intro:
      "Maximum likelihood turns away from priors. The parameter is a fixed unknown, and the MLE is the value that makes the observed data most probable. You will practice the log-likelihood procedure and learn when it fails at the edge of the parameter space.",
    willStudy: [
      "The definition of the MLE as arg max of the likelihood",
      "The four-step log-likelihood procedure",
      "MLEs for exponential, Bernoulli, normal and Poisson data",
      "Edge cases such as the uniform distribution on [0, θ]",
    ],
    sources: l5,
    tutorial: [
      {
        heading: "Fixed parameter, no prior",
        body: "Maximum likelihood is a frequentist method for point estimation. We no longer use a prior or treat the parameter as random. The MLE is the parameter value that maximizes the likelihood of the observed sample.",
        formula: m`\hat{\theta}(X) = \arg\max_{\theta}\; L(\theta \mid X)`,
        sourceId: "l5-def",
      },
      {
        heading: "The procedure",
        body: "Logs are increasing, so maximizing the log-likelihood is equivalent and easier. Step 1: write the log-likelihood. Step 2: differentiate and set to zero. Step 3: solve for the candidate. Step 4: check the second derivative is negative so it is a maximum.",
        formula: m`\ell(\theta\mid x)=\log L(\theta\mid x),\qquad \frac{d}{d\theta}\ell(\theta\mid x)=0,\qquad \frac{d^2}{d\theta^2}\ell(\theta\mid x)\Big|_{\hat\theta}<0`,
        sourceId: "l5-procedure",
      },
      {
        heading: "Worked patterns",
        body: "For exponential data with parameter θ the MLE is n over the sum, so with data 3, 1.5 and 2.1 it is 3/6.6 = 5/11. For Bernoulli data it is the sample proportion, for a normal mean with known variance it is the sample mean, and for the Poisson data 3, 2, 4, 3, 5, 2, 3 it is 22/7.",
        formula: m`\hat\theta_{\text{exp}}=\frac{n}{\sum x_i},\qquad \hat p=\bar{x},\qquad \hat\mu=\bar{x},\qquad \hat\lambda_{\text{Pois}}=\bar{x}`,
        sourceId: "l5-procedure",
      },
      {
        heading: "When calculus fails: edge cases",
        body: "Sometimes the likelihood has no interior maximum, so setting the derivative to zero fails. For a sample from Uniform[0, θ], the likelihood is θ^(−n) for θ at least the sample maximum and zero otherwise, which is decreasing, so the MLE sits on the edge of the allowed region at the maximum.",
        formula: m`L(\theta)=\theta^{-n}\,\mathbf{1}\{\theta \ge \max_i x_i\}\;\Rightarrow\;\hat\theta=\max_i X_i`,
        sourceId: "l5-edge",
      },
    ],
    quiz: [
      mc("ml-1", "Role of the likelihood", "In MLE, the likelihood function:",
        ["Provides the Bayesian posterior", "Describes how likely the observed data are for given parameter values", "Minimizes the data's variance", "Gives the probability of the parameters given the data"], 1,
        "L(θ) = f(x|θ) as a function of θ. MLE picks the θ that makes the observed data most probable.", "q3-likelihood"),
      mc("ml-2", "Second derivative test", "Assuming no edge cases, the candidate MLE is a maximum if the second derivative of the log-likelihood at the candidate is:",
        ["Positive", "Zero", "Negative", "Undefined"], 2,
        "A negative second derivative means the log-likelihood is concave down there.", "l5-procedure"),
      mc("ml-3", "Bernoulli MLE", "A possibly weighted die is rolled $n$ times; $X_i=1$ if a six appears. The MLE of $\\theta=P(\\text{six})$ is:",
        ["(ΣXi)/(6n)", "(6/n)ΣXi", "(1/n)ΣXi", "None of the above"], 2,
        "Xi ~ Bernoulli(θ) so θ̂ = ΣXi / n, the proportion of sixes.", "l5-procedure"),
      mc("ml-4", "Poisson MLE", "Daily failures 3, 2, 4, 3, 5, 2, 3 are modeled as Poisson($\\lambda$). The MLE of $\\lambda$ is:",
        ["3", "22/7", "7/22", "5"], 1,
        "λ̂ = x̄ = 22/7 ≈ 3.14.", "l5-procedure"),
      mc("ml-5", "Why take logs", "We maximize the log-likelihood instead of the likelihood because:",
        ["The log-likelihood has a different maximizer", "Logs are monotonically increasing, so the maximizer is the same and the math is easier", "The likelihood is not defined", "It guarantees an unbiased estimator"], 1,
        "A monotone increasing transformation keeps the arg max and turns products into sums.", "l5-procedure"),
      open("ml-6", "Exponential MLE", "Data 3, 1.5 and 2.1 are a sample from an exponential distribution with parameter $\\theta$. Compute the MLE, showing the log-likelihood step.",
        "ℓ(θ) = n log θ − θΣxi; setting the derivative to 0 gives θ̂ = n/Σxi = 3/6.6 = 5/11 ≈ 0.4545. The second derivative −n/θ² is negative.", "l5-procedure"),
      open("ml-7", "Normal MLE", "For a sample from $N(\\mu,\\sigma^2)$ with $\\sigma^2$ known, derive the MLE of $\\mu$.",
        "ℓ(μ) = −Σ(xi−μ)²/(2σ²) + const; derivative Σ(xi−μ)/σ² = 0 gives μ̂ = x̄; second derivative −n/σ² < 0.", "l5-procedure"),
      open("ml-8", "Uniform edge case", "For a sample from Uniform[0, θ], explain why the usual derivative procedure fails and find the MLE.",
        "L(θ) = θ^{−n} for θ ≥ max xi is strictly decreasing, so there is no interior stationary point; the maximum is at the edge θ̂ = max xi.", "l5-edge"),
    ],
    examBank: [
      {
        id: "ml-e1",
        prompt:
          "A random variable has density $f(x\\mid\\theta)=\\tfrac{2}{\\theta^2}x$ for $0\\le x\\le\\theta$. For a sample $X_1,\\dots,X_n$: (a) write the likelihood including the support constraint, (b) show why setting the derivative of the log-likelihood to zero fails, and (c) find the MLE of $\\theta$.",
        hint: "Include the indicator that every xi ≤ θ. Is the likelihood increasing or decreasing in θ?",
        concept: "MLE edge case",
        sourceIds: ["l5-edge", "l5-procedure"],
        keyPoints: ["L(θ) = 2^n ∏xi · θ^{−2n} · 1{θ ≥ max xi}", "derivative −2n/θ ≠ 0", "decreasing in θ", "θ̂ = max xi"],
      },
      {
        id: "ml-e2",
        prompt:
          "Exponential data (parameter $\\theta$): 3, 1.5, 2.1. Derive the MLE of $\\theta$ from scratch, verify it is a maximum, and interpret the answer in terms of the sample mean.",
        hint: "Write ℓ(θ), differentiate, set to zero, then check the second derivative.",
        concept: "MLE procedure",
        sourceIds: ["l5-procedure"],
        keyPoints: ["ℓ(θ) = n log θ − θΣx", "θ̂ = n/Σx = 5/11", "second derivative −n/θ² < 0", "θ̂ = 1/x̄"],
      },
      {
        id: "ml-e3",
        prompt:
          "(Adapted from Homework 2.) (a) Decay times follow $f(x\\mid\\theta)=\\tfrac{1}{\\theta^2}xe^{-x/\\theta}$ for $x>0$. For observations 2, 3 and 4, find the MLE of $\\theta$. (b) A failure count has pmf $f(x\\mid\\theta)=(1-\\theta)^x\\theta$ with $0<\\theta<1$. For a sample $X_1,\\dots,X_n$, find the MLE of $\\theta$ and check it is a maximum.",
        hint: "Write the log-likelihood, differentiate, set to zero, solve, then check the second derivative.",
        concept: "MLE procedure",
        sourceIds: ["hw2-mle", "l5-procedure"],
        keyPoints: ["(a) ℓ = −2n log θ − Σx/θ + const", "θ̂ = Σx/(2n) = 9/6 = 1.5", "(b) ℓ = Σx log(1−θ) + n log θ", "θ̂ = n/(n + Σx) = 1/(1 + x̄)", "second derivative negative"],
      },
    ],
  },

  {
    id: "maximum-likelihood-properties",
    title: "Maximum Likelihood Properties",
    unit: "Unit 3 · Frequentist estimation",
    intro:
      "Why is the MLE worth using? It has three useful properties you can compute with: invariance, consistency and (asymptotic) unbiasedness. This topic shows what each means and where the MLE falls short in small samples.",
    willStudy: [
      "Invariance: the MLE of g(θ) is g(θ̂)",
      "Consistency: the MLE converges to the truth as n grows",
      "Bias, and why the MLE is not always unbiased",
    ],
    sources: l6,
    tutorial: [
      {
        heading: "Invariance: functions come for free",
        body: "If θ̂ is the MLE of θ, then for any function g, the MLE of g(θ) is g(θ̂). For exponential waiting times with rate λ, the MLE of the mean 1/λ is 1/λ̂ = x̄, and the MLE of the variance 1/λ² is x̄². For Uniform[0, θ], the median θ/2 has MLE max(Xi)/2.",
        formula: m`\widehat{g(\theta)} = g(\hat\theta)`,
        sourceId: "l6-invariance",
      },
      {
        heading: "Consistency",
        body: "As the sample size grows, the MLE converges in probability to the true parameter value. With enough data it will be very close to the truth.",
        formula: m`\hat\theta_n \xrightarrow{\;P\;} \theta_T \quad (n\to\infty)`,
        sourceId: "l6-consistency",
      },
      {
        heading: "Bias and the MLE",
        body: "The bias is the expected value of the estimator minus the truth. The MLE is not always unbiased in small samples. For Uniform[0, θ], the MLE is the sample maximum, which can never exceed θ, so its expectation is nθ/(n+1) and it is biased low. The bias shrinks as n grows, which fits with consistency.",
        formula: m`\text{Bias}(\hat\theta)=E[\hat\theta]-\theta, \qquad E[\max_i X_i] = \frac{n}{n+1}\,\theta`,
        sourceId: "l6-bias",
      },
    ],
    quiz: [
      mc("mp-1", "Invariance", "A fish-length sample gives MLEs $\\hat\\mu=5$ and $\\hat\\sigma^2=4$ for a normal model. The MLE of the standard deviation $\\sigma$ is:",
        ["√(4/10)", "4/10", "2", "4"], 2,
        "By invariance, σ̂ = √σ̂² = √4 = 2.", "l6-invariance"),
      mc("mp-2", "MLEs and bias", "True or false: MLEs are always unbiased.",
        ["True", "False"], 1,
        "MLEs are not guaranteed to be unbiased. The normal variance MLE divides by n and underestimates σ².", "q3-bias"),
      mc("mp-3", "Meaning of consistency", "Consistency of the MLE means:",
        ["It is unbiased for every n", "It converges to the true parameter as n → ∞", "It always equals the posterior mean", "Its variance is zero for any n"], 1,
        "Consistency: θ̂n → θ in probability as n grows.", "l6-consistency"),
      mc("mp-4", "Uniform MLE and n", "For $X_i\\sim U(0,\\theta)$, the MLE is $\\max X_i$. As $n$ increases, $E[\\hat\\theta]$:",
        ["Moves further from θ", "Gets closer to θ", "Stays constant", "Equals θ for all n"], 1,
        "E[max] = nθ/(n+1), which approaches θ. It is biased low for every finite n.", "l6-bias"),
      open("mp-5", "Invariance (exponential)", "Waiting times are exponential with rate $\\lambda$. Use invariance to give the MLE of (a) the mean waiting time and (b) the variance of the waiting times.",
        "λ̂ = 1/x̄. (a) 1/λ̂ = x̄. (b) 1/λ̂² = x̄².", "l6-invariance"),
      open("mp-6", "Invariance (uniform median)", "For a sample from Uniform[0, θ], find the MLE of the median of the distribution.",
        "The median is θ/2 and θ̂ = max Xi, so the MLE of the median is max(Xi)/2.", "l6-invariance"),
      open("mp-7", "Bias of the uniform MLE", "For $X_i\\sim U(0,\\theta)$ with $\\hat\\theta=\\max X_i$, find $E[\\hat\\theta]$ and decide whether it is unbiased. How could you fix it?",
        "P(max ≤ m) = (m/θ)^n so f(m) = n m^{n−1}/θ^n; E = nθ/(n+1) < θ, so it is biased low. Multiplying by (n+1)/n makes it unbiased.", "l6-bias"),
      open("mp-8", "Bias vs. consistency", "Explain how an estimator can be biased and still consistent, using the normal variance MLE as an example.",
        "σ̂² = (1/n)Σ(Xi−X̄)² has expectation ((n−1)/n)σ², so it is biased, but the bias (σ²/n) goes to zero and the estimator converges to σ² as n grows.", "q3-bias"),
    ],
    examBank: [
      {
        id: "mp-e1",
        prompt:
          "Let $X_1,\\dots,X_n$ be i.i.d. Uniform$(0,\\theta)$ with MLE $\\hat\\theta=\\max_i X_i$. (a) Derive the density of $\\hat\\theta$. (b) Compute $E[\\hat\\theta]$ and the bias. (c) Show the bias goes to zero. (d) Give an unbiased version and state the MLE of the median.",
        hint: "Start from P(max ≤ m) = (m/θ)^n and differentiate.",
        concept: "Bias of the MLE",
        sourceIds: ["l6-bias", "l6-invariance", "l5-edge"],
        keyPoints: ["f(m) = n m^{n−1}/θ^n", "E = nθ/(n+1)", "bias = −θ/(n+1) → 0", "(n+1)/n · max is unbiased", "median MLE = max/2"],
      },
      {
        id: "mp-e2",
        prompt:
          "Exponential waiting times have rate $\\lambda$ with MLE $\\hat\\lambda=1/\\bar{x}$. Use invariance to find the MLE of (i) the mean, (ii) the variance, and (iii) $P(X>2)$. Explain why you did not need to redo any maximization.",
        hint: "Express each quantity as a function of λ.",
        concept: "Invariance",
        sourceIds: ["l6-invariance"],
        keyPoints: ["mean 1/λ → x̄", "variance 1/λ² → x̄²", "P(X>2)=e^{−2λ} → e^{−2/x̄}", "invariance: MLE of g(θ) is g(θ̂)"],
      },
    ],
  },

  {
    id: "sampling-distributions",
    title: "Sampling Distributions",
    unit: "Unit 3 · Frequentist estimation",
    intro:
      "A statistic computed from random data is itself random. Its distribution, the sampling distribution, tells us how much the statistic varies and how precise an estimator is. This topic derives sampling distributions for the MLEs you have already found.",
    willStudy: [
      "What a sampling distribution is and what the standard error measures",
      "Sampling distributions of a sample proportion, a sample mean and a uniform maximum",
      "How sample size changes variability and shape",
    ],
    sources: l7,
    tutorial: [
      {
        heading: "A statistic is random, so it has a distribution",
        body: "Before observing data, the sample is random, so any statistic T = t(X1, …, Xn) is random too. The probability distribution of T is its sampling distribution. The statistic does not depend on the parameter, but its sampling distribution may.",
        formula: m`T = t(X_1,\dots,X_n)\;\sim\;\text{sampling distribution of } T`,
        sourceId: "l7-def",
      },
      {
        heading: "Standard error",
        body: "The standard deviation of the sampling distribution is the standard error. It measures how variable the statistic is from sample to sample. For the sample mean it is σ/√n, so larger samples are more precise.",
        formula: m`\text{SE}(\bar X)=\sqrt{\text{Var}(\bar X)}=\frac{\sigma}{\sqrt{n}}`,
        sourceId: "l7-props",
      },
      {
        heading: "Sampling distributions of MLEs",
        body: "For normal data with known variance the MLE of the mean is the sample mean, which is normal with variance σ²/n. For Bernoulli data the sample proportion has variance p(1−p)/n. For Uniform[0, θ], the maximum has density n m^(n−1)/θ^n, with mean nθ/(n+1).",
        formula: m`\hat\mu=\bar X\sim N\!\left(\mu,\tfrac{\sigma^2}{n}\right),\quad \text{Var}(\hat p)=\frac{p(1-p)}{n},\quad f_{\hat\theta}(m)=\frac{n\,m^{n-1}}{\theta^{n}}`,
        sourceId: "l7-mle",
      },
      {
        heading: "Seeing it: shape and spread",
        body: "As n increases, the sampling distribution has lower variance and becomes closer to normal (Central Limit Theorem). For a proportion near 0 or 1 it is skewed and approaches normality more slowly.",
        sourceId: "l7-visual",
      },
    ],
    quiz: [
      mc("sd-1", "Reducing variance", "Which factor reduces the variance of the sampling distribution of $\\bar{X}$?",
        ["Increasing the sample size", "Increasing the population size", "Decreasing the sample size", "None of the above"], 0,
        "Var(X̄) = σ²/n, which shrinks as n grows.", "q3-se"),
      mc("sd-2", "Standard error", "For $n$ i.i.d. observations from $N(\\mu,\\sigma^2)$, the standard error of $\\bar{X}$ is:",
        ["σ²/n", "σ²/√n", "σ/n", "σ/√n"], 3,
        "SE is the standard deviation of X̄: σ/√n. (σ²/n is the variance.)", "q3-se"),
      mc("sd-3", "Sample proportion", "$X_i\\sim$ Bernoulli($p$) i.i.d. What is the variance of the sample proportion $T=\\frac1n\\sum X_i$?",
        ["p(1−p)/n", "p/n", "p(1−p)", "p/((1−p)n)"], 0,
        "Var(Xi) = p(1−p), and Var(T) = n·p(1−p)/n² = p(1−p)/n.", "l7-mle"),
      mc("sd-4", "Centered at the mean", "A forester takes 40 measurements from a population that is $N(20,25)$. What is $P(\\bar{X}<20)$?",
        ["0.68", "0.95", "0.99", "0.5"], 3,
        "X̄ ~ N(20, 25/40) is centered at 20 and symmetric, so the probability is 0.5.", "q3-se"),
      mc("sd-5", "Skewness", "For a sample proportion with $p$ close to 0, the sampling distribution is:",
        ["Perfectly normal for any n", "Skewed, approaching normality more slowly", "Uniform", "Constant"], 1,
        "Near 0 or 1 the distribution is skewed and needs larger n to look normal.", "l7-visual"),
      open("sd-6", "Define sampling distribution", "Explain in your own words what a sampling distribution is, using the sample mean as an example, and how it relates to the standard error.",
        "It is the distribution of a statistic over repeated samples. For X̄ it is centered at μ with variance σ²/n; its standard deviation is the standard error σ/√n.", "l7-def"),
      open("sd-7", "Sampling distribution of $\\hat p$", "Patients either relapse (0) or do not (1), Bernoulli($p$). For $T=\\sum_{i=1}^n X_i$, what is the sampling distribution, and how does the sample proportion $T/n$ behave as $n$ grows?",
        "T ~ Binomial(n, p). The sample proportion has mean p and variance p(1−p)/n, so it concentrates around p and looks more normal as n grows.", "l7-mle"),
      open("sd-8", "Uniform maximum", "For $X_i\\sim U(0,\\theta)$, find the sampling distribution of $\\hat\\theta=\\max X_i$ and its mean. What happens as $n$ increases?",
        "f(m) = n m^{n−1}/θ^n on [0, θ]; E = nθ/(n+1). As n grows the maximum approaches θ.", "l7-mle"),
    ],
    examBank: [
      {
        id: "sd-e1",
        prompt:
          "A forester measures $n=40$ trees from a population that is $N(20,25)$. (a) State the sampling distribution of $\\bar{X}$ and its standard error. (b) Find $P(\\bar X<20)$ and explain it without a table. (c) Find $P(\\bar X>21)$ and explain how it changes if $n$ is quadrupled.",
        hint: "X̄ ~ N(μ, σ²/n). Standardize before reading the normal table.",
        concept: "Sampling distribution of the mean",
        sourceIds: ["l7-mle", "l7-props", "q3-se"],
        keyPoints: ["X̄ ~ N(20, 25/40)", "SE = 5/√40 ≈ 0.79", "P(X̄<20) = 0.5 by symmetry", "z = 1/0.79 ≈ 1.26 → ≈ 0.10", "SE halves when n quadruples"],
      },
      {
        id: "sd-e2",
        prompt:
          "Let $X_1,\\dots,X_n$ be i.i.d. Bernoulli($p$) and $T=\\frac1n\\sum X_i$. (a) Find $E[T]$, $\\text{Var}(T)$ and the standard error. (b) Describe how the shape and spread of the sampling distribution change with $n$ and with $p$ (e.g. $p=0.1$ vs $0.5$). (c) How large must $n$ be for the standard error to be at most 0.05 when $p=0.5$?",
        hint: "Use independence to get Var(T) = p(1−p)/n, then solve SE ≤ 0.05.",
        concept: "Sampling distribution of a proportion",
        sourceIds: ["l7-mle", "l7-visual", "l7-props"],
        keyPoints: ["E[T] = p", "Var(T) = p(1−p)/n", "skewed for p near 0 or 1", "√(0.25/n) ≤ 0.05 → n ≥ 100"],
      },
    ],
  },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

export const sourceById = (id: string): SourceRef | undefined => {
  for (const t of TOPICS) {
    const s = t.sources.find((x) => x.id === id);
    if (s) return s;
  }
  return undefined;
};

/** Lecture notes available to read in-app. Files live in course-library/ and are served at /course-library/. */
export const LECTURE_NOTES = Object.entries(LEC).map(([n, file]) => ({
  id: `lecture-${n}`,
  number: Number(n),
  title: TOPICS[Number(n) - 1].title,
  file,
}));
