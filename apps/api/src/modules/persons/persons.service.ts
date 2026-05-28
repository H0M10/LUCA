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
      apellido_paterno: input.apellidoPaterno ?? null,
      apellido_materno: input.apellidoMaterno ?? null,
      alias: input.alias ?? null,
      gender: input.gender ?? null,
      birth_date: input.birthDate ?? null,
      death_date: input.deathDate ?? null,
      birth_place: input.birthPlace ?? null,
      birth_country: input.birthCountry ?? null,
      birth_lat: input.birthLat ?? null,
      birth_lng: input.birthLng ?? null,
      blood_type: input.bloodType ?? null,
      is_proband: input.isProband ?? false,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    },
  });
  return personDto(person);
}

/**
 * Update parcial — solo aplica los campos enviados. Un valor `null` significa
 * "limpiar este campo"; undefined significa "no tocar".
 */
export async function updatePerson(
  personId: string,
  userId: string,
  input: Partial<PersonCreateInput>,
) {
  const person = await prisma.person.findFirst({ where: { id: personId, deleted_at: null } });
  if (!person) throw Errors.notFound('Persona');
  await assertAccess(person.tree_id, userId, 'edit');

  const data: Record<string, unknown> = {};
  if (input.firstName !== undefined) data.first_name = input.firstName;
  if (input.apellidoPaterno !== undefined) data.apellido_paterno = input.apellidoPaterno || null;
  if (input.apellidoMaterno !== undefined) data.apellido_materno = input.apellidoMaterno || null;
  if (input.alias !== undefined) data.alias = input.alias || null;
  if (input.gender !== undefined) data.gender = input.gender || null;
  if (input.birthDate !== undefined) data.birth_date = input.birthDate ?? null;
  if (input.deathDate !== undefined) data.death_date = input.deathDate ?? null;
  if (input.birthPlace !== undefined) data.birth_place = input.birthPlace || null;
  if (input.birthCountry !== undefined) data.birth_country = input.birthCountry || null;
  if (input.birthLat !== undefined) data.birth_lat = input.birthLat ?? null;
  if (input.birthLng !== undefined) data.birth_lng = input.birthLng ?? null;
  if (input.bloodType !== undefined) data.blood_type = input.bloodType || null;
  if (input.notes !== undefined) data.notes = input.notes || null;
  if (input.tags !== undefined) data.tags = input.tags;

  const updated = await prisma.person.update({ where: { id: personId }, data });
  return personDto(updated);
}

export async function deletePerson(personId: string, userId: string) {
  const person = await prisma.person.findFirst({ where: { id: personId, deleted_at: null } });
  if (!person) throw Errors.notFound('Persona');
  await assertAccess(person.tree_id, userId, 'edit');
  await prisma.person.update({ where: { id: personId }, data: { deleted_at: new Date() } });
}
