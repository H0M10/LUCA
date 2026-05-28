import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserRole, UserStatus } from '@genograma/shared';
import { USER_ROLES, USER_STATUSES } from '@genograma/shared';
import * as api from '../api/admin.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Card, Select } from '../../../shared/components/ui.js';
import { useMe } from '../../auth/hooks/useAuth.js';
import { toast } from '../../../shared/stores/toast.js';
import { BarChart, HBarChart, DonutChart } from '../components/Charts.js';

const ROLE_LABEL: Record<string, string> = { user: 'Usuario', worker: 'Trabajador', admin: 'Administrador' };
const STATUS_LABEL: Record<string, string> = { active: 'Activo', suspended: 'Suspendido', deleted: 'Eliminado' };

export function AdminDashboard() {
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin';

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: api.getStats,
  });
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: api.listUsers,
  });

  return (
    <div className="min-h-screen bg-paper-100">
      <Navbar />
      <main className="editorial py-10 md:py-14">
        <header className="mb-10 border-b border-paper-300 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-moss-700">
            Panel de control · {isAdmin ? 'Administrador' : 'Trabajador'}
          </p>
          <h1 className="mt-3 font-display text-display-md font-light leading-tight text-ink-900">
            Tablero <em className="fr-italic text-moss-700">general</em>
          </h1>
          <p className="mt-2 font-sans text-ink-500">
            Métricas agregadas de toda la plataforma Luca.
          </p>
        </header>

        {/* Tarjetas de totales */}
        <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Usuarios" value={stats?.totals.users} loading={loadingStats} accent="#42A7A5" />
          <StatCard label="Árboles" value={stats?.totals.trees} loading={loadingStats} accent="#123F52" />
          <StatCard label="Personas" value={stats?.totals.persons} loading={loadingStats} accent="#8AB96B" />
          <StatCard label="Condiciones" value={stats?.totals.conditions} loading={loadingStats} accent="#E0685A" />
        </section>

        {/* Gráficas */}
        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="mb-1 font-display text-xl font-medium text-ink-900">Altas de usuarios</h2>
            <p className="mb-5 font-sans text-sm text-ink-500">Últimos 12 meses</p>
            {stats ? (
              <BarChart
                data={stats.registrationsByMonth.map((m) => ({
                  label: m.month.slice(5),
                  value: m.count,
                }))}
              />
            ) : (
              <ChartSkeleton />
            )}
          </Card>
          <Card>
            <h2 className="mb-1 font-display text-xl font-medium text-ink-900">Por rol</h2>
            <p className="mb-5 font-sans text-sm text-ink-500">Distribución de cuentas</p>
            {stats ? (
              <DonutChart
                data={Object.entries(stats.byRole).map(([k, v]) => ({ label: ROLE_LABEL[k] ?? k, value: v }))}
              />
            ) : (
              <ChartSkeleton />
            )}
          </Card>
        </section>

        <section className="mb-10">
          <Card>
            <h2 className="mb-1 font-display text-xl font-medium text-ink-900">Condiciones más comunes</h2>
            <p className="mb-5 font-sans text-sm text-ink-500">Top 10 en toda la plataforma</p>
            {stats ? (
              <HBarChart data={stats.topConditions.map((c) => ({ label: c.name, value: c.count }))} />
            ) : (
              <ChartSkeleton />
            )}
          </Card>
        </section>

        {/* Gestión de usuarios */}
        <section>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-paper-300 px-6 py-5 md:px-8">
              <h2 className="font-display text-xl font-medium text-ink-900">Usuarios</h2>
              <p className="font-sans text-sm text-ink-500">
                {isAdmin
                  ? 'Cambia el rol o el estatus de cada cuenta.'
                  : 'Vista de solo lectura (requiere administrador para editar).'}
              </p>
            </div>
            {loadingUsers ? (
              <p className="px-8 py-10 text-center font-sans text-ink-300">Cargando usuarios…</p>
            ) : (
              <UsersTable users={users ?? []} canEdit={isAdmin} meId={me?.id} />
            )}
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  accent,
}: {
  label: string;
  value?: number;
  loading: boolean;
  accent: string;
}) {
  return (
    <div className="card-paper relative overflow-hidden p-6">
      <span className="absolute left-0 top-0 h-full w-1.5" style={{ background: accent }} />
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-2 font-display text-4xl font-light text-ink-900">
        {loading ? '—' : (value ?? 0).toLocaleString('es-MX')}
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-40 animate-pulse rounded-2xl bg-paper-200" />;
}

function UsersTable({
  users,
  canEdit,
  meId,
}: {
  users: api.AdminUser[];
  canEdit: boolean;
  meId?: string;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { role?: UserRole; status?: UserStatus } }) =>
      api.updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Usuario actualizado');
    },
    onError: (e) => toast.error((e as Error).message || 'No se pudo actualizar'),
  });

  if (users.length === 0) {
    return <p className="px-8 py-10 text-center font-sans text-ink-300">Sin usuarios.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-paper-300 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            <th className="px-6 py-3 font-normal md:px-8">Usuario</th>
            <th className="px-4 py-3 font-normal">Árboles</th>
            <th className="px-4 py-3 font-normal">Alta</th>
            <th className="px-4 py-3 font-normal">Rol</th>
            <th className="px-4 py-3 font-normal">Estatus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-200">
          {users.map((u) => {
            const isSelf = u.id === meId;
            return (
              <tr key={u.id} className="transition hover:bg-paper-50">
                <td className="px-6 py-4 md:px-8">
                  <p className="font-sans font-medium text-ink-900">
                    {u.fullName}
                    {isSelf && <span className="ml-2 font-mono text-[10px] text-moss-700">(tú)</span>}
                  </p>
                  <p className="font-sans text-xs text-ink-500">{u.email}</p>
                </td>
                <td className="px-4 py-4 font-mono text-sm text-ink-700">{u.treeCount}</td>
                <td className="px-4 py-4 font-sans text-xs text-ink-500">
                  {new Date(u.createdAt).toLocaleDateString('es-MX')}
                </td>
                <td className="px-4 py-4">
                  {canEdit ? (
                    <Select
                      className="!py-1.5 !text-sm"
                      value={u.role}
                      disabled={mutation.isPending}
                      onChange={(e) => mutation.mutate({ id: u.id, input: { role: e.target.value as UserRole } })}
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Badge tone="role">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                  )}
                </td>
                <td className="px-4 py-4">
                  {canEdit ? (
                    <Select
                      className="!py-1.5 !text-sm"
                      value={u.status}
                      disabled={mutation.isPending}
                      onChange={(e) => mutation.mutate({ id: u.id, input: { status: e.target.value as UserStatus } })}
                    >
                      {USER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Badge tone="status">{STATUS_LABEL[u.status] ?? u.status}</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'role' | 'status' }) {
  const cls = tone === 'role' ? 'bg-moss-100 text-moss-800' : 'bg-paper-200 text-ink-700';
  return (
    <span className={`inline-block rounded-full px-3 py-1 font-sans text-xs font-medium ${cls}`}>{children}</span>
  );
}
