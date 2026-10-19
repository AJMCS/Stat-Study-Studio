import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * The opening animation on the home screen, once per browser session.
 *
 * One diagram in the reference's node-and-curve language draws on left to right as a single orange route travels
 * it: data (a stem plot) into a node, branching to a prior and a likelihood (rings with small densities inside),
 * which merge into the focal posterior node, drawn exactly where the θ, the "o" of Studio, will form. The letters
 * then draw on left to right while the diagram under them steps back left to right; the solid Geist letters rise
 * through the outlines; the posterior node becomes Studio's "o" and its bar draws across: θ. The words are pulled
 * rightward into the θ and vanish at its left side, the θ settles as the home mark while its ring draws, and two
 * branches grow from it to Learn and Practice, with the headline close behind. On a phone the line is as wide as
 * the screen and its θ, level with the centred home mark, glides in to it as the ring draws.
 *
 * SVG + the Web Animations API only. Every colour is a theme variable set in CSS (a theme switch recolours it
 * mid-flight); only opacity, transforms and dash offsets are animated, and the θ never travels.
 */

const KEY = "studio-intro-seen";
let seenThisLoad = false;
// The intro belongs to opening the app at its front door, not to coming back to it from another screen.
const openedAtHome = typeof location !== "undefined" && /^#?\/?$/.test(location.hash);

export function shouldPlayIntro(): boolean {
  if (seenThisLoad || !openedAtHome) return false;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(KEY) !== "1";
  } catch {
    return true; // storage unavailable: once per page load (seenThisLoad)
  }
}

function markSeen() {
  seenThisLoad = true;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

/** The θ mark's geometry (ThetaMark's 48-unit box), with the ring drawn in halves from the bottom. */
const OVAL_R = "M24 9.5 C30.5 9.5 33.5 16 33.5 24 C33.5 32 30.5 38.5 24 38.5";
const OVAL_L = "M24 9.5 C17.5 9.5 14.5 16 14.5 24 C14.5 32 17.5 38.5 24 38.5";
// one closed stroke from the bottom (where the branches leave), clockwise all the way round
const RING = "M24 46 A22 22 0 0 1 24 2 A22 22 0 0 1 24 46";
const BAR = "M15.5 24 L32.5 24";
export const MARK_RING_W = 1.2;
export const MARK_OVAL_W = 4;

const WORDS = ["Stats", "Study", "Studi"] as const;
const FONT = '700 100px "Geist Sans"';
const FACES = [FONT, '500 13px "Geist Mono"', '500 30px "Caveat"'];
const TRACK = -0.03; // em, as set on the SVG text
const GAP = 0.27; // em between words
const THETA_GAP = 0.1; // em of clear space between the i and the θ

// ------------------------------------------------------------------------------------------------ path geometry
type Pt = [number, number];
type Seg = [number, number, number, number, number, number];
interface Stroke {
  start: Pt;
  segs: Seg[];
}
const line = (a: Pt, b: Pt): Stroke => ({ start: a, segs: [[a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3, a[0] + (2 * (b[0] - a[0])) / 3, a[1] + (2 * (b[1] - a[1])) / 3, b[0], b[1]]] });
const pathOf = (start: Pt, parts: (Pt[] | Pt)[]): Stroke => {
  const segs: Seg[] = [];
  let p = start;
  for (const part of parts) {
    if (typeof part[0] === "number") {
      const e = part as Pt;
      segs.push(line(p, e).segs[0]);
      p = e;
    } else {
      const [c1, c2, e] = part as Pt[];
      segs.push([c1[0], c1[1], c2[0], c2[1], e[0], e[1]]);
      p = e;
    }
  }
  return { start, segs };
};
const smooth = (pts: Pt[]): Stroke => {
  const segs: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    segs.push([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]]);
  }
  return { start: pts[0], segs };
};
const f = (n: number) => n.toFixed(1);
const dOf = (s: Stroke) => `M${f(s.start[0])} ${f(s.start[1])} ` + s.segs.map((g) => `C${g.map(f).join(" ")}`).join(" ");

