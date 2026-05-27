import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import type { PersonDto } from '../api/trees.js';

interface Props {
  treeId: string;
  onSelect: (person: PersonDto) => void;
  onClose: () => void;
}

/**
 * Search palette (estilo Cmd+K / Spotlight) para encontrar personas del árbol.
 * Se abre con la tecla "/" y cierra con Escape.
 */
export function SearchPalette({ treeId, onSelect, onClose }: Props) {
  const [q, setQ] = useState('');
  const { data: tree } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => api.getTree(treeId),
  });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const results = !tree
    ? []
    : tree.persons.filter((p) => {
        if (!q.trim()) return true;
        const t = `${p.firstName} ${p.lastName ?? ''} ${p.alias ?? ''}`.toLowerCase();
        return t.includes(q.toLowerCase());
      });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/40 backdrop-blur-sm pt-[10vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl animate-scale-in border border-ink-900/10 bg-paper-50 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-paper-300 px-5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Buscar</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Nombre de la persona…"
            className="flex-1 bg-transparent text-base text-ink-900 outline-none placeholder-ink-300"
          />
          <kbd className="rounded border border-paper-400 bg-paper-100 px-2 py-0.5 font-mono text-[10px] uppercase text-ink-500">ESC</kbd>
        </div>

        <ul className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && (
            <li className="px-5 py-6 font-display text-sm italic text-ink-500">
              {q ? 'No hay personas con ese nombre.' : 'Empieza a escribir un nombre.'}
            </li>
          )}
          {results.map((p) => {
            const sym = p.gender === 'female' ? '○' : p.gender === 'male' ? '□' : '◇';
            return (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p)}
                  className="flex w-full items-center gap-3 border-t border-paper-300/60 px-5 py-3 text-left transition hover:bg-moss-50"
                >
                  <span className="font-mono text-sm text-ink-500">{sym}</span>
                  <span className="flex-1">
                    <span className="font-display text-base text-ink-900">
                      {p.firstName} {p.lastName ?? ''}
                    </span>
                    {p.isProband && <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-moss-700">yo</span>}
                    {p.birthDate && (
                      <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                        {p.birthDate}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-ink-300">↵</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-paper-300 bg-paper-100 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          <span>{results.length} resultados</span>
          <span><kbd className="rounded bg-paper-50 px-1.5 py-0.5">/</kbd> abrir · <kbd className="rounded bg-paper-50 px-1.5 py-0.5">ESC</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
