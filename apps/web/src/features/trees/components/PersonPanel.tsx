import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import * as medApi from '../../medical/api/medical.js';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import { QuickAddDialog, type Relation } from './QuickAddDialog.js';
import { EditPersonDialog } from './EditPersonDialog.js';
import { NotesAndTags } from './NotesAndTags.js';
import { PhotoUpload } from './PhotoUpload.js';
import { PersonAvatar } from './PersonAvatar.js';
import { toast } from '../../../shared/stores/toast.js';

interface Props {
  treeId: string;
  person: PersonDto;
  persons: PersonDto[];
  relationships: RelationshipDto[];
  onClose: () => void;
}

type Tab = 'family' | 'health';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export function PersonPanel({ treeId, person, persons, relationships, onClose }: Props) {
  const qc = useQueryClient();
  const [addRelation, setAddRelation] = useState<Relation | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('family');
  const [showDelete, setShowDelete] = useState(false);

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

  // Descendientes (hacia abajo por relaciones padre→hijo) — para poder podar una rama.
  const descendants = (() => {
    const set = new Set<string>();
    const q = [person.id];
    while (q.length) {
      const cur = q.shift()!;
      relationships
        .filter((r) => r.type === 'parent' && r.fromPersonId === cur)
        .forEach((r) => {
          if (!set.has(r.toPersonId)) {
            set.add(r.toPersonId);
            q.push(r.toPersonId);
          }
        });
    }
    set.delete(person.id);
    return set;
  })();

  const del = useMutation({
    mutationFn: async (ids: string[]) => {
      // Borramos descendientes primero, luego la persona (evita relaciones colgando raras).
      for (const pid of ids) await api.deletePerson(pid);
    },
    onSuccess: (_d, ids) => {
      toast.success(ids.length > 1 ? `${ids.length} personas eliminadas` : `${person.firstName} eliminado`);
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
      onClose();
    },
    onError: (e) => toast.error((e as { message?: string }).message ?? 'No se pudo eliminar'),
  });

  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in bg-ink-950/30 backdrop-blur-sm" onClick={onClose} />

      <aside
        className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col bg-paper-50 shadow-paper-lg animate-slide-in"
        style={{ animationName: 'slide-in', animationDuration: '0.4s' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-paper-300 bg-paper-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <PersonAvatar person={person} size={40} />
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
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900"
            >
              ×
            </button>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-full border border-moss-700/50 bg-moss-50 px-3 py-1 font-sans text-xs font-medium text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-white"
              title="Editar nombre, fechas y género"
            >
              ✎ Editar
            </button>
          </div>
        </div>

        {/* Datos rápidos */}
        <div className="grid grid-cols-3 gap-px border-b border-paper-300 bg-paper-300 text-center">
          <Datum label="Nacimiento" value={person.birthDate ?? '—'} />
          <Datum
            label={person.deathDate ? 'Defunción' : 'Estado'}
            value={person.deathDate ?? 'Vivo'}
            tone={person.deathDate ? 'muted' : 'ok'}
          />
          <Datum
            label="Sangre"
            value={person.bloodType && person.bloodType !== 'unknown' ? person.bloodType : '—'}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-paper-300 bg-paper-50">
          <TabButton active={tab === 'family'} onClick={() => setTab('family')}>
            Familia
          </TabButton>
          <TabButton active={tab === 'health'} onClick={() => setTab('health')}>
            Salud
          </TabButton>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-5 border-b border-paper-300 pb-5">
            <PhotoUpload person={person} treeId={treeId} />
          </div>
          {tab === 'family' ? (
            <div className="space-y-1">
              <FamilyRow label="Padre">
                {father ? <RelativeChip person={father} /> : <AddButton onClick={() => setAddRelation({ kind: 'father', child: person })}>+ Agregar padre</AddButton>}
              </FamilyRow>
              <FamilyRow label="Madre">
                {mother ? <RelativeChip person={mother} /> : <AddButton onClick={() => setAddRelation({ kind: 'mother', child: person })}>+ Agregar madre</AddButton>}
              </FamilyRow>
              <FamilyRow label={`Pareja${partners.length > 1 ? 's' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {partners.map((p) => <RelativeChip key={p.id} person={p} />)}
                  <AddButton onClick={() => setAddRelation({ kind: 'partner', of: person })}>+ Agregar pareja</AddButton>
                </div>
              </FamilyRow>
              <FamilyRow label={`Hijo${children.length === 1 ? '' : 's'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {children.map((p) => <RelativeChip key={p.id} person={p} />)}
                  <AddButton onClick={() => setAddRelation({ kind: 'child', parent: person })}>+ Agregar hijo/a</AddButton>
                </div>
              </FamilyRow>
              <FamilyRow label={`Hermano${siblings.length === 1 ? '' : 's'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {siblings.map((p) => <RelativeChip key={p.id} person={p} />)}
                  <AddButton onClick={() => setAddRelation({ kind: 'sibling', of: person })}>+ Agregar hermano/a</AddButton>
                </div>
              </FamilyRow>
            </div>
          ) : (
            <div className="space-y-6">
              <HealthTab person={person} treeId={treeId} />
              <div className="border-t border-paper-300 pt-6">
                <NotesAndTags person={person} treeId={treeId} />
              </div>
            </div>
          )}
        </div>

        {/* Menú de borrado: solo esta persona, o esta + sus descendientes */}
        {showDelete && (
          <div className="border-t border-clay-300 bg-clay-100/60 px-6 py-4">
            <p className="mb-3 font-sans text-sm text-ink-700">
              ¿Cómo quieres eliminar a <strong>{person.firstName}</strong>?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => del.mutate([person.id])}
                disabled={del.isPending}
                className="rounded-full border border-clay-500 bg-white px-4 py-2 text-left font-sans text-sm text-ink-900 transition hover:bg-clay-100 disabled:opacity-50"
              >
                <strong>Solo a {person.firstName}</strong>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Sus familiares quedan, solo se quitan sus vínculos
                </span>
              </button>
              {descendants.size > 0 && (
                <button
                  onClick={() => del.mutate([...descendants, person.id])}
                  disabled={del.isPending}
                  className="rounded-full border border-clay-500 bg-white px-4 py-2 text-left font-sans text-sm text-clay-700 transition hover:bg-clay-100 disabled:opacity-50"
                >
                  <strong>A {person.firstName} y sus {descendants.size} descendiente{descendants.size === 1 ? '' : 's'}</strong>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-clay-600">
                    Poda toda la rama hacia abajo
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowDelete(false)}
                disabled={del.isPending}
                className="self-start font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-paper-300 bg-paper-100 px-6 py-3">
          <Link
            to={`/persons/${person.id}?treeId=${treeId}`}
            className="link-underline font-mono text-[10px] uppercase tracking-widest text-moss-700"
          >
            Expediente completo →
          </Link>
          <button
            onClick={() => setShowDelete((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
          >
            Eliminar
          </button>
        </div>
      </aside>

      {addRelation && (
        <QuickAddDialog treeId={treeId} relation={addRelation} persons={persons} onClose={() => setAddRelation(null)} />
      )}

      {editing && (
        <EditPersonDialog treeId={treeId} person={person} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 border-b-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] transition ${
        active ? 'border-moss-700 text-moss-700' : 'border-transparent text-ink-500 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}

function Datum({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'muted' }) {
  const color = tone === 'ok' ? 'text-moss-700' : tone === 'muted' ? 'text-ink-500' : 'text-ink-900';
  return (
    <div className="bg-paper-50 p-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">{label}</p>
      <p className={`mt-1 font-display text-sm ${color}`}>{value}</p>
    </div>
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
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-moss-700/60 bg-moss-50 px-3 py-1 font-sans text-xs font-medium text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
    >
      {children}
    </button>
  );
}

// ════════════════════ HEALTH TAB ════════════════════

function HealthTab({ person, treeId }: { person: PersonDto; treeId: string }) {
  const qc = useQueryClient();
  const { data: medical, isLoading } = useQuery({
    queryKey: ['medical', person.id],
    queryFn: () => medApi.getPersonMedical(person.id),
  });

  const updatePerson = useMutation({
    mutationFn: (input: Parameters<typeof api.updatePerson>[1]) => api.updatePerson(person.id, input),
    onSuccess: () => {
      toast.success('Guardado');
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
    },
    onError: () => toast.error('No se pudo guardar'),
  });

  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tipo de sangre */}
      <section>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-700">Tipo de sangre</p>
        <div className="flex flex-wrap gap-1.5">
          {BLOOD_TYPES.map((bt) => (
            <button
              key={bt}
              onClick={() => updatePerson.mutate({ bloodType: person.bloodType === bt ? 'unknown' : bt })}
              className={`rounded-full border px-3 py-1 font-sans text-xs font-medium transition ${
                person.bloodType === bt
                  ? 'border-clay-600 bg-clay-600 text-paper-50'
                  : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-clay-600 hover:text-clay-600'
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </section>

      {/* Condiciones */}
      <section className="border-t border-paper-300 pt-5">
        <SectionTitle title="Condiciones médicas" count={medical?.conditions.length ?? 0} onAdd={() => setShowAddCondition(true)} />
        {isLoading ? (
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Cargando…</p>
        ) : medical?.conditions.length === 0 ? (
          <p className="font-display text-sm italic text-ink-500">Sin condiciones registradas.</p>
        ) : (
          <ul className="space-y-1.5">
            {medical?.conditions.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border border-paper-300 bg-paper-50 px-3 py-1.5 text-sm">
                <span>
                  <strong>{c.conditionName ?? c.customName}</strong>
                  {c.conditionCode && <span className="ml-1.5 font-mono text-[10px] text-ink-500">{c.conditionCode}</span>}
                  <span className="ml-2 font-mono text-[10px] text-ink-500">{c.status ?? '—'} · {c.severity ?? '—'}</span>
                </span>
                <button
                  onClick={() => medApi.deleteCondition(c.id).then(() => qc.invalidateQueries({ queryKey: ['medical', person.id] }))}
                  className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {showAddCondition && <AddConditionForm personId={person.id} onClose={() => setShowAddCondition(false)} onAdded={() => qc.invalidateQueries({ queryKey: ['medical', person.id] })} />}
      </section>

      {/* Alergias */}
      <section className="border-t border-paper-300 pt-5">
        <SectionTitle title="Alergias" count={medical?.allergies.length ?? 0} onAdd={() => setShowAddAllergy(true)} />
        {medical?.allergies.length === 0 ? (
          <p className="font-display text-sm italic text-ink-500">Sin alergias registradas.</p>
        ) : (
          <ul className="space-y-1.5">
            {medical?.allergies.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded border border-paper-300 bg-paper-50 px-3 py-1.5 text-sm">
                <span>
                  <strong>{a.name}</strong>{' '}
                  <span className="font-mono text-[10px] text-ink-500">({a.kind} · {a.severity ?? '—'})</span>
                </span>
                <button
                  onClick={() => medApi.deleteAllergy(a.id).then(() => qc.invalidateQueries({ queryKey: ['medical', person.id] }))}
                  className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {showAddAllergy && <AddAllergyForm personId={person.id} onClose={() => setShowAddAllergy(false)} onAdded={() => qc.invalidateQueries({ queryKey: ['medical', person.id] })} />}
      </section>

      {/* Hábitos */}
      <section className="border-t border-paper-300 pt-5">
        <SectionTitle title="Hábitos" count={medical?.habits.length ?? 0} onAdd={() => setShowAddHabit(true)} />
        {medical?.habits.length === 0 ? (
          <p className="font-display text-sm italic text-ink-500">Sin hábitos registrados.</p>
        ) : (
          <ul className="space-y-1.5">
            {medical?.habits.map((h) => (
              <li key={h.id} className="flex items-center justify-between rounded border border-paper-300 bg-paper-50 px-3 py-1.5 text-sm capitalize">
                <span>
                  <strong>{h.kind}</strong>{' '}
                  <span className="font-mono text-[10px] text-ink-500">({h.intensity ?? '—'})</span>
                </span>
                <button
                  onClick={() => medApi.deleteHabit(h.id).then(() => qc.invalidateQueries({ queryKey: ['medical', person.id] }))}
                  className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {showAddHabit && <AddHabitForm personId={person.id} onClose={() => setShowAddHabit(false)} onAdded={() => qc.invalidateQueries({ queryKey: ['medical', person.id] })} />}
      </section>
    </div>
  );
}

function SectionTitle({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-700">
        {title} {count > 0 && <span className="text-ink-300">· {count}</span>}
      </p>
      <button onClick={onAdd} className="font-mono text-[10px] uppercase tracking-widest text-moss-700 hover:text-moss-800">
        + agregar
      </button>
    </div>
  );
}

function AddConditionForm({ personId, onClose, onAdded }: { personId: string; onClose: () => void; onAdded: () => void }) {
  const [q, setQ] = useState('');
  const { data: catalog } = useQuery({
    queryKey: ['catalog', q],
    queryFn: () => medApi.searchConditions(q),
    enabled: q.length > 1,
  });
  const [picked, setPicked] = useState<medApi.CatalogCondition | null>(null);
  const [customName, setCustomName] = useState('');
  const [status, setStatus] = useState('active');
  const [severity, setSeverity] = useState('moderate');

  const add = useMutation({
    mutationFn: () =>
      medApi.addCondition(personId, {
        conditionId: picked?.id,
        customName: !picked && customName ? customName : undefined,
        status,
        severity,
      }),
    onSuccess: () => { onAdded(); onClose(); },
  });

  return (
    <div className="mt-3 animate-fade-up space-y-3 rounded border border-paper-300 bg-paper-100 p-3">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setPicked(null); }}
        placeholder="Buscar enfermedad… (diabetes, hipertensión)"
        autoFocus
        className="w-full border-b border-ink-300 bg-transparent py-2 text-sm outline-none focus:border-moss-700"
      />
      {q.length > 1 && catalog && catalog.length > 0 && !picked && (
        <ul className="max-h-40 overflow-y-auto rounded border border-paper-300 bg-paper-50">
          {catalog.map((c) => (
            <li key={c.id}>
              <button onClick={() => setPicked(c)} className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-moss-50">
                <span>{c.name}</span>
                <span className="font-mono text-[10px] text-ink-500">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {picked && (
        <div className="rounded border-l-2 border-moss-700 bg-moss-50 px-3 py-1.5 text-sm">
          ✓ {picked.name}{' '}
          <button onClick={() => setPicked(null)} className="ml-2 text-xs underline">cambiar</button>
        </div>
      )}
      {!picked && q.length > 1 && catalog?.length === 0 && (
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Nombre personalizado"
          className="w-full border-b border-ink-300 bg-transparent py-2 text-sm"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border-b border-ink-300 bg-transparent py-1 text-sm">
          <option value="active">Activa</option>
          <option value="remission">En remisión</option>
          <option value="controlled">Controlada</option>
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="border-b border-ink-300 bg-transparent py-1 text-sm">
          <option value="mild">Leve</option>
          <option value="moderate">Moderada</option>
          <option value="severe">Severa</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => add.mutate()} disabled={!picked && !customName} className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-medium text-paper-50 disabled:bg-ink-300">
          Agregar
        </button>
        <button onClick={onClose} className="rounded-full border border-paper-400 px-4 py-1.5 text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AddAllergyForm({ personId, onClose, onAdded }: { personId: string; onClose: () => void; onAdded: () => void }) {
  const [kind, setKind] = useState('drug');
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState('mild');
  const add = useMutation({
    mutationFn: () => medApi.addAllergy(personId, { kind, name, severity }),
    onSuccess: () => { onAdded(); onClose(); },
  });
  return (
    <div className="mt-3 animate-fade-up space-y-2 rounded border border-paper-300 bg-paper-100 p-3">
      <div className="grid grid-cols-3 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="border-b border-ink-300 bg-transparent py-1 text-sm">
          <option value="drug">Medicamento</option>
          <option value="food">Alimento</option>
          <option value="environmental">Ambiental</option>
          <option value="other">Otra</option>
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Penicilina…" autoFocus className="col-span-2 border-b border-ink-300 bg-transparent py-1 text-sm" />
      </div>
      <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full border-b border-ink-300 bg-transparent py-1 text-sm">
        <option value="mild">Leve</option>
        <option value="moderate">Moderada</option>
        <option value="severe">Severa</option>
        <option value="anaphylactic">Anafiláctica</option>
      </select>
      <div className="flex gap-2">
        <button onClick={() => add.mutate()} disabled={!name} className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-medium text-paper-50 disabled:bg-ink-300">
          Agregar
        </button>
        <button onClick={onClose} className="rounded-full border border-paper-400 px-4 py-1.5 text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AddHabitForm({ personId, onClose, onAdded }: { personId: string; onClose: () => void; onAdded: () => void }) {
  const [kind, setKind] = useState('smoking');
  const [intensity, setIntensity] = useState('moderate');
  const add = useMutation({
    mutationFn: () => medApi.addHabit(personId, { kind, intensity }),
    onSuccess: () => { onAdded(); onClose(); },
  });
  return (
    <div className="mt-3 animate-fade-up space-y-2 rounded border border-paper-300 bg-paper-100 p-3">
      <div className="grid grid-cols-2 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="border-b border-ink-300 bg-transparent py-1 text-sm">
          <option value="smoking">Tabaquismo</option>
          <option value="alcohol">Alcohol</option>
          <option value="drugs">Drogas</option>
          <option value="sedentary">Sedentarismo</option>
          <option value="diet">Dieta</option>
          <option value="exercise">Ejercicio</option>
        </select>
        <select value={intensity} onChange={(e) => setIntensity(e.target.value)} className="border-b border-ink-300 bg-transparent py-1 text-sm">
          <option value="low">Baja</option>
          <option value="moderate">Moderada</option>
          <option value="high">Alta</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => add.mutate()} className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-medium text-paper-50">
          Agregar
        </button>
        <button onClick={onClose} className="rounded-full border border-paper-400 px-4 py-1.5 text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}
