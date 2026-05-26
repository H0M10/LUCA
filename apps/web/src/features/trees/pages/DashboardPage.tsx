import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TreeCreateSchema, type TreeCreateInput, type PersonCreateInput } from '@genograma/shared';
import * as api from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button, ErrorAlert, Field, Input, Select, Textarea } from '../../../shared/components/ui.js';
import { useMe, useLogout } from '../../auth/hooks/useAuth.js';
import { Branch } from '../../../shared/brand/Logo.js';
import { TreeListSkeleton } from '../../../shared/components/Skeleton.js';
import { toast } from '../../../shared/stores/toast.js';

export function DashboardPage() {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: trees, isLoading } = useQuery({ queryKey: ['trees'], queryFn: api.listTrees });
  const [showWizard, setShowWizard] = useState(false);

  const personCount = trees?.reduce((acc, t) => acc + t.personCount, 0) ?? 0;
  const ownedCount = trees?.filter((t) => t.isOwner).length ?? 0;
  const sharedCount = (trees?.length ?? 0) - ownedCount;

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-20">
        {/* Editorial header con animación */}
        <header className="mb-12 grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-paper-300 pb-10 md:mb-16 md:pb-12">
          <div className="col-span-12 md:col-span-8 stagger">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Edición del archivero · {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              Hola,{' '}
              <em className="fr-italic text-moss-700">{me?.fullName.split(' ')[0]}</em>.
            </h1>
            <p className="mt-3 max-w-xl font-display text-lg italic text-ink-500">
              {trees && trees.length > 0
                ? 'Esta es tu biblioteca de árboles familiares.'
                : 'Bienvenido a tu archivo. Plantemos tu primer árbol.'}
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-4 md:justify-end">
            <Button
              variant="ghost"
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => {
                    toast.info('Sesión cerrada');
                    navigate('/');
                  },
                })
              }
            >
              Cerrar sesión
            </Button>
            {trees && trees.length > 0 && (
              <Button onClick={() => setShowWizard(true)}>+ Nuevo árbol</Button>
            )}
          </div>
        </header>

        {/* Stats bar — solo si tiene al menos un árbol */}
        {trees && trees.length > 0 && (
          <section className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper-300 bg-paper-300 md:mb-16 md:grid-cols-4">
            <StatBox label="Árboles" value={trees.length} animationDelay="0.05s" />
            <StatBox label="Personas registradas" value={personCount} animationDelay="0.15s" />
            <StatBox label="Propios" value={ownedCount} animationDelay="0.25s" />
            <StatBox label="Compartidos" value={sharedCount} animationDelay="0.35s" />
          </section>
        )}

        {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} firstTime={trees?.length === 0} />}

        {/* Loading skeleton */}
        {isLoading && (
          <>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink-500">Cargando archivos…</p>
            <TreeListSkeleton />
          </>
        )}

        {/* Empty state — primer uso */}
        {trees && trees.length === 0 && !showWizard && (
          <EmptyState onStart={() => setShowWizard(true)} />
        )}

        {/* List de árboles */}
        {trees && trees.length > 0 && (
          <ul className="divide-y divide-paper-300 border-t border-paper-300">
            {trees.map((t, i) => (
              <li key={t.id} className="animate-fade-up" style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
                <Link
                  to={`/trees/${t.id}`}
                  className="group grid grid-cols-12 items-baseline gap-x-6 py-8 transition hover:bg-paper-50 md:py-10"
                >
                  <span className="col-span-2 font-mono text-xs uppercase tracking-widest text-ink-300 transition group-hover:text-moss-700 md:col-span-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="col-span-10 md:col-span-5">
                    <h3 className="font-display text-2xl font-light text-ink-900 transition group-hover:text-moss-700 md:text-3xl">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="mt-2 font-sans text-sm italic text-ink-500">{t.description}</p>
                    )}
                  </div>
                  <div className="col-span-6 mt-3 md:col-span-3 md:mt-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                      {t.personCount} {t.personCount === 1 ? 'persona' : 'personas'}
                    </p>
                    {!t.isOwner && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-clay-600">
                        Compartido
                      </p>
                    )}
                  </div>
                  <div className="col-span-6 mt-3 flex items-baseline justify-end gap-3 md:col-span-3 md:mt-0">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                      {new Date(t.updatedAt).toLocaleDateString('es-MX')}
                    </span>
                    <span className="font-mono text-base text-ink-300 transition group-hover:translate-x-1 group-hover:text-moss-700">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatBox({ label, value, animationDelay }: { label: string; value: number; animationDelay: string }) {
  return (
    <div
      className="animate-fade-up bg-paper-50 p-6 transition hover:bg-paper-100"
      style={{ animationDelay }}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-2 font-display text-4xl font-light text-ink-900 md:text-5xl">{value}</p>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="animate-scale-in border border-dashed border-paper-400 bg-paper-50/60 px-6 py-20 text-center">
      <Branch className="mx-auto h-8 w-48 text-moss-700" />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Página en blanco</p>
      <h2 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
        Tu archivo está{' '}
        <em className="fr-italic text-moss-700">por escribirse</em>.
      </h2>
      <p className="mx-auto mt-6 max-w-md font-display text-lg italic text-ink-500">
        Empieza por ti. Todo árbol se construye desde una raíz — y esa raíz eres tú.
      </p>
      <div className="mt-10">
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-700"
        >
          Plantar mi primer árbol
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
      <p className="mt-8 font-sans text-xs text-ink-500">
        Llevará menos de un minuto.
      </p>
    </div>
  );
}

/**
 * Wizard de 2 pasos: crear árbol + agregar al proband.
 * Si firstTime, hace todo el flujo. Si no, solo crea el árbol.
 */
function OnboardingWizard({ onClose, firstTime }: { onClose: () => void; firstTime?: boolean }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [createdTreeId, setCreatedTreeId] = useState<string | null>(null);

  const treeForm = useForm<TreeCreateInput>({
    resolver: zodResolver(TreeCreateSchema),
  });
  const personForm = useForm<PersonCreateInput & { gender: 'male' | 'female' | 'nonbinary' | 'unknown' }>();

  const createTree = useMutation({
    mutationFn: api.createTree,
    onSuccess: (tree) => {
      qc.invalidateQueries({ queryKey: ['trees'] });
      setCreatedTreeId(tree.id);
      if (firstTime) {
        setStep(2);
      } else {
        toast.success('Árbol creado', tree.name);
        navigate(`/trees/${tree.id}`);
      }
    },
    onError: () => toast.error('No se pudo crear el árbol'),
  });

  const addPerson = useMutation({
    mutationFn: (input: PersonCreateInput) => api.addPerson(createdTreeId!, { ...input, isProband: true }),
    onSuccess: () => {
      toast.success('¡Listo! Tu árbol está plantado.', 'Ahora puedes seguir añadiendo familiares.');
      navigate(`/trees/${createdTreeId}`);
    },
    onError: () => toast.error('No se pudo registrar a la persona'),
  });

  return (
    <div className="mb-12 animate-scale-in overflow-hidden border border-ink-900/10 bg-paper-50 shadow-paper-lg">
      {/* Stepper */}
      <div className="flex items-center justify-between border-b border-paper-300 bg-paper-100 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
            Paso {step} de {firstTime ? 2 : 1}
          </span>
          <div className="flex gap-1">
            <span className={`h-1 w-8 transition ${step >= 1 ? 'bg-moss-700' : 'bg-paper-300'}`} />
            {firstTime && <span className={`h-1 w-8 transition ${step >= 2 ? 'bg-moss-700' : 'bg-paper-300'}`} />}
          </div>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          Cancelar ×
        </button>
      </div>

      <div className="px-6 py-8 md:px-10 md:py-12">
        {step === 1 ? (
          <div className="grid grid-cols-12 gap-x-6 gap-y-6">
            <div className="col-span-12 md:col-span-4">
              <p className="section-number">— 01 / Nombra tu árbol</p>
              <h2 className="mt-3 font-display text-3xl font-light leading-tight text-ink-900">
                Toda familia{' '}
                <em className="fr-italic text-moss-700">merece un nombre</em>.
              </h2>
              <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-ink-500">
                Puedes tener varios árboles — uno por rama familiar, uno por adopción, uno para hijos. Hoy creamos el primero.
              </p>
            </div>
            <form
              onSubmit={treeForm.handleSubmit((d) => createTree.mutate(d))}
              className="col-span-12 space-y-6 md:col-span-7 md:col-start-6"
            >
              <Field number="01" label="Nombre del árbol" error={treeForm.formState.errors.name?.message}>
                <Input
                  placeholder="Familia Pérez Salinas"
                  autoFocus
                  {...treeForm.register('name')}
                />
              </Field>
              <Field number="02" label="Descripción (opcional)" error={treeForm.formState.errors.description?.message}>
                <Textarea
                  rows={2}
                  placeholder="Rama paterna · ramas de Quito y Loja"
                  {...treeForm.register('description')}
                />
              </Field>
              <ErrorAlert
                message={createTree.error ? (createTree.error as { message: string }).message : undefined}
              />
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={createTree.isPending}>
                  {createTree.isPending ? 'Creando…' : firstTime ? 'Continuar' : 'Crear árbol'}
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-x-6 gap-y-6">
            <div className="col-span-12 md:col-span-4">
              <p className="section-number">— 02 / Marca la raíz</p>
              <h2 className="mt-3 font-display text-3xl font-light leading-tight text-ink-900">
                Empieza{' '}
                <em className="fr-italic text-moss-700">por ti</em>.
              </h2>
              <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-ink-500">
                Tú eres el <strong>proband</strong> — el punto desde el que se construye todo. Después
                agregarás padres, hermanos, hijos.
              </p>
            </div>
            <form
              onSubmit={personForm.handleSubmit((d) => addPerson.mutate(d))}
              className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-7 md:col-start-6"
            >
              <Field number="01" label="Tu nombre" error={personForm.formState.errors.firstName?.message}>
                <Input autoFocus {...personForm.register('firstName', { required: true })} />
              </Field>
              <Field number="02" label="Apellido" error={personForm.formState.errors.lastName?.message}>
                <Input {...personForm.register('lastName')} />
              </Field>
              <Field number="03" label="Género">
                <Select {...personForm.register('gender')}>
                  <option value="">— Seleccionar —</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="nonbinary">No binario</option>
                  <option value="unknown">Prefiero no decir</option>
                </Select>
              </Field>
              <Field number="04" label="Fecha de nacimiento" error={personForm.formState.errors.birthDate?.message}>
                <Input type="date" {...personForm.register('birthDate')} />
              </Field>
              <div className="col-span-2 flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={addPerson.isPending}>
                  {addPerson.isPending ? 'Plantando…' : 'Plantar mi árbol'}
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    toast.info('Árbol creado vacío', 'Podrás agregar personas más tarde.');
                    navigate(`/trees/${createdTreeId}`);
                  }}
                >
                  Saltar este paso
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
