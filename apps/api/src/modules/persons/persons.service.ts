import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { assertAccess, personDto } from '../trees/trees.service.js';
import type { PersonCreateInput } from '@genograma/shared';

export async function createPerson(treeId: string, userId: string, input: PersonCreateInput) {
  await assertAccess(treeId, userId, 'edit');

  if (input.isProband) {
    const existingProband = await prisma.person.findFirst({
      where: { tree_id: treeId, is_proband: true, deleted_at: null },
    });
    if (existingProband) throw Errors.conflict('Ya existe una persona marcada como "yo" en este árbol');
  }

  const person = await prisma.person.create({
    data: {
      tree_id: treeId,
      first_name: input.firstName,
      last_name: input.lastName ?? null,
      alias: input.alias ?? null,
      gender: input.gender ?? null,
      birth_date: input.birthDate ?? null,
      death_date: input.deathDate ?? null,
      birth_place: input.birthPlace ?? null,
      blood_type: input.bloodType ?? null,
      is_proband: input.isProband ?? false,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    },
  });
  return personDto(person);
}

export async function updatePerson(personId: string, userId: string, input: PersonCreateInput) {
  const person = await prisma.person.findFirst({
    where: { id: personId, deleted_at: null },
  });
  if (!person) throw Errors.notFound('Persona');
  await assertAccess(person.tree_id, userId, 'edit');

  const updated = await prisma.person.update({
    where: { id: personId },
    data: {
      first_name: input.firstName,
      last_name: input.lastName ?? null,
      alias: input.alias ?? null,
      gender: input.gender ?? null,
      birth_date: input.birthDate ?? null,
      death_date: input.deathDate ?? null,
      birth_place: input.birthPlace ?? null,
      blood_type: input.bloodType ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    },
  });
  return personDto(updated);
}

export async function deletePerson(personId: string, userId: string) {
  const person = await prisma.person.findFirst({ where: { id: personId, deleted_at: null } });
  if (!person) throw Errors.notFound('Persona');
  await assertAccess(person.tree_id, userId, 'edit');
  await prisma.person.update({ where: { id: personId }, data: { deleted_at: new Date() } });
}
