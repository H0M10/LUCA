import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { assertAccess } from './trees.service.js';

/** Nombre completo: Nombre + Apellido paterno + Apellido materno (fallback last_name). */
function fullName(p: {
  first_name: string;
  last_name?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
}): string {
  const apellidos = [p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ') || p.last_name || '';
  return apellidos ? `${p.first_name} ${apellidos}` : p.first_name;
}

/**
 * Resumen clínico agregado del árbol — patrones hereditarios visibles.
 */
export async function familyMedicalSummary(treeId: string, userId: string) {
  await assertAccess(treeId, userId, 'read');

  const persons = await prisma.person.findMany({
    where: { tree_id: treeId, deleted_at: null },
    include: {
      person_condition: { include: { medical_condition: true } },
      allergy: true,
      habit: true,
    },
  });

  const total = persons.length;
  const alive = persons.filter((p) => !p.death_date).length;
  const dead = total - alive;

  // Agrupar condiciones por nombre/código
  const conditionMap = new Map<
    string,
    { name: string; code: string | null; hereditary: boolean; count: number; persons: string[] }
  >();
  for (const p of persons) {
    for (const pc of p.person_condition) {
      const key = pc.medical_condition?.code ?? pc.custom_name ?? 'desconocida';
      const name = pc.medical_condition?.name ?? pc.custom_name ?? 'Desconocida';
      const hereditary = pc.medical_condition?.is_hereditary ?? false;
      const existing = conditionMap.get(key);
      if (existing) {
        existing.count++;
        existing.persons.push(fullName(p));
      } else {
        conditionMap.set(key, {
          name,
          code: pc.medical_condition?.code ?? null,
          hereditary,
          count: 1,
          persons: [fullName(p)],
        });
      }
    }
  }

  // Patrones: 2+ casos = patrón posible. Hereditarias siempre destacadas.
  const conditions = Array.from(conditionMap.values())
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      ...c,
      severity: c.count >= 3 ? 'alta' : c.count === 2 ? 'media' : 'baja',
    }));

  // Causas de muerte
  const deathCauses = persons
    .flatMap((p) =>
      p.person_condition
        .filter((c) => c.status === 'cause_of_death')
        .map((c) => c.medical_condition?.name ?? c.custom_name ?? '?'),
    )
    .filter(Boolean);

  // Hábitos comunes
  const habitMap = new Map<string, number>();
  for (const p of persons) {
    for (const h of p.habit) {
      habitMap.set(h.kind, (habitMap.get(h.kind) ?? 0) + 1);
    }
  }
  const habits = Array.from(habitMap.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  // Alergias agregadas
  const allergyMap = new Map<string, number>();
  for (const p of persons) {
    for (const a of p.allergy) {
      const key = a.name.toLowerCase();
      allergyMap.set(key, (allergyMap.get(key) ?? 0) + 1);
    }
  }
  const allergies = Array.from(allergyMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    summary: { total, alive, dead },
    conditions,
    deathCauses,
    habits,
    allergies,
  };
}

/**
 * Exporta el árbol como archivo GEDCOM 5.5.1 (estándar genealógico).
 */
export async function exportGedcom(treeId: string, userId: string): Promise<string> {
  await assertAccess(treeId, userId, 'read');

  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    include: {
      person: { where: { deleted_at: null } },
      relationship: true,
    },
  });
  if (!tree) throw Errors.notFound('Árbol');

  const personIdToGed = new Map<string, string>();
  tree.person.forEach((p, i) => personIdToGed.set(p.id, `I${i + 1}`));

  // Agrupar relaciones parent por "familia" (mismo conjunto de padres → mismos hijos)
  const partnerPairs = tree.relationship
    .filter((r) => r.type === 'partner')
    .map((r) => [r.from_person_id, r.to_person_id].sort().join(':'));

  const familyMap = new Map<string, { parents: string[]; children: string[] }>();
  for (const pair of partnerPairs) {
    if (!familyMap.has(pair)) familyMap.set(pair, { parents: pair.split(':'), children: [] });
  }

  // Asignar hijos a familias (por par de padres)
  const childrenByParent = new Map<string, string[]>();
  for (const r of tree.relationship.filter((r) => r.type === 'parent')) {
    if (!childrenByParent.has(r.from_person_id)) childrenByParent.set(r.from_person_id, []);
    childrenByParent.get(r.from_person_id)!.push(r.to_person_id);
  }

  // Para cada persona, buscar sus dos padres y crear familia
  for (const p of tree.person) {
    const parentsRels = tree.relationship.filter((r) => r.type === 'parent' && r.to_person_id === p.id);
    if (parentsRels.length === 0) continue;
    const parents = parentsRels.map((r) => r.from_person_id).sort();
    const key = parents.join(':');
    if (!familyMap.has(key)) familyMap.set(key, { parents, children: [] });
    familyMap.get(key)!.children.push(p.id);
  }

  // Construir GEDCOM
  const lines: string[] = [];
  lines.push('0 HEAD');
  lines.push('1 SOUR Luca');
  lines.push('2 NAME Luca App');
  lines.push('2 VERS 1.0');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');
  lines.push(`1 DATE ${formatGedcomDate(new Date())}`);

  // Individuals
  for (const p of tree.person) {
    const ged = personIdToGed.get(p.id)!;
    const apellidos = [p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ') || p.last_name || '';
    lines.push(`0 @${ged}@ INDI`);
    lines.push(`1 NAME ${p.first_name} /${apellidos}/`);
    if (p.gender === 'male') lines.push('1 SEX M');
    else if (p.gender === 'female') lines.push('1 SEX F');
    else lines.push('1 SEX U');
    if (p.birth_date) {
      lines.push('1 BIRT');
      lines.push(`2 DATE ${formatGedcomDate(p.birth_date)}`);
      if (p.birth_place) lines.push(`2 PLAC ${p.birth_place}`);
    }
    if (p.death_date) {
      lines.push('1 DEAT');
      lines.push(`2 DATE ${formatGedcomDate(p.death_date)}`);
    }
    if (p.notes) {
      for (const noteLine of p.notes.split('\n')) {
        lines.push(`1 NOTE ${noteLine}`);
      }
    }
  }

  // Families
  let famCounter = 1;
  for (const fam of familyMap.values()) {
    if (fam.parents.length === 0 && fam.children.length === 0) continue;
    lines.push(`0 @F${famCounter}@ FAM`);
    for (const parentId of fam.parents) {
      const person = tree.person.find((p) => p.id === parentId);
      if (!person) continue;
      const ged = personIdToGed.get(parentId);
      if (!ged) continue;
      const tag = person.gender === 'female' ? 'WIFE' : 'HUSB';
      lines.push(`1 ${tag} @${ged}@`);
    }
    for (const childId of fam.children) {
      const ged = personIdToGed.get(childId);
      if (ged) lines.push(`1 CHIL @${ged}@`);
    }
    famCounter++;
  }

  lines.push('0 TRLR');
  return lines.join('\n');
}

function formatGedcomDate(d: Date): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
