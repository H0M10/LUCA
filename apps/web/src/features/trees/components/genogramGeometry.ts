import type { PersonDto, RelationshipDto } from '../api/trees.js';

// ── Dimensiones base del lienzo ──────────────────────────────────────────
export const NODE_W = 200;
export const NODE_H = 130;
export const GAP_X = 110; // separación entre unidades (parejas/solteros) de una generación
export const GAP_Y = 140; // separación vertical entre generaciones
export const COUPLE_GAP = 44; // separación entre los dos miembros de una pareja
export const PAD = 56;

export interface Layout {
  generations: Map<number, string[]>;
  posById: Map<string, { x: number; y: number; gen: number }>;
  maxGen: number; // span de generaciones (para compatibilidad)
  maxPerGen: number;
  width: number;
  height: number;
}

/**
 * Layout estilo genograma:
 *  - Generación por BFS desde el proband (padres arriba, hijos abajo).
 *  - Dentro de cada generación, las parejas quedan ADYACENTES y los hijos
 *    se ordenan para caer bajo sus padres (se procesa de arriba hacia abajo).
 */
export function computeLayout(persons: PersonDto[], rels: RelationshipDto[]): Layout {
  const proband = persons.find((p) => p.isProband) ?? persons[0];
  const generations = new Map<number, string[]>();
  const genById = new Map<string, number>();

  if (!proband) {
    return { generations, posById: new Map(), maxGen: 0, maxPerGen: 0, width: PAD * 2, height: PAD * 2 };
  }

  // BFS de generaciones
  const queue: Array<{ id: string; gen: number }> = [{ id: proband.id, gen: 0 }];
  while (queue.length) {
    const { id, gen } = queue.shift()!;
    if (genById.has(id)) continue;
    genById.set(id, gen);
    rels
      .filter((r) => r.type === 'parent' && r.toPersonId === id)
      .forEach((r) => !genById.has(r.fromPersonId) && queue.push({ id: r.fromPersonId, gen: gen + 1 }));
    rels
      .filter((r) => r.type === 'parent' && r.fromPersonId === id)
      .forEach((r) => !genById.has(r.toPersonId) && queue.push({ id: r.toPersonId, gen: gen - 1 }));
    rels
      .filter((r) => r.type === 'partner' && (r.fromPersonId === id || r.toPersonId === id))
      .forEach((r) => {
        const other = r.fromPersonId === id ? r.toPersonId : r.fromPersonId;
        if (!genById.has(other)) queue.push({ id: other, gen });
      });
  }
  persons.forEach((p) => !genById.has(p.id) && genById.set(p.id, 0));

  const byGen = new Map<number, string[]>();
  for (const [id, g] of genById) {
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g)!.push(id);
  }

  const partnerOf = new Map<string, Set<string>>();
  rels
    .filter((r) => r.type === 'partner')
    .forEach((r) => {
      (partnerOf.get(r.fromPersonId) ?? partnerOf.set(r.fromPersonId, new Set()).get(r.fromPersonId)!).add(r.toPersonId);
      (partnerOf.get(r.toPersonId) ?? partnerOf.set(r.toPersonId, new Set()).get(r.toPersonId)!).add(r.fromPersonId);
    });

  const parentsOf = new Map<string, string[]>();
  rels
    .filter((r) => r.type === 'parent')
    .forEach((r) => {
      (parentsOf.get(r.toPersonId) ?? parentsOf.set(r.toPersonId, []).get(r.toPersonId)!).push(r.fromPersonId);
    });

  const gens = [...byGen.keys()].sort((a, b) => b - a); // ancestros primero
  const maxGen = gens[0] ?? 0;
  const minGen = gens[gens.length - 1] ?? 0;

  // Orden por generación (top-down): parejas juntas + hijos bajo sus padres
  const indexOf = new Map<string, number>();
  const unitsByGen = new Map<number, string[][]>();

  for (const g of gens) {
    const ids = byGen.get(g)!;
    const keyOf = (id: string) => {
      const ps = (parentsOf.get(id) ?? []).filter((pid) => genById.get(pid) === g + 1 && indexOf.has(pid));
      if (ps.length === 0) return Number.POSITIVE_INFINITY;
      return ps.reduce((s, pid) => s + indexOf.get(pid)!, 0) / ps.length;
    };
    const orig = new Map(ids.map((id, i) => [id, i]));
    const sorted = [...ids].sort((a, b) => keyOf(a) - keyOf(b) || orig.get(a)! - orig.get(b)!);

    const placed = new Set<string>();
    const units: string[][] = [];
    for (const id of sorted) {
      if (placed.has(id)) continue;
      const mate = [...(partnerOf.get(id) ?? [])].find((pid) => genById.get(pid) === g && !placed.has(pid));
      if (mate) {
        units.push([id, mate]);
        placed.add(id);
        placed.add(mate);
      } else {
        units.push([id]);
        placed.add(id);
      }
    }
    unitsByGen.set(g, units);
    const ordered: string[] = [];
    units.forEach((u) => u.forEach((id) => ordered.push(id)));
    ordered.forEach((id, i) => indexOf.set(id, i));
  }

  const unitWidth = (u: string[]) => u.length * NODE_W + (u.length - 1) * COUPLE_GAP;
  const rowWidth = (units: string[][]) =>
    units.reduce((s, u) => s + unitWidth(u), 0) + Math.max(0, units.length - 1) * GAP_X;
  let maxRow = 0;
  for (const units of unitsByGen.values()) maxRow = Math.max(maxRow, rowWidth(units));

  const posById = new Map<string, { x: number; y: number; gen: number }>();
  for (const g of gens) {
    const units = unitsByGen.get(g)!;
    const y = PAD + (maxGen - g) * (NODE_H + GAP_Y);
    let x = PAD + (maxRow - rowWidth(units)) / 2;
    for (const u of units) {
      for (const id of u) {
        posById.set(id, { x, y, gen: g });
        x += NODE_W + COUPLE_GAP;
      }
      x += -COUPLE_GAP + GAP_X;
    }
    generations.set(g, units.flat());
  }

  const span = maxGen - minGen;
  const maxPerGen = Math.max(1, Math.ceil((maxRow + GAP_X) / (NODE_W + GAP_X)));
  return {
    generations,
    posById,
    maxGen: span,
    maxPerGen,
    width: PAD * 2 + maxRow,
    height: PAD * 2 + (span + 1) * NODE_H + span * GAP_Y,
  };
}

