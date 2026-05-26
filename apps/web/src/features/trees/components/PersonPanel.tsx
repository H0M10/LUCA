import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import { QuickAddDialog, type Relation } from './QuickAddDialog.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import { toast } from '../../../shared/stores/toast.js';

interface Props {
  treeId: string;
  person: PersonDto;
  persons: PersonDto[];
  relationships: RelationshipDto[];
  onClose: () => void;
}

export function PersonPanel({ treeId, person, persons, relationships, onClose }: Props) {
  const qc = useQueryClient();
  const [addRelation, setAddRelation] = useState<Relation | null>(null);

  const parents = relationships
    .filter((r) => r.type === 'parent' && r.toPersonId === person.id)
    .map((r) => persons.find((p) => p.id === r.fromPersonId))
    .filter(Boolean) as PersonDto[];
  const partners = relationships
    .filter((r) => r.type === 'partner' && (r.fromPersonId === person.id || r.toPersonId === person.id))
    .map((r) =>
      persons.find((p) => p.id === (r.fromPersonId === person.id ? r.toPersonId : r.fromPersonId)),
    )
    .filter(Boolean) as PersonDto[];
  const children = relationships
    .filter((r) => r.type === 'parent' && r.fromPersonId === person.id)
    .map((r) => persons.find((p) => p.id === r.toPersonId))
    .filter(Boolean) as PersonDto[];
  const siblings = parents
    .flatMap((parent) =>
      relationships
        .filter((r) => r.type === 'parent' && r.fromPersonId === parent.id && r.toPersonId !== person.id)
        .map((r) => persons.find((p) => p.id === r.toPersonId)),
    )
    .filter(Boolean) as PersonDto[];

  const father = parents.find((p) => p.gender === 'male');
  const mother = parents.find((p) => p.gender === 'female');

  const del = useMutation({
    mutationFn: () => api.deletePerson(person.id),
    onSuccess: () => {
      toast.success(`${person.firstName} eliminado`);
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
      onClose();
    },
  });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col bg-paper-50 shadow-paper-lg animate-slide-in"
        style={{ animationName: 'slide-in', animationDuration: '0.4s' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-paper-300 bg-paper-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <PersonSymbol gender={person.gender} dead={!!person.deathDate} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
                Expediente № {person.id.slice(0, 8).toUpperCase()}
              </p>
              <h2 className="mt-1 font-display text-2xl font-light leading-tight text-ink-900">
                {person.firstName}{' '}
                <em className="fr-italic text-moss-700">{person.lastName ?? ''}</em>
              </h2>
              {person.isProband && (
                <span className="mt-2 inline-block rounded-full bg-ink-900 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-paper-50">
                  Yo · Proband
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Datos básicos */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-paper-300 pb-5">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Nacimiento</dt>
              <dd className="mt-0.5 font-sans text-sm text-ink-900">{person.birthDate ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                {person.deathDate ? 'Defunción' : 'Estado'}
              </dt>
              <dd className="mt-0.5 font-sans text-sm text-ink-900">
                {person.deathDate ?? 'Vivo'}
              </dd>
            </div>
            <div className="col-span-2">
              <Link
                to={`/persons/${person.id}?treeId=${treeId}`}
                className="link-underline font-mono text-[10px] uppercase tracking-widest text-moss-700"
              >
                Ver expediente completo →
              </Link>
            </div>
          </dl>

          {/* Familia directa */}
          <div className="mt-6">
            <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Familia directa</h3>

            <FamilyRow label="Padre">
              {father ? (
                <RelativeChip person={father} />
              ) : (
                <AddButton onClick={() => setAddRelation({ kind: 'father', child: person })}>
                  + Agregar padre
                </AddButton>
              )}
            </FamilyRow>

            <FamilyRow label="Madre">
              {mother ? (
                <RelativeChip person={mother} />
              ) : (
                <AddButton onClick={() => setAddRelation({ kind: 'mother', child: person })}>
                  + Agregar madre
                </AddButton>
              )}
            </FamilyRow>

            <FamilyRow label={`Pareja${partners.length > 1 ? 's' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                {partners.map((p) => <RelativeChip key={p.id} person={p} />)}
                <AddButton onClick={() => setAddRelation({ kind: 'partner', of: person })}>
                  + Agregar pareja
                </AddButton>
              </div>
            </FamilyRow>

            <FamilyRow label={`Hijo${children.length === 1 ? '' : 's'}`}>
              <div className="flex flex-wrap items-center gap-2">
                {children.map((p) => <RelativeChip key={p.id} person={p} />)}
                <AddButton onClick={() => setAddRelation({ kind: 'child', parent: person })}>
                  + Agregar hijo/a
                </AddButton>
              </div>
            </FamilyRow>

            <FamilyRow label={`Hermano${siblings.length === 1 ? '' : 's'}`}>
              <div className="flex flex-wrap items-center gap-2">
                {siblings.map((p) => <RelativeChip key={p.id} person={p} />)}
                <AddButton onClick={() => setAddRelation({ kind: 'sibling', of: person })}>
                  + Agregar hermano/a
                </AddButton>
              </div>
            </FamilyRow>
          </div>
        </div>

        {/* Footer con acción peligrosa */}
        <div className="border-t border-paper-300 bg-paper-100 px-6 py-4">
          <button
            onClick={() => {
              if (confirm(`¿Eliminar a ${person.firstName}? Las relaciones también se borrarán.`)) {
                del.mutate();
              }
            }}
            className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
          >
            Eliminar esta persona
          </button>
        </div>
      </aside>

      {addRelation && (
        <QuickAddDialog
          treeId={treeId}
          relation={addRelation}
          onClose={() => setAddRelation(null)}
        />
      )}
    </>
  );
}

function FamilyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-paper-300/60 py-3 first:border-t-0">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-300">{label}</p>
      {children}
    </div>
  );
}

function RelativeChip({ person }: { person: PersonDto }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-paper-300 bg-paper-50 px-3 py-1 font-sans text-sm text-ink-900">
      <span className="font-mono text-[9px] uppercase text-ink-500">
        {person.gender === 'female' ? '○' : person.gender === 'male' ? '□' : '◇'}
      </span>
      {person.firstName} {person.lastName ?? ''}
      {person.isProband && <span className="font-mono text-[9px] text-ink-500">· yo</span>}
    </span>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-moss-700/50 bg-moss-50 px-3 py-1 font-sans text-xs font-medium text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
    >
      {children}
    </button>
  );
}

function PersonSymbol({ gender, dead }: { gender: string | null; dead: boolean }) {
  const color = dead ? '#A89F8E' : '#1F1A14';
  const symbol =
    gender === 'female' ? (
      <circle cx="20" cy="20" r="17" fill="none" stroke={color} strokeWidth="2" />
    ) : gender === 'male' ? (
      <rect x="3" y="3" width="34" height="34" fill="none" stroke={color} strokeWidth="2" />
    ) : (
      <path d="M 20 3 L 37 20 L 20 37 L 3 20 Z" fill="none" stroke={color} strokeWidth="2" />
    );
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0">
      {symbol}
      {dead && <line x1="4" y1="4" x2="36" y2="36" stroke={color} strokeWidth="2" />}
    </svg>
  );
}
