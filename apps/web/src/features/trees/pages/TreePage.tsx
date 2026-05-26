import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonCreateSchema, type PersonCreateInput } from '@genograma/shared';
import * as api from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button, ErrorAlert, Field, Input, Select } from '../../../shared/components/ui.js';
import { GenogramView } from '../components/GenogramView.js';
import { Branch } from '../../../shared/brand/Logo.js';
import { toast } from '../../../shared/stores/toast.js';

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
  const [view, setView] = useState<'tree' | 'list'>('tree');
  const [linkMode, setLinkMode] = useState<null | { from: string; type: 'parent' | 'partner' }>(null);

  const delTree = useMutation({
    mutationFn: () => api.deleteTree(id!),
    onSuccess: () => {
      toast.success('Árbol eliminado');
      qc.invalidateQueries({ queryKey: ['trees'] });
      navigate('/dashboard');
    },
  });
  const delPerson = useMutation({
    mutationFn: (pid: string) => api.deletePerson(pid),
    onSuccess: () => {
      toast.success('Persona eliminada');
      qc.invalidateQueries({ queryKey: ['tree', id] });
    },
  });
  const addRel = useMutation({
    mutationFn: api.addRelationship,
    onSuccess: () => {
      toast.success('Relación creada');
      qc.invalidateQueries({ queryKey: ['tree', id] });
      setLinkMode(null);
    },
    onError: (e) => toast.error('No se pudo crear', (e as { message?: string }).message),
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
        <Link
          to="/dashboard"
          className="link-underline mb-6 inline-block animate-slide-in font-mono text-[10px] uppercase tracking-widest text-ink-500"
        >
          ← Archivos
        </Link>

        {/* Header */}
        <header className="mb-10 grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-paper-300 pb-10 stagger">
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
              {tree.persons.length} {tree.persons.length === 1 ? 'persona' : 'personas'} ·{' '}
              {tree.relationships.length} {tree.relationships.length === 1 ? 'relación' : 'relaciones'}
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-4 md:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('¿Eliminar este árbol? Esta acción se puede revertir desde el panel admin en 30 días.')) {
                  delTree.mutate();
                }
              }}
            >
              Eliminar
            </Button>
            <Button onClick={() => setShowAdd(true)}>+ Persona</Button>
          </div>
        </header>

        {/* Toolbar — vista + estado */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
          <div className="inline-flex rounded-full border border-paper-300 bg-paper-50 p-1 text-xs">
            <button
              onClick={() => setView('tree')}
              className={`rounded-full px-4 py-1.5 font-sans transition ${
                view === 'tree' ? 'bg-ink-900 text-paper-50' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Genograma
            </button>
            <button
              onClick={() => setView('list')}
              className={`rounded-full px-4 py-1.5 font-sans transition ${
                view === 'list' ? 'bg-ink-900 text-paper-50' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Lista
            </button>
          </div>

          {linkMode && (
            <div className="animate-slide-in flex flex-wrap items-center gap-3 border border-moss-700/40 bg-moss-50 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-moss-700">Modo enlace</span>
              <span className="font-sans text-xs text-ink-700">
                Selecciona objetivo —{' '}
                <em className="fr-italic text-moss-700">
                  {linkMode.type === 'parent' ? 'padre/madre → hijo/a' : 'pareja'}
                </em>
              </span>
              <button
                onClick={() => setLinkMode(null)}
                className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {showAdd && (
          <AddPersonForm
            treeId={tree.id}
            onClose={() => setShowAdd(false)}
            onAdded={() => qc.invalidateQueries({ queryKey: ['tree', id] })}
          />
        )}

        {/* Empty state */}
        {tree.persons.length === 0 ? (
          <div className="animate-scale-in border border-dashed border-paper-400 px-6 py-16 text-center">
            <Branch className="mx-auto h-6 w-32 text-moss-700" />
            <h3 className="mt-6 font-display text-2xl font-light text-ink-900">
              Este archivo está vacío
            </h3>
            <p className="mt-2 font-display text-base italic text-ink-500">
              Empieza por ti — todo árbol crece desde una raíz.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowAdd(true)}>+ Agregar primera persona</Button>
            </div>
          </div>
        ) : view === 'tree' ? (
          <GenogramView
            persons={tree.persons}
            relationships={tree.relationships}
            linkMode={linkMode}
            onSelectAsTarget={(toId) =>
              addRel.mutate({
                type: linkMode!.type,
                fromPersonId: linkMode!.from,
                toPersonId: toId,
              })
            }
            onStartLink={(id, type) => setLinkMode({ from: id, type })}
            onDelete={(id) => {
              const p = tree.persons.find((x) => x.id === id);
              if (p && confirm(`¿Eliminar a ${p.firstName}?`)) delPerson.mutate(id);
            }}
          />
        ) : (
          <ListView
            persons={tree.persons}
            relationships={tree.relationships}
          />
        )}

        <ErrorAlert message={addRel.error ? (addRel.error as { message: string }).message : undefined} />
      </main>
      <Footer />
    </div>
  );
}

function ListView({
  persons,
  relationships,
}: {
  persons: api.PersonDto[];
  relationships: api.RelationshipDto[];
}) {
  return (
    <ul className="divide-y divide-paper-300 border-y border-paper-300">
      {persons.map((p, i) => {
        const parents = relationships
          .filter((r) => r.type === 'parent' && r.toPersonId === p.id)
          .map((r) => persons.find((x) => x.id === r.fromPersonId)?.firstName)
          .filter(Boolean);
        const children = relationships
          .filter((r) => r.type === 'parent' && r.fromPersonId === p.id)
          .map((r) => persons.find((x) => x.id === r.toPersonId)?.firstName)
          .filter(Boolean);
        const partners = relationships
          .filter((r) => r.type === 'partner' && (r.fromPersonId === p.id || r.toPersonId === p.id))
          .map((r) =>
            persons.find((x) => x.id === (r.fromPersonId === p.id ? r.toPersonId : r.fromPersonId))
              ?.firstName,
          )
          .filter(Boolean);

        return (
          <li
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${0.05 + i * 0.04}s` }}
          >
            <Link
              to={`/persons/${p.id}?treeId=${p.treeId}`}
              className="group grid grid-cols-12 items-baseline gap-x-6 py-6 transition hover:bg-paper-50"
            >
              <span className="col-span-2 font-mono text-xs uppercase tracking-widest text-ink-300 md:col-span-1">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="col-span-10 md:col-span-4">
                <h3 className="font-display text-xl font-light text-ink-900 group-hover:text-moss-700">
                  {p.firstName} {p.lastName ?? ''}
                  {p.isProband && (
                    <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 align-middle font-mono text-[9px] uppercase tracking-widest text-paper-50">
                      Yo
                    </span>
                  )}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  {p.birthDate ?? '?'} — {p.deathDate ?? (p.birthDate ? 'presente' : '')}
                </p>
              </div>
              <div className="col-span-12 mt-3 space-y-0.5 font-sans text-xs text-ink-500 md:col-span-6 md:mt-0">
                {parents.length > 0 && (
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">Padres · </span>
                    {parents.join(' / ')}
                  </p>
                )}
                {partners.length > 0 && (
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">Pareja · </span>
                    {partners.join(' / ')}
                  </p>
                )}
                {children.length > 0 && (
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">Hijos · </span>
                    {children.join(' / ')}
                  </p>
                )}
              </div>
              <span className="col-span-1 hidden font-mono text-base text-ink-300 transition group-hover:translate-x-1 group-hover:text-moss-700 md:block md:text-right">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
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
    onSuccess: (p) => {
      toast.success(`${p.firstName} agregado`);
      onAdded();
      onClose();
    },
    onError: () => toast.error('No se pudo agregar la persona'),
  });

  return (
    <section className="mb-10 animate-scale-in border-y border-paper-300 bg-paper-50 py-10">
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
