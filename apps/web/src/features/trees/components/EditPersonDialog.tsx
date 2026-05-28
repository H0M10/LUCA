import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, ErrorAlert, Field, Input } from '../../../shared/components/ui.js';
import { DateField } from '../../../shared/components/DateField.js';
import { PlaceSearch, type PlaceValue } from './PlaceSearch.js';
import * as api from '../api/trees.js';
import type { PersonDto } from '../api/trees.js';
import { toast } from '../../../shared/stores/toast.js';

/**
 * Editar datos básicos de una persona ya creada (nombre, apellido, género, fechas).
 * Útil cuando te equivocas al escribir o quieres completar información.
 */
export function EditPersonDialog({
  treeId,
  person,
  onClose,
}: {
  treeId: string;
  person: PersonDto;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState(person.firstName);
  const [apellidoPaterno, setApellidoPaterno] = useState(person.apellidoPaterno ?? '');
  const [apellidoMaterno, setApellidoMaterno] = useState(person.apellidoMaterno ?? '');
  const [gender, setGender] = useState<string>(person.gender ?? '');
  const [birthDate, setBirthDate] = useState(person.birthDate?.slice(0, 10) ?? '');
  const [isAlive, setIsAlive] = useState(!person.deathDate);
  const [deathDate, setDeathDate] = useState(person.deathDate?.slice(0, 10) ?? '');
  const [place, setPlace] = useState<PlaceValue | null>(
    person.birthLat != null && person.birthLng != null
      ? { display: person.birthPlace ?? '', country: person.birthCountry, lat: person.birthLat, lng: person.birthLng }
      : null,
  );
  const [placeTouched, setPlaceTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const save = useMutation({
    mutationFn: () =>
      api.updatePerson(person.id, {
        firstName: firstName.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        gender: (gender || 'unknown') as 'male' | 'female' | 'nonbinary' | 'unknown',
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: !isAlive && deathDate ? new Date(deathDate) : null,
        ...(placeTouched
          ? place
            ? {
                birthPlace: place.display.slice(0, 120),
                birthCountry: place.country ?? '',
                birthLat: place.lat,
                birthLng: place.lng,
              }
            : { birthPlace: '', birthCountry: '', birthLat: null, birthLng: null }
          : {}),
      }),
    onSuccess: () => {
      toast.success('Datos actualizados');
      qc.invalidateQueries({ queryKey: ['tree', treeId] });
      onClose();
    },
    onError: (e) => setError((e as { message?: string }).message ?? 'No se pudo guardar'),
  });

  const canSave = firstName.trim().length > 0 && !save.isPending;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg animate-scale-in rounded-2xl border border-paper-300 bg-white shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-paper-300 px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Editar datos</p>
            <h2 className="mt-1 font-display text-2xl font-medium text-ink-900">Corregir información</h2>
          </div>
          <button onClick={onClose} className="font-mono text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900">
            ESC ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            save.mutate();
          }}
          className="space-y-5 px-6 py-6"
        >
          <Field label="Nombre(s)">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Apellido paterno" hint="opcional">
              <Input value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} placeholder="Paterno" />
            </Field>
            <Field label="Apellido materno" hint="opcional">
              <Input value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} placeholder="Materno" />
            </Field>
          </div>

          <Field label="Género">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['male', '□ Masculino'],
                  ['female', '○ Femenino'],
                  ['nonbinary', '◇ No binario'],
                  ['unknown', '— Sin especificar'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGender(gender === val ? '' : val)}
                  className={`rounded-full border px-4 py-1.5 font-sans text-sm transition ${
                    gender === val
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-paper-400 bg-white text-ink-700 hover:border-ink-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <DateField label="Fecha de nacimiento" hint="día y mes opcionales" value={birthDate} onChange={setBirthDate} />

          <Field label="Lugar de origen" hint="aparece en el globo 3D">
            <PlaceSearch
              value={place?.display ?? null}
              onSelect={(p) => {
                setPlace(p);
                setPlaceTouched(true);
              }}
              onClear={() => {
                setPlace(null);
                setPlaceTouched(true);
              }}
            />
          </Field>

          <div className="rounded-xl border border-paper-300 bg-paper-100 px-4 py-3">
            <label className="flex items-center gap-3 font-sans text-sm">
              <input
                type="checkbox"
                checked={!isAlive}
                onChange={(e) => setIsAlive(!e.target.checked)}
                className="h-4 w-4 accent-clay-600"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                Esta persona ya falleció
              </span>
            </label>
            {!isAlive && (
              <div className="mt-3 animate-fade-up">
                <DateField label="Fecha de defunción" hint="opcional" value={deathDate} onChange={setDeathDate} />
              </div>
            )}
          </div>

          <ErrorAlert message={error ?? undefined} />

          <div className="flex items-center gap-3 border-t border-paper-300 pt-5">
            <Button type="submit" disabled={!canSave}>
              {save.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
