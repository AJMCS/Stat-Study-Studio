import type { Attempt } from "../types";

/** Small accessible SVG line chart of composite scores with an optional cutoff line. */
export function Trend({ attempts, cutoff, pick, label }: { attempts: Attempt[]; cutoff: number; pick?: (a: Attempt) => number; label: string }) {
  const W = 360;
  const H = 90;
  const pad = 12;
  const left = 30; // room for the cutoff label, clear of the first point
  const val = pick ?? ((a: Attempt) => a.composite);
  if (attempts.length === 0) return <p className="muted">No saved attempts yet.</p>;
  const values = attempts.map((a) => val(a));
  const lo = Math.max(0, Math.floor((Math.min(cutoff, ...values) - 10) / 10) * 10);
  const x = (i: number) => (attempts.length === 1 ? (left + W - pad) / 2 : left + (i * (W - pad - left)) / (attempts.length - 1));
  const y = (v: number) => H - pad - ((v - lo) / (100 - lo)) * (H - pad * 2);
  const pts = attempts.map((a, i) => `${x(i)},${y(val(a))}`).join(" ");
  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${attempts.map((a) => val(a)).join(", ")}`}>
        <line x1={left} x2={W - pad} y1={y(cutoff)} y2={y(cutoff)} className="cutoff" />
        <polyline points={pts} className="line" fill="none" />
        {attempts.map((a, i) => (
          <circle key={a.id} cx={x(i)} cy={y(val(a))} r={3.5} className="dot">
            <title>{`${new Date(a.at).toLocaleDateString()}: ${val(a)}`}</title>
          </circle>
        ))}
      </svg>
      <span className="cutoff-label" aria-hidden="true" style={{ top: `${(y(cutoff) / H) * 100}%` }}>{cutoff}</span>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
