import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import type { UserRole, UserStatus } from '@genograma/shared';

function countBy<T>(arr: T[], key: (t: T) => string): Record<string, number> {
  const m: Record<string, number> = {};
  for (const x of arr) {
    const k = key(x);
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

/** Estadísticas agregadas para el dashboard de administrador. */
export async function getAdminStats() {
  const [users, treesCount, personsCount, conditionsCount, pcs] = await Promise.all([
    prisma.app_user.findMany({ select: { role: true, status: true, created_at: true, deleted_at: true } }),
    prisma.tree.count(),
    prisma.person.count({ where: { deleted_at: null } }),
    prisma.person_condition.count(),
    prisma.person_condition.findMany({
      select: { custom_name: true, medical_condition: { select: { name: true } } },
    }),
  ]);

  const active = users.filter((u) => !u.deleted_at);

  // Altas por mes (últimos 12 meses)
  const months: Array<{ month: string; count: number }> = [];
  const idxByMonth = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    idxByMonth.set(key, months.length);
    months.push({ month: key, count: 0 });
  }
  for (const u of active) {
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const idx = idxByMonth.get(key);
    if (idx !== undefined) months[idx]!.count++;
  }

  // Condiciones más comunes (todos los árboles)
  const condMap = new Map<string, number>();
  for (const pc of pcs) {
    const name = pc.medical_condition?.name ?? pc.custom_name ?? 'Desconocida';
    condMap.set(name, (condMap.get(name) ?? 0) + 1);
  }
  const topConditions = [...condMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totals: {
      users: active.length,
      trees: treesCount,
      persons: personsCount,
      conditions: conditionsCount,
    },
    byRole: countBy(active, (u) => u.role),
    byStatus: countBy(active, (u) => u.status),
    registrationsByMonth: months,
    topConditions,
  };
}

/** Lista de usuarios para gestión. */
export async function listAdminUsers() {
  const users = await prisma.app_user.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      status: true,
      created_at: true,
      last_login_at: true,
      _count: { select: { tree: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    status: u.status,
    createdAt: u.created_at.toISOString(),
    lastLoginAt: u.last_login_at?.toISOString() ?? null,
    treeCount: u._count.tree,
  }));
}

/** Cambiar rol/estatus de un usuario (solo admin). */
export async function updateAdminUser(
  targetId: string,
  actorId: string,
  input: { role?: UserRole; status?: UserStatus },
) {
  if (targetId === actorId && input.role && input.role !== 'admin') {
    throw Errors.badRequest('No puedes quitarte a ti mismo el rol de administrador');
  }
  const exists = await prisma.app_user.findFirst({ where: { id: targetId, deleted_at: null } });
  if (!exists) throw Errors.notFound('Usuario');

  const data: Record<string, unknown> = {};
  if (input.role) data.role = input.role;
  if (input.status) data.status = input.status;

  const u = await prisma.app_user.update({ where: { id: targetId }, data });
  return { id: u.id, role: u.role, status: u.status };
}