// ------------------------------------------------------------------------------------------------ the letters
interface Box {
  x0: number;
  x1: number;
  top: number;
  bot: number;
  xh: number; // y of the x-height
  base: number;
  stem: number;
}
interface Stem {
  cx: number;
  top: number;
  bot: number;
}
/**
 * Centre-line strokes of Geist Bold's letters, in the glyph's ink box inset by half a stem. When `stick` is set the
 * letter's main stem is left out (a rigid stick from the stick plot becomes it) and returned separately.
 */
function letter(ch: string, b: Box, stick: boolean): { strokes: Stroke[]; stem?: Stem } {
  const h = b.stem / 2;
  const X = (u: number) => b.x0 + h + u * (b.x1 - b.x0 - 2 * h);
  const span = (y0: number, y1: number) => (v: number) => y0 + v * (y1 - y0);
  const Y = span(b.top + h, b.bot - h);
  const P = (u: number, v: number, y = Y): Pt => [X(u), y(v)];
  const yx = b.xh + h;
  const yb = b.base - h;
  switch (ch) {
    case "S":
    case "s":
      return {
        strokes: [
          pathOf(P(0.93, 0.2), [
            [P(0.86, 0.05), P(0.7, 0), P(0.5, 0)],
            [P(0.25, 0), P(0.07, 0.12), P(0.07, 0.29)],
            [P(0.07, 0.52), P(0.93, 0.46), P(0.93, 0.72)],
            [P(0.93, 0.9), P(0.75, 1), P(0.5, 1)],
            [P(0.27, 1), P(0.1, 0.92), P(0.06, 0.78)],
          ]),
        ],
      };
    case "t":
      return stick
        ? { strokes: [line([X(0), yx], [X(1), yx]), pathOf(P(0.36, 0.76), [[P(0.36, 0.95), P(0.5, 1), P(0.72, 1)], P(1, 1)])], stem: { cx: X(0.36), top: Y(0), bot: Y(0.76) } }
        : { strokes: [line([X(0), yx], [X(1), yx]), pathOf(P(0.36, 0), [P(0.36, 0.76), [P(0.36, 0.95), P(0.5, 1), P(0.72, 1)], P(1, 1)])] };
    case "a": {
      const arch = [[P(0.16, 0.06), P(0.32, 0), P(0.5, 0)], [P(0.76, 0), P(0.9, 0.12), P(0.9, 0.36)]] as Pt[][];
      const bowl = pathOf(P(0.9, 0.46), [
        [P(0.6, 0.47), P(0.06, 0.5), P(0.06, 0.76)],
        [P(0.06, 0.92), P(0.2, 1), P(0.38, 1)],
        [P(0.62, 1), P(0.9, 0.88), P(0.9, 0.64)],
      ]);
      return stick
        ? { strokes: [pathOf(P(0.08, 0.22), arch), bowl], stem: { cx: X(0.9), top: Y(0.36), bot: Y(1) } }
        : { strokes: [pathOf(P(0.08, 0.22), [...arch, P(0.9, 1)]), bowl] };
    }
    case "u":
      return { strokes: [pathOf(P(0.04, 0), [P(0.04, 0.6), [P(0.04, 0.88), P(0.22, 1), P(0.46, 1)], [P(0.7, 1), P(0.96, 0.84), P(0.96, 0.58)]]), line(P(0.96, 0), P(0.96, 1))] };
    case "d": {
      const B = span(yx, yb);
      const bowl = pathOf(P(0.9, 0.2, B), [
        [P(0.8, 0.04, B), P(0.64, 0, B), P(0.46, 0, B)],
        [P(0.2, 0, B), P(0.04, 0.2, B), P(0.04, 0.5, B)],
        [P(0.04, 0.8, B), P(0.2, 1, B), P(0.46, 1, B)],
        [P(0.64, 1, B), P(0.8, 0.96, B), P(0.9, 0.8, B)],
      ]);
      return stick ? { strokes: [bowl], stem: { cx: X(1), top: Y(0), bot: Y(1) } } : { strokes: [bowl, line(P(1, 0), P(1, 1))] };
    }
    case "y": {
      const vb = (yb - (b.top + h)) / (b.bot - h - (b.top + h));
      return { strokes: [line(P(0, 0), P(0.52, vb)), pathOf(P(1, 0), [P(0.47, 0.86), [P(0.4, 0.98), P(0.32, 1), P(0.1, 1)]])] };
    }
    case "i": {
      const cx = (b.x0 + b.x1) / 2;
      const r = b.stem * 0.16;
      const dy = b.top + h;
      const k = r * 0.55;
      return {
        strokes: [
          line([cx, b.top + b.stem * 1.3 + h], [cx, b.base - h]),
          pathOf([cx + r, dy], [
            [[cx + r, dy + k], [cx + k, dy + r], [cx, dy + r]],
            [[cx - k, dy + r], [cx - r, dy + k], [cx - r, dy]],
            [[cx - r, dy - k], [cx - k, dy - r], [cx, dy - r]],
            [[cx + k, dy - r], [cx + r, dy - k], [cx + r, dy]],
          ]),
        ],
      };
    }
  }
  return { strokes: [] };
}

