import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { assertAccess } from '../trees/trees.service.js';
import type { RelationshipCreateInput } from '@genograma/shared';

export async function createRelationship(userId: string, input: RelationshipCreateInput) {
  const [from, to] = await Promise.all([
    prisma.person.findFirst({ where: { id: input.fromPersonId, deleted_at: null } }),
    prisma.person.findFirst({ where: { id: input.toPersonId, deleted_at: null } }),
  ]);
  if (!from || !to) throw Errors.notFound('Persona');
  if (from.tree_id !== to.tree_id) throw Errors.badRequest('Las personas no pertenecen al mismo árbol');
  await assertAccess(from.tree_id, userId, 'edit');

  // Validación simple de ciclos en relaciones de parent
  if (input.type === 'parent') {
    if (await wouldCreateCycle(from.id, to.id)) {
      throw Errors.badRequest('La relación crearía un ciclo en el árbol genealógico');
    }
  }

  try {
    const rel = await prisma.relationship.create({
      data: {
        tree_id: from.tree_id,
        type: input.type,
        from_person_id: input.fromPersonId,
        to_person_id: input.toPersonId,
        subtype: input.subtype ?? null,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        notes: input.notes ?? null,
      },
    });
    return {
      id: rel.id,
      type: rel.type,
      fromPersonId: rel.from_person_id,
      toPersonId: rel.to_person_id,
      subtype: rel.subtype,
    };
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      throw Errors.conflict('Esa relación ya existe');
    }
    throw e;
  }
}

async function wouldCreateCycle(parentId: string, childId: string): Promise<boolean> {
  // BFS desde childId siguiendo relaciones parent (childId -> sus hijos -> ...).
  // Si alcanzamos parentId, agregar parentId→childId crea ciclo.
  const visited = new Set<string>([childId]);
  const queue: string[] = [childId];
  while (queue.length) {
    const current = queue.shift()!;
    if (current === parentId) return true;
    const children = await prisma.relationship.findMany({
      where: { type: 'parent', from_person_id: current },
      select: { to_person_id: true },
    });
    for (const c of children) {
      if (!visited.has(c.to_person_id)) {
        visited.add(c.to_person_id);
        queue.push(c.to_person_id);
      }
    }
  }
  return false;
}

export async function deleteRelationship(id: string, userId: string) {
  const rel = await prisma.relationship.findUnique({ where: { id } });
  if (!rel) throw Errors.notFound('Relación');
  await assertAccess(rel.tree_id, userId, 'edit');
  await prisma.relationship.delete({ where: { id } });
}
