import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TreeCreateSchema, type TreeCreateInput } from '@genograma/shared';
import * as api from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button, ErrorAlert, Field, Input, Textarea } from '../../../shared/components/ui.js';
import { useMe, useLogout } from '../../auth/hooks/useAuth.js';
import { Branch } from '../../../shared/brand/Logo.js';

export function DashboardPage() {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: trees, isLoading } = useQuery({
    queryKey: ['trees'],
    queryFn: api.listTrees,
  });
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-20">
        {/* Editorial header */}
        <header className="mb-12 grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-paper-300 pb-10 md:mb-16 md:pb-12">
          <div className="col-span-12 md:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Edición del archivero · {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              Hola,{' '}
              <em className="fr-italic text-moss-700">{me?.fullName.split(' ')[0]}</em>.
            </h1>
            <p className="mt-3 max-w-xl font-display text-lg italic text-ink-500">
              Esta es tu biblioteca de árboles familiares. Crea uno por cada rama que quieras explorar.
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-4 md:justify-end">
            <Button variant="ghost" onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}>
              Cerrar sesión
            </Button>
            <Button onClick={() => setShowNew(true)}>
              + Nuevo árbol
            </Button>
          </div>
        </header>

        {showNew && <NewTreeForm onClose={() => setShowNew(false)} />}

        {isLoading && <p className="font-mono text-xs uppercase tracking-widest text-ink-500">Cargando archivos…</p>}

        {trees && trees.length === 0 && !showNew && (
          <div className="border border-dashed border-paper-400 bg-paper-50/50 py-20 text-center">
            <Branch className="mx-auto h-6 w-32 text-moss-700" />
            <h2 className="mt-6 font-display text-3xl font-light text-ink-900">
              Aún no plantas nada.
            </h2>
            <p className="mt-3 font-sans text-sm text-ink-500">
              Empieza por ti — tu árbol crecerá desde ahí.
            </p>
            <div className="mt-8">
              <Button onClick={() => setShowNew(true)}>Plantar mi primer árbol</Button>
            </div>
          </div>
        )}

        {trees && trees.length > 0 && (
          <ul className="divide-y divide-paper-300 border-t border-paper-300">
            {trees.map((t, i) => (
              <li key={t.id}>
                <Link
                  to={`/trees/${t.id}`}
                  className="group grid grid-cols-12 items-baseline gap-x-6 py-8 transition hover:bg-paper-50 md:py-10"
                >
                  <span className="col-span-2 font-mono text-xs uppercase tracking-widest text-ink-300 md:col-span-1">
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

function NewTreeForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<TreeCreateInput>({
    resolver: zodResolver(TreeCreateSchema),
  });
  const { mutate, isPending, error } = useMutation({
    mutationFn: api.createTree,
    onSuccess: (tree) => {
      qc.invalidateQueries({ queryKey: ['trees'] });
      navigate(`/trees/${tree.id}`);
    },
  });

  return (
    <section className="mb-12 border-y border-paper-300 bg-paper-50 py-10">
      <div className="grid grid-cols-12 gap-x-6 gap-y-6">
        <div className="col-span-12 md:col-span-4">
          <p className="section-number">— Nuevo árbol</p>
          <h2 className="mt-2 font-display text-3xl font-light text-ink-900">
            Dale un{' '}
            <em className="fr-italic">nombre</em>.
          </h2>
        </div>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="col-span-12 space-y-6 md:col-span-7 md:col-start-6">
          <Field number="01" label="Nombre del árbol" error={errors.name?.message}>
            <Input placeholder="Familia Pérez Salinas" autoFocus {...register('name')} />
          </Field>
          <Field number="02" label="Descripción (opcional)" error={errors.description?.message}>
            <Textarea rows={2} placeholder="Familia paterna · ramas de Quito y Loja" {...register('description')} />
          </Field>
          <ErrorAlert message={error ? (error as { message: string }).message : undefined} />
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Plantando…' : 'Crear árbol'}
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
