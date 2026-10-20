import type { CheckChoice, CheckQuestion, SourceRef } from "../types";
import { lec } from "./cite";

/**
 * Comprehension checks: short questions about the idea of each tutorial step (not computation). Multiple choice is
 * marked automatically and every option says why it is right or wrong, citing the lecture page that settles it.
 * One or two "explain in a sentence" items per topic are self-rated against a reference answer.
 * Quiz answer keys are never cited here, since these show before any quiz is taken.
 *
 * Option rule (checked by learning.test.ts): the options of a question are the same shape and about the same length,
 * none carries its own reason, and each distractor is a misconception a classmate could hold. The reasons are shown
 * only after the answer is marked.
 */

const m = String.raw;

/** An option: `ok` marks the single correct one. */
const opt = (text: string, why: string, ok = false, source?: SourceRef): CheckChoice => ({ text, why, correct: ok, source });

const mc = (id: string, step: number, prompt: string, source: SourceRef, choices: CheckChoice[]): CheckQuestion => ({
  id,
  step,
  kind: "mc",
  prompt,
  choices,
  source,
});

const explain = (id: string, step: number, prompt: string, reference: string, source: SourceRef): CheckQuestion => ({
  id,
  step,
  kind: "explain",
  prompt,
  reference,
  source,
});