// ------------------------------------------------------------------------------------------------ layout
interface Layout {
  w: number;
  h: number;
  fs: number;
  stacked: boolean; // phone: one line as wide as the screen; its θ glides in to the centred home mark at the end
  xs: number[]; // text x of each word
  bases: number[]; // baseline of each word
  cap: number;
  thetaCx: number;
  thetaCy: number;
  thetaLeft: number; // the θ's outer left side: the edge the words slide into
  theta: { x: number; y: number; s: number };
  target: { x: number; y: number; s: number };
}

function measure(target: DOMRect | null): Layout {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const stacked = w < 640;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = FONT;
  const width = (t: string) => (ctx.measureText(t).width + t.length * TRACK * 100) / 100;
  const cap = (ctx.measureText("H").actualBoundingBoxAscent || 71) / 100;
  const ws = WORDS.map(width);
  const ovalH = cap * 1.03; // the θ stands a touch taller than a cap, like a real theta
  const s1em = ovalH / (29 + MARK_OVAL_W);
  const halfW = (9.5 + MARK_OVAL_W / 2) * s1em; // θ centre to its outer left side, in em
  const margin = stacked ? 16 : Math.max(24, w * 0.05);
  // the θ forms where the home mark rests (on a phone: level with it, at the end of the line); words stand to its left
  const thetaCy = target ? target.top + target.height / 2 : h * 0.5;
  const ringR = 22 * s1em; // the θ's ring, in em
  const toTheta = ws[0] + GAP + ws[1] + GAP + ws[2] + THETA_GAP + halfW; // line start to the θ's centre, in em
  const phoneFs = Math.min(48, (w - 2 * margin) / (toTheta + ringR));
  const thetaCx = stacked ? margin + toTheta * phoneFs : target ? target.left + target.width / 2 : w * 0.7;
  let fs: number;
  let xs: number[];
  let bases: number[];
  const base0 = (f: number) => thetaCy + (ovalH * f) / 2;
  {
    fs = stacked ? phoneFs : Math.min(132, (thetaCx - margin) / (toTheta + 0.45), h * 0.15);
    const left = thetaCx - toTheta * fs;
    xs = [left, left + (ws[0] + GAP) * fs, left + (ws[0] + GAP + ws[1] + GAP) * fs];
    bases = [0, 1, 2].map(() => base0(fs));
  }
  const s = s1em * fs;
  const theta = { x: thetaCx - 24 * s, y: thetaCy - 24 * s, s };
  const tgt = target ? { x: target.left, y: target.top, s: target.width / 48 } : { x: thetaCx - 64, y: thetaCy - 64, s: 128 / 48 };
  return { w, h, fs, stacked, xs, bases, cap: cap * fs, thetaCx, thetaCy, thetaLeft: thetaCx - halfW * fs, theta, target: tgt };
}

