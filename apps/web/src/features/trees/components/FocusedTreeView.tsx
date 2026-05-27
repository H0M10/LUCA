import { useEffect, useMemo, useState } from 'react';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import type { Relation } from './QuickAddDialog.js';

interface Props {
  persons: PersonDto[];
  relationships: RelationshipDto[];
  onAdd: (relation: Relation) => void;
  onSelectPerson: (person: PersonDto) => void;
}

/**
 * Vista enfocada: una persona en el centro, su familia inmediata alrededor.
 * Click en cualquier pariente lo convierte en el nuevo centro con animación.
 * Botones "+ agregar X" siempre visibles para máxima legibilidad.
 */
export function FocusedTreeView({ persons, relationships, onAdd, onSelectPerson }: Props) {
  // Persona enfocada — por defecto el proband
  const proband = useMemo(() => persons.find((p) => p.isProband) ?? persons[0]!, [persons]);
  const [focusedId, setFocusedId] = useState<string>(proband.id);
  const [transitionKey, setTransitionKey] = useState(0); // para re-trigger animaciones
  const focused = persons.find((p) => p.id === focusedId) ?? proband;

  // Si la persona enfocada deja de existir, volver al proband
  useEffect(() => {
    if (!persons.find((p) => p.id === focusedId)) {
      setFocusedId(proband.id);
    }
  }, [persons, focusedId, proband.id]);

  const changeFocus = (id: string) => {
    if (id === focusedId) return;
    setFocusedId(id);
    setTransitionKey((k) => k + 1);
  };

  // Relaciones del focused
  const parents = relationships
    .filter((r) => r.type === 'parent' && r.toPersonId === focused.id)
    .map((r) => persons.find((p) => p.id === r.fromPersonId))
    .filter(Boolean) as PersonDto[];
  const father = parents.find((p) => p.gender === 'male') ?? parents.find((p) => p.gender !== 'female');
  const mother = parents.find((p) => p.gender === 'female') ?? (parents[0] !== father ? parents[0] : null);

  const partners = relationships
    .filter((r) => r.type === 'partner' && (r.fromPersonId === focused.id || r.toPersonId === focused.id))
    .map((r) => persons.find((p) => p.id === (r.fromPersonId === focused.id ? r.toPersonId : r.fromPersonId)))
    .filter(Boolean) as PersonDto[];

  const children = relationships
    .filter((r) => r.type === 'parent' && r.fromPersonId === focused.id)
    .map((r) => persons.find((p) => p.id === r.toPersonId))
    .filter(Boolean) as PersonDto[];

  const siblings = parents
    .flatMap((parent) =>
      relationships
        .filter((r) => r.type === 'parent' && r.fromPersonId === parent.id && r.toPersonId !== focused.id)
        .map((r) => persons.find((p) => p.id === r.toPersonId)),
    )
    .filter(Boolean) as PersonDto[];
  const uniqueSiblings = Array.from(new Map(siblings.map((p) => [p.id, p])).values());

  // Path para breadcrumb: enfocado → proband
  const path = useMemo(() => buildPath(focused, proband, persons, relationships), [focused, proband, persons, relationships]);

  return (
    <div className="rounded-sm border border-paper-300 bg-paper-50">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b border-paper-300 bg-paper-100 px-5 py-3 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Estás viendo:</span>
        {path.map((p, i) => (
          <span key={p.id} className="flex items-center gap-2">
            {i > 0 && <span className="font-mono text-xs text-ink-300">›</span>}
            <button
              onClick={() => changeFocus(p.id)}
              className={`font-display transition ${
                p.id === focused.id ? 'text-ink-900 font-medium' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {p.firstName}
              {p.isProband && <span className="ml-1 font-mono text-[9px] uppercase text-moss-700">· yo</span>}
            </button>
          </span>
        ))}
        {focused.id !== proband.id && (
          <button
            onClick={() => changeFocus(proband.id)}
            className="ml-auto rounded-full border border-moss-700/40 bg-moss-50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
          >
            ↩ volver a mí
          </button>
        )}
      </div>

      <div className="relative px-4 py-8 md:px-12 md:py-14" key={transitionKey}>
        {/* Padres */}
        <div className="mb-6 flex justify-center gap-4 md:gap-12">
          <ParentSlot
            label="Padre"
            person={father}
            onSelect={(p) => changeFocus(p.id)}
            onAdd={() => onAdd({ kind: 'father', child: focused })}
          />
          <ParentSlot
            label="Madre"
            person={mother}
            onSelect={(p) => changeFocus(p.id)}
            onAdd={() => onAdd({ kind: 'mother', child: focused })}
          />
        </div>

        {/* Línea conectora padres → focused */}
        {(father || mother) && (
          <div className="mx-auto h-10 w-px bg-moss-700/40 md:h-14" />
        )}

        {/* Fila central: hermanos | focused | pareja */}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          {/* Hermanos */}
          <RelativeStack
            label="Hermanos"
            people={uniqueSiblings}
            onSelect={(p) => changeFocus(p.id)}
            onAdd={() => onAdd({ kind: 'sibling', of: focused })}
            align="right"
            connector="right"
          />

          {/* Persona enfocada — destacada */}
          <FocusedCard person={focused} />

          {/* Pareja */}
          <RelativeStack
            label={partners.length === 1 ? 'Pareja' : 'Parejas'}
            people={partners}
            onSelect={(p) => changeFocus(p.id)}
            onAdd={() => onAdd({ kind: 'partner', of: focused })}
            align="left"
            connector="left"
          />
        </div>

        {/* Línea conectora focused → hijos */}
        {children.length > 0 && (
          <div className="mx-auto mt-6 h-10 w-px bg-moss-700/40 md:h-14" />
        )}

        {/* Hijos */}
        <div className="mt-2 flex justify-center">
          <ChildrenRow
            children={children}
            onSelect={(p) => changeFocus(p.id)}
            onAdd={() => onAdd({ kind: 'child', parent: focused })}
          />
        </div>

        {/* Botón "Ver expediente" para abrir el panel lateral con info clínica */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => onSelectPerson(focused)}
            className="link-underline font-mono text-[10px] uppercase tracking-widest text-moss-700"
          >
            Ver expediente clínico de {focused.firstName} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────

function FocusedCard({ person }: { person: PersonDto }) {
  const dead = !!person.deathDate;
  return (
    <div
      className="relative mx-auto w-56 animate-grow-in border-2 border-ink-900 bg-paper-50 px-5 py-4 shadow-paper-lg md:w-64"
      style={{ animationDuration: '0.5s' }}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-0.5 font-mono text-[9px] uppercase tracking-widest text-paper-50">
        Enfocado
      </div>
      <div className="flex items-center gap-3">
        <PersonSymbol gender={person.gender} dead={dead} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-light leading-tight text-ink-900">
            {person.firstName}
          </h3>
          <p className="truncate font-display text-base italic text-ink-500">
            {person.lastName ?? ''}
          </p>
        </div>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
        {person.birthDate ?? '?'} — {person.deathDate ?? (person.birthDate ? 'presente' : '')}
      </p>
      {person.isProband && (
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-moss-700">★ Yo · Proband</p>
      )}
    </div>
  );
}

function ParentSlot({
  label,
  person,
  onSelect,
  onAdd,
}: {
  label: string;
  person: PersonDto | null | undefined;
  onSelect: (p: PersonDto) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500">{label}</span>
      {person ? (
        <button
          onClick={() => onSelect(person)}
          className="group flex w-44 animate-fade-up flex-col items-center gap-1 border border-paper-300 bg-paper-50 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-paper-lg"
        >
          <div className="flex items-center gap-2">
            <PersonSymbol gender={person.gender} dead={!!person.deathDate} size={28} />
            <span className="truncate font-display text-base text-ink-900 group-hover:text-moss-700">
              {person.firstName}
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
            click para enfocar →
          </span>
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="flex w-44 animate-fade-up flex-col items-center justify-center gap-1 border border-dashed border-moss-700/50 bg-moss-50 px-3 py-3.5 font-sans text-xs text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
        >
          <span className="text-xl leading-none">+</span>
          <span>Agregar {label.toLowerCase()}</span>
        </button>
      )}
    </div>
  );
}

function RelativeStack({
  label,
  people,
  onSelect,
  onAdd,
  align,
  connector: _connector,
}: {
  label: string;
  people: PersonDto[];
  onSelect: (p: PersonDto) => void;
  onAdd: () => void;
  align: 'left' | 'right';
  connector: 'left' | 'right';
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${align === 'left' ? 'md:items-start' : 'md:items-end'} items-center`}>
      <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500">{label}</span>
      <div className={`flex flex-wrap gap-2 ${align === 'left' ? 'md:justify-start' : 'md:justify-end'} justify-center`}>
        {people.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group flex animate-fade-up items-center gap-2 border border-paper-300 bg-paper-50 px-3 py-1.5 transition hover:-translate-y-0.5 hover:border-ink-900"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <PersonSymbol gender={p.gender} dead={!!p.deathDate} size={20} />
            <span className="font-display text-sm text-ink-900 group-hover:text-moss-700">
              {p.firstName}
            </span>
          </button>
        ))}
        <button
          onClick={onAdd}
          className="inline-flex animate-fade-up items-center gap-1 border border-dashed border-moss-700/50 bg-moss-50 px-3 py-1.5 font-sans text-xs text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
        >
          + {label.toLowerCase().slice(0, -1)}{label.endsWith('s') ? '' : ''}
        </button>
      </div>
    </div>
  );
}

function ChildrenRow({
  children,
  onSelect,
  onAdd,
}: {
  children: PersonDto[];
  onSelect: (p: PersonDto) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
        Hijos {children.length > 0 && <span className="text-ink-300">· {children.length}</span>}
      </span>
      <div className="flex flex-wrap items-start justify-center gap-3">
        {children.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group flex w-32 animate-fade-up flex-col items-center gap-1 border border-paper-300 bg-paper-50 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-paper-lg"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <PersonSymbol gender={p.gender} dead={!!p.deathDate} size={28} />
            <span className="truncate font-display text-sm text-ink-900 group-hover:text-moss-700">
              {p.firstName}
            </span>
          </button>
        ))}
        <button
          onClick={onAdd}
          className="flex w-32 animate-fade-up flex-col items-center justify-center gap-1 border border-dashed border-moss-700/50 bg-moss-50 px-3 py-3.5 font-sans text-xs text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
        >
          <span className="text-xl leading-none">+</span>
          <span>Agregar hijo/a</span>
        </button>
      </div>
    </div>
  );
}

