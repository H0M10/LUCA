const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function GoogleButton({ label = 'Continuar con Google' }: { label?: string }) {
  return (
    <a
      href={`${API_BASE}/api/auth/google`}
      className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-ink-300 bg-white px-6 py-3 font-sans text-sm font-medium text-ink-900 transition hover:border-ink-900 hover:bg-paper-100"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853"/>
        <path d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC04"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
      </svg>
      <span>{label}</span>
    </a>
  );
}
