/**
 * Logo Luca — usa el PNG real proporcionado por el cliente.
 * En fondos oscuros se aplica filtro CSS para que el logo (oscuro) aparezca blanco.
 */
export function Logo({ className = 'h-10 w-10', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const base = import.meta.env.BASE_URL;
  const filter = tone === 'light' ? 'brightness-0 invert' : '';
  return (
    <img
      src={`${base}logo.png`}
      alt="Luca"
      className={`${className} object-contain ${filter}`}
      loading="eager"
      decoding="async"
    />
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
