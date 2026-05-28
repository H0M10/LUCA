import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../../../shared/lib/http.js';
import { Button, ErrorAlert, Input } from '../../../shared/components/ui.js';
import { toast } from '../../../shared/stores/toast.js';

export function TwoFactorCard() {
  const qc = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => http<{ data: { enabled: boolean } }>('/api/auth/2fa/status').then((r) => r.data),
  });

  const [setupData, setSetupData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupMut = useMutation({
    mutationFn: () =>
      http<{ data: { qrDataUrl: string; secret: string } }>('/api/auth/2fa/setup', {
        method: 'POST',
      }).then((r) => r.data),
    onSuccess: setSetupData,
    onError: () => toast.error('No se pudo iniciar el setup'),
  });

  const confirmMut = useMutation({
    mutationFn: () =>
      http<{ data: { ok: boolean; backupCodes: string[] } }>('/api/auth/2fa/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: confirmCode }),
      }).then((r) => r.data),
    onSuccess: (d) => {
      toast.success('2FA activado');
      setBackupCodes(d.backupCodes);
      setSetupData(null);
      setConfirmCode('');
      qc.invalidateQueries({ queryKey: ['2fa-status'] });
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'Error'),
  });

  const disableMut = useMutation({
    mutationFn: () =>
      http('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: disableCode }),
      }),
    onSuccess: () => {
      toast.success('2FA desactivado');
      setDisableCode('');
      qc.invalidateQueries({ queryKey: ['2fa-status'] });
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'Error'),
  });

  const enabled = status?.enabled;

  if (backupCodes) {
    return (
      <div className="space-y-4 border-l-4 border-moss-700 bg-moss-50 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-moss-700">
          ✓ 2FA activado — guarda estos códigos de respaldo
        </p>
        <p className="font-sans text-sm text-ink-700">
          Cada uno sirve UNA SOLA VEZ. Guárdalos en un lugar seguro. Si pierdes tu teléfono podrás
          usarlos para entrar.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded bg-paper-50 p-3 font-mono text-sm">
          {backupCodes.map((c) => (
            <li key={c} className="text-center text-ink-900">{c}</li>
          ))}
        </ul>
        <Button onClick={() => setBackupCodes(null)}>Entendido, los guardé</Button>
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="space-y-4">
        <p className="border-l-4 border-moss-700 bg-moss-50 px-4 py-3 font-sans text-sm">
          ✓ <strong>2FA está activo</strong> — tu cuenta tiene doble protección.
        </p>
        <details>
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700">
            Desactivar 2FA
          </summary>
          <div className="mt-3 space-y-3">
            <p className="font-sans text-xs text-ink-500">
              Para desactivar, ingresa un código de tu app o un código de respaldo:
            </p>
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="123456 o ABCDEF1234"
              autoComplete="off"
            />
            <ErrorAlert message={error ?? undefined} />
            <Button
              variant="danger"
              onClick={() => { setError(null); disableMut.mutate(); }}
              disabled={!disableCode || disableMut.isPending}
            >
              {disableMut.isPending ? 'Desactivando…' : 'Confirmar desactivación'}
            </Button>
          </div>
        </details>
      </div>
    );
  }

  if (setupData) {
    return (
      <div className="space-y-4">
        <p className="font-sans text-sm text-ink-700">
          Escanea este código QR con <strong>Google Authenticator</strong>, <strong>Authy</strong> o
          <strong> 1Password</strong>:
        </p>
        <div className="flex justify-center rounded border border-paper-300 bg-paper-50 p-4">
          <img src={setupData.qrDataUrl} alt="QR code 2FA" className="h-48 w-48" />
        </div>
        <details>
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-ink-500">
            ¿No puedes escanear? Ingresa manualmente
          </summary>
          <p className="mt-2 break-all rounded bg-paper-100 p-2 font-mono text-xs text-ink-900">
            {setupData.secret}
          </p>
        </details>
        <p className="font-sans text-sm text-ink-700">
          Ingresa el código de 6 dígitos que muestra la app:
        </p>
        <Input
          value={confirmCode}
          onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          className="text-center font-mono text-2xl tracking-widest"
        />
        <ErrorAlert message={error ?? undefined} />
        <div className="flex gap-2">
          <Button
            onClick={() => { setError(null); confirmMut.mutate(); }}
            disabled={confirmCode.length !== 6 || confirmMut.isPending}
          >
            {confirmMut.isPending ? 'Verificando…' : 'Activar 2FA'}
          </Button>
          <Button variant="ghost" onClick={() => setSetupData(null)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-ink-700">
        Añade una capa extra de seguridad. Después de tu contraseña te pediremos un código de 6
        dígitos que solo tu teléfono genera.
      </p>
      <Button onClick={() => { setError(null); setupMut.mutate(); }} disabled={setupMut.isPending}>
        {setupMut.isPending ? 'Generando…' : 'Activar 2FA'}
      </Button>
    </div>
  );
}
