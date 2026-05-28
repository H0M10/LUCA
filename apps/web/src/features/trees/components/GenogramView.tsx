import { useEffect, useMemo, useRef, useState } from 'react';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import type { Relation } from './QuickAddDialog.js';
import { PersonAvatar } from './PersonAvatar.js';
import {
  computeLayout,
  buildGenogramEdges,
  NODE_W,
  NODE_H,
  PAD,
  type Seg,
} from './genogramGeometry.js';

// Re-exportamos para consumidores existentes (PrintableGenogram)
export { computeLayout, NODE_W, NODE_H, GAP_X, GAP_Y, PAD } from './genogramGeometry.js';
export type { Layout } from './genogramGeometry.js';

interface Props {
  persons: PersonDto[];
  relationships: RelationshipDto[];
  linkMode: null | { from: string; type: 'parent' | 'partner' };
  onSelectAsTarget: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: (relation: Relation) => void;
}

// Colores por tipo de vínculo
const C_UNION = '#123F52'; // matrimonio / unión vigente
const C_INFORMAL = '#42A7A5'; // unión libre / compromiso / adoptivo
const C_ENDED = '#E0685A'; // separación / divorcio
const C_BIO = '#123F52'; // filiación biológica
const C_HILITE = '#42A7A5';

function seg(s: Seg, key: string, stroke: string, width: number, dashed?: boolean, dim?: boolean) {
  return (
    <line
      key={key}
      x1={s.x1}
      y1={s.y1}
      x2={s.x2}
      y2={s.y2}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? '7 5' : undefined}
      style={{ opacity: dim ? 0.12 : 1, transition: 'opacity .25s, stroke-width .2s' }}
    />
  );
}

export function GenogramView({ persons, relationships, linkMode, onSelectAsTarget, onSelect, onAdd }: Props) {
  const layout = useMemo(() => computeLayout(persons, relationships), [persons, relationships]);
  const edges = useMemo(() => buildGenogramEdges(relationships, layout), [relationships, layout]);
  const [hovered, setHovered] = useState<string | null>(null);

  const svgWidth = layout.width;
  const svgHeight = layout.height;

  // ── Lienzo navegable (arrastrar + zoom) ──
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

  useEffect(() => {
    const id = requestAnimationFrame(fitToView);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgWidth, svgHeight]);

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
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
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

  // Personas conectadas a la resaltada (para atenuar el resto)
  const connected = new Set<string>();
  if (hovered) {
    connected.add(hovered);
    relationships.forEach((r) => {
      if (r.fromPersonId === hovered) connected.add(r.toPersonId);
      if (r.toPersonId === hovered) connected.add(r.fromPersonId);
    });
  }
  const dimEdge = (touches: Set<string>) => !!hovered && !touches.has(hovered);
  const liveEdge = (touches: Set<string>) => !!hovered && touches.has(hovered);

  return (
    <div className="relative rounded-2xl border border-paper-300 bg-paper-50 shadow-paper">
      {/* Controles */}
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

      {/* Lienzo */}
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
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width={svgWidth} height={svgHeight} className="block">
            {/* Conexiones (debajo de las cards) */}
            <g className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
              {/* Filiación: anclaje → bus → cada hijo */}
              {edges.childGroups.map((grp, gi) => {
                const dim = dimEdge(grp.touches);
                const live = liveEdge(grp.touches);
                const stem = C_BIO;
                const w = live ? 2.6 : 1.7;
                return (
                  <g key={`cg-${gi}`}>
                    {seg({ x1: grp.anchorX, y1: grp.anchorY, x2: grp.anchorX, y2: grp.busY }, `st-${gi}`, stem, w, false, dim)}
                    {grp.barX2 > grp.barX1 &&
                      seg({ x1: grp.barX1, y1: grp.busY, x2: grp.barX2, y2: grp.busY }, `bar-${gi}`, stem, w, false, dim)}
                    {grp.drops.map((d, di) =>
                      seg(
                        { x1: d.x, y1: grp.busY, x2: d.x, y2: d.topY },
                        `dr-${gi}-${di}`,
                        d.dashed ? C_INFORMAL : C_BIO,
                        w,
                        d.dashed,
                        dim,
                      ),
                    )}
                  </g>
                );
              })}

              {/* Uniones de pareja (grapas) + barras de separación/divorcio */}
              {edges.partners.map((e) => {
                const dim = dimEdge(e.touches);
                const live = liveEdge(e.touches);
                const color = live ? C_HILITE : e.ended ? C_ENDED : e.dashed ? C_INFORMAL : C_UNION;
                const w = live ? 2.8 : 2;
                return (
                  <g key={`pe-${e.relId}`}>
                    {e.segs.map((s, i) => seg(s, `pe-${e.relId}-${i}`, color, w, e.dashed, dim))}
                    {e.slashes > 0 && !dim && <Slashes x={e.midX} y={e.midY} count={e.slashes as 1 | 2} color={C_ENDED} />}
                  </g>
                );
              })}
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
                  style={{ animationDelay: `${0.15 + i * 0.06}s`, transformBox: 'fill-box', transformOrigin: 'center' }}
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

      {/* Leyenda */}
      <div className="border-t border-paper-300 bg-paper-100 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-widest text-ink-500">
          <LegendLine color={C_BIO} label="Filiación" />
          <LegendLine color={C_INFORMAL} dashed label="Adoptivo / hijastro" />
          <LegendLine color={C_UNION} label="Matrimonio" />
          <LegendLine color={C_INFORMAL} dashed label="Unión libre" />
          <LegendSlash count={1} label="Separación" />
          <LegendSlash count={2} label="Divorcio / ex" />
          <span className="ml-auto normal-case tracking-normal text-ink-400">
            Arrastra para mover · rueda para zoom · cursor sobre una persona = resalta sus vínculos
          </span>
        </div>
      </div>
    </div>
  );
}

