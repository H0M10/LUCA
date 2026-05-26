import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PersonDto, RelationshipDto } from '../api/trees.js';

interface Props {
  persons: PersonDto[];
  relationships: RelationshipDto[];
  linkMode: null | { from: string; type: 'parent' | 'partner' };
  onSelectAsTarget: (id: string) => void;
  onStartLink: (id: string, type: 'parent' | 'partner') => void;
  onDelete: (id: string) => void;
}

interface Layout {
  generations: Map<number, string[]>; // gen -> personIds
  posById: Map<string, { x: number; y: number; gen: number }>;
  maxGen: number;
  maxPerGen: number;
}

const NODE_W = 200;
const NODE_H = 130;
const GAP_X = 60;
const GAP_Y = 80;
const PAD = 40;

function computeLayout(persons: PersonDto[], rels: RelationshipDto[]): Layout {
  // Genealogía: gen 0 = proband; gen + para padres; gen - para hijos.
  // Si no hay proband, usar el de mayor edad como referencia.
  const proband = persons.find((p) => p.isProband) ?? persons[0];
  const generations = new Map<number, string[]>();
  const genById = new Map<string, number>();

  if (!proband) {
    return { generations, posById: new Map(), maxGen: 0, maxPerGen: 0 };
  }

  // BFS asignando generaciones
  const queue: Array<{ id: string; gen: number }> = [{ id: proband.id, gen: 0 }];
  while (queue.length) {
    const { id, gen } = queue.shift()!;
    if (genById.has(id)) continue;
    genById.set(id, gen);

    // padres → gen + 1
    rels
      .filter((r) => r.type === 'parent' && r.toPersonId === id)
      .forEach((r) => {
        if (!genById.has(r.fromPersonId)) queue.push({ id: r.fromPersonId, gen: gen + 1 });
      });
    // hijos → gen - 1
    rels
      .filter((r) => r.type === 'parent' && r.fromPersonId === id)
      .forEach((r) => {
        if (!genById.has(r.toPersonId)) queue.push({ id: r.toPersonId, gen: gen - 1 });
      });
    // pareja → misma gen
    rels
      .filter((r) => r.type === 'partner' && (r.fromPersonId === id || r.toPersonId === id))
      .forEach((r) => {
        const other = r.fromPersonId === id ? r.toPersonId : r.fromPersonId;
        if (!genById.has(other)) queue.push({ id: other, gen });
      });
  }

  // Personas no conectadas — generación 0 (separadas)
  persons.forEach((p) => {
    if (!genById.has(p.id)) genById.set(p.id, 0);
  });

  // Agrupar por generación
  for (const [id, gen] of genById) {
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen)!.push(id);
  }

  const gens = [...generations.keys()].sort((a, b) => b - a); // mayor (ancestros) primero
  const maxGen = gens[0] ?? 0;
  const minGen = gens[gens.length - 1] ?? 0;
  let maxPerGen = 0;
  for (const ids of generations.values()) maxPerGen = Math.max(maxPerGen, ids.length);

  // Calcular posiciones
  const posById = new Map<string, { x: number; y: number; gen: number }>();
  gens.forEach((g) => {
    const ids = generations.get(g)!;
    const totalWidth = ids.length * NODE_W + (ids.length - 1) * GAP_X;
    const startX = PAD + (maxPerGen * (NODE_W + GAP_X) - totalWidth) / 2;
    const y = PAD + (maxGen - g) * (NODE_H + GAP_Y);
    ids.forEach((id, idx) => {
      posById.set(id, { x: startX + idx * (NODE_W + GAP_X), y, gen: g });
    });
  });

  // ajustar maxGen para el viewBox
  return { generations, posById, maxGen: maxGen - minGen, maxPerGen };
}

