/**
 * Reference material for learning without an AI model: worked examples for the tutorials, a recall prompt per
 * topic, and a full reference solution for every exam question. Learners compare their own work with these and
 * score themselves. Everything is written in the notation of the lecture notes; solutions are Markdown with LaTeX.
 */

const m = String.raw;

export interface WorkedExample {
  /** Index of the tutorial step this example belongs under. */
  step: number;
  prompt: string;
  solution: string;
}

export interface Recall {
  prompt: string;
  reference: string;
  keyPoints: string[];
}

/* ------------------------------------------------------------------ worked examples */

export const EXAMPLES: Record<string, WorkedExample[]> = {
  "probability-review-and-inference": [
    {
      step: 0,
      prompt: m`A fair coin is tossed 10 times. What is the probability of exactly 6 heads?`,
      solution: m`The parameter is known ($p=0.5$) and we compute the probability of data, so this is a probability problem.

$$P(X=6)=\binom{10}{6}\left(\tfrac12\right)^{6}\left(\tfrac12\right)^{4}=\frac{210}{1024}\approx 0.205.$$`,
    },
    {
      step: 0,
      prompt: m`You toss a coin 10 times and see 8 heads. Give a good guess for the probability of heads, and say why this is inference.`,
      solution: m`Now the data (8 heads in 10 tosses) are observed and the parameter $p$ is unknown, so we are inferring $p$ from data. A natural point estimate is the sample proportion

$$\hat p=\frac{8}{10}=0.8,$$

which is also the value of $p$ that makes the observed data most probable (Lecture 5 shows why).`,
    },
  ],
  "frequentist-vs-bayesian": [
    {
      step: 2,
      prompt: m`You observe 8 heads in 10 independent flips of a coin with unknown heads probability $p$. Write the likelihood and say where it is largest.`,
      solution: m`The likelihood is the binomial probability of the observed data, viewed as a function of $p$:

$$L(p)=\binom{10}{8}p^{8}(1-p)^{2}\ \propto\ p^{8}(1-p)^{2}.$$

It is near zero for small $p$, peaks at $p=0.8$, and falls to zero at $p=1$ (the plot in Lecture 2). It is **not** a probability distribution over $p$: it does not integrate to one.`,
    },
    {
      step: 2,
      prompt: m`Scores are $N(\mu,10^2)$ with $\mu$ unknown. You observe 45, 55 and 50. Write the likelihood of $\mu$.`,
      solution: m`$$L(\mu)=\prod_{i=1}^{3}\frac{1}{10\sqrt{2\pi}}\exp\left\{-\frac{(x_i-\mu)^2}{200}\right\}\ \propto\ \exp\left\{-\frac{(45-\mu)^2+(55-\mu)^2+(50-\mu)^2}{200}\right\}.$$

The sum of squares equals $3(\mu-50)^2+50$, so $L(\mu)\propto \exp\{-3(\mu-50)^2/200\}$, which is largest at the sample mean $\mu=50$.`,
    },
    {
      step: 3,
      prompt: m`Lamp lifetimes are exponential with rate $\theta$. You want a gamma prior for $\theta$ with mean $0.0002$ and standard deviation $0.0001$. Find $\alpha$ and $\beta$.`,
      solution: m`For Gamma($\alpha,\beta$) the mean is $\alpha/\beta$ and the variance is $\alpha/\beta^2$. So

$$\frac{\alpha}{\beta}=0.0002,\qquad \frac{\alpha}{\beta^2}=(0.0001)^2=10^{-8}.$$

Dividing, $\beta=\dfrac{0.0002}{10^{-8}}=20000$, and then $\alpha=0.0002\cdot 20000=4$. So $\pi(\theta)=\dfrac{20000^4}{\Gamma(4)}\theta^{3}e^{-20000\theta}$.`,
    },
  ],
  "posterior-distribution": [
    {
      step: 2,
      prompt: m`You observe 8 heads in 10 flips and use a Beta(1, 1) prior. Find the posterior of $p$, its mean and its variance.`,
      solution: m`Add successes to $\alpha$ and failures to $\beta$:

$$p\mid\mathbf{x}\sim\text{Beta}(1+8,\ 1+10-8)=\text{Beta}(9,3).$$

Mean: $\dfrac{9}{9+3}=\dfrac34$. Variance: $\dfrac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}=\dfrac{27}{144\cdot 13}=\dfrac{3}{208}\approx 0.0144$.`,
    },
    {
      step: 2,
      prompt: m`A store models arrivals as Poisson with unknown rate $\lambda$ per hour and a Gamma(3, 2) prior. One hour has $X=3$ arrivals. Find the posterior, the prior variance and the posterior variance.`,
      solution: m`$$\lambda\mid x\sim\text{Gamma}(3+3,\ 2+1)=\text{Gamma}(6,3).$$

Prior variance $\alpha/\beta^2=3/4$; posterior variance $6/9=2/3$. The data reduced our uncertainty.`,
    },
    {
      step: 3,
      prompt: m`Differences in calorie labels are modeled as $N(\mu,100)$. The prior is $\mu\sim N(0,60)$, and $n=20$ differences average $\bar x_n=0.125$. Find the posterior of $\mu$.`,
      solution: m`With $\sigma^2=100$, $\mu_0=0$, $\sigma_0^2=60$:

$$\mu_1=\frac{\sigma^2\mu_0+n\sigma_0^2\bar x_n}{\sigma^2+n\sigma_0^2}=\frac{0+20\cdot 60\cdot 0.125}{100+1200}=\frac{150}{1300}=\frac{3}{26}\approx 0.115,$$

$$\sigma_1^2=\frac{\sigma^2\sigma_0^2}{\sigma^2+n\sigma_0^2}=\frac{6000}{1300}=\frac{60}{13}\approx 4.62.$$

So $\mu\mid\mathbf{x}\sim N(3/26,\ 60/13)$.`,
    },
  ],
  "loss-functions-bayes-estimators": [
    {
      step: 2,
      prompt: m`With a uniform prior and 8 heads in 10 flips, what is the Bayes estimate of $p$ under squared error loss?`,
      solution: m`The posterior is Beta(9, 3). Under squared error loss the Bayes estimator is the posterior mean, so

$$\delta(\mathbf{x})=E(p\mid\mathbf{x})=\frac{9}{12}=\frac34.$$`,
    },
    {
      step: 2,
      prompt: m`A Gamma(3, 2) prior on a Poisson rate and an observed $X=3$: find the Bayes estimate under squared error loss.`,
      solution: m`The posterior is Gamma(6, 3), with mean $6/3=2$. So the Bayes estimate is $2$ (compare the prior mean $3/2$ and the data value $3$: it sits between them).`,
    },
    {
      step: 3,
      prompt: m`In the calorie example the posterior is $N(3/26,\,60/13)$. What is the Bayes estimate of $\mu$ under absolute error loss?`,
      solution: m`Under absolute error loss the Bayes estimator is the posterior **median**. A normal posterior is symmetric, so its median equals its mean: the estimate is $3/26\approx 0.115$, the same as under squared error loss.`,
    },
  ],
  "maximum-likelihood-estimation": [
    {
      step: 2,
      prompt: m`A sample of size 3 from an exponential distribution with parameter $\theta$ is $X_1=3$, $X_2=1.5$, $X_3=2.1$. Compute the MLE of $\theta$.`,
      solution: m`$$L(\theta)=\prod_{i=1}^3\theta e^{-\theta x_i}=\theta^3e^{-6.6\theta},\qquad \ell(\theta)=3\log\theta-6.6\theta.$$

Set $\ell'(\theta)=\dfrac{3}{\theta}-6.6=0$, so $\hat\theta=\dfrac{3}{6.6}=\dfrac{5}{11}\approx 0.4545$. Check: $\ell''(\theta)=-3/\theta^2<0$, so it is a maximum. In general $\hat\theta=n/\sum x_i=1/\bar x$.`,
    },
    {
      step: 2,
      prompt: m`Daily failures 3, 2, 4, 3, 5, 2, 3 are Poisson($\lambda$). Find the MLE of $\lambda$.`,
      solution: m`$$\ell(\lambda)=\Big(\sum x_i\Big)\log\lambda-n\lambda+\text{const},\qquad \ell'(\lambda)=\frac{\sum x_i}{\lambda}-n=0\ \Rightarrow\ \hat\lambda=\bar x=\frac{22}{7}\approx 3.14.$$`,
    },
    {
      step: 3,
      prompt: m`For a sample from Uniform$[0,\theta]$, why does setting the derivative to zero fail, and what is the MLE?`,
      solution: m`$$L(\theta)=\theta^{-n}\,\mathbf{1}\{\theta\ge \max_i x_i\}.$$

For $\theta\ge\max x_i$ we have $\ell(\theta)=-n\log\theta$, so $\ell'(\theta)=-n/\theta$ is never zero. $L$ is decreasing in $\theta$, so we want the smallest allowed value, on the edge of the parameter space: $\hat\theta=\max_i X_i$.`,
    },
  ],
  "maximum-likelihood-properties": [
    {
      step: 0,
      prompt: m`Waiting times are exponential with parameter $\lambda$. What are the MLEs of the mean waiting time and of the variance of the waiting times?`,
      solution: m`The MLE of the rate is $\hat\lambda=1/\bar x$. The mean is $1/\lambda$ and the variance is $1/\lambda^2$, so by invariance

$$\widehat{\text{mean}}=\frac{1}{\hat\lambda}=\bar x,\qquad \widehat{\text{variance}}=\frac{1}{\hat\lambda^{2}}=\bar x^{2}.$$`,
    },
    {
      step: 0,
      prompt: m`For a sample from Uniform$[0,\theta]$, find the MLE of the median of the distribution.`,
      solution: m`The median is $\theta/2$ and $\hat\theta=\max X_i$, so by invariance the MLE of the median is $\max_i X_i/2$.`,
    },
    {
      step: 2,
      prompt: m`Show that $\hat\theta=\max_i X_i$ is biased for $\theta$ when $X_i\sim U(0,\theta)$.`,
      solution: m`$P(\hat\theta\le m)=(m/\theta)^n$, so the density is $f(m)=\dfrac{n\,m^{n-1}}{\theta^{n}}$ on $[0,\theta]$. Then

$$E[\hat\theta]=\int_0^\theta m\cdot\frac{n\,m^{n-1}}{\theta^{n}}\,dm=\frac{n}{n+1}\,\theta.$$

The bias is $-\theta/(n+1)$: biased low for every finite $n$, but it tends to zero as $n$ grows (consistent with consistency). Multiplying by $(n+1)/n$ gives an unbiased estimator.`,
    },
  ],
  "sampling-distributions": [
    {
      step: 2,
      prompt: m`$X_1,\dots,X_n$ are i.i.d. Bernoulli($p$) and $T=\frac1n\sum X_i$. What is the sampling distribution of $T$, and its variance?`,
      solution: m`$nT=\sum X_i\sim\text{Binomial}(n,p)$, so $T$ takes values $0,\tfrac1n,\dots,1$ with binomial probabilities. Its mean is $p$ and, by independence,

$$\text{Var}(T)=\frac{1}{n^{2}}\cdot n\,p(1-p)=\frac{p(1-p)}{n}.$$

The standard error is $\sqrt{p(1-p)/n}$; it shrinks as $n$ grows.`,
    },
    {
      step: 2,
      prompt: m`$X_i\sim N(\mu,\sigma^2)$ i.i.d. with $\sigma^2$ known. Find the sampling distribution of the MLE $\hat\mu$.`,
      solution: m`The MLE is $\hat\mu=\bar X$. A sum of independent normals is normal, so

$$\bar X\sim N\!\left(\mu,\ \frac{\sigma^{2}}{n}\right),\qquad \text{SE}(\bar X)=\frac{\sigma}{\sqrt n}.$$`,
    },
    {
      step: 2,
      prompt: m`For $X_i\sim U(0,\theta)$ find the sampling distribution of $\hat\theta=\max X_i$ and its mean.`,
      solution: m`$P(\hat\theta\le m)=(m/\theta)^{n}$ for $0\le m\le\theta$, so $f_{\hat\theta}(m)=\dfrac{n\,m^{n-1}}{\theta^{n}}$ and

$$E[\hat\theta]=\frac{n}{n+1}\,\theta\ \longrightarrow\ \theta\quad(n\to\infty).$$`,
    },
  ],
};

