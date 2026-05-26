import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { DateField } from '../../../shared/components/DateField.js';
import * as api from '../api/trees.js';
import type { PersonDto } from '../api/trees.js';
import { toast } from '../../../shared/stores/toast.js';

export type Relation =
  | { kind: 'self' } // primer registro: el proband
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

function inferLastName(r: Relation): string {
  if (r.kind === 'father' || r.kind === 'mother') return '';
  if (r.kind === 'child') return r.parent.lastName ?? '';
  if (r.kind === 'sibling') return r.of.lastName ?? '';
  return '';
}

function titleFor(r: Relation): { eyebrow: string; heading: string } {
  switch (r.kind) {
    case 'self':
      return { eyebrow: '— Punto de partida', heading: 'Empieza por ti' };
    case 'father':
      return { eyebrow: `— Padre de ${r.child.firstName}`, heading: 'Agregar padre' };
    case 'mother':
      return { eyebrow: `— Madre de ${r.child.firstName}`, heading: 'Agregar madre' };
    case 'partner':
      return { eyebrow: `— Pareja de ${r.of.firstName}`, heading: 'Agregar pareja' };
    case 'child':
      return { eyebrow: `— Hijo/a de ${r.parent.firstName}`, heading: 'Agregar hijo/a' };
    case 'sibling':
      return { eyebrow: `— Hermano/a de ${r.of.firstName}`, heading: 'Agregar hermano/a' };
  }
}

export function QuickAddDialog({ treeId, relation, onClose }: Props) {
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(inferLastName(relation));
  const [gender, setGender] = useState<'male' | 'female' | 'nonbinary' | 'unknown' | ''>(
    inferGender(relation) ?? '',
  );
  const [birthDate, setBirthDate] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [deathDate, setDeathDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { eyebrow, heading } = titleFor(relation);

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Crear la persona
      const personInput = {
        firstName: firstName.trim(),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
        ...(gender ? { gender: gender as 'male' | 'female' | 'nonbinary' | 'unknown' } : {}),
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        ...(!isAlive && deathDate ? { deathDate: new Date(deathDate) } : {}),
        ...(relation.kind === 'self' ? { isProband: true } : {}),
      };
      const newPerson = await api.addPerson(treeId, personInput);

      // 2. Crear la relación apropiada
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
        // Para hermano: crear relación parent desde los padres existentes de `of` (si los hay)
        const tree = await api.getTree(treeId);
        const parentsOf = tree.relationships
          .filter((r) => r.type === 'parent' && r.toPersonId === relation.of.id)
          .map((r) => r.fromPersonId);
        if (parentsOf.length === 0) {
          // sin padres registrados, no podemos enlazar como hermano automáticamente
          // (queda como persona suelta — el usuario podrá enlazar después)
          toast.info('Hermano agregado sin padres comunes', 'Cuando registres los padres se conectarán solos.');
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
      toast.success(`${p.firstName} agregado`);
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
      onClose();
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'Error al guardar'),
  });

  const canSubmit = firstName.trim().length > 0 && !mutation.isPending;
  const requiresGender = relation.kind === 'self';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg animate-scale-in border border-ink-900/10 bg-paper-50 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-paper-300 bg-paper-100 px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">{eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl font-light text-ink-900">
            {heading}
          </h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate();
          }}
          autoComplete="off"
          className="space-y-5 px-6 py-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field number="01" label="Nombre">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="María"
              />
            </Field>
            <Field number="02" label="Apellido" hint="opcional">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="off"
                placeholder="Pérez"
              />
            </Field>
          </div>

          <Field number="03" label={requiresGender ? 'Género' : 'Género (opcional)'}>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['male', 'Masculino'],
                  ['female', 'Femenino'],
                  ['nonbinary', 'No binario'],
                  ['unknown', 'Prefiero no decir'],
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
            number="04"
            label="Fecha de nacimiento"
            hint="opcional · puedes poner solo el año"
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

          <ErrorAlert message={error ?? undefined} />

          <div className="flex flex-wrap items-center gap-3 border-t border-paper-300 pt-5">
            <Button type="submit" disabled={!canSubmit}>
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
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
