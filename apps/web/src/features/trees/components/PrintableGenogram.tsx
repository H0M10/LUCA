import type { PersonDto, RelationshipDto } from '../api/trees.js';
import { computeLayout, NODE_W, NODE_H, PAD } from './GenogramView.js';

/**
 * Versión SOLO para impresión / PDF del genograma COMPLETO.
 * - Se renderiza siempre (oculto en pantalla con `.print-only`), de modo que
 *   `window.print()` captura todo el árbol sin importar la vista activa.
 * - SVG puro (sin foreignObject ni interactividad) → imprime de forma fiable
 *   en todos los navegadores y escala a la página vía viewBox + width:100%.
 */
export function PrintableGenogram({
  tree,
}: {
  tree: { name: string; description: string | null; persons: PersonDto[]; relationships: RelationshipDto[] };
}) {
  const { persons, relationships } = tree;
  const layout = computeLayout(persons, relationships);
  if (persons.length === 0) return null;

  const width = PAD * 2 + layout.maxPerGen * NODE_W + (layout.maxPerGen - 1) * 60;
  const height = PAD * 2 + (layout.maxGen + 1) * NODE_H + layout.maxGen * 80;

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
          stroke="#333"
          strokeWidth="1.2"
          fill="none"
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
      return (
        <line
          key={`pn-${r.id}`}
          x1={from.x + NODE_W}
          y1={y}
          x2={to.x}
          y2={y}
          stroke="#333"
          strokeWidth="1.2"
          strokeDasharray={isEnded ? '6 4' : undefined}
        />
      );
    });

  return (
    <div className="print-only">
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#555' }}>
          Luca · Árbol genealógico
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 300, margin: '4px 0', color: '#111' }}>{tree.name}</h1>
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#555' }}>
          {persons.length} personas · {relationships.length} relaciones ·{' '}
          {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: '100%', maxHeight: '14cm', width: 'auto', height: 'auto', display: 'block', margin: '0 auto' }}
      >
        <g>{partnerLines}</g>
        <g>{parentLines}</g>
        {persons.map((p) => {
          const pos = layout.posById.get(p.id);
          if (!pos) return null;
          return <PrintNode key={p.id} person={p} x={pos.x} y={pos.y} />;
        })}
      </svg>

      <div style={{ marginTop: 14, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, color: '#555' }}>
        □ Masculino &nbsp;&nbsp; ○ Femenino &nbsp;&nbsp; ◇ Otro &nbsp;&nbsp; ╳ Fallecido &nbsp;&nbsp; ┄ Separados
      </div>
    </div>
  );
}

function PrintNode({ person, x, y }: { person: PersonDto; x: number; y: number }) {
  const dead = !!person.deathDate;
  const clipId = `clip-${person.id}`;
  const symSize = 30;
  const sx = 12;
  const sy = NODE_H / 2 - symSize / 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={NODE_W}
        height={NODE_H}
        fill="white"
        stroke={person.isProband ? '#111' : '#777'}
        strokeWidth={person.isProband ? 2 : 1}
      />

      {/* Foto o símbolo */}
      {person.photoData ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={sx + symSize / 2} cy={sy + symSize / 2} r={symSize / 2} />
            </clipPath>
          </defs>
          <image
            href={person.photoData}
            x={sx}
            y={sy}
            width={symSize}
            height={symSize}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle cx={sx + symSize / 2} cy={sy + symSize / 2} r={symSize / 2} fill="none" stroke="#777" strokeWidth="1" />
        </>
      ) : (
        <PrintSymbol gender={person.gender} x={sx} y={sy} size={symSize} dead={dead} />
      )}

      {/* Nombre */}
      <text x={sx + symSize + 10} y={NODE_H / 2 - 6} fontSize="15" fill="#111" fontFamily="Georgia, serif">
        {truncate(`${person.firstName} ${person.lastName ?? ''}`.trim(), 18)}
      </text>
      <text x={sx + symSize + 10} y={NODE_H / 2 + 14} fontSize="10" fill="#555" fontFamily="monospace">
        {(person.birthDate ?? '?') + ' — ' + (person.deathDate ?? (person.birthDate ? 'pres.' : ''))}
      </text>
      {person.isProband && (
        <text x={sx + symSize + 10} y={NODE_H / 2 + 30} fontSize="9" fill="#3D5240" fontFamily="monospace" letterSpacing="1">
          ★ YO
        </text>
      )}

      {dead && person.photoData && (
        <line x1={sx} y1={sy} x2={sx + symSize} y2={sy + symSize} stroke="#555" strokeWidth="1.5" />
      )}
    </g>
  );
}

function PrintSymbol({ gender, x, y, size, dead }: { gender: string | null; x: number; y: number; size: number; dead: boolean }) {
  const stroke = dead ? '#999' : '#111';
  let shape;
  if (gender === 'female') {
    shape = <circle cx={x + size / 2} cy={y + size / 2} r={size / 2} fill="none" stroke={stroke} strokeWidth="1.5" />;
  } else if (gender === 'male') {
    shape = <rect x={x} y={y} width={size} height={size} fill="none" stroke={stroke} strokeWidth="1.5" />;
  } else {
    shape = (
      <path
        d={`M ${x + size / 2} ${y} L ${x + size} ${y + size / 2} L ${x + size / 2} ${y + size} L ${x} ${y + size / 2} Z`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
    );
  }
  return (
    <>
      {shape}
      {dead && <line x1={x} y1={y} x2={x + size} y2={y + size} stroke={stroke} strokeWidth="1.5" />}
    </>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
