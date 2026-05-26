import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as treesApi from '../api/trees.js';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { MedicalPanel } from '../../medical/components/MedicalPanel.js';

export function PersonPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const treeId = search.get('treeId');

  const { data: tree } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => treesApi.getTree(treeId!),
    enabled: !!treeId,
  });

  const person = tree?.persons.find((p) => p.id === id);

  if (!treeId || !id) {
    return <div className="editorial py-20 font-mono text-xs text-ink-500">Parámetros inválidos.</div>;
  }
  if (!tree || !person) {
    return (
      <div>
        <Navbar />
        <main className="editorial py-20 font-mono text-xs uppercase tracking-widest text-ink-500">
          Abriendo expediente…
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="editorial py-12 md:py-16">
        <button
          onClick={() => navigate(`/trees/${treeId}`)}
          className="link-underline mb-8 font-mono text-[10px] uppercase tracking-widest text-ink-500"
        >
          ← <Link to={`/trees/${treeId}`} className="text-ink-500 hover:text-ink-900">{tree.name}</Link>
        </button>

        {/* Editorial portrait header */}
        <header className="grid grid-cols-12 gap-x-6 gap-y-8 border-y border-paper-300 py-10 md:py-14">
          <div className="col-span-12 md:col-span-4">
            <PersonPortrait person={person} />
          </div>
          <div className="col-span-12 md:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Expediente № {person.id.slice(0, 8).toUpperCase()}
            </p>
            <h1 className="mt-4 font-display text-display-md font-light leading-[0.9] text-ink-900">
              {person.firstName}
              <br />
              <em className="fr-italic text-moss-700">{person.lastName ?? ''}</em>
            </h1>
            {person.alias && (
              <p className="mt-3 font-display text-xl italic text-ink-500">«{person.alias}»</p>
            )}
            {person.isProband && (
              <p className="mt-4 inline-block rounded-full bg-ink-900 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-paper-50">
                Proband · Yo
              </p>
            )}

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-paper-300 pt-6 sm:grid-cols-4">
              <Datum label="Nacimiento" value={person.birthDate ?? '—'} />
              <Datum label="Defunción" value={person.deathDate ?? '—'} />
              <Datum label="Lugar" value={person.birthPlace ?? '—'} />
              <Datum
                label="Sangre"
                value={person.bloodType && person.bloodType !== 'unknown' ? person.bloodType : '—'}
              />
            </dl>

            {person.notes && (
              <blockquote className="mt-6 border-l-2 border-moss-700 pl-4 font-display text-lg italic leading-snug text-ink-700">
                {person.notes}
              </blockquote>
            )}
          </div>
        </header>

        {/* Medical section */}
        <section className="mt-12 md:mt-16">
          <div className="mb-8 grid grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-4">
              <p className="section-number">— 02</p>
              <h2 className="mt-3 font-display text-display-md font-light leading-[0.95]">
                Historia<br />
                <em className="fr-italic text-clay-600">clínica</em>.
              </h2>
            </div>
            <p className="col-span-12 max-w-md font-sans text-sm leading-relaxed text-ink-500 md:col-span-7 md:col-start-6">
              Registra condiciones, alergias y hábitos. Esta información viaja con el árbol y ayuda a
              detectar patrones hereditarios — pero permanece estrictamente confidencial.
            </p>
          </div>

          <MedicalPanel personId={person.id} />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{label}</dt>
      <dd className="mt-1 font-display text-lg text-ink-900">{value}</dd>
    </div>
  );
}

function PersonPortrait({ person }: { person: { gender: string | null; deathDate: string | null } }) {
  const color = person.deathDate ? '#A89F8E' : '#1F1A14';
  const symbol =
    person.gender === 'female' ? (
      <circle cx="80" cy="80" r="70" fill="none" stroke={color} strokeWidth="2" />
    ) : person.gender === 'male' ? (
      <rect x="10" y="10" width="140" height="140" fill="none" stroke={color} strokeWidth="2" />
    ) : (
      <path d="M 80 10 L 150 80 L 80 150 L 10 80 Z" fill="none" stroke={color} strokeWidth="2" />
    );
  return (
    <div className="relative aspect-square border border-paper-300 bg-paper-50 p-6">
      <span className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-widest text-ink-300">
        Fig.
      </span>
      <svg viewBox="0 0 160 160" className="h-full w-full">
        {symbol}
        {person.deathDate && <line x1="15" y1="15" x2="145" y2="145" stroke={color} strokeWidth="2" />}
      </svg>
    </div>
  );
}
