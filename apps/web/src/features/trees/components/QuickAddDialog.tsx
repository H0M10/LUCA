import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { DateField } from '../../../shared/components/DateField.js';
import * as api from '../api/trees.js';
import type { PersonDto } from '../api/trees.js';
import { toast } from '../../../shared/stores/toast.js';

export type Relation =
  | { kind: 'self' }
  | { kind: 'father'; child: PersonDto }
  | { kind: 'mother'; child: PersonDto }
  | { kind: 'partner'; of: PersonDto }
  | { kind: 'child'; parent: PersonDto }
  | { kind: 'sibling'; of: PersonDto };

interface Props {
  treeId: string;
  relation: Relation;
  onClose: () => void;
}

function inferGender(r: Relation): 'male' | 'female' | undefined {
  if (r.kind === 'father') return 'male';
  if (r.kind === 'mother') return 'female';
  return undefined;
}

function inferApellidos(r: Relation): { paterno: string; materno: string } {
  // Por convención, hijos y hermanos suelen compartir los apellidos del contexto.
  if (r.kind === 'child') return { paterno: r.parent.apellidoPaterno ?? '', materno: r.parent.apellidoMaterno ?? '' };
  if (r.kind === 'sibling') return { paterno: r.of.apellidoPaterno ?? '', materno: r.of.apellidoMaterno ?? '' };
  return { paterno: '', materno: '' };
}

function meta(r: Relation): {
  title: string;
  hint: string;
  relationLabel: string;
  contextPerson: PersonDto | null;
} {
  switch (r.kind) {
    case 'self':
      return {
        title: 'Empieza por ti',
        hint: 'Solo necesitamos tu nombre. El resto puedes llenarlo después.',
        relationLabel: 'punto de partida',
        contextPerson: null,
      };
    case 'father':
      return {
        title: `Padre de ${r.child.firstName}`,
        hint: 'Estás registrando al papá. Lo demás puede llenarse después.',
        relationLabel: 'padre →',
        contextPerson: r.child,
      };
    case 'mother':
      return {
        title: `Madre de ${r.child.firstName}`,
        hint: 'Estás registrando a la mamá.',
        relationLabel: 'madre →',
        contextPerson: r.child,
      };
    case 'partner':
      return {
        title: `Pareja de ${r.of.firstName}`,
        hint: '',
        relationLabel: '↔ pareja',
        contextPerson: r.of,
      };
    case 'child':
      return {
        title: `Hijo/a de ${r.parent.firstName}`,
        hint: '',
        relationLabel: '↓ hijo/a',
        contextPerson: r.parent,
      };
    case 'sibling':
      return {
        title: `Hermano/a de ${r.of.firstName}`,
        hint: 'Si ya registraste a los padres, se conectarán automáticamente.',
        relationLabel: '↔ hermano/a',
        contextPerson: r.of,
      };
  }
}

