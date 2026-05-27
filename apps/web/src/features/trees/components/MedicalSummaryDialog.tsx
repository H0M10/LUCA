import { useQuery } from '@tanstack/react-query';
import { http } from '../../../shared/lib/http.js';

interface SummaryData {
  summary: { total: number; alive: number; dead: number };
  conditions: Array<{
    name: string;
    code: string | null;
    hereditary: boolean;
    count: number;
    persons: string[];
    severity: 'baja' | 'media' | 'alta';
  }>;
  deathCauses: string[];
  habits: Array<{ kind: string; count: number }>;
  allergies: Array<{ name: string; count: number }>;
}

export function MedicalSummaryDialog({ treeId, onClose }: { treeId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['summary', treeId],
    queryFn: () => http<{ data: SummaryData }>(`/api/trees/${treeId}/summary`).then((r) => r.data),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/40 backdrop-blur-sm pt-[5vh] animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in border border-ink-900/10 bg-paper-50 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-paper-300 bg-paper-100 px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Resumen clínico familiar</p>
          <h2 className="mt-1 font-display text-2xl font-light text-ink-900">
            Patrones que <em className="fr-italic text-moss-700">se repiten</em> en tu familia
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 font-mono text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {isLoading || !data ? (
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Calculando…
            </p>
          ) : (
            <>
              {/* Overview */}
              <section className="grid grid-cols-3 gap-px overflow-hidden border border-paper-300 bg-paper-300">
                <Stat label="Total" value={data.summary.total} />
                <Stat label="Vivos" value={data.summary.alive} tone="ok" />
                <Stat label="Fallecidos" value={data.summary.dead} tone="muted" />
              </section>

              {/* Condiciones */}
              <section>
                <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-700">
                  Condiciones médicas
                </h3>
                {data.conditions.length === 0 ? (
                  <p className="font-display text-sm italic text-ink-500">
                    Aún no hay condiciones registradas. Agrégalas desde el panel de cada persona.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.conditions.map((c) => (
                      <li
                        key={c.code ?? c.name}
                        className={`border-l-4 px-4 py-3 ${
                          c.severity === 'alta'
                            ? 'border-clay-600 bg-clay-100/40'
                            : c.severity === 'media'
                              ? 'border-sand-600 bg-sand-100/40'
                              : 'border-moss-700 bg-moss-50'
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <strong className="font-display text-base text-ink-900">
                            {c.name}
                            {c.code && (
                              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                                {c.code}
                              </span>
                            )}
                            {c.hereditary && (
                              <span className="ml-2 rounded-full bg-clay-600 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-paper-50">
                                hereditaria
                              </span>
                            )}
                          </strong>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                            {c.count} {c.count === 1 ? 'caso' : 'casos'}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-xs text-ink-500">
                          En: {c.persons.join(', ')}
                        </p>
                        {c.severity === 'alta' && (
                          <p className="mt-2 font-display text-sm italic text-clay-700">
                            ⚠ Patrón fuerte — considera hablarlo con un profesional de la salud.
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Causas de muerte */}
              {data.deathCauses.length > 0 && (
                <section>
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-700">
                    Causas de fallecimiento
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {data.deathCauses.map((d, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-ink-900/20 bg-ink-900/5 px-3 py-1 font-sans text-sm text-ink-700"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Hábitos */}
              {data.habits.length > 0 && (
                <section>
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-700">
                    Hábitos comunes
                  </h3>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {data.habits.map((h) => (
                      <li
                        key={h.kind}
                        className="border border-paper-300 bg-paper-100 px-3 py-1.5 text-sm"
                      >
                        <strong className="capitalize">{h.kind}</strong>
                        <span className="ml-2 font-mono text-[10px] text-ink-500">× {h.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Alergias */}
              {data.allergies.length > 0 && (
                <section>
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-700">
                    Alergias agregadas
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {data.allergies.map((a) => (
                      <li
                        key={a.name}
                        className="rounded-full border border-paper-300 bg-paper-50 px-3 py-1 text-sm"
                      >
                        {a.name} <span className="font-mono text-[10px] text-ink-500">× {a.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="border-t border-paper-300 pt-4 font-sans text-xs italic text-ink-500">
                Este resumen es solo informativo. No sustituye consejo médico profesional.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'muted' }) {
  const color = tone === 'ok' ? 'text-moss-700' : tone === 'muted' ? 'text-ink-500' : 'text-ink-900';
  return (
    <div className="bg-paper-50 p-4 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{label}</p>
      <p className={`mt-1 font-display text-3xl ${color}`}>{value}</p>
    </div>
  );
}
