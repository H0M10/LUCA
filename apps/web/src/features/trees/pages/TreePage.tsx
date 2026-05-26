import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonCreateSchema, type PersonCreateInput } from '@genograma/shared';
import * as api from '../api/trees.js';
import type { PersonDto, RelationshipDto } from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button, ErrorAlert, Field, Input, Select, Textarea } from '../../../shared/components/ui.js';

export function TreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: tree, isLoading } = useQuery({
    queryKey: ['tree', id],
    queryFn: () => api.getTree(id!),
    enabled: !!id,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [linkMode, setLinkMode] = useState<null | { from: string; type: 'parent' | 'partner' }>(null);

  const delTree = useMutation({
    mutationFn: () => api.deleteTree(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trees'] });
      navigate('/dashboard');
    },
  });
  const delPerson = useMutation({
    mutationFn: (pid: string) => api.deletePerson(pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree', id] }),
  });
  const addRel = useMutation({
    mutationFn: api.addRelationship,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tree', id] });
      setLinkMode(null);
    },
  });

  if (isLoading || !tree) {
    return (
      <div>
        <Navbar />
        <main className="editorial py-20 text-center font-mono text-xs uppercase tracking-widest text-ink-500">
          Abriendo archivo…
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-16">
        <Link to="/dashboard" className="link-underline mb-6 inline-block font-mono text-[10px] uppercase tracking-widest text-ink-500">
          ← Archivos
        </Link>

        {/* Header */}
        <header className="mb-10 grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-paper-300 pb-10">
          <div className="col-span-12 md:col-span-8">
            <p className="section-number">— Árbol {tree.id.slice(0, 6)}</p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              {tree.name}
            </h1>
            {tree.description && (
              <p className="mt-4 max-w-2xl font-display text-lg italic text-ink-500">
                {tree.description}
              </p>
            )}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              {tree.persons.length} {tree.persons.length === 1 ? 'persona' : 'personas'} · {tree.relationships.length} {tree.relationships.length === 1 ? 'relación' : 'relaciones'}
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-4 md:justify-end">
            <Button variant="ghost" onClick={() => {
              if (confirm('¿Eliminar este árbol? Esta acción se puede revertir desde el panel admin en 30 días.')) {
                delTree.mutate();
              }
            }}>
              Eliminar
            </Button>
            <Button onClick={() => setShowAdd(true)}>+ Persona</Button>
          </div>
        </header>

        {linkMode && (
          <div className="mb-6 flex flex-wrap items-center gap-4 border-y border-moss-700/30 bg-moss-50 px-5 py-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-moss-700">Modo enlace</span>
            <span className="font-sans text-sm text-ink-700">
              Selecciona la persona objetivo del enlace{' '}
              <em className="fr-italic text-moss-700">
                {linkMode.type === 'parent' ? 'padre/madre → hijo/a' : 'pareja'}
              </em>.
            </span>
            <button
              onClick={() => setLinkMode(null)}
              className="ml-auto font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
            >
              Cancelar
            </button>
          </div>
        )}

        {showAdd && (
          <AddPersonForm
            treeId={tree.id}
            onClose={() => setShowAdd(false)}
            onAdded={() => qc.invalidateQueries({ queryKey: ['tree', id] })}
          />
        )}

        {/* Grid */}
        {tree.persons.length === 0 ? (
          <div className="border border-dashed border-paper-400 py-16 text-center font-display text-xl italic text-ink-500">
            Este archivo aún está vacío. Empieza por ti.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tree.persons.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                relationships={tree.relationships}
                persons={tree.persons}
                linkMode={linkMode}
                onStartLink={(type) => setLinkMode({ from: p.id, type })}
                onCompleteLink={(toId) =>
                  addRel.mutate({
                    type: linkMode!.type,
                    fromPersonId: linkMode!.from,
                    toPersonId: toId,
                  })
                }
                onDelete={() => {
                  if (confirm(`¿Eliminar a ${p.firstName}?`)) delPerson.mutate(p.id);
                }}
              />
            ))}
          </div>
        )}

        <ErrorAlert message={addRel.error ? (addRel.error as { message: string }).message : undefined} />
      </main>
      <Footer />
    </div>
  );
}

