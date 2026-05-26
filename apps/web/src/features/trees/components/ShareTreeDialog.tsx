import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { toast } from '../../../shared/stores/toast.js';

export function ShareTreeDialog({ treeId, onClose }: { treeId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['members', treeId],
    queryFn: () => api.listMembers(treeId),
  });

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'edit' | 'admin'>('edit');

  const invite = useMutation({
    mutationFn: () => api.inviteMember(treeId, email, permission),
    onSuccess: (m) => {
      toast.success(`Invitado: ${m.fullName}`, `Ahora puede ${m.permission === 'read' ? 'ver' : 'editar'} tu árbol`);
      qc.invalidateQueries({ queryKey: ['members', treeId] });
      setEmail('');
    },
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => api.removeMember(treeId, memberId),
    onSuccess: () => {
      toast.success('Acceso removido');
      qc.invalidateQueries({ queryKey: ['members', treeId] });
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg animate-scale-in border border-ink-900/10 bg-paper-50 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-paper-300 bg-paper-100 px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Compartir árbol</p>
          <h2 className="mt-1 font-display text-2xl font-light text-ink-900">
            Invita a tu <em className="fr-italic text-moss-700">familia</em>
          </h2>
          <p className="mt-2 font-sans text-xs text-ink-500">
            La persona debe tener cuenta en Luca con ese correo. Si no, pídele que se registre primero.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Form de invitación */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field number="01" label="Correo del invitado">
                  <Input
                    type="email"
                    placeholder="hermana@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                </Field>
              </div>
              <div className="col-span-1">
                <Field label="Permisos">
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as 'read' | 'edit' | 'admin')}
                    className="w-full border-b border-ink-300 bg-transparent py-2.5 font-sans text-sm text-ink-900 outline-none focus:border-moss-700"
                  >
                    <option value="read">Solo ver</option>
                    <option value="edit">Editar</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
              </div>
            </div>

            <ErrorAlert message={invite.error ? (invite.error as { message: string }).message : undefined} />

            <Button type="submit" disabled={!email || invite.isPending}>
              {invite.isPending ? 'Invitando…' : 'Invitar'}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Button>
          </form>

          {/* Lista de miembros */}
          <div className="border-t border-paper-300 pt-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Con acceso</p>
            {isLoading ? (
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Cargando…</p>
            ) : (
              <ul className="space-y-2">
                {data?.owner && (
                  <li className="flex items-center justify-between rounded-sm border border-paper-300 bg-paper-100 px-4 py-2.5">
                    <div>
                      <p className="font-sans text-sm font-medium text-ink-900">{data.owner.fullName}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                        {data.owner.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-ink-900 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-paper-50">
                      Dueño
                    </span>
                  </li>
                )}
                {data?.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-sm border border-paper-300 bg-paper-50 px-4 py-2.5"
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-ink-900">{m.fullName}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-moss-700/40 bg-moss-50 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-moss-700">
                        {m.permission === 'read' ? 'Lectura' : m.permission === 'edit' ? 'Edición' : 'Admin'}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`¿Quitar acceso a ${m.fullName}?`)) remove.mutate(m.id);
                        }}
                        className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
                {data && data.members.length === 0 && (
                  <p className="font-display text-sm italic text-ink-500">Aún nadie más tiene acceso.</p>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-paper-300 bg-paper-100 px-6 py-3 text-right">
          <button onClick={onClose} className="link-underline font-sans text-sm text-ink-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
