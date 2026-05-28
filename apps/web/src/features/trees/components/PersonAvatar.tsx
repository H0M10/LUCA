import type { PersonDto } from '../api/trees.js';

/**
 * Avatar de persona: muestra la FOTO si existe (photoData), si no el símbolo
 * de genograma estándar (□ hombre, ○ mujer, ◇ otro, con tachado si fallecido).
 */
export function PersonAvatar({
  person,
  size = 40,
  className = '',
}: {
  person: Pick<PersonDto, 'gender' | 'deathDate' | 'photoData' | 'firstName'>;
  size?: number;
  className?: string;
}) {
  const dead = !!person.deathDate;

  if (person.photoData) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={person.photoData}
          alt={person.firstName}
          className="h-full w-full rounded-full border border-paper-300 object-cover"
          style={dead ? { filter: 'grayscale(1) opacity(0.75)' } : undefined}
        />
        {dead && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <svg viewBox="0 0 40 40" className="h-full w-full">
              <line x1="4" y1="4" x2="36" y2="36" stroke="#3F6A7B" strokeWidth="2" />
            </svg>
          </span>
        )}
      </span>
    );
  }

  return <PersonSymbol gender={person.gender} dead={dead} size={size} className={className} />;
}

export function PersonSymbol({
  gender,
  dead,
  size = 40,
  className = '',
}: {
  gender: string | null;
  dead: boolean;
  size?: number;
  className?: string;
}) {
  const color = dead ? '#7796A3' : '#123F52';
  const s = size;
  const symbol =
    gender === 'female' ? (
      <circle cx={s / 2} cy={s / 2} r={s / 2 - 2} fill="none" stroke={color} strokeWidth="1.5" />
    ) : gender === 'male' ? (
      <rect x="2" y="2" width={s - 4} height={s - 4} fill="none" stroke={color} strokeWidth="1.5" />
    ) : (
      <path
        d={`M ${s / 2} 2 L ${s - 2} ${s / 2} L ${s / 2} ${s - 2} L 2 ${s / 2} Z`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    );
  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} className={`shrink-0 ${className}`}>
      {symbol}
      {dead && <line x1="3" y1="3" x2={s - 3} y2={s - 3} stroke={color} strokeWidth="1.5" />}
    </svg>
  );
}
