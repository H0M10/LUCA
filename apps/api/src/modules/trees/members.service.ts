import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { assertAccess } from './trees.service.js';

type Permission = 'read' | 'edit' | 'admin';

export async function listMembers(treeId: string, userId: string) {
  await assertAccess(treeId, userId, 'read');
  const tree = await prisma.tree.findUnique({ where: { id: treeId } });
  if (!tree) throw Errors.notFound('Árbol');
  const owner = await prisma.app_user.findUnique({ where: { id: tree.owner_user_id } });
  const memberRows = await prisma.tree_member.findMany({
    where: { tree_id: treeId },
    orderBy: { created_at: 'asc' },
  });
  const memberUsers = await prisma.app_user.findMany({
    where: { id: { in: memberRows.map((m) => m.user_id) } },
  });
  const userById = new Map(memberUsers.map((u) => [u.id, u]));
  return {
    owner: owner
      ? { id: owner.id, email: owner.email, fullName: owner.full_name }
      : null,
    members: memberRows.map((m) => {
      const u = userById.get(m.user_id);
      return {
        id: m.id,
        userId: m.user_id,
        email: u?.email ?? '',
        fullName: u?.full_name ?? '',
        permission: m.permission as Permission,
        acceptedAt: m.accepted_at?.toISOString() ?? null,
        createdAt: m.created_at.toISOString(),
      };
    }),
  };
}

export async function inviteMember(
  treeId: string,
  inviterId: string,
  email: string,
  permission: Permission,
) {
  await assertAccess(treeId, inviterId, 'admin');

  const tree = await prisma.tree.findUnique({ where: { id: treeId } });
  if (!tree) throw Errors.notFound('Árbol');
  if (tree.owner_user_id === inviterId) {
    // OK, owner is inviting
  }

  const invitee = await prisma.app_user.findUnique({ where: { email: email.toLowerCase() } });
  if (!invitee) throw Errors.notFound('No existe un usuario con ese correo. Pídele que se registre primero.');
  if (invitee.id === tree.owner_user_id) throw Errors.badRequest('El dueño ya tiene acceso total');

  try {
    const member = await prisma.tree_member.create({
      data: {
        tree_id: treeId,
        user_id: invitee.id,
        permission,
        invited_by: inviterId,
        accepted_at: new Date(), // auto-accept para MVP
      },
    });
    return {
      id: member.id,
      userId: member.user_id,
      email: invitee.email,
      fullName: invitee.full_name,
      permission: member.permission as Permission,
    };
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      throw Errors.conflict('Esta persona ya tiene acceso al árbol');
    }
    throw e;
  }
}

export async function removeMember(treeId: string, ownerId: string, memberId: string) {
  await assertAccess(treeId, ownerId, 'admin');
  const member = await prisma.tree_member.findUnique({ where: { id: memberId } });
  if (!member || member.tree_id !== treeId) throw Errors.notFound('Miembro');
  await prisma.tree_member.delete({ where: { id: memberId } });
}

export async function updateMemberPermission(
  treeId: string,
  ownerId: string,
  memberId: string,
  permission: Permission,
) {
  await assertAccess(treeId, ownerId, 'admin');
  const member = await prisma.tree_member.findUnique({ where: { id: memberId } });
  if (!member || member.tree_id !== treeId) throw Errors.notFound('Miembro');
  await prisma.tree_member.update({ where: { id: memberId }, data: { permission } });
}
