import { useState } from 'react';
import { useMe } from '../../features/auth/hooks/useAuth.js';

export function EmailVerifyBanner() {
  const { data: me } = useMe();
  const [dismissed, setDismissed] = useState(false);

  if (!me || me.emailVerifiedAt || dismissed) return null;

  return (
    <div className="border-b border-sand-600/40 bg-sand-100/60 px-4 py-2.5 animate-fade-in">
      <div className="editorial flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-ink-900">
          <span className="font-mono text-[10px] uppercase tracking-widest text-sand-700">
            Email sin verificar
          </span>
          <span className="text-ink-700">
            Te enviamos un correo a <strong>{me.email}</strong> · revisa tu inbox para activar la cuenta.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          Después
        </button>
      </div>
    </div>
  );
}