/* ------------------------------------------------------------------ recall prompts */

export const RECALL: Record<string, Recall> = {
  "probability-review-and-inference": {
    prompt: "From memory: explain how probability and statistical inference differ, using a coin as an example.",
    reference: m`**Probability** starts from a known model, for example a fair coin ($p=0.5$), and asks how likely some data are ($P(6\text{ heads in }10)$). **Inference** runs the other way: the data are observed (8 heads in 10 tosses), the parameter is unknown, and we ask what the data say about it (a good guess is $\hat p=0.8$). A *statistic* is a function of the data that does not depend on unknown parameters, such as $\bar X$.`,
    keyPoints: [
      "Probability: parameters are known and we compute chances of data",
      "Inference: data are observed and the parameters are unknown",
      "Gave or recognized a concrete example, such as the coin",
    ],
  },
  "frequentist-vs-bayesian": {
    prompt: "From memory: how do frequentists and Bayesians treat the parameter, and what is the likelihood?",
    reference: m`Frequentists treat the parameter as **fixed but unknown**, so probability statements are about procedures over repeated samples (a confidence interval either contains the parameter or not). Bayesians treat it as **random**, with a prior $\pi(\theta)$ before the data and a posterior after. Both use the **likelihood** $L(\theta)=\prod f(X_i\mid\theta)$: the density of the observed data as a function of $\theta$. It is not a probability distribution over $\theta$.`,
    keyPoints: [
      "Frequentist: the parameter is fixed and unknown",
      "Bayesian: the parameter is random, with a prior that is updated to a posterior",
      "The likelihood is the density of the observed data viewed as a function of the parameter",
      "The likelihood is not a probability distribution over the parameter",
    ],
  },
  "posterior-distribution": {
    prompt: "From memory: what is the posterior distribution, and how does conjugate updating work for Beta-Bernoulli?",
    reference: m`The posterior $\pi(\theta\mid\mathbf{x})$ is the distribution of the parameter **after** seeing the data, and $\pi(\theta\mid\mathbf{x})\propto f(\mathbf{x}\mid\theta)\pi(\theta)$ (the marginal of the data is a constant). A prior is **conjugate** if the posterior is in the same family. For Bernoulli data with a Beta($\alpha,\beta$) prior the posterior is Beta($\alpha+\sum x_i,\ \beta+n-\sum x_i$): add successes to $\alpha$ and failures to $\beta$. With little data the prior matters; with a lot, the posterior mean moves toward the sample mean.`,
    keyPoints: [
      "Posterior is proportional to likelihood times prior",
      "Conjugate means the prior and posterior are in the same family",
      "Beta($\\alpha+\\sum x_i$, $\\beta+n-\\sum x_i$) for Bernoulli data",
      "More data (or a vaguer prior) means the data dominate",
    ],
  },
  "loss-functions-bayes-estimators": {
    prompt: "From memory: what is a Bayes estimator, and how do squared error and absolute error loss differ?",
    reference: m`A loss function $L(\theta,a)$ says how costly it is to report $a$ when the truth is $\theta$. The **Bayes estimator** $\delta(\mathbf{x})$ is the $a$ that minimizes the expected posterior loss $E[L(\theta,a)\mid\mathbf{x}]$. Under **squared error** loss it is the posterior **mean**; under **absolute error** loss it is the posterior **median** (which punishes extreme errors less).`,
    keyPoints: [
      "Bayes estimator minimizes the expected posterior loss",
      "Squared error loss gives the posterior mean",
      "Absolute error loss gives the posterior median",
    ],
  },
  "maximum-likelihood-estimation": {
    prompt: "From memory: how do you find an MLE, and when can the usual method fail?",
    reference: m`The MLE $\hat\theta=\arg\max_\theta L(\theta\mid\mathbf{x})$ treats $\theta$ as a fixed unknown (no prior). Because $\log$ is increasing we maximize $\ell=\log L$: (1) write $\ell(\theta)$, (2) set $\ell'(\theta)=0$, (3) solve for the candidate $\hat\theta$, (4) check $\ell''(\hat\theta)<0$. It can fail when the maximum is on the **edge** of the parameter space: for Uniform$[0,\theta]$ the likelihood is decreasing in $\theta$ for $\theta\ge\max x_i$, so $\hat\theta=\max X_i$.`,
    keyPoints: [
      "The MLE maximizes the likelihood; the parameter is fixed and there is no prior",
      "Steps: log-likelihood, differentiate and set to zero, solve, check the second derivative is negative",
      "The maximum can be on the boundary, such as Uniform[0, θ] with the maximum observation",
    ],
  },
  "maximum-likelihood-properties": {
    prompt: "From memory: what are invariance and consistency of the MLE, and is the MLE always unbiased?",
    reference: m`**Invariance:** if $\hat\theta$ is the MLE of $\theta$, then $g(\hat\theta)$ is the MLE of $g(\theta)$. **Consistency:** $\hat\theta_n\xrightarrow{P}\theta_T$ as $n\to\infty$. The MLE is **not always unbiased**: for $U(0,\theta)$, $E[\max X_i]=\tfrac{n}{n+1}\theta$, and the normal variance MLE divides by $n$ so $E[\hat\sigma^2]=\tfrac{n-1}{n}\sigma^2$. The bias tends to zero as $n$ grows.`,
    keyPoints: [
      "Invariance: the MLE of g(θ) is g of the MLE",
      "Consistency: the MLE converges to the true value as n grows",
      "Not always unbiased, with an example (uniform maximum or the normal variance MLE)",
      "The bias goes to zero as n grows",
    ],
  },
  "sampling-distributions": {
    prompt: "From memory: what is a sampling distribution, and why does the standard error shrink as n grows?",
    reference: m`A statistic $T=t(X_1,\dots,X_n)$ is random because the data are, so it has a distribution: its **sampling distribution**. The **standard error** is the standard deviation of that distribution. For the sample mean, $\text{SE}(\bar X)=\sigma/\sqrt n$, so larger samples are more precise; the distribution also becomes closer to normal (Central Limit Theorem).`,
    keyPoints: [
      "A statistic is random, and its distribution is the sampling distribution",
      "The standard error is the standard deviation of the sampling distribution",
      "SE of the sample mean is σ/√n, so more data means a more precise estimate",
    ],
  },
};

