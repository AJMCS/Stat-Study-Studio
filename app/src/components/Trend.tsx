import type { Attempt } from "../types";

/** Small accessible SVG line chart of composite scores with an optional cutoff line. */
export function Trend({ attempts, cutoff, pick, label }: { attempts: Attempt[]; cutoff: number; pick?: (a: Attempt) => number; label: string }) {
  const W = 360;
  const H = 120;
  const pad = 18;
  const val = pick ?? ((a: Attempt) => a.composite);
  if (attempts.length === 0) return <p className="muted">No saved attempts yet.</p>;
  const x = (i: number) => (attempts.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (attempts.length - 1));
  const y = (v: number) => H - pad - (v / 100) * (H - pad * 2);
  const pts = attempts.map((a, i) => `${x(i)},${y(val(a))}`).join(" ");
  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${attempts.map((a) => val(a)).join(", ")}`}>
        <line x1={pad} x2={W - pad} y1={y(cutoff)} y2={y(cutoff)} className="cutoff" />
        <text x={W - pad} y={y(cutoff) - 3} textAnchor="end" className="axis">
          {cutoff}
        </text>
        <polyline points={pts} className="line" fill="none" />
        {attempts.map((a, i) => (
          <circle key={a.id} cx={x(i)} cy={y(val(a))} r={3.5} className="dot">
            <title>{`${new Date(a.at).toLocaleDateString()}: ${val(a)}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
