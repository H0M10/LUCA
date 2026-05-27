import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { http } from '../../../shared/lib/http.js';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { toast } from '../../../shared/stores/toast.js';

export function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      http('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      }),
    onSuccess: () => {
      toast.success('Contraseña actualizada', 'Cierra sesión en otros dispositivos por seguridad.');
      setCurrent('');
      setNext('');
      setConfirm('');
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'Error'),
  });

  const canSubmit =
    current.length >= 1 &&
    next.length >= 10 &&
    /[A-Z]/.test(next) &&
    /[a-z]/.test(next) &&
    /[0-9]/.test(next) &&
    next === confirm &&
    next !== current &&
    !mutation.isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        mutation.mutate();
      }}
      className="space-y-5"
      autoComplete="off"
    >
      <Field number="01" label="Contraseña actual">
        <Input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field number="02" label="Nueva contraseña" hint="10+ chars, May/min/num">
        <Input
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field
        number="03"
        label="Confirmar nueva contraseña"
        error={confirm && confirm !== next ? 'No coincide con la nueva' : undefined}
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <ErrorAlert message={error ?? undefined} />
      <Button type="submit" disabled={!canSubmit}>
        {mutation.isPending ? 'Guardando…' : 'Cambiar contraseña'}
      </Button>
      <p className="font-sans text-xs text-ink-500">
        Al cambiar tu contraseña se cierra sesión en TODOS tus dispositivos por seguridad.
      </p>
    </form>
  );
}
