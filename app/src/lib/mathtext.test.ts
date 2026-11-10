import { describe, expect, it } from "vitest";
import { normalizeMath, splitParts } from "./mathtext";

describe("a question with lettered parts", () => {
  it("puts the setting first and each part on its own line, dropping the joining commas and 'and'", () => {
    const q = "A random variable has density $f(x\\mid\\theta)=\\tfrac{2}{\\theta^2}x$ for $0\\le x\\le\\theta$. For a sample $X_1,\\dots,X_n$: (a) write the likelihood, (b) show why setting the derivative to zero fails, and (c) find the MLE of $\\theta$.";
    expect(splitParts(q)).toBe(
      "A random variable has density $f(x\\mid\\theta)=\\tfrac{2}{\\theta^2}x$ for $0\\le x\\le\\theta$. For a sample $X_1,\\dots,X_n$:\n\n(a) write the likelihood\n\n(b) show why setting the derivative to zero fails\n\n(c) find the MLE of $\\theta$.",
    );
  });

  it("leaves a question with fewer than two parts, or markers only inside maths, alone", () => {
    expect(splitParts("Find the MLE of $p$ and (a) nothing else.")).toBe("Find the MLE of $p$ and (a) nothing else.");
    expect(splitParts("Show $P(a) P(b) = 1$ holds.")).toBe("Show $P(a) P(b) = 1$ holds.");
  });
});

describe("model-written text for the renderer", () => {
  it("turns LaTeX's own delimiters into the $ forms", () => {
    expect(normalizeMath("Let \\(\\theta\\) be unknown and \\( n = 10 \\).")).toBe("Let $\\theta$ be unknown and $n = 10$.");
    expect(normalizeMath("Then \\[ \\hat\\theta = \\bar x \\] is the MLE.")).toBe("Then\n\n$$\n\\hat\\theta = \\bar x\n$$\n\nis the MLE.");
  });

  it("puts every display block on its own lines", () => {
    expect(normalizeMath("(a) Show $$L(\\theta) = \\prod f(x_i)$$ and (b) maximise it.")).toBe("(a) Show\n\n$$\nL(\\theta) = \\prod f(x_i)\n$$\n\nand (b) maximise it.");
    expect(normalizeMath("$$\n a = b \n$$")).toBe("$$\na = b\n$$");
  });

  it("wraps an align environment that was left outside maths, and leaves one inside alone", () => {
    expect(normalizeMath("So \\begin{align} a &= b \\\\ c &= d \\end{align} holds.")).toBe("So\n\n$$\n\\begin{align} a &= b \\\\ c &= d \\end{align}\n$$\n\nholds.");
    expect(normalizeMath("$$\\begin{align} a &= b \\end{align}$$")).toBe("$$\n\\begin{align} a &= b \\end{align}\n$$");
  });

  it("leaves ordinary text, inline maths and Markdown alone", () => {
    const s = "A coin is tossed $n$ times.\n\n(a) Write the likelihood.\n(b) Find the MLE of $p$.";
    expect(normalizeMath(s)).toBe(s);
  });
});
