/**
 * The θ mark: a theta in a thin ring, drawn in the ink colour (currentColor). Every stroke is a path with
 * pathLength=1, so an intro can draw it on with stroke-dasharray/stroke-dashoffset (classes theta-ring, theta-oval,
 * theta-bar).
 */
export function ThetaMark({ size = 32, ring = true, className, title }: { size?: number; ring?: boolean; className?: string; title?: string }) {
  return (
    <svg
      className={`theta-mark${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {ring && <path className="theta-ring" pathLength={1} strokeWidth={1.5} d="M24 2 A22 22 0 1 1 23.99 2" />}
      <path className="theta-oval" pathLength={1} strokeWidth={3} d="M24 9.5 C30.5 9.5 33.5 16 33.5 24 C33.5 32 30.5 38.5 24 38.5 C17.5 38.5 14.5 32 14.5 24 C14.5 16 17.5 9.5 24 9.5 Z" />
      <path className="theta-bar" pathLength={1} strokeWidth={3} d="M15.5 24 L32.5 24" />
    </svg>
  );
}
