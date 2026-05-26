import { useToastStore } from '../stores/toast.js';

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((t) => {
        const tone =
          t.kind === 'success'
            ? 'border-moss-700 bg-moss-700 text-paper-50'
            : t.kind === 'error'
              ? 'border-clay-600 bg-clay-600 text-paper-50'
              : 'border-ink-900 bg-ink-900 text-paper-50';
        const symbol = t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : '·';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative animate-toast-in border-l-4 ${tone} bg-paper-50 !text-ink-900 shadow-paper-lg`}
            role="status"
          >
            <div className="flex gap-3 px-5 py-4">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                  t.kind === 'success'
                    ? 'bg-moss-700 text-paper-50'
                    : t.kind === 'error'
                      ? 'bg-clay-600 text-paper-50'
                      : 'bg-ink-900 text-paper-50'
                }`}
              >
                {symbol}
              </span>
              <div className="flex-1">
                <p className="font-display text-base font-medium leading-tight">{t.title}</p>
                {t.body && <p className="mt-1 font-sans text-xs text-ink-500">{t.body}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="font-mono text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