interface Node {
  x: number;
  y: number;
  r: number;
  glyph?: string; // a small density drawn inside the ring
  dot: boolean;
  focal?: boolean;
}
interface Built {
  strokes: { d: string; x: number }[]; // the letters' thin construction strokes, with where each letter starts
  sticks: { x: number; top: number; bot: number }[];
  nodes: Node[];
  edges: string[]; // muted branches
  route: string[]; // the one orange route, as its segments between nodes (drawn one after another)
  labels: { x: number; y: number; text: string }[];
  labelSize: number;
  note: { x: number; y: number; size: number; lines: string[] };
  ink: { x0: number; x1: number }[];
  fill: { top: number; bot: number }; // the band the solid letters rise through
  x0: number; // the composition's left and right, for the left-to-right clock
  x1: number;
}

/** Once the words are on the page: each glyph's ink box and strokes, and the diagram laid out around them. */
function build(L: Layout, texts: SVGTextElement[]): Built {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = FONT;
  const sc = L.fs / 100;
  const m = (t: string) => ctx.measureText(t);
  const stem = (m("i").actualBoundingBoxRight + m("i").actualBoundingBoxLeft) * sc;
  const xhEm = m("x").actualBoundingBoxAscent / 100;
  const strokes: Built["strokes"] = [];
  const ink: { x0: number; x1: number }[] = [];
  let top = Infinity, bot = -Infinity;
  WORDS.forEach((word, wi) => {
    const t = texts[wi];
    const base = L.bases[wi];
    let x0 = Infinity, x1 = -Infinity;
    [...word].forEach((ch, ci) => {
      const ox = t.getStartPositionOfChar(ci).x;
      const g = m(ch);
      const box: Box = {
        x0: ox - g.actualBoundingBoxLeft * sc,
        x1: ox + g.actualBoundingBoxRight * sc,
        top: base - g.actualBoundingBoxAscent * sc,
        bot: base + g.actualBoundingBoxDescent * sc,
        xh: base - xhEm * L.fs,
        base,
        stem,
      };
      x0 = Math.min(x0, box.x0);
      x1 = Math.max(x1, box.x1);
      top = Math.min(top, box.top);
      bot = Math.max(bot, box.bot);
      strokes.push(...letter(ch, box, false).strokes.map((s) => ({ d: dOf(s), x: box.x0 })));
    });
    ink.push({ x0, x1 });
  });

  const fs = L.fs;
  const R = 22 * L.theta.s; // the θ's ring: the posterior node is drawn at exactly this size and place
  const S = L.thetaCy; // the spine runs through the θ's centre
  const hump = (cx: number, cy: number, w: number, hgt: number, sd: number) =>
    dOf(smooth(Array.from({ length: 13 }, (_, i) => {
      const u = i / 12;
      const y = i === 0 || i === 12 ? 0 : hgt * Math.exp(-((u - 0.5) ** 2) / (2 * sd * sd));
      return [cx - w / 2 + u * w, cy - y] as Pt;
    })));
  const sCurve = (a: Pt, b: Pt) => {
    const mx = (a[0] + b[0]) / 2;
    return dOf(pathOf(a, [[[mx, a[1]], [mx, b[1]], b]]));
  };
  const labelSize = Math.round(fs * 0.24);
  const sticksOf = (xa: number, xb: number, y: number, unit: number) =>
    [0.4, 0.85, 0.6, 1, 0.5].map((hh, i) => ({ x: xa + ((xb - xa) * (i + 0.5)) / 5, top: y - hh * unit, bot: y }));

  if (!L.stacked) {
    // data → (prior, likelihood) → posterior, branching like the reference: the posterior is the θ's place
    const A: Node = { x: ink[0].x0 - 0.3 * fs, y: S, r: 0.11 * fs, dot: true };
    const D: Node = { x: ink[0].x1 + 0.12 * fs, y: S, r: 0.13 * fs, dot: true };
    const xm = (ink[1].x0 + ink[1].x1) / 2;
    const P: Node = { x: xm, y: S - 1.05 * fs, r: 0.3 * fs, dot: false };
    const Lk: Node = { x: xm, y: S + 1.05 * fs, r: 0.3 * fs, dot: false };
    const T: Node = { x: L.thetaCx, y: S, r: R, dot: false, focal: true };
    P.glyph = hump(P.x, P.y + P.r * 0.45, P.r * 1.4, P.r * 0.7, 0.24);
    Lk.glyph = hump(Lk.x, Lk.y + Lk.r * 0.45, Lk.r * 1.4, Lk.r * 1.0, 0.13);
    T.glyph = hump(T.x, T.y + T.r * 0.5, T.r * 1.45, T.r * 1.15, 0.1);
    const edges = [sCurve([D.x + D.r, S], [P.x - P.r, P.y]), sCurve([P.x + P.r, P.y], [T.x - T.r, S])];
    const route = [
      `M${f(A.x + A.r)} ${f(S)} H${f(D.x - D.r)}`,
      sCurve([D.x + D.r, S], [Lk.x - Lk.r, Lk.y]),
      sCurve([Lk.x + Lk.r, Lk.y], [T.x - T.r, S]),
    ];
    const lab = labelSize >= 14;
    return {
      strokes,
      sticks: sticksOf(A.x + A.r * 2, D.x - D.r * 2, S, 0.62 * fs),
      nodes: [A, D, P, Lk, T],
      edges,
      route,
      labels: lab
        ? [
            { x: (A.x + D.x) / 2, y: S + labelSize * 1.5, text: "data" },
            { x: P.x, y: P.y - P.r - labelSize * 0.5, text: "prior" },
            { x: Lk.x, y: Lk.y + Lk.r + labelSize * 1.1, text: "likelihood" },
            { x: T.x, y: S + R + labelSize * 1.2, text: "posterior" },
          ]
        : [],
      labelSize,
      note: { x: A.x - A.r, y: P.y - P.r - labelSize * 2.6, size: Math.max(18, Math.round(fs * 0.26)), lines: ["a place to study statistics, one unknown at a time"] },
      ink,
      fill: { top, bot },
      x0: A.x - A.r,
      x1: T.x + T.r,
    };
  }
  // phone: the line stays clear; data → likelihood run along a spine above it and the prior along one below it,
  // and both drop straight into the posterior node, which is the θ's ring at the end of the line
  const base = L.bases[2];
  const above = base - L.cap - 0.95 * fs;
  const below = base + 1.55 * fs;
  const r = 0.16 * fs;
  const A: Node = { x: 16 + r, y: above, r, dot: true };
  const D: Node = { x: L.w * 0.42, y: above, r, dot: true };
  const N: Node = { x: L.thetaCx, y: above, r, dot: true };
  const Pn: Node = { x: 16 + r, y: below, r, dot: true };
  const M: Node = { x: L.thetaCx, y: below, r, dot: true };
  const T: Node = { x: L.thetaCx, y: L.thetaCy, r: R, dot: false, focal: true };
  T.glyph = hump(T.x, T.y + T.r * 0.5, T.r * 1.45, T.r * 1.15, 0.1);
  const route = [
    `M${f(A.x + r)} ${f(above)} H${f(D.x - r)}`,
    `M${f(D.x + r)} ${f(above)} H${f(N.x - r)}`,
    `M${f(N.x)} ${f(above + r)} V${f(T.y - R)}`,
  ];
  const edges = [
    hump((D.x + N.x) / 2, above, N.x - D.x - 2 * r - 10, 1.05 * fs, 0.14), // likelihood, on the upper spine
    `M${f(Pn.x + r)} ${f(below)} H${f(M.x - r)}`,
    hump((Pn.x + M.x) / 2, below, M.x - Pn.x - 2 * r - 10, 0.75 * fs, 0.22), // prior, wide, on the lower spine
    `M${f(M.x)} ${f(below - r)} V${f(T.y + R)}`,
  ];
  return {
    strokes,
    sticks: sticksOf(A.x + r * 2, D.x - r * 2, above, 0.85 * fs),
    nodes: [A, D, N, Pn, M, T],
    edges,
    route,
    labels: [], // Caveat at a readable size will not fit between these nodes on a phone
    labelSize,
    note: { x: 16, y: above - 1.05 * fs - 40, size: 20, lines: ["a place to study statistics,", "one unknown at a time"] },
    ink,
    fill: { top, bot },
    x0: 16,
    x1: L.w - 16,
  };
}