/** Marcas de barra(s) sobre la línea de unión: 1 = separación, 2 = divorcio. */
function Slashes({ x, y, count, color }: { x: number; y: number; count: 1 | 2; color: string }) {
  const s = 8;
  const offsets = count === 2 ? [-5, 5] : [0];
  return (
    <>
      {offsets.map((o, i) => (
        <line key={i} x1={x + o - s} y1={y + s} x2={x + o + s} y2={y - s} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      ))}
    </>
  );
}

function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="22" height="6">
        <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '5 4' : undefined} />
      </svg>
      {label}
    </span>
  );
}

function LegendSlash({ count, label }: { count: 1 | 2; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="22" height="12">
        <line x1="0" y1="6" x2="22" y2="6" stroke={C_ENDED} strokeWidth="2" />
        {(count === 2 ? [8, 14] : [11]).map((cx, i) => (
          <line key={i} x1={cx - 4} y1="11" x2={cx + 4} y2="1" stroke={C_ENDED} strokeWidth="2" />
        ))}
      </svg>
      {label}
    </span>
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
      <span className={`block h-1 w-full rounded-t-2xl ${person.isProband ? 'bg-moss-700' : dead ? 'bg-paper-400' : 'bg-ink-900'}`} />

      {isTarget && (
        <button onClick={onSelectAsTarget} className="absolute inset-0 z-10" aria-label="Seleccionar como objetivo" />
      )}

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

      {/* Botones de agregar familiar */}
      <div className="absolute -top-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Padre" onClick={(e) => add(e, { kind: 'father', child: person })} />
        <AddDot label="Madre" onClick={(e) => add(e, { kind: 'mother', child: person })} />
      </div>
      <div className="absolute -bottom-3 left-1/2 z-40 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Hijo/a" onClick={(e) => add(e, { kind: 'child', parent: person })} />
      </div>
      <div className="absolute top-1/2 -left-1 z-40 -translate-x-full -translate-y-1/2 pr-1 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Hermano/a" onClick={(e) => add(e, { kind: 'sibling', of: person })} />
      </div>
      <div className="absolute top-1/2 -right-1 z-40 translate-x-full -translate-y-1/2 pl-1 opacity-0 transition group-hover:opacity-100">
        <AddDot label="Pareja" onClick={(e) => add(e, { kind: 'partner', of: person })} />
      </div>
    </div>
  );
}

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
