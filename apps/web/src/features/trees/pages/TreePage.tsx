import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import type { PersonDto } from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Button } from '../../../shared/components/ui.js';
import { GenogramView } from '../components/GenogramView.js';
import { Branch } from '../../../shared/brand/Logo.js';
import { toast } from '../../../shared/stores/toast.js';
import { QuickAddDialog, type Relation } from '../components/QuickAddDialog.js';
import { PersonPanel } from '../components/PersonPanel.js';
import { ShareTreeDialog } from '../components/ShareTreeDialog.js';

export function TreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: tree, isLoading } = useQuery({
    queryKey: ['tree', id],
    queryFn: () => api.getTree(id!),
    enabled: !!id,
  });

  const [view, setView] = useState<'tree' | 'list'>('tree');
  const [openPerson, setOpenPerson] = useState<PersonDto | null>(null);
  const [quickAdd, setQuickAdd] = useState<Relation | null>(null);
  const [showShare, setShowShare] = useState(false);

  const delTree = useMutation({
    mutationFn: () => api.deleteTree(id!),
    onSuccess: () => {
      toast.success('Árbol eliminado');
      qc.invalidateQueries({ queryKey: ['trees'] });
      navigate('/dashboard');
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

  const proband = tree.persons.find((p) => p.isProband);

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-16">
        {/* Header */}
        <header className="mb-10 grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-paper-300 pb-10 stagger">
          <div className="col-span-12 md:col-span-8">
            <p className="section-number">— Tu árbol</p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
              {tree.name}
            </h1>
            {tree.description && (
              <p className="mt-3 max-w-2xl font-display text-lg italic text-ink-500">
                {tree.description}
              </p>
            )}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              {tree.persons.length} {tree.persons.length === 1 ? 'persona' : 'personas'} ·{' '}
              {tree.relationships.length} {tree.relationships.length === 1 ? 'relación' : 'relaciones'}
            </p>
          </div>
          <div className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-4 md:justify-end">
            <Button variant="ghost" onClick={() => setShowShare(true)}>
              Compartir
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('¿Eliminar este árbol? Tendrás que recrearlo si lo quieres de vuelta.')) {
                  delTree.mutate();
                }
              }}
            >
              Eliminar
            </Button>
          </div>
        </header>

        {/* Empty state — "Empieza por ti" */}
        {tree.persons.length === 0 ? (
          <StartHereCard onStart={() => setQuickAdd({ kind: 'self' })} />
        ) : (
          <>
            {/* Quick prompt: si NO hay proband, sugerir crearlo */}
            {!proband && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 border-clay-500 bg-clay-100/40 px-5 py-4 animate-fade-up">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-clay-700">— Falta</p>
                  <p className="mt-1 font-display text-base text-ink-900">
                    Aún no te has marcado a ti mismo en el árbol.
                  </p>
                </div>
                <Button onClick={() => setQuickAdd({ kind: 'self' })}>
                  + Agregarme a mí mismo
                </Button>
              </div>
            )}

            {/* Quick-action bar para proband */}
            {proband && (
              <div className="mb-6 flex flex-wrap items-center gap-3 border border-paper-300 bg-paper-50 px-4 py-3 animate-fade-up">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Agregar familia de {proband.firstName}:
                </span>
                <QuickChip onClick={() => setQuickAdd({ kind: 'father', child: proband })}>+ padre</QuickChip>
                <QuickChip onClick={() => setQuickAdd({ kind: 'mother', child: proband })}>+ madre</QuickChip>
                <QuickChip onClick={() => setQuickAdd({ kind: 'partner', of: proband })}>+ pareja</QuickChip>
                <QuickChip onClick={() => setQuickAdd({ kind: 'child', parent: proband })}>+ hijo/a</QuickChip>
                <QuickChip onClick={() => setQuickAdd({ kind: 'sibling', of: proband })}>+ hermano/a</QuickChip>
              </div>
            )}

            {/* Toggle vista */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
              <p className="font-sans text-xs italic text-ink-500">
                Click sobre una persona para agregar a su familia.
              </p>
            </div>

            {view === 'tree' ? (
              <GenogramView
                persons={tree.persons}
                relationships={tree.relationships}
                linkMode={null}
                onSelectAsTarget={() => undefined}
                onStartLink={(personId) => {
                  const p = tree.persons.find((x) => x.id === personId);
                  if (p) setOpenPerson(p);
                }}
                onDelete={(personId) => {
                  const p = tree.persons.find((x) => x.id === personId);
                  if (p) setOpenPerson(p);
                }}
              />
            ) : (
              <ListView
                persons={tree.persons}
                relationships={tree.relationships}
                onSelect={setOpenPerson}
              />
            )}
          </>
        )}
      </main>
      <Footer />

      {openPerson && (
        <PersonPanel
          treeId={tree.id}
          person={openPerson}
          persons={tree.persons}
          relationships={tree.relationships}
          onClose={() => setOpenPerson(null)}
        />
      )}

      {quickAdd && (
        <QuickAddDialog
          treeId={tree.id}
          relation={quickAdd}
          onClose={() => setQuickAdd(null)}
        />
      )}

      {showShare && <ShareTreeDialog treeId={tree.id} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function StartHereCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative animate-scale-in overflow-hidden border border-ink-900/10 bg-paper-50 px-8 py-16 text-center shadow-paper-lg md:px-16 md:py-24">
      <Branch className="mx-auto h-8 w-48 text-moss-700" />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Empieza por la raíz</p>
      <h2 className="mt-4 font-display text-display-md font-light leading-[0.95] text-ink-900">
        Empieza{' '}
        <em className="fr-italic text-moss-700">por ti</em>.
      </h2>
      <p className="mx-auto mt-6 max-w-md font-display text-lg italic text-ink-500">
        Todo árbol se construye desde una raíz. Tu nombre, tu fecha — eso basta para que el resto crezca alrededor.
      </p>
      <div className="mt-10">
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-700"
        >
          Agregarme al árbol
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
      <p className="mt-6 font-sans text-xs text-ink-500">
        Solo necesitas tu nombre. Después podrás agregar a tu familia con un click.
      </p>
    </div>
  );
}

function QuickChip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-dashed border-moss-700/50 bg-moss-50 px-3 py-1 font-sans text-xs font-medium text-moss-700 transition hover:border-moss-700 hover:bg-moss-700 hover:text-paper-50"
    >
      {children}
    </button>
  );
}

function ListView({
  persons,
  relationships,
  onSelect,
}: {
  persons: PersonDto[];
  relationships: api.RelationshipDto[];
  onSelect: (p: PersonDto) => void;
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

        return (
          <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
            <button
              onClick={() => onSelect(p)}
              className="group grid w-full grid-cols-12 items-baseline gap-x-6 py-6 text-left transition hover:bg-paper-50"
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
            </button>
          </li>
        );
      })}
    </ul>
  );
}
