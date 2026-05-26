import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button } from '../../../shared/components/ui.js';
import { useMe } from '../../auth/hooks/useAuth.js';
import { Branch } from '../../../shared/brand/Logo.js';
import { TreeListSkeleton } from '../../../shared/components/Skeleton.js';

/**
 * Dashboard simplificado: un usuario = un árbol personal (creado al registrarse).
 * Si tiene exactamente 1 árbol, lo abrimos directamente.
 * Si tiene varios (caso avanzado), mostramos la lista.
 * Si por algún motivo no tiene ninguno, mostramos un CTA para crear el suyo.
 */
export function DashboardPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const { data: trees, isLoading } = useQuery({
    queryKey: ['trees'],
    queryFn: api.listTrees,
  });

  // Auto-redirect: si el usuario tiene exactamente 1 árbol, vamos directo a él
  useEffect(() => {
    if (trees && trees.length === 1 && trees[0]) {
      navigate(`/trees/${trees[0].id}`, { replace: true });
    }
  }, [trees, navigate]);

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <main className="editorial py-12 md:py-20">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Cargando tu archivo…
          </p>
          <TreeListSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-20">
        <header className="mb-12 grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-paper-300 pb-10 md:mb-16 md:pb-12 stagger">
          <div className="col-span-12 md:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Edición del archivero · {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              Hola,{' '}
              <em className="fr-italic text-moss-700">{me?.fullName.split(' ')[0]}</em>.
            </h1>
            <p className="mt-3 max-w-xl font-display text-lg italic text-ink-500">
              {trees && trees.length > 1
                ? 'Tus árboles familiares.'
                : 'Te llevamos a tu árbol…'}
            </p>
          </div>
        </header>

        {/* Caso raro: usuario sin árbol (datos viejos) */}
        {trees && trees.length === 0 && <NoTreeFallback />}

        {/* Caso avanzado: múltiples árboles */}
        {trees && trees.length > 1 && (
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

function NoTreeFallback() {
  const navigate = useNavigate();
  // Si por algún motivo el usuario quedó sin árbol, le creamos uno
  return (
    <div className="animate-scale-in border border-dashed border-paper-400 bg-paper-50/60 px-6 py-20 text-center">
      <Branch className="mx-auto h-8 w-48 text-moss-700" />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Sin árbol</p>
      <h2 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
        Aún no tienes tu{' '}
        <em className="fr-italic text-moss-700">árbol</em>.
      </h2>
      <p className="mx-auto mt-6 max-w-md font-display text-lg italic text-ink-500">
        Cada cuenta tiene un árbol personal. Vamos a crear el tuyo.
      </p>
      <div className="mt-10">
        <Button onClick={() => navigate('/dashboard/new')}>Crear mi árbol →</Button>
      </div>
    </div>
  );
}
