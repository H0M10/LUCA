import { useEffect, useRef, useState } from 'react';

export interface PlaceValue {
  display: string;
  country: string | null;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country?: string };
}

/**
 * Buscador de lugar tipo "de dónde es" usando Nominatim (OpenStreetMap).
 * Gratis y sin API key. Devuelve coordenadas para ubicar a la persona en el globo 3D.
 */
export function PlaceSearch({
  value,
  onSelect,
  onClear,
}: {
  value: string | null;
  onSelect: (place: PlaceValue) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<number | undefined>(undefined);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const search = (q: string) => {
    window.clearTimeout(debounce.current);
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    debounce.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=es&q=${encodeURIComponent(q)}`,
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => results.length && setOpen(true)}
          autoComplete="off"
          placeholder="Ej. Querétaro, México"
          className="w-full rounded-full border border-paper-300 bg-white px-5 py-2.5 font-sans text-base text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700 focus:ring-2 focus:ring-moss-700/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              onClear();
            }}
            className="shrink-0 rounded-full border border-paper-300 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-500 transition hover:border-clay-500 hover:text-clay-600"
          >
            Quitar
          </button>
        )}
      </div>

      {loading && <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-300">Buscando…</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-paper-300 bg-white shadow-paper-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onSelect({
                    display: r.display_name,
                    country: r.address?.country ?? null,
                    lat: parseFloat(r.lat),
                    lng: parseFloat(r.lon),
                  });
                  setQuery(r.display_name);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2.5 text-left font-sans text-sm text-ink-700 transition hover:bg-moss-50 hover:text-moss-800"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
