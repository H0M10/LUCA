import { useMemo, useRef, useState } from 'react';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import { PersonAvatar } from './PersonAvatar.js';

interface Props {
  persons: PersonDto[];
  relationships: RelationshipDto[];
  linkMode: null | { from: string; type: 'parent' | 'partner' };
  onSelectAsTarget: (id: string) => void;
  onStartLink: (id: string, type: 'parent' | 'partner') => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export interface Layout {
  generations: Map<number, string[]>; // gen -> personIds
  posById: Map<string, { x: number; y: number; gen: number }>;
  maxGen: number;
  maxPerGen: number;
}

export const NODE_W = 200;
export const NODE_H = 130;
export const GAP_X = 60;
export const GAP_Y = 80;
export const PAD = 40;

export function computeLayout(persons: PersonDto[], rels: RelationshipDto[]): Layout {
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
  onSelect,
}: Props) {
  const layout = useMemo(() => computeLayout(persons, relationships), [persons, relationships]);
  // Persona resaltada: al pasar el cursor, ilumina TODAS sus conexiones.
  const [hovered, setHovered] = useState<string | null>(null);
  // Zoom para navegar árboles grandes (el contenedor hace scroll = paneo).
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  if (persons.length === 0) return null;

  const zoomIn = () => setZoom((z) => Math.min(2, +(z * 1.2).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.3, +(z / 1.2).toFixed(2)));
  const fit = () => {
    const el = scrollRef.current;
    if (!el) return setZoom(1);
    const cw = el.clientWidth - 32;
    const ch = el.clientHeight - 32;
    setZoom(Math.max(0.3, Math.min(1, Math.min(cw / svgWidth, ch / svgHeight))));
    el.scrollTo({ top: 0, left: 0 });
  };

  const svgWidth = PAD * 2 + layout.maxPerGen * NODE_W + (layout.maxPerGen - 1) * GAP_X;
  const svgHeight = PAD * 2 + (layout.maxGen + 1) * NODE_H + layout.maxGen * GAP_Y;

  // Conjunto de personas conectadas directamente a la resaltada (para atenuar el resto)
  const connected = new Set<string>();
  if (hovered) {
    connected.add(hovered);
    relationships.forEach((r) => {
      if (r.fromPersonId === hovered) connected.add(r.toPersonId);
      if (r.toPersonId === hovered) connected.add(r.fromPersonId);
    });
  }

  // ── Conexiones curvas, una por relación (se ven TODAS) ──────────
  const center = (id: string) => {
    const p = layout.posById.get(id);
    return p ? { cx: p.x + NODE_W / 2, top: p.y, bottom: p.y + NODE_H, midY: p.y + NODE_H / 2, x: p.x } : null;
  };
  const touches = (r: RelationshipDto) =>
    !hovered || r.fromPersonId === hovered || r.toPersonId === hovered;

  const parentEdges = relationships
    .filter((r) => r.type === 'parent')
    .map((r, i) => {
      const from = center(r.fromPersonId);
      const to = center(r.toPersonId);
      if (!from || !to) return null;
      const x1 = from.cx;
      const y1 = from.bottom;
      const x2 = to.cx;
      const y2 = to.top;
      const dy = (y2 - y1) * 0.5;
      const active = touches(r);
      return (
        <path
          key={`pe-${r.id}`}
          d={`M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`}
          fill="none"
          stroke={hovered && active ? '#42A7A5' : '#123F52'}
          strokeWidth={hovered && active ? 2.6 : 1.6}
          strokeLinecap="round"
          style={{
            opacity: active ? 1 : 0.1,
            transition: 'opacity .25s, stroke-width .25s, stroke .25s',
            animationDelay: `${0.15 + i * 0.03}s`,
          }}
        />
      );
    });

  const partnerEdges = relationships
    .filter((r) => r.type === 'partner')
    .map((r, i) => {
      const from = center(r.fromPersonId);
      const to = center(r.toPersonId);
      if (!from || !to) return null;
      const isEnded = r.subtype === 'divorced' || r.subtype === 'separated';
      // ordena izquierda→derecha
      const [a, b] = from.x <= to.x ? [from, to] : [to, from];
      const x1 = a.x + NODE_W;
      const x2 = b.x;
      const y = a.midY;
      const dip = 18;
      const midX = (x1 + x2) / 2;
      const active = touches(r);
      const color = isEnded ? '#E0685A' : '#8AB96B';
      return (
        <g
          key={`pn-${r.id}`}
          style={{ opacity: active ? 1 : 0.1, transition: 'opacity .25s' }}
        >
          <path
            d={`M ${x1} ${y} Q ${midX} ${y + dip}, ${x2} ${b.midY}`}
            fill="none"
            stroke={color}
            strokeWidth={hovered && active ? 2.6 : 1.8}
            strokeLinecap="round"
            strokeDasharray={isEnded ? '6 4' : undefined}
            style={{ transition: 'stroke-width .25s' }}
          />
          <circle cx={midX} cy={y + dip} r="3.5" fill={color} />
        </g>
      );
    });

  return (
    <div className="relative rounded-2xl border border-paper-300 bg-paper-50 shadow-paper">
      {/* Controles de zoom — flotan sobre el árbol */}
      <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-full border border-paper-300 bg-white shadow-paper">
        <button onClick={zoomIn} className="px-3 py-1.5 font-sans text-base font-semibold text-ink-700 transition hover:bg-moss-50 hover:text-moss-700" title="Acercar">＋</button>
        <span className="h-px bg-paper-300" />
        <button onClick={zoomOut} className="px-3 py-1.5 font-sans text-base font-semibold text-ink-700 transition hover:bg-moss-50 hover:text-moss-700" title="Alejar">－</button>
        <span className="h-px bg-paper-300" />
        <button onClick={fit} className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-ink-700 transition hover:bg-moss-50 hover:text-moss-700" title="Ajustar todo a la vista">Ver todo</button>
      </div>

      {/* Contenedor con scroll = paneo (arrastra/usa scroll para navegar todo el árbol) */}
      <div ref={scrollRef} className="max-h-[78vh] overflow-auto rounded-t-2xl">
      {/* Decorative paper background dots */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth * zoom}
        height={svgHeight * zoom}
        className="block"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <pattern id="paper-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.5" fill="#D9DDE3" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#paper-grid)" />

        {/* Conexiones (debajo de las cards), aparecen con un fundido suave */}
        <g className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          {partnerEdges}
          {parentEdges}
        </g>

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
                  dimmed={!!hovered && !connected.has(p.id)}
                  onHover={() => setHovered(p.id)}
                  onSelectAsTarget={() => onSelectAsTarget(p.id)}
                  onStartLink={(t) => onStartLink(p.id, t)}
                  onDelete={() => onDelete(p.id)}
                  onSelect={() => onSelect(p.id)}
                />
              </foreignObject>
            </g>
          );
        })}
      </svg>
      </div>

      {/* Legend abajo */}
      <div className="border-t border-paper-300 bg-paper-100 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-widest text-ink-500">
          <span className="flex items-center gap-1.5">
            <svg width="22" height="10"><path d="M2 8 C2 2, 20 8, 20 2" stroke="#123F52" strokeWidth="1.6" fill="none"/></svg>
            Padre–hijo/a
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="22" height="10"><path d="M1 3 Q11 11, 21 3" stroke="#8AB96B" strokeWidth="1.8" fill="none"/></svg>
            Pareja
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#E0685A" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
            Separados
          </span>
          <span className="ml-auto normal-case tracking-normal text-ink-400">
            Pasa el cursor sobre una persona para resaltar sus conexiones · click para ver/editar
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
  dimmed,
  onHover,
  onSelectAsTarget,
  onStartLink,
  onDelete,
  onSelect,
}: {
  person: PersonDto;
  isTarget: boolean | null;
  isSource: boolean | null;
  dimmed: boolean;
  onHover: () => void;
  onSelectAsTarget: () => void;
  onStartLink: (type: 'parent' | 'partner') => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const dead = !!person.deathDate;
  return (
    <div
      onMouseEnter={onHover}
      style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity .25s, transform .3s, box-shadow .3s' }}
      className={`group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-paper transition-all duration-300 ease-out ${
        isTarget
          ? 'border-moss-700 shadow-moss'
          : isSource
            ? 'border-clay-500 ring-2 ring-clay-300'
            : person.isProband
              ? 'border-moss-700 ring-2 ring-moss-700/25 animate-breath hover:-translate-y-1 hover:shadow-paper-lg'
              : 'border-paper-300 hover:-translate-y-1 hover:border-moss-700 hover:shadow-paper-lg'
      }`}
    >
      {/* Acento superior de color (turquesa proband, petróleo resto) */}
      <span
        className={`block h-1 w-full ${person.isProband ? 'bg-moss-700' : dead ? 'bg-paper-400' : 'bg-ink-900'}`}
      />

      {isTarget && (
        <button
          onClick={onSelectAsTarget}
          className="absolute inset-0 z-10"
          aria-label="Seleccionar como objetivo"
        />
      )}

      {/* Body — abre el panel de la persona (ver/editar/agregar) */}
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
      >
        <PersonAvatar person={person} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-medium leading-tight text-ink-900 group-hover:text-moss-700">
            {person.firstName} {person.lastName ?? ''}
          </h3>
          <p className="mt-0.5 truncate font-sans text-[11px] text-ink-500">
            {person.birthDate ?? '?'} — {person.deathDate ?? (person.birthDate ? 'presente' : '')}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-300">
              {person.gender === 'female' ? 'Femenino' : person.gender === 'male' ? 'Masculino' : 'Otro'}
            </span>
            {person.bloodType && person.bloodType !== 'unknown' && (
              <span className="rounded-full bg-clay-100 px-1.5 py-px font-mono text-[9px] font-medium text-clay-700">
                {person.bloodType}
              </span>
            )}
            {person.isProband && (
              <span className="rounded-full bg-moss-700 px-1.5 py-px font-mono text-[9px] uppercase tracking-widest text-white">
                Yo
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Acciones — visibles al hover */}
      <div className="relative z-20 flex border-t border-paper-200 text-[10px] opacity-0 transition group-hover:opacity-100">
        <button onClick={() => onStartLink('parent')} className="flex-1 px-2 py-1.5 font-sans font-medium text-moss-700 transition hover:bg-moss-50" title="Agregar hijo/a">
          + hijo
        </button>
        <span className="w-px bg-paper-200" />
        <button onClick={() => onStartLink('partner')} className="flex-1 px-2 py-1.5 font-sans font-medium text-moss-700 transition hover:bg-moss-50" title="Agregar pareja">
          + pareja
        </button>
        <span className="w-px bg-paper-200" />
        <button onClick={onDelete} className="flex-1 px-2 py-1.5 font-sans font-medium text-clay-600 transition hover:bg-clay-100" title="Eliminar persona">
          ×
        </button>
      </div>
    </div>
  );
}

