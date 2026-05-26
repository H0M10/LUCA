import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { assertAccess } from '../trees/trees.service.js';
import type { z } from 'zod';
import type {
  AllergyCreateSchema,
  HabitCreateSchema,
  PersonConditionCreateSchema,
} from '@genograma/shared';

async function assertPersonAccess(personId: string, userId: string, level: 'read' | 'edit' = 'read') {
  const person = await prisma.person.findFirst({ where: { id: personId, deleted_at: null } });
  if (!person) throw Errors.notFound('Persona');
  await assertAccess(person.tree_id, userId, level);
  return person;
}

export async function listPersonMedical(personId: string, userId: string) {
  await assertPersonAccess(personId, userId, 'read');
  const [conditions, allergies, habits] = await Promise.all([
    prisma.person_condition.findMany({
      where: { person_id: personId },
      include: { medical_condition: true },
      orderBy: { created_at: 'desc' },
    }),
    prisma.allergy.findMany({ where: { person_id: personId }, orderBy: { created_at: 'desc' } }),
    prisma.habit.findMany({ where: { person_id: personId }, orderBy: { created_at: 'desc' } }),
  ]);
  return {
    conditions: conditions.map((c) => ({
      id: c.id,
      conditionId: c.condition_id,
      conditionName: c.medical_condition?.name ?? c.custom_name,
      conditionCode: c.medical_condition?.code ?? null,
      customName: c.custom_name,
      ageAtDiagnosis: c.age_at_diagnosis,
      status: c.status,
      severity: c.severity,
      notes: c.notes,
    })),
    allergies: allergies.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      severity: a.severity,
      notes: a.notes,
    })),
    habits: habits.map((h) => ({
      id: h.id,
      kind: h.kind,
      intensity: h.intensity,
      startAge: h.start_age,
      endAge: h.end_age,
      notes: h.notes,
    })),
  };
}

export async function addCondition(
  personId: string,
  userId: string,
  input: z.infer<typeof PersonConditionCreateSchema>,
) {
  await assertPersonAccess(personId, userId, 'edit');
  return prisma.person_condition.create({
    data: {
      person_id: personId,
      condition_id: input.conditionId ?? null,
      custom_name: input.customName ?? null,
      age_at_diagnosis: input.ageAtDiagnosis ?? null,
      status: input.status ?? null,
      severity: input.severity ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function addAllergy(
  personId: string,
  userId: string,
  input: z.infer<typeof AllergyCreateSchema>,
) {
  await assertPersonAccess(personId, userId, 'edit');
  return prisma.allergy.create({
    data: {
      person_id: personId,
      kind: input.kind,
      name: input.name,
      severity: input.severity ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function addHabit(
  personId: string,
  userId: string,
  input: z.infer<typeof HabitCreateSchema>,
) {
  await assertPersonAccess(personId, userId, 'edit');
  return prisma.habit.create({
    data: {
      person_id: personId,
      kind: input.kind,
      intensity: input.intensity ?? null,
      start_age: input.startAge ?? null,
      end_age: input.endAge ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function deleteCondition(id: string, userId: string) {
  const c = await prisma.person_condition.findUnique({ where: { id } });
  if (!c) throw Errors.notFound();
  await assertPersonAccess(c.person_id, userId, 'edit');
  await prisma.person_condition.delete({ where: { id } });
}
export async function deleteAllergy(id: string, userId: string) {
  const a = await prisma.allergy.findUnique({ where: { id } });
  if (!a) throw Errors.notFound();
  await assertPersonAccess(a.person_id, userId, 'edit');
  await prisma.allergy.delete({ where: { id } });
}
export async function deleteHabit(id: string, userId: string) {
  const h = await prisma.habit.findUnique({ where: { id } });
  if (!h) throw Errors.notFound();
  await assertPersonAccess(h.person_id, userId, 'edit');
  await prisma.habit.delete({ where: { id } });
}
