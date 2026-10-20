/**
 * Progress rails in the Learn journey's language (bar line 6): every step is a ringed node (done = filled centre in an
 * ink ring, current = orange ring and centre with the journey's dashed halo, upcoming = empty muted ring). All the
 * nodes of a rail sit on one straight baseline, and each pair of neighbours is joined by one gently bowed 1px muted
 * arc, the same shallow bow every time (up on a horizontal rail, out to the left on a vertical one). Only the arc
 * into the current node is orange.
 */
import type { CSSProperties } from "react";

export type NodeState = "done" | "current" | "todo";
export type ArcState = "route" | "done" | "todo";

export function Ring({ state, className, style }: { state: NodeState; className?: string; style?: CSSProperties }) {
  return (
    <span className={`ring-node ${state}${className ? ` ${className}` : ""}`} style={style} aria-hidden="true">
      <span className="ring-dot" />
    </span>
  );
}

/** A horizontal arc between two nodes: its ends on the baseline (the box's middle), bowing up to the top of the box.
 * It stretches to fill the gap; the stroke keeps its width. */
export function HArc({ state, className }: { state: ArcState; className?: string }) {
  return (
    <svg className={`arc h ${state}${className ? ` ${className}` : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 50 Q 50 -50 100 50" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A vertical arc between two nodes: its ends on the baseline (the box's centre line), bowing out to the left. */
export function VArc({ state, className }: { state: ArcState; className?: string }) {
  return (
    <svg className={`arc v ${state}${className ? ` ${className}` : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M50 0 Q -50 50 50 100" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** The state of the arc that leads into node `to`, given the current node. */
export const arcInto = (to: number, at: number): ArcState => (to === at ? "route" : to < at ? "done" : "todo");
export const nodeAt = (i: number, at: number, doneUpTo = at): NodeState => (i === at ? "current" : i < doneUpTo ? "done" : "todo");
