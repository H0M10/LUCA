import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/trees.js';
import type { PersonDto } from '../api/trees.js';
import { toast } from '../../../shared/stores/toast.js';

interface Props {
  person: PersonDto;
  treeId: string;
}

/**
 * Notas y tags editables inline. Auto-save con debounce.
 */
export function NotesAndTags({ person, treeId }: Props) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(person.notes ?? '');
  const [tags, setTags] = useState<string[]>(person.tags ?? []);
  const [newTag, setNewTag] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const update = useMutation({
    mutationFn: (input: Parameters<typeof api.updatePerson>[1]) =>
      api.updatePerson(person.id, input),
    onSuccess: () => {
      setSavedAt(new Date());
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
    },
    onError: () => toast.error('No se pudo guardar'),
  });

  // Debounce de notas — guarda 1.2s después del último teclazo
  useEffect(() => {
    if (notes === (person.notes ?? '')) return;
    const t = setTimeout(() => update.mutate({ notes }), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const addTag = () => {
    const t = newTag.trim().toLowerCase().slice(0, 30);
    if (!t) return;
    if (tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setNewTag('');
    update.mutate({ tags: next });
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    update.mutate({ tags: next });
  };

  return (
    <div className="space-y-5">
      {/* Notas */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-700">Notas</p>
          <SaveStatus pending={update.isPending} savedAt={savedAt} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anécdotas, lugares, recuerdos…"
          maxLength={5000}
          className="w-full resize-y rounded-sm border border-paper-300 bg-paper-50 px-3 py-2.5 font-sans text-sm text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700"
        />
        <p className="mt-1 text-right font-mono text-[9px] text-ink-300">{notes.length} / 5000</p>
      </section>

      {/* Tags */}
      <section>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-700">Etiquetas</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-sand-500/40 bg-sand-100 px-2.5 py-0.5 font-sans text-xs text-ink-900"
            >
              #{t}
              <button
                onClick={() => removeTag(t)}
                className="font-mono text-[10px] text-ink-500 hover:text-clay-600"
                aria-label={`Quitar tag ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="+ etiqueta"
            maxLength={30}
            className="w-24 border-b border-ink-300 bg-transparent px-1 py-0.5 font-sans text-xs outline-none focus:border-moss-700"
          />
        </div>
        <p className="mt-1 font-sans text-[10px] text-ink-500">
          Ej. <em>lado-paterno</em>, <em>rama-ecuador</em>, <em>preferida-de-abuela</em>
        </p>
      </section>
    </div>
  );
}

function SaveStatus({ pending, savedAt }: { pending: boolean; savedAt: Date | null }) {
  if (pending) {
    return <span className="font-mono text-[9px] uppercase tracking-widest text-ink-300">guardando…</span>;
  }
  if (savedAt) {
    const diff = Math.round((Date.now() - savedAt.getTime()) / 1000);
    return (
      <span className="font-mono text-[9px] uppercase tracking-widest text-moss-700">
        ✓ guardado {diff < 5 ? 'ahora' : `hace ${diff}s`}
      </span>
    );
  }
  return null;
}
