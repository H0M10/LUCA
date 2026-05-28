import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import type { TreeCreateInput } from '@genograma/shared';

export async function assertAccess(
  treeId: string,
  userId: string,
  required: 'read' | 'edit' | 'admin' = 'read',
): Promise<void> {
  const tree = await prisma.tree.findFirst({
    where: { id: treeId, deleted_at: null },
    include: { tree_member: { where: { user_id: userId } } },
  });
  if (!tree) throw Errors.notFound('Árbol');

  if (tree.owner_user_id === userId) return; // owner always has full access

  const member = tree.tree_member[0];
  if (!member) throw Errors.forbidden('No tienes acceso a este árbol');

  const levels = { read: 0, edit: 1, admin: 2 };
  if (levels[member.permission as 'read' | 'edit' | 'admin'] < levels[required]) {
    throw Errors.forbidden(`Requiere permiso ${required}`);
  }
}

export async function listMyTrees(userId: string) {
  const trees = await prisma.tree.findMany({
    where: {
      deleted_at: null,
      OR: [{ owner_user_id: userId }, { tree_member: { some: { user_id: userId } } }],
    },
    orderBy: { updated_at: 'desc' },
    include: { _count: { select: { person: { where: { deleted_at: null } } } } },
  });
  return trees.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    isOwner: t.owner_user_id === userId,
    personCount: t._count.person,
    createdAt: t.created_at.toISOString(),
    updatedAt: t.updated_at.toISOString(),
  }));
}

export async function createTree(userId: string, input: TreeCreateInput) {
  const tree = await prisma.tree.create({
    data: {
      owner_user_id: userId,
      name: input.name,
      description: input.description ?? null,
    },
  });
  return { id: tree.id, name: tree.name, description: tree.description };
}

export async function getTree(treeId: string, userId: string) {
  await assertAccess(treeId, userId, 'read');
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    include: {
      person: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } },
      relationship: true,
    },
  });
  if (!tree) throw Errors.notFound('Árbol');
  return {
    id: tree.id,
    name: tree.name,
    description: tree.description,
    persons: tree.person.map(personDto),
    relationships: tree.relationship.map((r) => ({
      id: r.id,
      type: r.type,
      fromPersonId: r.from_person_id,
      toPersonId: r.to_person_id,
      subtype: r.subtype,
      startDate: r.start_date?.toISOString().slice(0, 10) ?? null,
      endDate: r.end_date?.toISOString().slice(0, 10) ?? null,
    })),
  };
}

export async function updateTree(treeId: string, userId: string, input: Partial<TreeCreateInput>) {
  await assertAccess(treeId, userId, 'edit');
  await prisma.tree.update({
    where: { id: treeId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
}

export async function deleteTree(treeId: string, userId: string) {
  const tree = await prisma.tree.findUnique({ where: { id: treeId } });
  if (!tree || tree.deleted_at) throw Errors.notFound('Árbol');
  if (tree.owner_user_id !== userId) throw Errors.forbidden('Solo el dueño puede eliminar');
  await prisma.tree.update({ where: { id: treeId }, data: { deleted_at: new Date() } });
}

export function personDto(p: {
  id: string;
  tree_id: string;
  first_name: string;
  last_name: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  alias: string | null;
  gender: string | null;
  birth_date: Date | null;
  death_date: Date | null;
  birth_place: string | null;
  blood_type: string | null;
  is_proband: boolean;
  photo_media_id: string | null;
  photo_data?: string | null;
  notes: string | null;
  tags: string[];
}) {
  // lastName se mantiene como apellidos combinados (paterno + materno) para
  // que toda la UI de visualización siga funcionando sin cambios.
  const apellidos = [p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
  return {
    id: p.id,
    treeId: p.tree_id,
    firstName: p.first_name,
    apellidoPaterno: p.apellido_paterno ?? null,
    apellidoMaterno: p.apellido_materno ?? null,
    lastName: apellidos || p.last_name || null,
    alias: p.alias,
    gender: p.gender,
    birthDate: p.birth_date?.toISOString().slice(0, 10) ?? null,
    deathDate: p.death_date?.toISOString().slice(0, 10) ?? null,
    birthPlace: p.birth_place,
    bloodType: p.blood_type,
    isProband: p.is_proband,
    photoMediaId: p.photo_media_id,
    photoData: p.photo_data ?? null,
    notes: p.notes,
    tags: p.tags ?? [],
  };
}