export function QuickAddDialog({ treeId, relation, onClose }: Props) {
  const qc = useQueryClient();
  const inferred = inferApellidos(relation);
  const [firstName, setFirstName] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState(inferred.paterno);
  const [apellidoMaterno, setApellidoMaterno] = useState(inferred.materno);
  const [gender, setGender] = useState<'male' | 'female' | 'nonbinary' | 'unknown' | ''>(
    inferGender(relation) ?? '',
  );
  const [birthDate, setBirthDate] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [deathDate, setDeathDate] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC para cerrar
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const m = meta(relation);

  const mutation = useMutation({
    mutationFn: async () => {
      const personInput = {
        firstName: firstName.trim(),
        ...(apellidoPaterno.trim() ? { apellidoPaterno: apellidoPaterno.trim() } : {}),
        ...(apellidoMaterno.trim() ? { apellidoMaterno: apellidoMaterno.trim() } : {}),
        ...(gender ? { gender: gender as 'male' | 'female' | 'nonbinary' | 'unknown' } : {}),
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        ...(!isAlive && deathDate ? { deathDate: new Date(deathDate) } : {}),
        ...(relation.kind === 'self' ? { isProband: true } : {}),
      };
      const newPerson = await api.addPerson(treeId, personInput);

      if (relation.kind === 'father' || relation.kind === 'mother') {
        await api.addRelationship({
          type: 'parent',
          fromPersonId: newPerson.id,
          toPersonId: relation.child.id,
          subtype: 'biological',
        });
      } else if (relation.kind === 'child') {
        await api.addRelationship({
          type: 'parent',
          fromPersonId: relation.parent.id,
          toPersonId: newPerson.id,
          subtype: 'biological',
        });
      } else if (relation.kind === 'partner') {
        await api.addRelationship({
          type: 'partner',
          fromPersonId: relation.of.id,
          toPersonId: newPerson.id,
        });
      } else if (relation.kind === 'sibling') {
        const tree = await api.getTree(treeId);
        const parentsOf = tree.relationships
          .filter((r) => r.type === 'parent' && r.toPersonId === relation.of.id)
          .map((r) => r.fromPersonId);
        if (parentsOf.length === 0) {
          toast.info('Hermano agregado sin padres comunes', 'Cuando registres a los padres se conectarán automáticamente.');
        } else {
          for (const pid of parentsOf) {
            await api.addRelationship({
              type: 'parent',
              fromPersonId: pid,
              toPersonId: newPerson.id,
              subtype: 'biological',
            });
          }
        }
      }
      return newPerson;
    },
    onSuccess: (p) => {
      toast.success(`${p.firstName} agregado al árbol`);
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
      onClose();
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'Error al guardar'),
  });

  const canSubmit = firstName.trim().length > 0 && !mutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl animate-scale-in border border-ink-900/10 bg-paper-50 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con DIAGRAMA visual de la relación */}
        <div className="relative border-b border-paper-300 bg-paper-100 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
            — Nuevo registro
          </p>
          <h2 className="mt-1 font-display text-2xl font-light text-ink-900">
            {m.title}
          </h2>

          {/* Mini-diagrama de relación */}
          {m.contextPerson && (
            <RelationDiagram relation={relation} contextPerson={m.contextPerson} draftName={firstName || '?'} draftGender={gender} />
          )}

          <button
            onClick={onClose}
            className="absolute right-4 top-4 font-mono text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900"
            aria-label="Cerrar"
          >
            ESC ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate();
          }}
          autoComplete="off"
          className="space-y-5 px-6 py-6"
        >
          {/* Bloque mínimo — nombre + apellidos (estilo mexicano) */}
          <div className="space-y-4">
            <Field number="01" label="Nombre(s)">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder={relation.kind === 'self' ? 'Tu nombre' : 'Su nombre'}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Apellido paterno" hint="opcional">
                <Input
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  autoComplete="off"
                  placeholder="Paterno"
                />
              </Field>
              <Field label="Apellido materno" hint="opcional">
                <Input
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  autoComplete="off"
                  placeholder="Materno"
                />
              </Field>
            </div>
          </div>

          {m.hint && (
            <p className="font-display text-sm italic text-ink-500">{m.hint}</p>
          )}

          {/* Toggle progressive disclosure */}
          {!showMore ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="link-underline font-sans text-sm font-medium text-moss-700"
            >
              + Agregar más detalles (género, fecha, estado)
            </button>
          ) : (
            <div className="animate-fade-up space-y-5 border-t border-paper-300 pt-5">
              <Field label="Género">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['male', '□ Masculino'],
                      ['female', '○ Femenino'],
                      ['nonbinary', '◇ No binario'],
                      ['unknown', '— Sin especificar'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(gender === val ? '' : val)}
                      className={`rounded-full border px-4 py-1.5 font-sans text-sm transition ${
                        gender === val
                          ? 'border-ink-900 bg-ink-900 text-paper-50'
                          : 'border-paper-400 bg-paper-50 text-ink-700 hover:border-ink-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <DateField
                label="Fecha de nacimiento"
                hint="día y mes opcionales"
                value={birthDate}
                onChange={setBirthDate}
              />

              <div className="rounded-sm border border-paper-300 bg-paper-100 px-4 py-3">
                <label className="flex items-center gap-3 font-sans text-sm">
                  <input
                    type="checkbox"
                    checked={!isAlive}
                    onChange={(e) => setIsAlive(!e.target.checked)}
                    className="h-4 w-4 accent-clay-600"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Esta persona ya falleció
                  </span>
                </label>
                {!isAlive && (
                  <div className="mt-3 animate-fade-up">
                    <DateField
                      label="Fecha de defunción"
                      hint="opcional"
                      value={deathDate}
                      onChange={setDeathDate}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <ErrorAlert message={error ?? undefined} />

          <div className="flex flex-wrap items-center gap-3 border-t border-paper-300 pt-5">
            <Button type="submit" disabled={!canSubmit}>
              {mutation.isPending ? 'Guardando…' : 'Agregar al árbol'}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Mini-diagrama de la relación que se está creando — para que el usuario
 * vea claramente A QUIÉN se está vinculando.
 */
function RelationDiagram({
  relation,
  contextPerson,
  draftName,
  draftGender,
}: {
  relation: Relation;
  contextPerson: PersonDto;
  draftName: string;
  draftGender: string;
}) {
  const draftSymbol = draftGender === 'female' ? '○' : draftGender === 'male' ? '□' : '◇';
  const ctxSymbol = contextPerson.gender === 'female' ? '○' : contextPerson.gender === 'male' ? '□' : '◇';
  const ctxName = `${contextPerson.firstName}${contextPerson.lastName ? ' ' + contextPerson.lastName : ''}`;

  // Determinar layout: vertical para parent/child, horizontal para partner/sibling
  const isVertical = relation.kind === 'father' || relation.kind === 'mother' || relation.kind === 'child';
  const draftAbove = relation.kind === 'father' || relation.kind === 'mother';

  return (
    <div className="mt-4 flex items-center gap-3 rounded-sm border border-moss-700/30 bg-moss-50 px-4 py-3">
      {isVertical ? (
        <div className="flex flex-1 flex-col items-center gap-1">
          <Chip symbol={draftAbove ? draftSymbol : ctxSymbol} name={draftAbove ? (draftName || 'Tú lo registras') : ctxName} highlight={draftAbove} />
          <svg width="20" height="24" viewBox="0 0 20 24" className="text-moss-700">
            <line x1="10" y1="0" x2="10" y2="24" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="6,18 10,24 14,18" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          <Chip symbol={draftAbove ? ctxSymbol : draftSymbol} name={draftAbove ? ctxName : (draftName || 'Tú lo registras')} highlight={!draftAbove} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center gap-2">
          <Chip symbol={ctxSymbol} name={ctxName} />
          <svg width="36" height="14" viewBox="0 0 36 14" className="text-moss-700">
            <line x1="0" y1="7" x2="36" y2="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray={relation.kind === 'sibling' ? '4 3' : '0'} />
            <polyline points="30,3 36,7 30,11" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          <Chip symbol={draftSymbol} name={draftName || 'Tú lo registras'} highlight />
        </div>
      )}
    </div>
  );
}

function Chip({ symbol, name, highlight }: { symbol: string; name: string; highlight?: boolean }) {
  return (
    <span
      className={`inline-flex max-w-[200px] items-center gap-2 truncate rounded-full border px-3 py-1 font-sans text-sm ${
        highlight
          ? 'animate-pulse-soft border-moss-700 bg-paper-50 font-medium text-moss-700 ring-2 ring-moss-300'
          : 'border-paper-400 bg-paper-50 text-ink-700'
      }`}
    >
      <span className="font-mono text-[10px] text-ink-500">{symbol}</span>
      <span className="truncate">{name}</span>
    </span>
  );
}
