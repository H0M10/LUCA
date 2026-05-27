import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { http } from '../../../shared/lib/http.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Branch } from '../../../shared/brand/Logo.js';

export function VerifyEmailPage() {
  const [search] = useSearchParams();
  const token = search.get('token');
  const [status, setStatus] = useState<'verifying' | 'ok' | 'error'>('verifying');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Falta el token. ¿Llegaste aquí desde el email?');
      return;
    }
    http('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setStatus('ok'))
      .catch((e) => {
        setStatus('error');
        setError((e as { message?: string }).message ?? 'No se pudo verificar.');
      });
  }, [token]);

  return (
    <div>
      <Navbar />
      <main className="editorial flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <Branch className="mx-auto h-6 w-40 text-moss-700" />
        {status === 'verifying' && (
          <>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">Verificando…</p>
            <h1 className="mt-4 font-display text-display-md font-light text-ink-900">
              Un momento por favor.
            </h1>
          </>
        )}
        {status === 'ok' && (
          <>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-moss-700">— Confirmado</p>
            <h1 className="mt-4 font-display text-display-md font-light text-ink-900">
              Tu email está{' '}
              <em className="fr-italic text-moss-700">verificado</em>.
            </h1>
            <p className="mt-6 max-w-md font-display text-lg italic text-ink-500">
              Gracias. Ahora tu cuenta tiene protección completa.
            </p>
            <Link
              to="/dashboard"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-700"
            >
              Ir a mi árbol →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-clay-700">— No verificado</p>
            <h1 className="mt-4 font-display text-display-md font-light text-ink-900">
              No pudimos verificar
            </h1>
            <p className="mt-6 max-w-md font-display text-lg italic text-ink-500">{error}</p>
            <Link
              to="/login"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-700"
            >
              Volver a entrar
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
