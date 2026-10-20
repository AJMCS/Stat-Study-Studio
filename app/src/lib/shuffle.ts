/**
 * A stable shuffle: the same id always gives the same order, so an option list never jumps around between visits,
 * but the correct option is not always first. Returns the display order as indexes into the original list.
 */
export function stableOrder(id: string, n: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let seed = h >>> 0;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** One random seed per browser session (sessionStorage "studio-shuffle"; a test can set it for a repeatable order). */
function sessionSeed(): string {
  try {
    let s = sessionStorage.getItem("studio-shuffle");
    if (!s) {
      s = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("studio-shuffle", s);
    }
    return s;
  } catch {
    return String(Date.now());
  }
}

/**
 * A session shuffle for a flashcard or quiz deck: the order says nothing about which term comes next (not the known
 * ones last, not the lecture's order), differs from session to session, and stays put while the deck is being run.
 */
export function sessionShuffle(id: string, n: number): number[] {
  return stableOrder(`${id}-${sessionSeed()}`, n);
}
