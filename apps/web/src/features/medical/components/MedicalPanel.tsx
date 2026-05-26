import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/medical.js';
import { Button, ErrorAlert, Field, Input, Select } from '../../../shared/components/ui.js';

export function MedicalPanel({ personId }: { personId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['medical', personId],
    queryFn: () => api.getPersonMedical(personId),
  });

  if (isLoading) {
    return <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">Cargando expediente clínico…</p>;
  }
  if (!data) return null;

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-12">
      <Section
        number="01"
        title="Condiciones"
        accent="moss"
        body={<Conditions personId={personId} items={data.conditions} />}
      />
      <Section
        number="02"
        title="Alergias"
        accent="clay"
        body={<Allergies personId={personId} items={data.allergies} />}
      />
      <Section
        number="03"
        title="Hábitos"
        accent="sand"
        body={<Habits personId={personId} items={data.habits} />}
      />
    </div>
  );
}

function Section({
  number,
  title,
  accent,
  body,
}: {
  number: string;
  title: string;
  accent: 'moss' | 'clay' | 'sand';
  body: React.ReactNode;
}) {
  const colorMap = {
    moss: 'text-moss-700',
    clay: 'text-clay-600',
    sand: 'text-sand-600',
  };
  return (
    <div className="col-span-12 border-t border-paper-300 pt-8">
      <div className="mb-6 flex items-baseline gap-6">
        <span className={`font-mono text-xs uppercase tracking-widest ${colorMap[accent]}`}>— {number}</span>
        <h3 className="font-display text-3xl font-light text-ink-900">
          {title}
        </h3>
      </div>
      {body}
    </div>
  );
}

