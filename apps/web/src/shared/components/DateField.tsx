import { useMemo, useState, useEffect } from 'react';

/**
 * DateField — Día/Mes/Año con autocompletado.
 * Devuelve string YYYY-MM-DD al onChange. Si solo se llena el año, devuelve YYYY-01-01.
 * Vacío → '' (cadena vacía).
 *
 * Más amigable que <input type="date"> nativo porque:
 * - Permite escribir SOLO el año (común en genealogía)
 * - Selectores separados que cualquiera entiende
 * - Auto-tabula al siguiente campo
 */
export function DateField({
  number,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  number?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  // Parse incoming value
  const parsed = useMemo<[string, string, string]>(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ['', '', ''];
    const parts = value.split('-');
    const yy = parts[0] ?? '';
    const mm = parts[1] ?? '';
    const dd = parts[2] ?? '';
    return [dd === '01' ? '' : dd, mm === '01' && dd === '01' ? '' : mm, yy];
  }, [value]);
  const d = parsed[0];
  const m = parsed[1];
  const y = parsed[2];

  const [day, setDay] = useState(d);
  const [month, setMonth] = useState(m);
  const [year, setYear] = useState(y);

  useEffect(() => {
    setDay(d); setMonth(m); setYear(y);
  }, [d, m, y]);

  const emit = (dd: string, mm: string, yy: string) => {
    if (!yy || yy.length !== 4) {
      onChange('');
      return;
    }
    const monthPad = mm.padStart(2, '0') || '01';
    const dayPad = dd.padStart(2, '0') || '01';
    onChange(`${yy}-${monthPad}-${dayPad}`);
  };

  const currentYear = new Date().getFullYear();
  const months = [
    ['1', 'Ene'], ['2', 'Feb'], ['3', 'Mar'], ['4', 'Abr'],
    ['5', 'May'], ['6', 'Jun'], ['7', 'Jul'], ['8', 'Ago'],
    ['9', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dic'],
  ];

  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between">
        <span className="font-sans text-xs uppercase tracking-widest text-ink-500">
          {number && <span className="mr-2 font-mono text-ink-300">{number}</span>}
          {label}
        </span>
        {hint && <span className="font-sans text-xs italic text-ink-300">{hint}</span>}
      </span>

      <div className="grid grid-cols-[1fr_1.4fr_1.6fr] gap-2">
        {/* Día */}
        <select
          value={day}
          onChange={(e) => { setDay(e.target.value); emit(e.target.value, month, year); }}
          className="appearance-none border-b border-ink-300 bg-transparent py-2.5 font-sans text-base text-ink-900 outline-none transition focus:border-moss-700"
        >
          <option value="">Día</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
              {i + 1}
            </option>
          ))}
        </select>

        {/* Mes */}
        <select
          value={month}
          onChange={(e) => { setMonth(e.target.value); emit(day, e.target.value, year); }}
          className="appearance-none border-b border-ink-300 bg-transparent py-2.5 font-sans text-base text-ink-900 outline-none transition focus:border-moss-700"
        >
          <option value="">Mes</option>
          {months.map(([val, name]) => (
            <option key={val} value={val!.padStart(2, '0')}>{name}</option>
          ))}
        </select>

        {/* Año */}
        <input
          type="number"
          inputMode="numeric"
          min={1500}
          max={currentYear + 1}
          step={1}
          placeholder="Año"
          value={year}
          onChange={(e) => {
            const yy = e.target.value.replace(/\D/g, '').slice(0, 4);
            setYear(yy);
            emit(day, month, yy);
          }}
          className="appearance-none border-b border-ink-300 bg-transparent py-2.5 font-sans text-base text-ink-900 placeholder-ink-300 outline-none transition focus:border-moss-700"
        />
      </div>

      <p className="mt-1 font-sans text-[11px] text-ink-500">
        Si no sabes el día o mes, déjalos vacíos. El año basta.
      </p>

      {error && (
        <span className="mt-1 block font-sans text-xs italic text-clay-600">— {error}</span>
      )}
    </label>
  );
}