// ── Bordes (conexiones) estilo genograma ──────────────────────────────────
export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface PartnerEdge {
  relId: string;
  subtype: string | null;
  segs: Seg[];
  midX: number;
  midY: number;
  slashes: 0 | 1 | 2; // 0 unión vigente · 1 separación · 2 divorcio
  dashed: boolean; // unión libre / compromiso
  ended: boolean; // separación / divorcio / viudez
  touches: Set<string>;
}
export interface ChildGroup {
  parents: string[];
  anchorX: number;
  anchorY: number;
  busY: number;
  barX1: number;
  barX2: number;
  drops: Array<{ x: number; topY: number; childId: string; subtype: string | null; dashed: boolean }>;
  touches: Set<string>;
}

const STEP_LIKE = new Set(['adoptive', 'step', 'foster', 'surrogate']);

export function buildGenogramEdges(rels: RelationshipDto[], layout: Layout) {
  const center = (id: string) => {
    const p = layout.posById.get(id);
    return p ? { cx: p.x + NODE_W / 2, top: p.y, bottom: p.y + NODE_H, midY: p.y + NODE_H / 2 } : null;
  };
  const coupleUnion = new Map<string, { x: number; y: number }>();

  const partners: PartnerEdge[] = [];
  for (const r of rels.filter((r) => r.type === 'partner')) {
    const A = center(r.fromPersonId);
    const B = center(r.toPersonId);
    if (!A || !B) continue;
    const [a, b] = A.cx <= B.cx ? [A, B] : [B, A];
    const unionY = Math.max(a.bottom, b.bottom) + GAP_Y * 0.32;
    const midX = (a.cx + b.cx) / 2;
    const sub = r.subtype;
    partners.push({
      relId: r.id,
      subtype: sub,
      segs: [
        { x1: a.cx, y1: a.bottom, x2: a.cx, y2: unionY },
        { x1: b.cx, y1: b.bottom, x2: b.cx, y2: unionY },
        { x1: a.cx, y1: unionY, x2: b.cx, y2: unionY },
      ],
      midX,
      midY: unionY,
      slashes: sub === 'divorced' ? 2 : sub === 'separated' ? 1 : 0,
      dashed: sub === 'cohabitation' || sub === 'engaged',
      ended: sub === 'divorced' || sub === 'separated' || sub === 'widowed',
      touches: new Set([r.fromPersonId, r.toPersonId]),
    });
    coupleUnion.set([r.fromPersonId, r.toPersonId].sort().join('|'), { x: midX, y: unionY });
  }

  // Agrupar hijos por su conjunto de padres
  const parentsOf = new Map<string, string[]>();
  const subOf = new Map<string, string | null>();
  for (const r of rels.filter((r) => r.type === 'parent')) {
    (parentsOf.get(r.toPersonId) ?? parentsOf.set(r.toPersonId, []).get(r.toPersonId)!).push(r.fromPersonId);
    subOf.set(`${r.fromPersonId}>${r.toPersonId}`, r.subtype);
  }
  const groups = new Map<string, { parents: string[]; children: string[] }>();
  for (const [child, parents] of parentsOf) {
    const sorted = [...parents].sort();
    const key = sorted.join('|');
    if (!groups.has(key)) groups.set(key, { parents: sorted, children: [] });
    groups.get(key)!.children.push(child);
  }

  const childGroups: ChildGroup[] = [];
  for (const { parents, children } of groups.values()) {
    let anchorX: number;
    let anchorY: number;
    if (parents.length >= 2) {
      const up = coupleUnion.get(parents.join('|'));
      if (up) {
        anchorX = up.x;
        anchorY = up.y;
      } else {
        const cs = parents.map(center).filter(Boolean) as NonNullable<ReturnType<typeof center>>[];
        if (!cs.length) continue;
        anchorX = cs.reduce((s, c) => s + c.cx, 0) / cs.length;
        anchorY = Math.max(...cs.map((c) => c.bottom)) + GAP_Y * 0.32;
      }
    } else {
      const c = center(parents[0]!);
      if (!c) continue;
      anchorX = c.cx;
      anchorY = c.bottom;
    }
    const cc = children.map((id) => ({ id, c: center(id) })).filter((x) => x.c) as Array<{
      id: string;
      c: NonNullable<ReturnType<typeof center>>;
    }>;
    if (!cc.length) continue;
    const topY = Math.min(...cc.map((x) => x.c.top));
    const busY = topY - GAP_Y * 0.45;
    const xs = cc.map((x) => x.c.cx);
    const drops = cc.map((x) => {
      const parent = parents.find((p) => subOf.has(`${p}>${x.id}`));
      const subtype = parent ? subOf.get(`${parent}>${x.id}`) ?? null : null;
      return { x: x.c.cx, topY: x.c.top, childId: x.id, subtype, dashed: subtype ? STEP_LIKE.has(subtype) : false };
    });
    childGroups.push({
      parents,
      anchorX,
      anchorY,
      busY,
      barX1: Math.min(anchorX, ...xs),
      barX2: Math.max(anchorX, ...xs),
      drops,
      touches: new Set<string>([...parents, ...children]),
    });
  }

  return { partners, childGroups };
}
