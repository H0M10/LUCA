import { useEffect, useMemo, useRef, useState } from 'react';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import type { Relation } from './QuickAddDialog.js';
import { PersonAvatar } from './PersonAvatar.js';

interface Props {
  persons: PersonDto[];
  relationships: RelationshipDto[];
  linkMode: null | { from: string; type: 'parent' | 'partner' };
  onSelectAsTarget: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: (relation: Relation) => void;
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
  onSelect,
  onAdd,
}: Props) {
  const layout = useMemo(() => computeLayout(persons, relationships), [persons, relationships]);
  // Persona resaltada: al pasar el cursor, ilumina TODAS sus conexiones.
  const [hovered, setHovered] = useState<string | null>(null);

  const svgWidth = PAD * 2 + layout.maxPerGen * NODE_W + (layout.maxPerGen - 1) * GAP_X;
  const svgHeight = PAD * 2 + (layout.maxGen + 1) * NODE_H + layout.maxGen * GAP_Y;

  // ── Lienzo navegable estilo Figma: arrastrar para mover, rueda para zoom ──
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(24);
  const [ty, setTy] = useState(24);
  const pan = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const [grabbing, setGrabbing] = useState(false);

  const clampZoom = (z: number) => Math.max(0.25, Math.min(2.5, z));

  const fitToView = () => {
    const el = viewportRef.current;
    if (!el) return;
    const pad = 48;
    const z = clampZoom(Math.min((el.clientWidth - pad) / svgWidth, (el.clientHeight - pad) / svgHeight));
    setZoom(z);
    setTx((el.clientWidth - svgWidth * z) / 2);
    setTy(Math.max(16, (el.clientHeight - svgHeight * z) / 2));
  };

  // Ajustar a la vista al cargar y cuando cambia el tamaño del árbol
  useEffect(() => {
    const id = requestAnimationFrame(fitToView);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgWidth, svgHeight]);

  // Zoom con la rueda hacia el cursor (listener nativo no-pasivo)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setZoom((z) => {
        const nz = clampZoom(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
        setTx((t) => mx - ((mx - t) / z) * nz);
        setTy((t) => my - ((my - t) / z) * nz);
        return nz;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const el = viewportRef.current;
    const cx = el ? el.clientWidth / 2 : 0;
    const cy = el ? el.clientHeight / 2 : 0;
    setZoom((z) => {
      const nz = clampZoom(z * factor);
      setTx((t) => cx - ((cx - t) / z) * nz);
      setTy((t) => cy - ((cy - t) / z) * nz);
      return nz;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return; // clicks en tarjetas
    pan.current = { active: true, sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
    setGrabbing(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pan.current.active) return;
    setTx(pan.current.ox + (e.clientX - pan.current.sx));
    setTy(pan.current.oy + (e.clientY - pan.current.sy));
  };
  const endPan = () => {
    pan.current.active = false;
    setGrabbing(false);
  };

  if (persons.length === 0) return null;

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
      {/* Controles — flotan sobre el árbol */}
      <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-2xl border border-paper-300 bg-white shadow-paper">
        <button onClick={() => zoomBy(1.2)} className="px-3 py-2 font-sans text-base font-semibold text-ink-700 transition hover:bg-moss-50 hover:text-moss-700" title="Acercar">＋</button>
        <span className="h-px bg-paper-300" />
        <button onClick={() => zoomBy(1 / 1.2)} className="px-3 py-2 font-sans text-base font-semibold text-ink-700 transition hover:bg-moss-50 hover:text-moss-700" title="Alejar">－</button>
        <span className="h-px bg-paper-300" />
        <button onClick={fitToView} className="px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-ink-700 transition hover:bg-moss-50 hover:text-moss-700" title="Ajustar todo a la vista">Ver todo</button>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-full bg-ink-900/80 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-white">
        {Math.round(zoom * 100)}%
      </div>

      {/* Lienzo: arrastra para mover · rueda para zoom */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerLeave={() => { endPan(); setHovered(null); }}
        className={`relative h-[78vh] touch-none overflow-hidden rounded-t-2xl ${grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ backgroundColor: '#F6F8F9', backgroundImage: 'radial-gradient(#D9DDE3 0.7px, transparent 0.7px)', backgroundSize: '22px 22px' }}
      >
        <div style={{ transform: `translate(${tx}px, ${ty}px) scale(${zoom})`, transformOrigin: '0 0', width: svgWidth, height: svgHeight }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        className="block"
      >

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
                  onSelect={() => onSelect(p.id)}
                  onAdd={onAdd}
                />
              </foreignObject>
            </g>
          );
        })}
      </svg>
        </div>
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
            Arrastra para mover · rueda para zoom · cursor sobre una persona = resalta conexiones
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
  onSelect,
  onAdd,
}: {
  person: PersonDto;
  isTarget: boolean | null;
  isSource: boolean | null;
  dimmed: boolean;
  onHover: () => void;
  onSelectAsTarget: () => void;
  onSelect: () => void;
  onAdd: (relation: Relation) => void;
}) {
  const dead = !!person.deathDate;
  const add = (e: React.MouseEvent, rel: Relation) => {
    e.stopPropagation();
    onAdd(rel);
  };

  return (
    <div
      data-no-pan
      onMouseEnter={onHover}
      style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity .25s, transform .3s, box-shadow .3s' }}
      className={`group relative flex h-full w-full flex-col rounded-2xl border bg-white shadow-paper transition-all duration-300 ease-out ${
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
        className={`block h-1 w-full rounded-t-2xl ${person.isProband ? 'bg-moss-700' : dead ? 'bg-paper-400' : 'bg-ink-900'}`}
      />

      {isTarget && (
        <button onClick={onSelectAsTarget} className="absolute inset-0 z-10" aria-label="Seleccionar como objetivo" />
      )}

      {/* Body — abre el panel de la persona (ver/editar/eliminar/salud) */}
      <button onClick={onSelect} className="flex flex-1 cursor-pointer items-center gap-3 px-3 pb-3 pt-2 text-left">
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

      {/* Botones de agregar familiar — posicionados alrededor (aparecen al hover) */}
      {/* Arriba: padres */}
      <div className="absolute -top-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Padre" onClick={(e) => add(e, { kind: 'father', child: person })} />
        <AddDot label="Madre" onClick={(e) => add(e, { kind: 'mother', child: person })} />
      </div>
      {/* Abajo: hijos */}
      <div className="absolute -bottom-3 left-1/2 z-40 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Hijo/a" onClick={(e) => add(e, { kind: 'child', parent: person })} />
      </div>
      {/* Izquierda: hermanos */}
      <div className="absolute top-1/2 -left-1 z-40 -translate-x-full -translate-y-1/2 pr-1 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Hermano/a" onClick={(e) => add(e, { kind: 'sibling', of: person })} />
      </div>
      {/* Derecha: pareja */}
      <div className="absolute top-1/2 -right-1 z-40 translate-x-full -translate-y-1/2 pl-1 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Pareja" onClick={(e) => add(e, { kind: 'partner', of: person })} />
      </div>
    </div>
  );
}

/** Botón-píldora "+ etiqueta" para agregar un familiar en una dirección. */
function AddDot({ label, onClick }: { label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-full border border-moss-700 bg-white px-2 py-0.5 font-sans text-[10px] font-semibold text-moss-700 shadow-paper transition hover:bg-moss-700 hover:text-white"
      title={`Agregar ${label.toLowerCase()}`}
    >
      + {label}
    </button>
  );
}

