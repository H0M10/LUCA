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

  // Conjunto "de sangre": alcanzable desde el proband SOLO por relaciones
  // padre-hijo (ancestros + descendientes). Las parejas que entran por
  // matrimonio NO son de sangre → se acomodan al lado, sin mover la columna.
  const blood = new Set<string>([proband.id]);
  {
    const q = [proband.id];
    while (q.length) {
      const id = q.shift()!;
      for (const r of rels) {
        if (r.type !== 'parent') continue;
        if (r.toPersonId === id && !blood.has(r.fromPersonId)) {
          blood.add(r.fromPersonId);
          q.push(r.fromPersonId);
        }
        if (r.fromPersonId === id && !blood.has(r.toPersonId)) {
          blood.add(r.toPersonId);
          q.push(r.toPersonId);
        }
      }
    }
  }

  const gens = [...byGen.keys()].sort((a, b) => b - a); // ancestros primero
  const maxGen = gens[0] ?? 0;
  const minGen = gens[gens.length - 1] ?? 0;

  // Unidades: cada una tiene un ANCLA de sangre y a su lado las parejas que se
  // casaron con esa persona. El ancla es lo que se centra bajo sus padres.
  interface Unit {
    members: string[];
    anchorIdx: number;
    x: number;
  }
  const unitsByGen = new Map<number, Unit[]>();
  const unitOf = new Map<string, Unit>();

  for (const g of gens) {
    const ids = byGen.get(g)!;
    const placed = new Set<string>();
    const units: Unit[] = [];
    // 1) Personas de sangre, con sus parejas (no de sangre) adjuntas a la derecha.
    for (const id of ids) {
      if (placed.has(id) || !blood.has(id)) continue;
      const members = [id];
      placed.add(id);
      for (const pid of partnerOf.get(id) ?? []) {
        if (genById.get(pid) === g && !blood.has(pid) && !placed.has(pid)) {
          members.push(pid);
          placed.add(pid);
        }
      }
      const unit: Unit = { members, anchorIdx: 0, x: 0 };
      members.forEach((m) => unitOf.set(m, unit));
      units.push(unit);
    }
    // 2) Restantes: se adjuntan a la unidad de su pareja si existe; si no, unidad propia.
    for (const id of ids) {
      if (placed.has(id)) continue;
      let attached = false;
      for (const pid of partnerOf.get(id) ?? []) {
        const u = unitOf.get(pid);
        if (u && genById.get(pid) === g) {
          u.members.push(id);
          unitOf.set(id, u);
          placed.add(id);
          attached = true;
          break;
        }
      }
      if (!attached) {
        const unit: Unit = { members: [id], anchorIdx: 0, x: 0 };
        unitOf.set(id, unit);
        placed.add(id);
        units.push(unit);
      }
    }
    unitsByGen.set(g, units);
  }

  const unitWidth = (u: Unit) => u.members.length * NODE_W + (u.members.length - 1) * COUPLE_GAP;
  const anchorOffset = (u: Unit) => u.anchorIdx * (NODE_W + COUPLE_GAP) + NODE_W / 2;

  const posById = new Map<string, { x: number; y: number; gen: number }>();
  const cardCenter = (id: string) => {
    const p = posById.get(id);
    return p ? p.x + NODE_W / 2 : null;
  };

  // Colocar de ARRIBA (ancestros) hacia ABAJO; cada unidad se centra bajo sus padres.
  for (let gi = 0; gi < gens.length; gi++) {
    const g = gens[gi]!;
    const y = PAD + (maxGen - g) * (NODE_H + GAP_Y);
    const units = unitsByGen.get(g)!;

    if (gi === 0) {
      let cursor = 0;
      for (const u of units) {
        u.x = cursor;
        cursor += unitWidth(u) + GAP_X;
      }
    } else {
      const desired = (u: Unit) => {
        const anchor = u.members[u.anchorIdx]!;
        const cs = (parentsOf.get(anchor) ?? [])
          .map(cardCenter)
          .filter((v): v is number => v != null);
        return cs.length ? cs.reduce((s, v) => s + v, 0) / cs.length : Number.POSITIVE_INFINITY;
      };
      const ordered = units.map((u) => ({ u, d: desired(u) })).sort((a, b) => a.d - b.d);
      let cursorRight = Number.NEGATIVE_INFINITY;
      for (const { u, d } of ordered) {
        const base =
          d === Number.POSITIVE_INFINITY
            ? cursorRight > Number.NEGATIVE_INFINITY
              ? cursorRight + GAP_X + anchorOffset(u)
              : anchorOffset(u)
            : d;
        let x = base - anchorOffset(u);
        if (cursorRight > Number.NEGATIVE_INFINITY) x = Math.max(x, cursorRight + GAP_X);
        u.x = x;
        cursorRight = x + unitWidth(u);
      }
    }

    for (const u of units) {
      let cx = u.x;
      for (const id of u.members) {
        posById.set(id, { x: cx, y, gen: g });
        cx += NODE_W + COUPLE_GAP;
      }
    }
    generations.set(g, units.flatMap((u) => u.members));
  }

  // Normalizar para que el mínimo x sea PAD.
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of posById.values()) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + NODE_W);
  }
  if (minX === Infinity) {
    minX = PAD;
    maxX = PAD;
  }
  const shift = PAD - minX;
  for (const p of posById.values()) p.x += shift;

  const span = maxGen - minGen;
  const contentW = maxX - minX;
  const maxPerGen = Math.max(1, Math.ceil((contentW + GAP_X) / (NODE_W + GAP_X)));
  return {
    generations,
    posById,
    maxGen: span,
    maxPerGen,
    width: PAD * 2 + contentW,
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
  /** Barra + bajadas que conectan a los padres cuando NO son una pareja registrada. */
  parentBar: { x1: number; x2: number; y: number } | null;
  parentStubs: Array<{ x: number; fromY: number; toY: number }>;
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
    const pa = layout.posById.get(r.fromPersonId);
    const pb = layout.posById.get(r.toPersonId);
    if (!pa || !pb) continue;
    const [L, R] = pa.x <= pb.x ? [pa, pb] : [pb, pa];
    const sub = r.subtype;
    const sameRow = Math.abs(L.y - R.y) < 1;
    const gap = R.x - (L.x + NODE_W);
    const inline = sameRow && gap > 0 && gap <= GAP_X + 1; // son vecinos = pareja
    let segs: Seg[];
    let midX: number;
    let midY: number;
    if (inline) {
      // Barra horizontal ENTRE las dos tarjetas (estilo genograma clásico)
      const y = L.y + NODE_H / 2;
      const x1 = L.x + NODE_W;
      const x2 = R.x;
      segs = [{ x1, y1: y, x2, y2: y }];
      midX = (x1 + x2) / 2;
      midY = y;
    } else {
      // Parejas no adyacentes (varias parejas, lejanas): grapa por debajo
      const aCx = L.x + NODE_W / 2;
      const bCx = R.x + NODE_W / 2;
      const unionY = Math.max(L.y, R.y) + NODE_H + GAP_Y * 0.32;
      segs = [
        { x1: aCx, y1: L.y + NODE_H, x2: aCx, y2: unionY },
        { x1: bCx, y1: R.y + NODE_H, x2: bCx, y2: unionY },
        { x1: aCx, y1: unionY, x2: bCx, y2: unionY },
      ];
      midX = (aCx + bCx) / 2;
      midY = unionY;
    }
    partners.push({
      relId: r.id,
      subtype: sub,
      segs,
      midX,
      midY,
      slashes: sub === 'divorced' ? 2 : sub === 'separated' ? 1 : 0,
      dashed: sub === 'cohabitation' || sub === 'engaged',
      ended: sub === 'divorced' || sub === 'separated' || sub === 'widowed',
      touches: new Set([r.fromPersonId, r.toPersonId]),
    });
    coupleUnion.set([r.fromPersonId, r.toPersonId].sort().join('|'), { x: midX, y: midY });
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
    let parentBar: { x1: number; x2: number; y: number } | null = null;
    let parentStubs: Array<{ x: number; fromY: number; toY: number }> = [];
    if (parents.length >= 2) {
      // ¿Hay una PAREJA registrada entre los padres? Anclamos a su unión.
      let coupleUP: { x: number; y: number } | null = null;
      let couplePair: [string, string] | null = null;
      for (let i = 0; i < parents.length && !coupleUP; i++) {
        for (let j = i + 1; j < parents.length; j++) {
          const up = coupleUnion.get([parents[i]!, parents[j]!].sort().join('|'));
          if (up) {
            coupleUP = up;
            couplePair = [parents[i]!, parents[j]!];
            break;
          }
        }
      }
      if (coupleUP && couplePair) {
        anchorX = coupleUP.x;
        anchorY = coupleUP.y;
        // Padres adicionales (no parte de la pareja) se conectan a la unión.
        const extras = parents.filter((p) => !couplePair!.includes(p));
        const cs = extras.map(center).filter(Boolean) as NonNullable<ReturnType<typeof center>>[];
        if (cs.length) {
          const xs = [anchorX, ...cs.map((c) => c.cx)];
          parentBar = { x1: Math.min(...xs), x2: Math.max(...xs), y: anchorY };
          parentStubs = cs.map((c) => ({ x: c.cx, fromY: c.bottom, toY: anchorY }));
        }
      } else {
        // Ningún par es pareja: barra que une a todos los co-padres.
        const cs = parents.map(center).filter(Boolean) as NonNullable<ReturnType<typeof center>>[];
        if (!cs.length) continue;
        anchorY = Math.max(...cs.map((c) => c.bottom)) + GAP_Y * 0.32;
        const pxs = cs.map((c) => c.cx);
        anchorX = (Math.min(...pxs) + Math.max(...pxs)) / 2;
        parentBar = { x1: Math.min(...pxs), x2: Math.max(...pxs), y: anchorY };
        parentStubs = cs.map((c) => ({ x: c.cx, fromY: c.bottom, toY: anchorY }));
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
      parentBar,
      parentStubs,
    });
  }

  return { partners, childGroups };
}
