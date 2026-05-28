import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../../../shared/lib/http.js';
import { Button, ErrorAlert, Input } from '../../../shared/components/ui.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';

export function TwoFactorChallenge({ challengeId }: { challengeId: string }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const verify = useMutation({
    mutationFn: () =>
      http('/api/auth/2fa/challenge', {
        method: 'POST',
        body: JSON.stringify({ challengeId, code }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      navigate('/dashboard');
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'Código incorrecto'),
  });

  return (
    <div>
      <Navbar />
      <main className="editorial py-16 md:py-24">
        <div className="mx-auto max-w-md">
          <p className="section-number">— Verificación adicional</p>
          <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
            Código de tu{' '}
            <em className="fr-italic text-moss-700">app</em>
          </h1>
          <p className="mt-4 font-display text-base italic text-ink-500">
            Abre Google Authenticator (o tu app de 2FA) e ingresa el código de 6 dígitos. Si perdiste tu
            teléfono, usa uno de tus códigos de respaldo.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              verify.mutate();
            }}
            className="mt-8 space-y-4"
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 10))}
              placeholder="000000"
              autoFocus
              autoComplete="off"
              className="text-center font-mono text-3xl tracking-widest"
            />
            <ErrorAlert message={error ?? undefined} />
            <Button type="submit" disabled={code.length < 6 || verify.isPending} className="w-full">
              {verify.isPending ? 'Verificando…' : 'Verificar'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