/* ------------------------------------------------------------------ exam reference solutions */

export const SOLUTIONS: Record<string, string> = {
  "pr-e1": m`**(a)** $P(X=6)=\binom{10}{6}(1/2)^{10}=\dfrac{210}{1024}\approx 0.205$.

**(b)** The data (8 heads in 10 tosses) are observed and $p$ is unknown, so this is an inference problem. A reasonable point estimate is $\hat p=8/10=0.8$: it is the sample proportion, and also the value of $p$ that makes the observed data most probable.`,
  "pr-e2": m`A **statistic** is a function of the data that does not depend on any unknown parameter.

(i) $\bar X$: yes. (ii) $S^2$: yes. (iv) $\max_i X_i$: yes. (iii) $\bar X-\mu$: **no**, because it depends on the unknown $\mu$ and cannot be computed from the sample alone.`,
  "fb-e1": m`**(a)** Mean $\alpha/\beta=0.0002$ and variance $\alpha/\beta^2=(0.0001)^2=10^{-8}$. Dividing, $\beta=0.0002/10^{-8}=20000$ and $\alpha=0.0002\cdot 20000=4$.

**(b)** $\pi(\theta)=\dfrac{20000^{4}}{\Gamma(4)}\theta^{3}e^{-20000\theta}$ for $\theta>0$. It describes what we believe about the lifetime rate before seeing any data: around $0.0002$ per hour, give or take $0.0001$.`,
  "fb-e2": m`$$L(\mu)=\prod_{i=1}^{3}\frac{1}{10\sqrt{2\pi}}e^{-(x_i-\mu)^2/200}=\big(10\sqrt{2\pi}\big)^{-3}\exp\left\{-\frac{(45-\mu)^2+(55-\mu)^2+(50-\mu)^2}{200}\right\}.$$

The sum of squares is $3(\mu-50)^2+50$, so $L$ is largest at the sample mean, $\mu=50$.

A frequentist treats $\mu$ as fixed and maximizes $L$ (the MLE). A Bayesian multiplies $L$ by a prior $\pi(\mu)$ to get the posterior.`,
  "fb-e3": m`**(a)** Mean $\alpha/\beta=5$ and variance $\alpha/\beta^2=2$ give $\beta=5/2$ and $\alpha=25/2$, so
$$\pi(\theta)=\frac{(5/2)^{25/2}}{\Gamma(25/2)}\,\theta^{23/2}e^{-(5/2)\theta},\quad\theta>0.$$

**(b)** Not reasonable. A normal prior puts positive probability on $\lambda\le 0$, but a Poisson mean must be positive. A gamma prior lives on $(0,\infty)$, so it respects the parameter space.`,
  "fb-e4": m`**(a)** $L(p)=\binom{100}{60}p^{60}(1-p)^{40}\propto p^{60}(1-p)^{40}$.

**(b)** The sketch is near zero at $p=0$ and $p=1$, rises to a single narrow peak at $p=0.6$ and falls again.

**(c)** $L(\lambda)=\prod_{i=1}^{10}\dfrac{e^{-\lambda}\lambda^{x_i}}{x_i!}\propto e^{-10\lambda}\lambda^{\sum x_i}$.`,
  "po-e1": m`**(a)** With $\sigma^2=100$, $\mu_0=0$, $\sigma_0^2=60$, $n=20$, $\bar x_n=0.125$:
$$\mu_1=\frac{\sigma^2\mu_0+n\sigma_0^2\bar x_n}{\sigma^2+n\sigma_0^2}=\frac{150}{1300}=\frac{3}{26},\qquad \sigma_1^2=\frac{\sigma^2\sigma_0^2}{\sigma^2+n\sigma_0^2}=\frac{6000}{1300}=\frac{60}{13}.$$

**(b)** $\mu_1=w\,\bar x_n+(1-w)\,\mu_0$ with $w=\dfrac{n\sigma_0^2}{\sigma^2+n\sigma_0^2}=\dfrac{12}{13}$, so almost all of the weight is on the data.

**(c)** As $n\to\infty$, $w\to 1$ and $\sigma_1^2\to 0$: the posterior concentrates at $\bar x_n$.`,
  "po-e2": m`**(a)** The likelihood is $f(\mathbf{x}\mid p)=p^{\sum x_i}(1-p)^{n-\sum x_i}$ and the prior is $\pi(p)=1$ on $[0,1]$. So
$$\pi(p\mid\mathbf{x})\propto p^{\sum x_i}(1-p)^{n-\sum x_i}=p^{(1+\sum x_i)-1}(1-p)^{(1+n-\sum x_i)-1},$$
the kernel of Beta($1+\sum x_i,\ 1+n-\sum x_i$).

**(b)** The prior (Beta(1,1)) and the posterior are both Beta distributions: same family, so updating only changes the parameters. That is what conjugate means.`,
  "po-e3": m`The posterior is Gamma($\alpha+\sum x_i,\ \beta+n$), with mean
$$\frac{\alpha+n\bar X_n}{\beta+n}=\underbrace{\frac{n}{\beta+n}}_{\gamma_n}\bar X_n+\underbrace{\frac{\beta}{\beta+n}}_{1-\gamma_n}\cdot\frac{\alpha}{\beta}.$$
Since the prior mean is $\mu_0=\alpha/\beta$, this is $\gamma_n\bar X_n+(1-\gamma_n)\mu_0$ with $\gamma_n=\dfrac{n}{\beta+n}\to 1$ as $n\to\infty$.`,
  "po-e4": m`**(a)** Posterior precision is prior precision plus data precision: $\dfrac{1}{\sigma_1^2}=\dfrac{1}{\sigma_0^2}+\dfrac{n}{\sigma^2}$, so $30=\dfrac{1}{\sigma_0^2}+22$ and $\sigma_0^2=\dfrac18$.

The posterior mean is $\mu_1=\dfrac{\mu_0/\sigma_0^2+n\bar x/\sigma^2}{30}=\dfrac{8\mu_0+22\cdot 32}{30}=30$, so $8\mu_0=196$ and $\mu_0=24.5$. The prior is $N(24.5,\ 1/8)$.

**(b)** $\text{Beta}(2+3,\ 200+100-3)=\text{Beta}(5,297)$.`,
  "lf-e1": m`Let $m=E(\theta\mid\mathbf{x})$. Then
$$E[(\theta-a)^2\mid\mathbf{x}]=\text{Var}(\theta\mid\mathbf{x})+(m-a)^2,$$
because $(\theta-a)^2=(\theta-m)^2+2(\theta-m)(m-a)+(m-a)^2$ and the cross term has expectation $0$. This is smallest at $a=m$, so the Bayes estimator under squared error loss is the posterior mean.

For absolute error loss, $\frac{d}{da}E|\theta-a|=P(\theta<a\mid\mathbf{x})-P(\theta>a\mid\mathbf{x})$, which is zero when each side has probability $1/2$: the posterior median. The two coincide when the posterior is symmetric (for example normal).`,
  "lf-e2": m`**(a)** $\text{Beta}(2+7,\ 2+50-7)=\text{Beta}(9,45)$.

**(b)** Under squared error loss the estimate is the posterior mean: $\dfrac{9}{54}=\dfrac16\approx 0.167$.

**(c)** The sample proportion is $7/50=0.14$. The Bayes estimate is higher: it is pulled toward the prior mean $1/2$ of the Beta(2,2) prior, so it lies between $0.14$ and $0.5$.`,
  "lf-e3": m`**(a)** $\alpha/\beta=0.2$ and $\alpha/\beta^2=1$ give $\beta=0.2$ and $\alpha=0.04$.

**(b)** The likelihood is $\propto\lambda^{10}e^{-\lambda\sum x_i}=\lambda^{10}e^{-30\lambda}$, so the posterior is $\propto\lambda^{0.04-1+10}e^{-(0.2+30)\lambda}$, that is Gamma($10.04,\ 30.2$).

**(c)** Squared error loss gives the posterior mean: $\dfrac{10.04}{30.2}\approx 0.332$.`,
  "ml-e1": m`**(a)** $L(\theta)=\prod_{i=1}^n\dfrac{2x_i}{\theta^2}\,\mathbf{1}\{x_i\le\theta\}=2^n\Big(\prod x_i\Big)\theta^{-2n}\,\mathbf{1}\{\theta\ge\max x_i\}$.

**(b)** For $\theta\ge\max x_i$, $\ell(\theta)=\text{const}-2n\log\theta$ and $\ell'(\theta)=-2n/\theta$, which is never zero.

**(c)** $L$ is decreasing in $\theta$, so the largest likelihood is at the smallest allowed $\theta$: $\hat\theta=\max_i X_i$.`,
  "ml-e2": m`$\ell(\theta)=n\log\theta-\theta\sum x_i$, so $\ell'(\theta)=\dfrac n\theta-\sum x_i=0$ gives $\hat\theta=\dfrac{n}{\sum x_i}=\dfrac{3}{6.6}=\dfrac{5}{11}$.

Check: $\ell''(\theta)=-n/\theta^2<0$, so it is a maximum. Since $\bar x=2.2$, $\hat\theta=1/\bar x$: the reciprocal of the sample mean.`,
  "ml-e3": m`**(a)** $L(\theta)=\prod\dfrac{x_i e^{-x_i/\theta}}{\theta^2}$, so $\ell(\theta)=-2n\log\theta-\dfrac{\sum x_i}{\theta}+\text{const}$ and $\ell'(\theta)=-\dfrac{2n}{\theta}+\dfrac{\sum x_i}{\theta^2}=0$ gives $\hat\theta=\dfrac{\sum x_i}{2n}=\dfrac{9}{6}=1.5$. At $\hat\theta$, $\ell''=\dfrac{2n}{\hat\theta^2}-\dfrac{2\sum x_i}{\hat\theta^3}=-\dfrac{2n}{\hat\theta^2}<0$.

**(b)** $L(\theta)=(1-\theta)^{\sum x_i}\theta^n$, $\ell=\sum x_i\log(1-\theta)+n\log\theta$, and $\ell'=-\dfrac{\sum x_i}{1-\theta}+\dfrac n\theta=0$ gives $n(1-\theta)=\theta\sum x_i$, so $\hat\theta=\dfrac{n}{n+\sum x_i}=\dfrac{1}{1+\bar x}$. Check: $\ell''=-\dfrac{\sum x_i}{(1-\theta)^2}-\dfrac{n}{\theta^2}<0$.`,
  "mp-e1": m`**(a)** $P(\hat\theta\le m)=(m/\theta)^n$, so $f(m)=\dfrac{n\,m^{n-1}}{\theta^n}$ on $[0,\theta]$.

**(b)** $E[\hat\theta]=\int_0^\theta m\dfrac{n\,m^{n-1}}{\theta^n}dm=\dfrac{n}{n+1}\theta$, so $\text{Bias}(\hat\theta)=-\dfrac{\theta}{n+1}$: biased low.

**(c)** $-\theta/(n+1)\to 0$ as $n\to\infty$.

**(d)** $\dfrac{n+1}{n}\max_i X_i$ is unbiased. By invariance the MLE of the median $\theta/2$ is $\max_i X_i/2$.`,
  "mp-e2": m`The MLE is $\hat\lambda=1/\bar x$. By invariance (no new maximization needed):

(i) mean $=1/\lambda$, so the MLE is $\bar x$. (ii) variance $=1/\lambda^2$, so the MLE is $\bar x^2$. (iii) $P(X>2)=e^{-2\lambda}$, so the MLE is $e^{-2\hat\lambda}=e^{-2/\bar x}$.

Invariance says the MLE of $g(\theta)$ is $g(\hat\theta)$ for any function $g$.`,
  "sd-e1": m`**(a)** $\bar X\sim N(20,\ 25/40)$, with standard error $5/\sqrt{40}\approx 0.79$.

**(b)** $P(\bar X<20)=0.5$ by symmetry about the mean.

**(c)** $P(\bar X>21)=P\!\left(Z>\dfrac{1}{0.79}\right)=P(Z>1.26)\approx 0.103$. Quadrupling $n$ halves the standard error to about $0.395$, so $z\approx 2.53$ and the probability drops to about $0.006$.`,
  "sd-e2": m`**(a)** $E[T]=p$, $\text{Var}(T)=\dfrac{p(1-p)}{n}$, and $\text{SE}=\sqrt{p(1-p)/n}$.

**(b)** As $n$ grows the variance shrinks and the shape approaches a normal curve (CLT). For $p$ near $0$ or $1$ (say $0.1$) the distribution is skewed and approaches normality more slowly than at $p=0.5$.

**(c)** For $p=0.5$: $\sqrt{0.25/n}\le 0.05\iff n\ge 100$.`,
};