function PersonSymbol({ gender, dead, size = 24 }: { gender: string | null; dead: boolean; size?: number }) {
  const color = dead ? '#A89F8E' : '#1F1A14';
  const s = size;
  const symbol =
    gender === 'female' ? (
      <circle cx={s / 2} cy={s / 2} r={s / 2 - 1.5} fill="none" stroke={color} strokeWidth="1.5" />
    ) : gender === 'male' ? (
      <rect x="1.5" y="1.5" width={s - 3} height={s - 3} fill="none" stroke={color} strokeWidth="1.5" />
    ) : (
      <path d={`M ${s / 2} 1.5 L ${s - 1.5} ${s / 2} L ${s / 2} ${s - 1.5} L 1.5 ${s / 2} Z`} fill="none" stroke={color} strokeWidth="1.5" />
    );
  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} className="shrink-0">
      {symbol}
      {dead && <line x1="2" y1="2" x2={s - 2} y2={s - 2} stroke={color} strokeWidth="1.5" />}
    </svg>
  );
}

/**
 * Construye el camino entre `focused` y `proband` siguiendo relaciones parent.
 * Si `focused === proband` devuelve [proband].
 */
function buildPath(
  focused: PersonDto,
  proband: PersonDto,
  persons: PersonDto[],
  relationships: RelationshipDto[],
): PersonDto[] {
  if (focused.id === proband.id) return [proband];

  // BFS desde proband buscando focused, retornando padres camino arriba
  const queue: Array<{ id: string; path: string[] }> = [{ id: proband.id, path: [proband.id] }];
  const visited = new Set<string>([proband.id]);

  while (queue.length) {
    const { id, path } = queue.shift()!;
    // explorar todos los vecinos (padres, hijos, parejas)
    const neighbors = relationships
      .filter(
        (r) =>
          (r.type === 'parent' && (r.fromPersonId === id || r.toPersonId === id)) ||
          (r.type === 'partner' && (r.fromPersonId === id || r.toPersonId === id)),
      )
      .flatMap((r) => [r.fromPersonId, r.toPersonId])
      .filter((nid) => nid !== id && !visited.has(nid));

    for (const nid of neighbors) {
      visited.add(nid);
      const newPath = [...path, nid];
      if (nid === focused.id) {
        return newPath.map((pid) => persons.find((p) => p.id === pid)!).filter(Boolean);
      }
      queue.push({ id: nid, path: newPath });
    }
  }

  // No conectado, devolver solo focused
  return [proband, focused];
}