function PersonCard({
  person,
  relationships,
  persons,
  linkMode,
  onStartLink,
  onCompleteLink,
  onDelete,
}: {
  person: PersonDto;
  relationships: RelationshipDto[];
  persons: PersonDto[];
  linkMode: null | { from: string; type: 'parent' | 'partner' };
  onStartLink: (type: 'parent' | 'partner') => void;
  onCompleteLink: (toId: string) => void;
  onDelete: () => void;
}) {
  const parents = relationships
    .filter((r) => r.type === 'parent' && r.toPersonId === person.id)
    .map((r) => persons.find((p) => p.id === r.fromPersonId))
    .filter(Boolean) as PersonDto[];
  const children = relationships
    .filter((r) => r.type === 'parent' && r.fromPersonId === person.id)
    .map((r) => persons.find((p) => p.id === r.toPersonId))
    .filter(Boolean) as PersonDto[];
  const partners = relationships
    .filter((r) => r.type === 'partner' && (r.fromPersonId === person.id || r.toPersonId === person.id))
    .map((r) => persons.find((p) => p.id === (r.fromPersonId === person.id ? r.toPersonId : r.fromPersonId)))
    .filter(Boolean) as PersonDto[];

  const isTarget = linkMode && linkMode.from !== person.id;
  const isSource = linkMode && linkMode.from === person.id;

  return (
    <article
      className={`group relative border bg-paper-50 transition ${
        isTarget
          ? 'cursor-pointer border-moss-700 shadow-moss'
          : isSource
            ? 'border-clay-500'
            : 'border-paper-300 hover:border-ink-900 hover:shadow-paper-lg'
      }`}
    >
      {isTarget && (
        <button
          onClick={() => onCompleteLink(person.id)}
          className="absolute inset-0 z-10"
          aria-label="Seleccionar como objetivo"
        />
      )}

      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-paper-300 bg-paper-100 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {person.gender === 'female' ? 'F' : person.gender === 'male' ? 'M' : '—'}
          {person.deathDate && ' · †'}
        </span>
        {person.isProband && (
          <span className="rounded-full bg-ink-900 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-paper-50">
            Yo
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <Link
          to={`/persons/${person.id}?treeId=${person.treeId}`}
          className="block"
        >
          <PersonSymbol gender={person.gender} dead={!!person.deathDate} />
          <h3 className="mt-4 font-display text-2xl font-light leading-tight text-ink-900 transition group-hover:text-moss-700">
            {person.firstName} {person.lastName ?? ''}
          </h3>
          {person.alias && (
            <p className="mt-0.5 font-display text-sm italic text-ink-500">«{person.alias}»</p>
          )}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            {person.birthDate ?? '?'} — {person.deathDate ?? (person.birthDate ? 'presente' : '')}
          </p>
        </Link>

        {(parents.length > 0 || children.length > 0 || partners.length > 0) && (
          <dl className="mt-4 space-y-1 border-t border-paper-300 pt-3 font-sans text-xs text-ink-500">
            {parents.length > 0 && (
              <div className="flex gap-2">
                <dt className="font-mono uppercase tracking-widest text-ink-300">Padres</dt>
                <dd className="flex-1 text-ink-700">{parents.map((p) => p.firstName).join(' · ')}</dd>
              </div>
            )}
            {partners.length > 0 && (
              <div className="flex gap-2">
                <dt className="font-mono uppercase tracking-widest text-ink-300">Pareja</dt>
                <dd className="flex-1 text-ink-700">{partners.map((p) => p.firstName).join(' · ')}</dd>
              </div>
            )}
            {children.length > 0 && (
              <div className="flex gap-2">
                <dt className="font-mono uppercase tracking-widest text-ink-300">Hijos</dt>
                <dd className="flex-1 text-ink-700">{children.map((p) => p.firstName).join(' · ')}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Actions */}
      <div className="relative z-20 flex border-t border-paper-300 text-xs">
        <button onClick={() => onStartLink('parent')} className="flex-1 px-3 py-2.5 font-sans text-ink-500 transition hover:bg-paper-200 hover:text-ink-900">
          + hijo
        </button>
        <span className="w-px bg-paper-300" />
        <button onClick={() => onStartLink('partner')} className="flex-1 px-3 py-2.5 font-sans text-ink-500 transition hover:bg-paper-200 hover:text-ink-900">
          + pareja
        </button>
        <span className="w-px bg-paper-300" />
        <button onClick={onDelete} className="flex-1 px-3 py-2.5 font-sans text-clay-600 transition hover:bg-clay-100 hover:text-clay-700">
          Eliminar
        </button>
      </div>
    </article>
  );
}

function PersonSymbol({ gender, dead }: { gender: string | null; dead: boolean }) {
  // Genogram standard: square=male, circle=female, diamond=other
  const color = dead ? '#A89F8E' : '#1F1A14';
  const symbol =
    gender === 'female' ? (
      <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="1.5" />
    ) : gender === 'male' ? (
      <rect x="4" y="4" width="40" height="40" fill="none" stroke={color} strokeWidth="1.5" />
    ) : (
      <path d="M 24 4 L 44 24 L 24 44 L 4 24 Z" fill="none" stroke={color} strokeWidth="1.5" />
    );
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      {symbol}
      {dead && <line x1="6" y1="6" x2="42" y2="42" stroke={color} strokeWidth="1.5" />}
    </svg>
  );
}

function AddPersonForm({
  treeId,
  onClose,
  onAdded,
}: {
  treeId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<PersonCreateInput>({
    resolver: zodResolver(PersonCreateSchema),
  });
  const { mutate, isPending, error } = useMutation({
    mutationFn: (input: PersonCreateInput) => api.addPerson(treeId, input),
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  return (
    <section className="mb-10 border-y border-paper-300 bg-paper-50 py-10">
      <div className="grid grid-cols-12 gap-x-6 gap-y-6">
        <div className="col-span-12 md:col-span-3">
          <p className="section-number">— Nueva persona</p>
          <h2 className="mt-2 font-display text-3xl font-light text-ink-900">
            Una nueva{' '}
            <em className="fr-italic">rama</em>.
          </h2>
        </div>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-9">
          <Field number="01" label="Nombre" error={errors.firstName?.message}>
            <Input {...register('firstName')} autoFocus />
          </Field>
          <Field number="02" label="Apellido" error={errors.lastName?.message}>
            <Input {...register('lastName')} />
          </Field>
          <Field number="03" label="Género" error={errors.gender?.message}>
            <Select {...register('gender')}>
              <option value="">— Seleccionar —</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="nonbinary">No binario</option>
              <option value="unknown">Desconocido</option>
            </Select>
          </Field>
          <Field number="04" label="Fecha de nacimiento" error={errors.birthDate?.message}>
            <Input type="date" {...register('birthDate')} />
          </Field>
          <Field number="05" label="Fecha de defunción" hint="opcional" error={errors.deathDate?.message}>
            <Input type="date" {...register('deathDate')} />
          </Field>
          <label className="col-span-2 flex items-center gap-3 pt-2 sm:col-span-1">
            <input type="checkbox" {...register('isProband')} className="h-4 w-4 accent-moss-700" />
            <span className="font-sans text-sm text-ink-700">
              Marcar como <em className="fr-italic">yo</em>
            </span>
          </label>
          <div className="col-span-2">
            <ErrorAlert message={error ? (error as { message: string }).message : undefined} />
          </div>
          <div className="col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar persona'}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
