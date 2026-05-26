import { useState } from 'react';
import { Field, Input } from './ui.js';

/**
 * Campo de fecha con toggle "solo año" — útil para ancestros donde no se conoce
 * el día/mes exacto. Si está en modo "solo año", devuelve `YYYY-01-01` al backend.
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
  // Detectar si lo que viene es solo un año (YYYY-01-01)
  const looksLikeYearOnly = /^\d{4}-01-01$/.test(value);
  const [yearOnly, setYearOnly] = useState(looksLikeYearOnly);

  const currentYear = new Date().getFullYear();

  return (
    <Field number={number} label={label} hint={hint} error={error}>
      <div className="space-y-2">
        {yearOnly ? (
          <Input
            type="number"
            min={1500}
            max={currentYear}
            step={1}
            placeholder="ej. 1925"
            value={value ? value.slice(0, 4) : ''}
            onChange={(e) => {
              const y = e.target.value;
              onChange(y && /^\d{4}$/.test(y) ? `${y}-01-01` : '');
            }}
            autoComplete="off"
          />
        ) : (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            max={`${currentYear + 1}-12-31`}
            autoComplete="off"
          />
        )}
        <label className="flex items-center gap-2 font-sans text-[11px] text-ink-500">
          <input
            type="checkbox"
            checked={yearOnly}
            onChange={(e) => setYearOnly(e.target.checked)}
            className="h-3 w-3 accent-moss-700"
          />
          Solo conozco el año
        </label>
      </div>
    </Field>
  );
}
