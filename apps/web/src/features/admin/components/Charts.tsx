/**
 * Gráficas SVG ligeras, sin dependencias, en la paleta BioTech.
 * Petróleo #123F52 · Turquesa #42A7A5 · Verde hoja #8AB96B · Coral #E0685A
 */

const PALETTE = ['#42A7A5', '#123F52', '#8AB96B', '#E0685A', '#7796A3', '#C9A227'];

/** Barras verticales — altas por mes. */
export function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const W = 640;
  const H = 240;
  const padL = 28;
  const padB = 28;
  const padT = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - padL;
  const innerH = H - padB - padT;
  const slot = innerW / data.length;
  const barW = Math.min(34, slot * 0.6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Altas por mes">
      {[0, 0.5, 1].map((t) => {
        const y = padT + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W} y2={y} stroke="#D9DDE3" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#7796A3" fontFamily="monospace">
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={5} fill="#42A7A5">
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#123F52" fontWeight={600}>
                {d.value}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H - 10}
              textAnchor="middle"
              fontSize={8}
              fill="#7796A3"
              fontFamily="monospace"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Barras horizontales — condiciones más comunes. */
export function HBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (data.length === 0) {
    return <p className="py-8 text-center font-sans text-sm text-ink-300">Aún no hay condiciones registradas.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate font-sans text-sm text-ink-700" title={d.label}>
            {d.label}
          </span>
          <span className="relative h-6 flex-1 overflow-hidden rounded-full bg-paper-200">
            <span
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold text-ink-900">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Dona — distribución (roles / estatus). */
export function DonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
        <g transform="rotate(-90 80 80)">
          <circle cx={80} cy={80} r={R} fill="none" stroke="#F2F2F2" strokeWidth={20} />
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * C;
            const seg = (
              <circle
                key={i}
                cx={80}
                cy={80}
                r={R}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={20}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text x={80} y={76} textAnchor="middle" fontSize={26} fontWeight={700} fill="#123F52" fontFamily="Poppins, sans-serif">
          {total}
        </text>
        <text x={80} y={94} textAnchor="middle" fontSize={9} fill="#7796A3" fontFamily="monospace">
          TOTAL
        </text>
      </svg>
      <ul className="flex flex-col gap-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 font-sans text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="capitalize text-ink-700">{d.label}</span>
            <span className="font-mono font-semibold text-ink-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
