/**
 * Logo Luca — monograma estilo placa heráldica.
 * "L" en serifa con un brote orgánico que sugiere genealogía/raíz.
 */
export function Logo({ className = 'h-10 w-10', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const bg = tone === 'dark' ? '#1F1A14' : '#FBF8F1';
  const fg = tone === 'dark' ? '#D9B679' : '#1F1A14';
  const accent = tone === 'dark' ? '#8FA589' : '#3D5240';
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Luca">
      <rect x="2" y="2" width="76" height="76" rx="2" fill={bg} />
      <rect x="2" y="2" width="76" height="76" rx="2" fill="none" stroke={fg} strokeOpacity="0.25" strokeWidth="0.5" />
      <rect x="6" y="6" width="68" height="68" rx="1" fill="none" stroke={fg} strokeOpacity="0.4" strokeWidth="0.5" />

      {/* L with serif terminals */}
      <path
        d="M 26 18 L 26 56 L 54 56 L 54 51 L 32 51 L 32 18 Z M 22 18 L 36 18 L 36 22 L 28 22 L 28 51 L 54 51 L 54 60 L 22 60 Z"
        fill={fg}
      />
      {/* Roots/branch — subtle organic curve */}
      <path
        d="M 40 36 C 44 34, 48 36, 50 32 M 40 36 C 36 34, 32 36, 30 32 M 40 36 L 40 30"
        stroke={accent}
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="40" cy="30" r="1.2" fill={accent} />
      <circle cx="50" cy="32" r="1" fill={accent} />
      <circle cx="30" cy="32" r="1" fill={accent} />
    </svg>
  );
}

export function Wordmark({ className = '', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const color = tone === 'dark' ? 'text-ink-900' : 'text-paper-50';
  return (
    <span
      className={`font-display text-[1.45em] font-medium leading-none tracking-tight ${color} ${className}`}
      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
    >
      Luca
    </span>
  );
}

/** Decorative ornament (branch with leaves) — used as section divider */
export function Branch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M 5 15 Q 30 5, 60 15 T 115 15" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <ellipse cx="22" cy="10" rx="4" ry="2" fill="currentColor" opacity="0.6" transform="rotate(-25 22 10)" />
      <ellipse cx="42" cy="9" rx="5" ry="2.2" fill="currentColor" opacity="0.5" transform="rotate(-15 42 9)" />
      <ellipse cx="78" cy="11" rx="5" ry="2.2" fill="currentColor" opacity="0.5" transform="rotate(15 78 11)" />
      <ellipse cx="98" cy="10" rx="4" ry="2" fill="currentColor" opacity="0.6" transform="rotate(25 98 10)" />
      <circle cx="60" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}