// ------------------------------------------------------------------------------------------------ the timeline
type Kf = Keyframe[];
/** Beats (ms after the intro starts). The phone's simpler diagram is quicker, which pays for its longer pull-in. */
const BEATS = {
  wide: { route: [100, 1000], build: [1150, 750], fill: 2350, oval: 2550, bar: 3050, pull: 3450, settle: 4550, branches: 5250, buttons: 5550, headline: 5750, nav: 5900 },
};
const END = 6400;

export function Intro({ getTarget, reveal, onDone }: { getTarget: () => DOMRect | null; reveal: () => { first: Element[]; then: Element[]; last: Element[] }; onDone: () => void }) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [built, setBuilt] = useState<Built | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const anims = useRef<Animation[]>([]);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    markSeen();
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    onDone();
  }, [onDone]);

  // start only once the faces it uses are loaded, so every run (and both themes) keep the same clock
  useLayoutEffect(() => {
    let live = true;
    const fonts = document.fonts;
    const ready = fonts?.load ? Promise.all(FACES.map((x) => fonts.load(x))).then(() => fonts.ready).catch(() => undefined) : Promise.resolve();
    void Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(() => live && setLayout(measure(getTarget())));
    return () => {
      live = false;
    };
  }, [getTarget]);

  useLayoutEffect(() => {
    if (!layout || !root.current) return;
    setBuilt(build(layout, Array.from(root.current.querySelectorAll<SVGTextElement>(".i-word"))));
  }, [layout]);

  // skip: Esc / Enter / click anywhere / the Skip button; a resize ends it too (the layout would be stale)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("resize", finish);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", finish);
    };
  }, [finish]);

  useEffect(() => {
    const el = root.current;
    if (!layout || !built || !el) return;
    const list: Animation[] = [];
    const q = (sel: string) => Array.from(el.querySelectorAll<HTMLElement | SVGElement>(sel));
    // "both" holds the first frame through the delay; exits use "forwards" so they never mask an earlier entrance
    const run = (targets: Element[], kf: Kf, delay: number, duration: number, easing = "cubic-bezier(.45,0,.25,1)", fill: FillMode = "both") =>
      targets.forEach((t) => list.push(t.animate(kf, { delay, duration, easing, fill })));
    const draw: Kf = [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }];
    const appear: Kf = [{ opacity: 0 }, { opacity: 1 }];
    const vanish: Kf = [{ opacity: 1 }, { opacity: 0 }];
    const out = (t: Element[], at: number, d = 450) => run(t, vanish, at, d, "ease-in-out", "forwards");
    const ease = "cubic-bezier(.4,0,.3,1)";
    const B = BEATS.wide;
    const xOf = (e: Element) => Number(e.getAttribute("data-x") ?? 0);
    const frac = (x: number) => Math.min(1, Math.max(0, (x - built.x0) / (built.x1 - built.x0)));
    const [r0, rd] = B.route;
    const [b0, bd] = B.build;
    // when the route reaches an element: measured along the route itself, so nothing draws ahead of or behind it
    // (measured on a scratch copy without pathLength, which would rescale the lengths)
    const svg = el.querySelector("svg");
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg?.appendChild(probe);
    const lens = built.route.map((d) => {
      probe.setAttribute("d", d);
      return probe.getTotalLength();
    });
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0) / total);
    const samples = built.route.flatMap((d, i) => {
      probe.setAttribute("d", d);
      return Array.from({ length: 51 }, (_, j) => ({ x: probe.getPointAtLength((lens[i] * j) / 50).x, f: starts[i] + (lens[i] / total) * (j / 50) }));
    });
    probe.remove();
    const routeFrac = (x: number) => samples.find((p) => p.x >= x - 2)?.f ?? 1;
    const onRoute = (e: Element) => r0 + routeFrac(xOf(e)) * rd;
    const onBuild = (x: number) => b0 + frac(x) * bd; // when the letters reach x

    // 1. one diagram draws on, left to right, as the orange route travels it
    // the route's segments draw one after another at one speed, so it reads as a single line travelling
    q(".i-route").forEach((e, i) => run([e], draw, r0 + starts[i] * rd, (lens[i] / total) * rd, "linear"));
    q(".i-ring").forEach((e) => run([e], draw, Math.max(0, onRoute(e) - 100), 500, ease));
    q(".i-node, .i-glyph, .i-head").forEach((e) => run([e], appear, onRoute(e) + 100, 450, "ease-out"));
    q(".i-stem, .i-edge").forEach((e) => run([e], draw, onRoute(e) - 100, 550, ease));
    q(".i-label").forEach((e) => run([e], appear, onRoute(e) + 150, 450, "ease-out"));
    run(q(".i-note"), appear, 200, 500, "ease-out");

    // 2. the letters draw on left to right while the diagram under them steps back, left to right, and the route
    //    is taken up from its start; the posterior node holds until the θ forms in it
    q(".i-stroke").forEach((e) => run([e], draw, onBuild(xOf(e)) + 100, 450, ease)); // after the diagram under it has gone
    q(".i-dia").forEach((e) => out([e], onBuild(xOf(e)) - 300, 400));
    run(q(".i-note"), vanish, b0, 500, "ease-in-out", "forwards");
    q(".i-route").forEach((e, i) =>
      run([e], [{ strokeDashoffset: 0 }, { strokeDashoffset: -1.2 }], b0 - 150 + starts[i] * bd, (lens[i] / total) * bd * 1.2, "linear", "forwards"),
    );

    // 3. the solid words fade in behind the outlines (450ms), then the outlines fade out (400ms)
    run(q(".i-word"), [{ fillOpacity: 0 }, { fillOpacity: 1 }], B.fill, 400, "ease-in-out");
    out(q(".i-stroke"), B.fill, 400);

    // 4. the posterior node becomes Studio's "o": its curve and ring give way as the o draws inside it; then the
    //    bar draws across and it is θ
    run(q(".theta-oval"), draw, B.oval, 550, ease);
    out(q(".i-focal"), B.oval + 100, 500);
    run(q(".theta-bar"), draw, B.bar, 400, ease);
    // behind the finished θ, a canvas-coloured disc: the sliding words pass under the θ rather than being cut in the air
    run(q(".theta-disc"), appear, B.bar, 400, "linear");

    // 5. the words are pulled rightward into the θ and disappear at its left side
    const words = q(".i-word");
    const slide = (wd: Element, at: number, d: number, from: number, dx: number) =>
      run([wd], [{ transform: `translate(0px, ${from}px)` }, { transform: `translate(${dx}px, ${from}px)` }], at, d, "cubic-bezier(.42,0,.55,1)", "forwards");
    const past = (wi: number) => layout.thetaCx - built.ink[wi].x0 + 2; // far enough for a word to pass wholly into the θ
    // one continuous motion, word spacing intact: Studio's end goes first, Stats last
    words.forEach((wd) => slide(wd, B.pull, 1150, 0, past(0)));

    // 6. the θ settles as the home mark while its 1px ring draws round it, both over 800ms (on a phone it glides in
    //    from the line's end to the centred mark at the same height)
    const { theta: t, target } = layout;
    const sd = 900;
    run(q(".theta"), [{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})` }, { transform: `translate(${target.x}px, ${target.y}px) scale(${target.s})` }], B.settle, sd, "cubic-bezier(.45,0,.55,1)");
    run(q(".theta-ring"), draw, B.settle, sd, ease);

    // 7. the θ becomes the two buttons: branches, their end nodes and Learn and Practice, alone; then the rest
    const { first, then, last } = reveal();
    run(first.filter((e) => e.getAttribute("data-reveal") === "branch"), draw, B.branches, 650, "cubic-bezier(.3,0,.4,1)");
    run(first.filter((e) => e.getAttribute("data-reveal") !== "branch"), appear, B.buttons, 450, "ease-out");
    run(then, appear, B.headline, 450, "ease-out");
    run(last, appear, B.nav, 450, "ease-out");
    out(q(".intro-skip"), B.nav, 450);

    anims.current = list;
    const timer = window.setTimeout(finish, END + 50);
    return () => {
      window.clearTimeout(timer);
      list.forEach((a) => a.cancel());
    };
  }, [layout, built, reveal, finish]);

  const ringD = (n: Node) => `M${f(n.x)} ${f(n.y + n.r)} A${f(n.r)} ${f(n.r)} 0 0 1 ${f(n.x)} ${f(n.y - n.r)} A${f(n.r)} ${f(n.r)} 0 0 1 ${f(n.x)} ${f(n.y + n.r)}`;
  return (
    <div className="intro" ref={root} onClick={finish}>
      {layout && (
        <svg className="intro-art" viewBox={`0 0 ${layout.w} ${layout.h}`} width={layout.w} height={layout.h} aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {built && (
            <>
              <text className="i-note" x={built.note.x} y={built.note.y} fontSize={built.note.size}>
                {built.note.lines.map((l, i) => (
                  <tspan key={i} x={built.note.x} dy={i === 0 ? 0 : built.note.size * 1.15}>
                    {l}
                  </tspan>
                ))}
              </text>
              {built.edges.map((d, i) => (
                <path key={i} className="i-dia i-edge" data-x={Number(d.slice(1).split(" ")[0])} pathLength={1} d={d} />
              ))}
              {built.route.map((d, i) => (
                <path key={i} className="i-route" pathLength={1} d={d} />
              ))}
              {built.sticks.map((s, i) => (
                <g key={i} className="i-dia" data-x={s.x}>
                  <path className="i-stem" data-x={s.x} pathLength={1} d={`M${f(s.x)} ${f(s.bot)} V${f(s.top)}`} />
                  <circle className="i-head" data-x={s.x} cx={s.x} cy={s.top} r={layout.fs * 0.032} />
                </g>
              ))}
              {built.nodes.map((n, i) => (
                <g key={i} className={n.focal ? "i-focal" : "i-dia"} data-x={n.x}>
                  <path className="i-ring" data-x={n.x} pathLength={1} d={ringD(n)} />
                  {n.dot && <circle className="i-node" data-x={n.x} cx={n.x} cy={n.y} r={n.r * 0.36} />}
                  {n.glyph && <path className="i-glyph" data-x={n.x} d={n.glyph} />}
                </g>
              ))}
              {built.labels.map((l, i) => (
                <text key={i} className={l.text === "posterior" && !layout.stacked ? "i-label i-focal" : "i-label i-dia"} data-x={l.x} x={l.x} y={l.y} fontSize={built.labelSize} textAnchor="middle">
                  {l.text}
                </text>
              ))}
            </>
          )}
          <clipPath id="i-into-theta">
            <rect x={-layout.w} y={0} width={layout.w + layout.thetaCx} height={layout.h} />
          </clipPath>
          <g clipPath="url(#i-into-theta)">
            {WORDS.map((wd, i) => (
              <text key={wd} className="i-word" x={layout.xs[i]} y={layout.bases[i]} fontSize={layout.fs}>
                {wd}
              </text>
            ))}
          </g>
          {built &&
            built.strokes.map((s, i) => (
              <path key={i} className="i-stroke" data-x={s.x} pathLength={1} d={s.d} />
            ))}
          <g className="theta" style={{ transform: `translate(${layout.theta.x}px, ${layout.theta.y}px) scale(${layout.theta.s})` }}>
            <path className="theta-ring" pathLength={1} strokeWidth={1 / layout.target.s} d={RING} />
            <ellipse className="theta-disc" cx={24} cy={24} rx={9.5 + MARK_OVAL_W / 2} ry={14.5 + MARK_OVAL_W / 2} />
            <path className="theta-oval" pathLength={1} strokeWidth={MARK_OVAL_W} d={OVAL_R} />
            <path className="theta-oval" pathLength={1} strokeWidth={MARK_OVAL_W} d={OVAL_L} />
            <path className="theta-bar" pathLength={1} strokeWidth={MARK_OVAL_W} d={BAR} />
          </g>
        </svg>
      )}
      <button
        type="button"
        className="ghost btn-sm intro-skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        Skip intro <kbd>ESC</kbd>
      </button>
    </div>
  );
}