export const CHECKS: Record<string, CheckQuestion[]> = {
  /* ------------------------------------------------------------------ Lecture 1 */
  "probability-review-and-inference": [
    mc("pr-c1", 0, "Which of these is an inference question?",
      lec("c-pr-c1", 1, 4, "Probability vs. inferential statistics", "Starts with observed events (data) and makes inferences about the unknown parameters"), [
        opt("Ten tosses gave $8$ heads: is this coin fair?", "Observed tosses, unknown coin: this one runs in the inference direction.", true),
        opt("A fair coin, $10$ tosses: how likely are $6$ heads?", "Known coin ($p = 0.5$), future tosses: probability."),
        opt("A fair die, $60$ rolls: how many sixes to expect?", "Known die, an expected count: probability, even though it mentions data."),
      ]),
    explain("pr-c2", 0, "In one sentence: why is \"what is a good guess for $p$ after $8$ heads in $10$ tosses?\" an inference question rather than a probability question?",
      "Because the data are already observed and $p$ is unknown: inference reasons from the data back to the parameter, while probability starts from a known $p$ and computes the chance of data.",
      lec("c-pr-c2", 1, 4, "Probability vs. inferential statistics", "Starts with observed events (data) and makes inferences about the unknown parameters")),
    mc("pr-c3", 1, m`For the model $N(\mu,\sigma^2)$, what does the parameter space rule out?`,
      lec("c-pr-c3", 1, 5, "Parameter space", "The set of all possible values that parameters can take."), [
        opt("Any negative value for the mean", m`The notes give $\mu\in\mathbb{R}$: any real mean is allowed.`),
        opt("A variance that is zero or below", m`The parameter space requires $\sigma^2>0$: a variance can't be zero or negative.`, true),
        opt("A mean larger than the variance", m`The mean and the variance are not tied to each other: any real $\mu$ goes with any $\sigma^2>0$.`),
      ]),
    mc("pr-c4", 2, m`$X_1,\dots,X_n$ are i.i.d. $N(\mu,\sigma^2)$ with $\mu$ unknown. Which is a statistic?`,
      lec("c-pr-c4", 1, 5, "Statistics", "a function of the data that does not depend on any unknown parameters"), [
        opt(m`The largest observation, $\max X_i$`, "Only the data go into it.", true),
        opt(m`The sample mean minus $\mu$, $\bar X - \mu$`, m`$\mu$ goes into it, and $\mu$ is unknown.`),
        opt(m`The standardized mean $(\bar X - \mu)/\sigma$`, m`Both $\mu$ and $\sigma$ go into it, and both are unknown.`),
      ]),
    explain("pr-c5", 2, m`In one sentence: why can't $\bar X-\mu$ be a statistic when $\mu$ is unknown?`,
      m`A statistic must be computable from the data alone, and $\bar X-\mu$ needs the unknown parameter $\mu$.`,
      lec("c-pr-c5", 1, 5, "Statistics", "a function of the data that does not depend on any unknown parameters")),
    mc("pr-c6", 3, m`You report: "the mean fruit weight is between $96$ and $104$ grams, with $95\%$ confidence". Which kind of inference is that?`,
      lec("c-pr-c6", 1, 6, "Estimation", "Provides a range within which the parameter is expected to lie with a certain confidence level or probability."), [
        opt("Point estimation", "A point estimate is a single best guess; this is a range.", false, lec("c-pr-c6-0", 1, 6, "Estimation", "Provides a single best guess of a parameter.")),
        opt("Interval estimation", "A range within which the parameter is expected to lie, with a stated confidence level.", true),
        opt("Hypothesis testing", m`A test decides about a claim such as $H_0: \mu = 100$. Here you report a range instead.`, false, lec("c-pr-c6-2", 1, 6, "Hypothesis testing", "Hypothesis testing is a type of decision theory used to test a claim about a parameter using sample data.")),
      ]),
  ],

  /* ------------------------------------------------------------------ Lecture 2 */
  "frequentist-vs-bayesian": [
    mc("fb-c1", 0, m`You model IQ as $N(\mu,\sigma^2)$ but want $P(\text{IQ}>140)$. What is $P(\text{IQ}>140)$?`,
      lec("c-fb-c1", 2, 3, "Basic definitions", "the parameters associated with that distribution may or may not be the actual parameters of interest"), [
        opt(m`Neither: here only $\mu$ and $\sigma^2$ are parameters`, "A parameter is any numerical characteristic of the population. The notes use exactly this example: it need not be one of the model's parameters."),
        opt(m`A parameter of interest, a function of $\mu$ and $\sigma^2$`, m`It describes the population, and once $\mu$ and $\sigma^2$ are known it can be computed from them.`, true),
        opt("A statistic, since it is a share of IQ scores", "It describes the population, not the sample. A statistic is computed from the data.", false, lec("c-fb-c1-2", 1, 5, "Statistics", "a function of the data that does not depend on any unknown parameters")),
      ]),
    mc("fb-c2", 1, m`A frequentist calculates the $95\%$ confidence interval $[2.1,\ 3.4]$ for $\theta$. Which statement is correct?`,
      lec("c-fb-c2", 2, 4, "Frequentist statistics", "For example, we cannot talk about the probability of the parameter being in a calculated confidence interval."), [
        opt(m`$95\%$ is the chance that $\theta$ lies in $[2.1,\ 3.4]$`, m`$\theta$ is fixed, so it is either in this interval or not. There is no probability left to state about it.`),
        opt(m`$95\%$ of intervals built this way cover $\theta$`, "Frequentist probability describes the long-run behaviour of the procedure, not this one interval.", true),
        opt(m`$95\%$ of repeat estimates land in $[2.1,\ 3.4]$`, m`That is about where future estimates fall. The $95\%$ is how often intervals built this way cover $\theta$, and each new sample gives a different interval.`),
      ]),
    mc("fb-c3", 1, m`What lets a Bayesian say "$\theta$ is between $2.1$ and $3.4$ with probability $0.9$"?`,
      lec("c-fb-c3", 2, 5, "Bayesian statistics", "Because our state of knowledge for a parameter is completely characterized by a probability distribution, we can make meaningful probabilistic statements about the parameter."), [
        opt(m`$\theta$ has a distribution describing our knowledge`, m`Once $\theta$ has a distribution (the posterior), probabilities about $\theta$ are meaningful.`, true),
        opt("The sample is large enough for the CLT to apply", m`Sample size changes how precise you are, not whether $\theta$ has a distribution.`),
        opt("It uses the likelihood rather than a prior", m`Both camps use the likelihood; using it is not what separates them.`, false, lec("c-fb-c3-2", 2, 5, "The likelihood", "Both frequentists and Bayesian use what is called the likelihood when conducting statistical inference.")),
      ]),
    explain("fb-c4", 1, "In one sentence: what is the core difference between how a frequentist and a Bayesian treat a parameter?",
      "A frequentist treats it as a fixed unknown number with no distribution; a Bayesian treats it as a random variable whose prior distribution is updated to a posterior by the data.",
      lec("c-fb-c4", 2, 4, "Frequentist vs. Bayesian", "that have their own probability distributions")),
    mc("fb-c5", 2, m`Once the data are observed, the likelihood $L(\theta)$ is:`,
      lec("c-fb-c5", 2, 5, "The likelihood", "even though the mathematical expression is the same, the likelihood function is now a function of the unknown parameter"), [
        opt(m`A distribution over $\theta$ that integrates to $1$`, "The notes say it is not a probability distribution and does not integrate to one.", false, lec("c-fb-c5-0", 2, 6, "The likelihood", "It does not integrate to one. However, it does give us an idea of which parameter values may be more likely to generate data like the data we observed.")),
        opt(m`The data's joint density, with $\theta$ as the input`, m`Same expression as the pdf, but the data are now known and $\theta$ is the variable.`, true),
        opt(m`The posterior for $\theta$ when the prior is flat`, m`With a flat prior the posterior is proportional to $L(\theta)$, but the posterior is scaled to integrate to one; $L(\theta)$ itself is not.`),
      ]),
    explain("fb-c6", 2, m`In one sentence: why is the likelihood not a probability distribution for $\theta$?`,
      m`It is the probability (density) of the fixed, observed data read as a function of $\theta$, so nothing makes it integrate to one over $\theta$: it ranks parameter values by how well they explain the data, without being probabilities for them.`,
      lec("c-fb-c6", 2, 6, "The likelihood", "It does not integrate to one. However, it does give us an idea of which parameter values may be more likely to generate data like the data we observed.")),
    mc("fb-c7", 3, m`You have no information about a defect proportion $\theta\in[0,1]$. Which prior fits?`,
      lec("c-fb-c7", 2, 7, "Prior distributions", "If we have absolutely no idea or prior information to go off of, then we might choose a uniform prior on the interval"), [
        opt("Uniform on the interval $[0, 1]$", "It spreads belief evenly over the parameter space: the notes' choice with no prior information.", true),
        opt("Normal with mean $0.5$, variance $10$", "It puts probability outside $[0, 1]$, where a proportion can't be. ‹HW01› asks the same about a normal prior for a Poisson mean.", false, lec("c-fb-c7-1", 1, 5, "Parameter space", "The set of all possible values that parameters can take.")),
        opt(m`A point mass placed at $\theta = 0.5$`, "That claims certainty, the opposite of having no information."),
      ]),
    mc("fb-c8", 3, "A prior with a small standard deviation says that:",
      lec("c-fb-c8", 2, 7, "Prior distributions", "In this case, we might construct a prior with a small standard deviation (low uncertainty)."), [
        opt(m`You're fairly confident about $\theta$'s value`, "A small spread concentrates belief near the prior mean, e.g. from past experiments or an expert.", true),
        opt(m`$\theta$ varies little from one sample to the next`, m`$\theta$ is a parameter, not a statistic; the prior describes your belief about one fixed value, not sample-to-sample variation.`),
        opt(m`$\theta$ is probably close to zero`, m`The standard deviation describes spread, not where $\theta$ is.`),
      ]),
  ],

  /* ------------------------------------------------------------------ Lecture 3 */
  "posterior-distribution": [
    mc("po-c1", 0, m`Why can we drop the marginal $m_n(\mathbf{x})$ and write $\pi(\theta\mid\mathbf{x})\propto f(\mathbf{x}\mid\theta)\,\pi(\theta)$?`,
      lec("c-po-c1", 3, 3, "Bayesian inference", "After integrating out the parameter, the marginal is no longer a function of the parameter"), [
        opt(m`Its value is the same for every $\theta$`, m`$\theta$ is integrated out of the marginal, so it is a constant in $\theta$ and is usually ignored.`, true),
        opt(m`It equals $L$ at the MLE`, m`$m_n(\mathbf{x})$ averages the likelihood over the prior; it is not $L$ at one point.`),
        opt("It cancels the prior's constant", m`The prior's constant can be dropped too, but separately. The marginal is dropped because $\theta$ is integrated out of it.`),
      ]),
    mc("po-c2", 0, "A posterior with a large variance means:",
      lec("c-po-c2", 3, 2, "Posterior distribution", "High posterior variance means that we still are not very certain what a likely value is for the parameter"), [
        opt(m`We're still unsure which $\theta$ values are likely`, "High posterior variance is high remaining uncertainty.", true),
        opt("Its mean landed far from the prior's mean", "Where the posterior is centred and how spread out it is are different things."),
        opt("A large sample was used to update the prior", "Larger samples shrink the posterior variance."),
      ]),
    mc("po-c3", 1, "What makes a prior conjugate?",
      lec("c-po-c3", 3, 4, "Conjugate priors", "if the prior and posterior distribution belong to the same family"), [
        opt("Likelihood times prior lands back in its family", "That is the definition: multiply likelihood by prior and you are back in the family you started with.", true),
        opt("It is flat over the whole parameter space", m`A uniform prior ($\mathrm{Beta}(1,\,1)$) happens to be conjugate for Bernoulli data, but conjugacy is about the family, not flatness.`),
        opt("Its mean is set equal to the MLE", "Conjugacy is about the family of the prior, not where it is centred."),
      ]),
    explain("po-c4", 1, "In one sentence: why does a conjugate prior make updating easy?",
      m`Because the posterior stays in the prior's family, updating is just changing the family's parameters (for example add the successes to $\alpha$ and the failures to $\beta$), with no integral to compute.`,
      lec("c-po-c4", 3, 4, "Conjugate priors", "if the prior and posterior distribution belong to the same family")),
    mc("po-c5", 2, m`$\mathrm{Beta}(\alpha,\beta)$ prior; Bernoulli data with $\sum x_i$ successes in $n$ trials. Where do the failures go?`,
      lec("c-po-c5", 3, 4, "Bernoulli sampling", "form a random sample from the Bernoulli distribution with parameter"), [
        opt(m`Into $\beta$, as $\beta + n - \sum x_i$`, m`Successes go to $\alpha$ and failures to $\beta$.`, true),
        opt(m`Into $\alpha$, with the successes`, m`$\alpha$ collects the successes only.`),
        opt(m`Into $\beta$, adding all $n$ trials`, m`That would count every trial as a failure. Only the $n - \sum x_i$ failures go to $\beta$.`),
      ]),
    mc("po-c6", 2, m`$\mathrm{Gamma}(\alpha,\beta)$ prior; Poisson counts $x_1,\dots,x_n$. The posterior's second parameter is:`,
      lec("c-po-c6", 3, 5, "Poisson sampling", "form a random sample from the Poisson distribution with parameter"), [
        opt(m`$\beta$ plus the number of counts, $n$`, m`$\beta$ counts the observations: add $n$.`, true),
        opt(m`$\beta$ plus the total of the counts, $\sum x_i$`, m`The total count goes to $\alpha$, not $\beta$.`),
        opt(m`$\beta$ plus the failures, $n - \sum x_i$`, m`That is the Beta-Bernoulli failure count. Poisson counts have no failures; $\beta$ counts observations.`),
      ]),
    mc("po-c7", 3, m`Normal data with known variance and a $N(\mu_0,\sigma_0^2)$ prior. The posterior mean $\mu_1$ lies between:`,
      lec("c-po-c7", 3, 6, "Normal sampling", "that is the normal distribution with mean 0 and a variance of 60."), [
        opt(m`$\mu_0$ and $\bar x$, the two means it averages`, m`$\mu_1$ is a weighted average of the two, with weights set by $\sigma^2$, $n$ and $\sigma_0^2$.`, true),
        opt(m`The sample mean $\bar x$ and the true mean $\mu$`, "The true mean is unknown; the formula uses the prior mean."),
        opt(m`The values one prior sd either side of $\mu_0$`, m`The posterior mean can land anywhere between $\mu_0$ and $\bar x$, not only within one sd of $\mu_0$.`),
      ]),
    mc("po-c8", 4, m`All three priors are $N(0,\sigma_0^2)$; $10$ observations have sample mean $3$. Which prior gives the posterior mean closest to $3$?`,
      lec("c-po-c8", 3, 7, "Effect of the prior", "the prior has more influence on the posterior and the posterior mean will be pulled closer to the prior mean"), [
        opt(m`The tight prior, $\sigma_0^2 = 1/2$`, "A small prior variance is a strong prior: it pulls the posterior toward $0$ (about $2.5$ in the figure)."),
        opt(m`The vague prior, $\sigma_0^2 = 5$`, "A vague prior has little influence, so the posterior sits almost at the sample mean.", true),
        opt(m`The middle prior, $\sigma_0^2 = 1$`, "It gives about $2.75$ in the figure: closer than the tight prior, but the vague prior lets the data dominate more."),
      ]),
    explain("po-c9", 4, "In one sentence: what happens to the influence of the prior as the sample size grows?",
      "It shrinks: the posterior mean is pulled toward the sample mean and the posterior variance decreases, so the data dominate.",
      lec("c-po-c9", 3, 7, "Effect of the prior", "When the sample size is large, the posterior mean is pulled closer to the sample mean")),
  ],

  /* ------------------------------------------------------------------ Lecture 4 */
  "loss-functions-bayes-estimators": [
    mc("lf-c1", 0, m`$\delta(\mathbf{X})$ and $\delta(\mathbf{x})$: which one is the estimate?`,
      lec("c-lf-c1", 4, 2, "Point estimation"), [
        opt(m`$\delta(x)$, its value for the observed data`, m`Lower-case $x$: the data are in, so this is a number.`, true),
        opt(m`$\delta(X)$, the rule applied to random data`, m`Capital $X$: the data are still random, so this is the rule, not a number.`),
        opt(m`$\delta$ in either form: two names for one thing`, "Same rule, two different objects: one of them is a number and the other is not."),
      ]),
    explain("lf-c2", 0, "In one sentence: what is the difference between a point estimator and a point estimate?",
      m`The estimator $\delta(\mathbf{X})$ is a rule, a function of the random data; the estimate $\delta(\mathbf{x})$ is the number that rule gives for the data actually observed.`,
      lec("c-lf-c2", 4, 2, "Point estimation")),
    mc("lf-c3", 0, m`What does the loss function $L(\theta,a)$ measure?`,
      lec("c-lf-c3", 4, 2, "Loss functions", "is a real number. The interpretation is that the statistician \"loses\" by"), [
        opt(m`How much reporting $a$ costs if $\theta$ is the truth`, m`That is the definition: the statistician loses $L(\theta, a)$.`, true),
        opt(m`The likelihood of $\theta$ when the data equal $a$`, m`A different object. The likelihood $L(\theta)$ has one argument; the loss has two.`),
        opt("The average error over many repeated samples", m`That is a frequentist average over samples. $L(\theta, a)$ is the cost for one $\theta$ and one reported $a$.`),
      ]),
    mc("lf-c4", 1, m`A Bayes estimator is the value of $a$ that:`,
      lec("c-lf-c4", 4, 3, "Bayes estimator", "be a loss function. For each possible value"), [
        opt("Minimizes the expected posterior loss", m`Definition ‹1.3›: for each $x$, choose the $a$ that makes $E[L(\theta, a) | x]$ smallest.`, true),
        opt("Maximizes the likelihood of the data", "That is the MLE from ‹L05›, which uses no prior and no loss.", false, lec("c-lf-c4-1", 5, 2, "Maximum likelihood", "these are fixed unknown values")),
        opt("Maximizes the posterior density itself", "That is the posterior mode. Under squared or absolute error the Bayes estimator is the posterior mean or median instead."),
      ]),
    mc("lf-c5", 1, m`Why average the loss over the posterior instead of just computing $L(\theta, a)$?`,
      lec("c-lf-c5", 4, 2, "Loss functions", "However, when we view the parameter as a random variable with a distribution, we can find the expected loss."), [
        opt(m`$\theta$ is unknown, so we average over our beliefs`, m`Viewing $\theta$ as random, the expected posterior loss is computable even though $\theta$ isn't known.`, true),
        opt(m`The loss $L(\theta, a)$ already picks out a best $a$`, m`With $\theta$ unknown, $L(\theta, a)$ is not a number you can minimize on its own; it has to be averaged over something first.`),
        opt("The prior is no longer needed after the data", m`The posterior still contains the prior. We average over it because $\theta$ is unknown.`),
      ]),
    mc("lf-c6", 2, "Under squared error loss, the Bayes estimator is the posterior:",
      lec("c-lf-c6", 4, 3, "Squared error loss", "Suppose that the squared error loss function is used and that the posterior mean of"), [
        opt("mean", "Theorem ‹2.1›: squared error is minimized by the posterior mean.", true),
        opt("median", "The median belongs to a different loss.", false, lec("c-lf-c6-1", 4, 5, "Absolute error loss", "Suppose that the absolute error loss function is used. Then, the Bayes estimator of")),
        opt("mode", "The mode maximizes the posterior density; squared error loss leads to the mean."),
      ]),
    explain("lf-c7", 2, "In one sentence: why does the choice of loss function change the Bayes estimate?",
      "Because the Bayes estimate minimizes expected loss, and different losses penalize errors differently: squared error is minimized by the posterior mean, absolute error by the posterior median.",
      lec("c-lf-c7", 4, 3, "Common loss functions", "Absolute error loss does not penalize extreme deviations as much as squared error loss.")),
    mc("lf-c8", 3, "Compared with squared error loss, absolute error loss:",
      lec("c-lf-c8", 4, 3, "Common loss functions", "Absolute error loss does not penalize extreme deviations as much as squared error loss."), [
        opt("Penalizes big misses less than squared error", "Its loss grows in proportion to the miss, not with its square.", true),
        opt("Gives the posterior mean rather than the median", "It is the other way round."),
        opt("Is only usable when the posterior is normal", "It works for any posterior; with a normal posterior it just happens to agree with squared error."),
      ]),
    mc("lf-c9", 3, m`The posterior is $N(3/26,\ 60/13)$. Under absolute error loss, the Bayes estimate is:`,
      lec("c-lf-c9", 4, 5, "Absolute error loss", "Suppose that the absolute error loss function is used. Then, the Bayes estimator of"), [
        opt("$3/26$, the posterior median", "Absolute error gives the posterior median; a normal is symmetric, so median = mean.", true),
        opt("$0.125$, the observed sample mean", "The prior pulls the posterior toward $0$, so it is centred at $3/26$, not at the sample mean."),
        opt(m`$0$, the mean of the $N(0,\ 60)$ prior`, "$0$ is the prior mean; the data moved the posterior away from it."),
      ]),
  ],

  /* ------------------------------------------------------------------ Lecture 5 */
  "maximum-likelihood-estimation": [
    mc("ml-c1", 0, "A friend estimates a coin's heads probability $p$ by maximum likelihood from $10$ flips. In that method, how is $p$ treated?",
      lec("c-ml-c1", 5, 2, "Maximum likelihood", "these are fixed unknown values"), [
        opt("A fixed number, estimated from the flips alone", "Maximum likelihood treats $p$ as a number we don't know: no prior, nothing random, and only the data to go on.", true),
        opt("A fixed number, but it needs a prior before it can be estimated", "A prior is a Bayesian ingredient; maximum likelihood estimates $p$ with no prior at all."),
        opt("A random quantity with a flat prior on $[0, 1]$", "That is a Bayesian setup: a flat prior leads to a posterior, not to the maximum likelihood procedure."),
      ]),
    explain("ml-c2", 0, "In one sentence: what does the MLE choose, and how is that different from a Bayes estimate?",
      "It chooses the parameter value that makes the observed data most probable, using only the likelihood; a Bayes estimate also uses a prior and minimizes expected posterior loss.",
      lec("c-ml-c2", 5, 2, "Maximum likelihood", "these are fixed unknown values")),
    mc("ml-c3", 1, m`Why may we maximize $\ell(\theta)=\log L(\theta)$ instead of $L(\theta)$?`,
      lec("c-ml-c3", 5, 2, "Procedure", "the argument that maximizes the likelihood is the same as the argument that maximizes the log likelihood"), [
        opt(m`$\theta$ values rank the same under $L$ and $\log L$`, m`$\log$ is increasing, so it keeps the order of $L$'s values: the largest $L$ is still the largest $\log L$, at the same $\theta$. And sums are easier to differentiate than products.`, true),
        opt(m`$\log L$ is concave, so a critical point is a max`, "Not always: concavity depends on the model, not on taking logs, so a critical point still has to be checked."),
        opt(m`$\log L$ has the same maximum value, so either works`, m`The maximum values differ ($\log L$ against $L$); only where the maximum sits is shared.`),
      ]),
    mc("ml-c4", 1, m`You solve $\ell'(\theta)=0$ and get a candidate $\hat\theta$. What must you still check?`,
      lec("c-ml-c4", 5, 2, "Procedure", "to ensure that this is a maximum and not a minimum"), [
        opt(m`That $\ell$ bends downward at $\hat\theta$, not upward`, m`Step ‹4› in symbols: $\ell''(\hat\theta)<0$. A negative second derivative means the curve bends down there, so the candidate is a maximum and not a minimum.`, true),
        opt(m`That $\ell'$ rises through zero at $\hat\theta$, not falls`, m`A slope that goes from negative to positive marks the bottom of a dip: $\ell''(\hat\theta)>0$, a minimum, the opposite of what you want.`),
        opt(m`That $\ell$ itself is zero at $\hat\theta$, not just $\ell'$`, m`The value of $\ell$ at the candidate settles nothing: a log likelihood is rarely zero at its peak. Step ‹4› checks the curvature there, $\ell''(\hat\theta)<0$.`),
      ]),
    mc("ml-c5", 2, m`Daily failure counts are modeled as $\mathrm{Poisson}(\lambda)$. Which statistic is the MLE of $\lambda$?`,
      lec("c-ml-c5", 5, 4, "Examples", "The number of failures in a computer system in a day follows a Poisson distribution with parameter"), [
        opt(m`The sample mean, $\sum x_i / n$`, m`$\ell'(\lambda) = \sum x_i/\lambda - n = 0$ gives $\hat\lambda = \bar x$; $\lambda$ is the Poisson mean, as ‹L01 · P3› defines it.`, true),
        opt("The sample median of the counts", m`The median does not maximize the Poisson likelihood; setting the derivative to zero gives $\sum x_i/n$.`),
        opt(m`The total over $n - 1$, $\sum x_i/(n - 1)$`, m`Dividing by $n - 1$ is the sample-variance convention; the derivative gives $\sum x_i/n$ exactly.`),
      ]),
    mc("ml-c6", 3, m`$\mathrm{Uniform}[0,\theta]$: why does setting $\ell'(\theta)=0$ fail?`,
      lec("c-ml-c6", 5, 4, "Edge cases", "a global maximum could lie on the edge of the parameter space"), [
        opt(m`$L$ falls for $\theta \ge \max x_i$, so the peak is at the edge`, m`No interior stationary point: $L(\theta)=\theta^{-n}$ falls, and the maximum sits on the boundary $\max x_i$.`, true),
        opt(m`The MLE is $\tfrac{n+1}{n}\max x_i$, which $\ell' = 0$ cannot reach`, m`That scaled maximum is unbiased for $\theta$, as ‹L06› shows, but it is not where $L$ is largest: $L$ is largest at $\max x_i$ itself.`),
        opt(m`$\ell'(\theta)>0$ on the interior, so $\ell$ keeps rising past $\max x_i$`, m`It falls, not rises: wherever $L$ is positive, $\ell'(\theta)=-n/\theta<0$, so $\ell$ is largest at the smallest allowed $\theta$, which is $\max x_i$.`),
      ]),
    mc("ml-c7", 3, m`$\mathrm{Uniform}[0,\theta]$ data: $0.8$, $2.6$, $1.9$. What is the likelihood at $\theta = 2$?`,
      lec("c-ml-c7", 2, 5, "The likelihood", "If the parameter space has a constraint, we can use indicator functions to signify this in the likelihood."), [
        opt(m`$L(2) = 0$: the value $2.6$ can't occur when $\theta = 2$`, m`Every observation must be at most $\theta$, so $L(\theta)=\theta^{-3}\,\mathbf{1}\{\theta\ge 2.6\}$ is $0$ below $2.6$; the MLE is the smallest allowed value, $2.6$.`, true),
        opt(m`$L(2) = 2^{-3}$, from $L(\theta)=\theta^{-n}$ with $n = 3$`, m`$\theta^{-n}$ is the likelihood only where every observation is possible, $\theta\ge 2.6$; below that the indicator makes it $0$.`),
        opt(m`$L(2) = 2^{-2}$, counting the two values below $2$`, m`The likelihood is a product over all three observations, and the factor for $2.6$ is $0$, so the whole product is $0$.`),
      ]),
    explain("ml-c8", 3, "In one sentence: when should you look at the edges of the parameter space?",
      m`When the likelihood has no interior stationary point or keeps rising or falling (often when the support depends on $\theta$, as for $\mathrm{Uniform}[0,\theta]$), because the global maximum can then sit on the boundary.`,
      lec("c-ml-c8", 5, 4, "Edge cases", "Thus, it is good practice to consider the edges of the parameter space if applicable.")),
  ],

  /* ------------------------------------------------------------------ Lecture 6 */
  "maximum-likelihood-properties": [
    mc("mp-c1", 0, m`From a normal sample of $n=10$ fish lengths, the MLE of $\sigma^2$ is $4$. What is the MLE of $\sigma$?`,
      lec("c-mp-c1", 6, 2, "Invariance", "This means that as long as we can compute an MLE for the parameter"), [
        opt("$2$, the square root of $4$", m`By invariance $\hat\sigma=\sqrt{\hat\sigma^2}=2$.`, true),
        opt("$0.4$, after dividing by $n = 10$", "Nothing in the question divides by $n$: $0.4$ comes from nowhere."),
        opt(m`$4$, unchanged from $\hat\sigma^2$`, m`$\sigma$ and $\sigma^2$ are different quantities; invariance applies the square root.`),
      ]),
    mc("mp-c2", 0, "What does invariance save you from?",
      lec("c-mp-c2", 6, 2, "Invariance", "For example, medians and other quantiles are typically a function of the distribution parameters."), [
        opt(m`Re-deriving the MLE of each $g(\theta)$`, m`MLE of $g(\theta) = g(\hat\theta)$: a median, a variance or a probability comes for free.`, true),
        opt(m`Checking that $\hat\theta$ is a maximum`, m`You still need $\hat\theta$ itself, found and checked the usual way.`),
        opt(m`Correcting $g(\hat\theta)$ for bias`, m`Invariance says nothing about bias; it only tells you the MLE of $g(\theta)$.`),
      ]),
    explain("mp-c3", 0, m`In one sentence: how do you get the MLE of the median of $\mathrm{Uniform}[0,\theta]$?`,
      m`Write the median as a function of $\theta$, namely $\theta/2$, and plug in the MLE $\hat\theta=\max_i X_i$, giving $\max_i X_i/2$ by invariance.`,
      lec("c-mp-c3", 6, 3, "Invariance", "form a random sample from the uniform distribution on")),
    mc("mp-c4", 1, "Consistency of the MLE means:",
      lec("c-mp-c4", 6, 3, "Consistency", "the MLE becomes a better and better approximation of the true parameter"), [
        opt(m`$\hat\theta_n \to  \theta_T$ in probability as $n$ grows`, "With more data the MLE gets as close to the truth as you like.", true),
        opt(m`$E[\hat\theta_n] = \theta_T$, whatever the sample size`, "That is unbiasedness, which the MLE can lack in small samples while still being consistent.", false, lec("c-mp-c4-1", 6, 4, "Is the MLE unbiased?", "This means that the bias tends to zero as the sample size grows.")),
        opt(m`$\mathrm{Var}(\hat\theta_n)$ is the smallest possible`, m`Consistency is about converging to $\theta_T$, not about the variance at a fixed $n$.`),
      ]),
    mc("mp-c5", 2, m`For $U(0,\theta)$, $\mathbb{E}[\max_i X_i]=\frac{n}{n+1}\theta$. So the MLE $\max_i X_i$ is:`,
      lec("c-mp-c5", 6, 4, "Is the MLE unbiased?", "This means that the bias tends to zero as the sample size grows."), [
        opt(m`Biased low by $\theta/(n+1)$`, m`Bias $=\frac{n}{n+1}\theta-\theta=-\theta/(n+1)$, which is negative.`, true),
        opt(m`Biased high by $\theta/(n+1)$`, m`The maximum can never exceed $\theta$, so its average falls short of $\theta$: the bias is negative.`),
        opt(m`Biased low by $\theta/n$`, m`$\frac{n}{n+1}\theta-\theta=-\theta/(n+1)$, not $-\theta/n$; the two agree only as $n$ grows.`),
      ]),
    mc("mp-c6", 2, "Can a biased estimator still be consistent?",
      lec("c-mp-c6", 6, 4, "Is the MLE unbiased?", "This means that the bias tends to zero as the sample size grows."), [
        opt("Yes, if its bias goes to $0$ as $n$ grows", "Biased for each finite $n$, consistent in the limit, like the uniform maximum.", true),
        opt("Yes, if its variance stays the same", m`A consistent estimator needs to concentrate on $\theta_T$; a variance that never shrinks stops that.`),
        opt("Yes, if its bias is positive", "The sign doesn't matter; what matters is that the bias shrinks to zero."),
      ]),
    explain("mp-c7", 2, "In one sentence: what does bias measure?",
      m`How far the estimator's expected value (its average over repeated samples) is from the true parameter: $\mathrm{Bias}(\hat\theta)=\mathbb{E}[\hat\theta]-\theta$.`,
      lec("c-mp-c7", 6, 3, "Is the MLE unbiased?", "of an estimator is the difference between its expected value (on average, what it estimates) and the true value of the parameter")),
  ],

  /* ------------------------------------------------------------------ Lecture 7 */
  "sampling-distributions": [
    mc("sd-c1", 0, "Why does a statistic have a distribution at all?",
      lec("c-sd-c1", 7, 2, "Definition", "it has some probability distribution. Since a statistic is just a function of the data, it is also random, with some distribution."), [
        opt("It is computed from a random sample", "Random data in, random statistic out.", true),
        opt(m`It depends on the unknown $\theta$`, m`A statistic never depends on $\theta$; only its distribution may.`),
        opt("It varies as the population shifts", "The population is fixed; the sample drawn from it is what changes."),
      ]),
    mc("sd-c2", 0, m`$\mathrm{Bernoulli}(p)$ data and $T=\frac1n\sum X_i$. Which is true?`,
      lec("c-sd-c2", 7, 2, "Definition", "A statistic is only a function of the data"), [
        opt("$T$ uses only data; its distribution involves $p$", m`The notes: the statistic is a function of the data only, yet its distribution may depend on $\theta$.`, true),
        opt("$T$ depends on $p$, so it is not a statistic", "You compute $T$ from the data alone."),
        opt("$T$ is free of $p$, and so is its distribution", m`Its mean is $p$ and its variance $p(1-p)/n$.`),
      ]),
    explain("sd-c3", 0, "In one sentence: what is a sampling distribution?",
      "The probability distribution of a statistic over repeated random samples: it shows how the statistic varies from sample to sample.",
      lec("c-sd-c3", 7, 2, "Definition", "it has some probability distribution. Since a statistic is just a function of the data, it is also random, with some distribution.")),
    mc("sd-c4", 1, "The standard error of a statistic is:",
      lec("c-sd-c4", 7, 2, "Properties", "The standard deviation of the sampling distribution is called the"), [
        opt("The sd of its sampling distribution", "That is the definition.", true),
        opt("The variance of its sampling distribution", "That is the SE squared, not the SE."),
        opt("The standard deviation of the raw data", m`$\sigma$ describes one observation; the SE describes the statistic.`),
      ]),
    explain("sd-c5", 1, m`In one sentence: why does a larger sample give a more precise estimate of $\mu$?`,
      m`Because the standard error of $\bar X$ is $\sigma/\sqrt n$, which shrinks as $n$ grows, so $\bar X$ varies less from sample to sample.`,
      lec("c-sd-c5", 7, 3, "Some MLE sampling distributions", "as the sample size increases, the sampling variance of")),
    mc("sd-c6", 2, m`As $n$ grows, the sampling variance of $\hat\mu=\bar X$:`,
      lec("c-sd-c6", 7, 3, "Some MLE sampling distributions", "as the sample size increases, the sampling variance of"), [
        opt(m`Shrinks, as $\sigma^2/n$ does`, m`$\sigma^2/n$ shrinks with $n$: the estimator becomes more precise.`, true),
        opt("Grows, as more values add up", m`The sum's variance grows, but $\bar X$ divides by $n$, so its variance shrinks.`),
        opt(m`Stays at $\sigma^2$, the data's own`, m`$\sigma^2$ is one observation's variance; $\bar X$'s is $\sigma^2/n$.`),
      ]),
    mc("sd-c7", 3, m`A sample proportion with $p=0.1$ and $n=5$. Its sampling distribution is:`,
      lec("c-sd-c7", 7, 5, "Visualizing a sampling distribution", "close to zero (or one) the sampling distribution is skewed and approaches normality more slowly"), [
        opt("Skewed; it nears normal slowly", "Near $0$ or $1$ the distribution is lopsided.", true),
        opt(m`Roughly normal, since $n \ge  5$ here`, "$n = 5$ is far too small for a proportion near $0$; the figure shows it lopsided."),
        opt("Symmetric about its mean, $p = 0.1$", "A proportion near $0$ piles up at $0$ with a long right tail."),
      ]),
    mc("sd-c8", 3, "What does the Central Limit Theorem say about sampling distributions?",
      lec("c-sd-c8", 7, 2, "Properties", "increases, the sampling distribution of many statistics becomes approximately normal (Central Limit Theorem)."), [
        opt("Many become nearly normal as $n$ grows", "Property ‹3› in the notes.", true),
        opt("They are normal for any sample size", "Only approximately, and only as $n$ grows."),
        opt("The data become normal as $n$ grows too", "The data keep their own distribution. It is the statistic's distribution that becomes normal.", false, lec("c-sd-c8-2", 1, 4, "Law of Large Numbers and CLT", "approaches a normal distribution regardless of the original distribution of")),
      ]),
  ],
};

export const checksFor = (topicId: string): CheckQuestion[] => CHECKS[topicId] ?? [];
