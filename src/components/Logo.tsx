/** The Forest of Keys mark: a tiny three-node tree inside a leaf-shaped badge. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-2)" />
          <stop offset="100%" stopColor="var(--brand)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logo-bg)" />
      <g stroke="var(--logo-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <line x1="24" y1="15" x2="14.5" y2="31" />
        <line x1="24" y1="15" x2="33.5" y2="31" />
      </g>
      <circle cx="24" cy="14" r="6.5" fill="var(--logo-ink)" />
      <circle cx="14" cy="33" r="5.5" fill="var(--logo-ink)" opacity="0.92" />
      <circle cx="34" cy="33" r="5.5" fill="var(--accent-warm)" />
    </svg>
  );
}