function Conditions({ personId, items }: { personId: string; items: api.ConditionDto[] }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const { data: catalog } = useQuery({
    queryKey: ['catalog', q],
    queryFn: () => api.searchConditions(q),
    enabled: showForm && q.length > 1,
  });
  const [picked, setPicked] = useState<api.CatalogCondition | null>(null);
  const [customName, setCustomName] = useState('');
  const [age, setAge] = useState('');
  const [status, setStatus] = useState('active');
  const [severity, setSeverity] = useState('moderate');

  const add = useMutation({
    mutationFn: () =>
      api.addCondition(personId, {
        conditionId: picked?.id,
        customName: !picked && customName ? customName : undefined,
        ageAtDiagnosis: age ? Number(age) : undefined,
        status,
        severity,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical', personId] });
      setShowForm(false);
      setPicked(null);
      setCustomName('');
      setAge('');
      setQ('');
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteCondition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', personId] }),
  });

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="font-display text-base italic text-ink-500">Sin condiciones registradas.</p>
      ) : (
        <ul className="divide-y divide-paper-300 border-y border-paper-300">
          {items.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-4 py-4">
              <div>
                <p className="font-display text-lg leading-tight text-ink-900">
                  {c.conditionName ?? c.customName}
                  {c.conditionCode && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                      {c.conditionCode}
                    </span>
                  )}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  {c.ageAtDiagnosis ? `Dx ${c.ageAtDiagnosis} años · ` : ''}
                  {c.status} · {c.severity ?? '—'}
                </p>
              </div>
              <button
                onClick={() => del.mutate(c.id)}
                className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
              >
                eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="link-underline font-sans text-sm font-medium text-ink-900"
        >
          + Añadir condición
        </button>
      ) : (
        <div className="space-y-4 border border-paper-300 bg-paper-50 p-5">
          <Field number="·" label="Buscar enfermedad (CIE-10)">
            <Input
              placeholder="Diabetes, hipertensión, cáncer…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPicked(null);
              }}
            />
          </Field>

          {q.length > 1 && catalog && catalog.length > 0 && !picked && (
            <ul className="max-h-40 divide-y divide-paper-300 overflow-y-auto border border-paper-300 bg-paper-50">
              {catalog.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setPicked(c)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-moss-50"
                  >
                    <span className="font-display text-base">{c.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{c.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {picked && (
            <div className="flex items-center justify-between border-l-2 border-moss-700 bg-moss-50 px-4 py-3">
              <span className="font-display text-base text-ink-900">
                ✓ {picked.name} <span className="font-mono text-xs text-ink-500">{picked.code}</span>
              </span>
              <button
                onClick={() => setPicked(null)}
                className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
              >
                cambiar
              </button>
            </div>
          )}

          {!picked && q.length > 1 && catalog && catalog.length === 0 && (
            <Field label="Nombre personalizado">
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Edad dx">
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
            <Field label="Estado">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Activa</option>
                <option value="remission">En remisión</option>
                <option value="controlled">Controlada</option>
                <option value="cause_of_death">Causa de muerte</option>
              </Select>
            </Field>
            <Field label="Severidad">
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="mild">Leve</option>
                <option value="moderate">Moderada</option>
                <option value="severe">Severa</option>
              </Select>
            </Field>
          </div>

          <ErrorAlert message={add.error ? (add.error as { message: string }).message : undefined} />

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => add.mutate()} disabled={add.isPending || (!picked && !customName)}>
              {add.isPending ? 'Guardando…' : 'Agregar'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Allergies({ personId, items }: { personId: string; items: api.AllergyDto[] }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState('drug');
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState('mild');

  const add = useMutation({
    mutationFn: () => api.addAllergy(personId, { kind, name, severity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical', personId] });
      setShowForm(false);
      setName('');
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteAllergy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', personId] }),
  });

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="font-display text-base italic text-ink-500">Sin alergias registradas.</p>
      ) : (
        <ul className="divide-y divide-paper-300 border-y border-paper-300">
          {items.map((a) => (
            <li key={a.id} className="flex items-baseline justify-between py-4">
              <div>
                <p className="font-display text-lg text-ink-900">{a.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  {a.kind} · {a.severity ?? '—'}
                </p>
              </div>
              <button
                onClick={() => del.mutate(a.id)}
                className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
              >
                eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="link-underline font-sans text-sm font-medium text-ink-900"
        >
          + Añadir alergia
        </button>
      ) : (
        <div className="space-y-4 border border-paper-300 bg-paper-50 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo">
              <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="drug">Medicamento</option>
                <option value="food">Alimento</option>
                <option value="environmental">Ambiental</option>
                <option value="other">Otra</option>
              </Select>
            </Field>
            <Field label="Nombre">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Penicilina, maní…" />
            </Field>
            <Field label="Severidad">
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="mild">Leve</option>
                <option value="moderate">Moderada</option>
                <option value="severe">Severa</option>
                <option value="anaphylactic">Anafiláctica</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={() => add.mutate()} disabled={!name || add.isPending}>
              Agregar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Habits({ personId, items }: { personId: string; items: api.HabitDto[] }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState('smoking');
  const [intensity, setIntensity] = useState('moderate');

  const add = useMutation({
    mutationFn: () => api.addHabit(personId, { kind, intensity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical', personId] });
      setShowForm(false);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteHabit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', personId] }),
  });

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="font-display text-base italic text-ink-500">Sin hábitos registrados.</p>
      ) : (
        <ul className="divide-y divide-paper-300 border-y border-paper-300">
          {items.map((h) => (
            <li key={h.id} className="flex items-baseline justify-between py-4">
              <div>
                <p className="font-display text-lg text-ink-900 capitalize">{h.kind}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  {h.intensity ?? '—'}
                </p>
              </div>
              <button
                onClick={() => del.mutate(h.id)}
                className="font-mono text-[10px] uppercase tracking-widest text-clay-600 hover:text-clay-700"
              >
                eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="link-underline font-sans text-sm font-medium text-ink-900"
        >
          + Añadir hábito
        </button>
      ) : (
        <div className="space-y-4 border border-paper-300 bg-paper-50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hábito">
              <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="smoking">Tabaquismo</option>
                <option value="alcohol">Alcohol</option>
                <option value="drugs">Drogas</option>
                <option value="sedentary">Sedentarismo</option>
                <option value="diet">Dieta</option>
                <option value="exercise">Ejercicio</option>
                <option value="other">Otro</option>
              </Select>
            </Field>
            <Field label="Intensidad">
              <Select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                <option value="low">Baja</option>
                <option value="moderate">Moderada</option>
                <option value="high">Alta</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={() => add.mutate()} disabled={add.isPending}>
              Agregar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