export function GenogramView({
  persons,
  relationships,
  linkMode,
  onSelectAsTarget,
  onStartLink,
  onDelete,
}: Props) {
  const layout = useMemo(() => computeLayout(persons, relationships), [persons, relationships]);
  if (persons.length === 0) return null;

  const svgWidth = PAD * 2 + layout.maxPerGen * NODE_W + (layout.maxPerGen - 1) * GAP_X;
  const svgHeight = PAD * 2 + (layout.maxGen + 1) * NODE_H + layout.maxGen * GAP_Y;

  // Construir líneas
  const parentLines = relationships
    .filter((r) => r.type === 'parent')
    .map((r) => {
      const from = layout.posById.get(r.fromPersonId);
      const to = layout.posById.get(r.toPersonId);
      if (!from || !to) return null;
      const x1 = from.x + NODE_W / 2;
      const y1 = from.y + NODE_H;
      const x2 = to.x + NODE_W / 2;
      const y2 = to.y;
      const midY = (y1 + y2) / 2;
      return (
        <path
          key={`p-${r.id}`}
          d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
          stroke="#3D5240"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-path"
          strokeDasharray="1000"
          style={{ animationDelay: '0.4s' }}
        />
      );
    });

  const partnerLines = relationships
    .filter((r) => r.type === 'partner')
    .map((r) => {
      const from = layout.posById.get(r.fromPersonId);
      const to = layout.posById.get(r.toPersonId);
      if (!from || !to) return null;
      const isEnded = r.subtype === 'divorced' || r.subtype === 'separated';
      const y = from.y + NODE_H / 2;
      const x1 = from.x + NODE_W;
      const x2 = to.x;
      return (
        <line
          key={`pn-${r.id}`}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={isEnded ? '#C2613A' : '#3D5240'}
          strokeWidth="1.5"
          strokeDasharray={isEnded ? '6 4' : '500'}
          strokeLinecap="round"
          className="animate-draw-path"
          style={{ animationDelay: '0.3s' }}
        />
      );
    });

  return (
    <div className="relative overflow-x-auto rounded-sm border border-paper-300 bg-paper-50">
      {/* Decorative paper background dots */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        className="block min-w-full"
        style={{ minHeight: 400 }}
      >
        <defs>
          <pattern id="paper-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.5" fill="#E5DDD0" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#paper-grid)" />

        {/* Líneas primero (debajo de las cards) */}
        <g>{partnerLines}</g>
        <g>{parentLines}</g>

        {/* Cards de personas */}
        {persons.map((p, i) => {
          const pos = layout.posById.get(p.id);
          if (!pos) return null;
          const isTarget = linkMode && linkMode.from !== p.id;
          const isSource = linkMode && linkMode.from === p.id;
          return (
            <g
              key={p.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="animate-grow-in"
              style={{ animationDelay: `${0.15 + i * 0.08}s`, transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <foreignObject width={NODE_W} height={NODE_H} style={{ overflow: 'visible' }}>
                <PersonNode
                  person={p}
                  isTarget={isTarget}
                  isSource={isSource}
                  onSelectAsTarget={() => onSelectAsTarget(p.id)}
                  onStartLink={(t) => onStartLink(p.id, t)}
                  onDelete={() => onDelete(p.id)}
                />
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Legend abajo */}
      <div className="border-t border-paper-300 bg-paper-100 px-4 py-2">
        <div className="flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-ink-500">
          <span>Notación de genograma</span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14"><rect x="1" y="1" width="12" height="12" stroke="#1F1A14" fill="none"/></svg>
            Masculino
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14"><circle cx="7" cy="7" r="6" stroke="#1F1A14" fill="none"/></svg>
            Femenino
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14"><line x1="2" y1="2" x2="12" y2="12" stroke="#A89F8E"/></svg>
            Fallecido
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#C2613A" strokeDasharray="3 2"/></svg>
            Separados
          </span>
        </div>
      </div>
    </div>
  );
}

function PersonNode({
  person,
  isTarget,
  isSource,
  onSelectAsTarget,
  onStartLink,
  onDelete,
}: {
  person: PersonDto;
  isTarget: boolean | null;
  isSource: boolean | null;
  onSelectAsTarget: () => void;
  onStartLink: (type: 'parent' | 'partner') => void;
  onDelete: () => void;
}) {
  const dead = !!person.deathDate;
  return (
    <div
      className={`group relative h-full w-full cursor-pointer border bg-paper-50 transition-all duration-300 ease-out ${
        isTarget
          ? 'border-moss-700 shadow-moss'
          : isSource
            ? 'border-clay-500 ring-2 ring-clay-300'
            : person.isProband
              ? 'border-ink-900 ring-1 ring-moss-700/30 animate-breath hover:-translate-y-0.5 hover:shadow-paper-lg'
              : 'border-paper-300 hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-paper-lg'
      }`}
    >
      {isTarget && (
        <button
          onClick={onSelectAsTarget}
          className="absolute inset-0 z-10"
          aria-label="Seleccionar como objetivo"
        />
      )}

      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-paper-300 bg-paper-100 px-3 py-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
          {person.gender === 'female' ? 'F' : person.gender === 'male' ? 'M' : '—'}
          {dead && ' · †'}
        </span>
        {person.isProband && (
          <span className="rounded-full bg-ink-900 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-paper-50">
            Yo
          </span>
        )}
      </div>

      {/* Body */}
      <Link
        to={`/persons/${person.id}?treeId=${person.treeId}`}
        className="block px-3 py-2"
      >
        <div className="flex items-start gap-2">
          <PersonSymbol gender={person.gender} dead={dead} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-light leading-tight text-ink-900 group-hover:text-moss-700">
              {person.firstName} {person.lastName ?? ''}
            </h3>
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
              {person.birthDate ?? '?'} — {person.deathDate ?? (person.birthDate ? 'pres.' : '')}
            </p>
          </div>
        </div>
      </Link>

      {/* Acciones — visibles al hover */}
      <div className="relative z-20 flex border-t border-paper-300 text-[10px] opacity-60 transition group-hover:opacity-100">
        <button onClick={() => onStartLink('parent')} className="flex-1 px-2 py-1 font-sans text-ink-500 transition hover:bg-paper-200 hover:text-ink-900" title="Agregar hijo/a">
          + hijo
        </button>
        <span className="w-px bg-paper-300" />
        <button onClick={() => onStartLink('partner')} className="flex-1 px-2 py-1 font-sans text-ink-500 transition hover:bg-paper-200 hover:text-ink-900" title="Agregar pareja">
          + pareja
        </button>
        <span className="w-px bg-paper-300" />
        <button onClick={onDelete} className="flex-1 px-2 py-1 font-sans text-clay-600 transition hover:bg-clay-100" title="Eliminar persona">
          ×
        </button>
      </div>
    </div>
  );
}

function PersonSymbol({ gender, dead }: { gender: string | null; dead: boolean }) {
  const color = dead ? '#A89F8E' : '#1F1A14';
  const symbol =
    gender === 'female' ? (
      <circle cx="14" cy="14" r="12" fill="none" stroke={color} strokeWidth="1.5" />
    ) : gender === 'male' ? (
      <rect x="2" y="2" width="24" height="24" fill="none" stroke={color} strokeWidth="1.5" />
    ) : (
      <path d="M 14 2 L 26 14 L 14 26 L 2 14 Z" fill="none" stroke={color} strokeWidth="1.5" />
    );
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7 shrink-0">
      {symbol}
      {dead && <line x1="3" y1="3" x2="25" y2="25" stroke={color} strokeWidth="1.5" />}
    </svg>
  );
}
