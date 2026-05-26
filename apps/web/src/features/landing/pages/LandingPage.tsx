import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Branch, Logo } from '../../../shared/brand/Logo.js';
import { useMe } from '../../auth/hooks/useAuth.js';

export function LandingPage() {
  const { data: me } = useMe();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const skipIntro = () => {
      if (v.currentTime < 2) v.currentTime = 2;
    };
    const onTimeUpdate = () => {
      if (v.currentTime < 1.9) v.currentTime = 2;
    };
    v.addEventListener('loadedmetadata', skipIntro);
    v.addEventListener('seeked', skipIntro);
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      v.removeEventListener('loadedmetadata', skipIntro);
      v.removeEventListener('seeked', skipIntro);
      v.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  return (
    <div className="relative">
      <Navbar />

      {/* ═════════════════════════ HERO ═════════════════════════ */}
      <section className="relative overflow-hidden border-b border-paper-300">
        {/* Marginalia: top-left timestamp + edition */}
        <div className="editorial relative pt-8 md:pt-12">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
            <span>Edición № 01</span>
            <span className="h-px w-12 bg-ink-300" />
            <span>Genealogía + Salud</span>
            <span className="ml-auto hidden md:inline">Lat-Am · 2026</span>
          </div>
        </div>

        <div className="editorial relative grid grid-cols-12 gap-x-8 gap-y-10 py-12 md:gap-y-16 md:py-20">
          {/* LEFT — display title */}
          <div className="col-span-12 lg:col-span-6 stagger">
            <p className="eyebrow">Manual del origen familiar</p>

            <h1 className="mt-6 font-display text-display-xl font-light text-ink-900 text-balance">
              Conoce de dónde{' '}
              <em
                className="fr-italic font-normal text-moss-700"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}
              >
                vienes
              </em>
              <span className="block">
                cuida a quienes{' '}
                <span className="relative inline-block">
                  <span className="marker-moss px-1">amas.</span>
                </span>
              </span>
            </h1>

            <p className="mt-8 max-w-xl font-display text-2xl font-light leading-snug text-ink-700 text-pretty">
              Un árbol genealógico que también es{' '}
              <em className="fr-italic text-clay-600">historia clínica</em>. Patrones hereditarios,
              alergias, hábitos, y la memoria de quienes te precedieron — en un solo lugar.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {me ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-3 rounded-full bg-moss-700 px-7 py-3.5 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-800"
                >
                  Ir a mis árboles
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-3 rounded-full bg-ink-900 px-7 py-3.5 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-700"
                >
                  Empezar mi árbol
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              )}
              <a href="#metodo" className="link-underline font-sans text-base text-ink-700">
                Conocer el método
              </a>
            </div>

            {/* Mini stats */}
            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-paper-300 pt-8">
              <Stat n="20+" l="Condiciones CIE-10" />
              <Stat n="∞" l="Generaciones" />
              <Stat n="100%" l="Privacidad" />
            </dl>
          </div>

          {/* RIGHT — video plate */}
          <div className="relative col-span-12 lg:col-span-6">
            {/* Index number */}
            <div className="absolute -left-2 -top-8 font-display text-[140px] font-light leading-none text-paper-300 md:-left-6 md:text-[200px]">
              01
            </div>

            <div className="relative">
              {/* Video sin marco, sin captions, sin interacción del usuario */}
              <video
                ref={videoRef}
                className="block w-full select-none rounded-sm"
                style={{ maxHeight: '70vh', objectFit: 'cover', pointerEvents: 'none' }}
                src={`${import.meta.env.BASE_URL}intro.mp4#t=2`}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                controls={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Caption debajo */}
              <p className="mt-4 max-w-xs font-display text-sm italic text-ink-500">
                «La memoria de una familia no se hereda, se cultiva.»
              </p>
            </div>
          </div>
        </div>

        {/* Decorative bottom rule */}
        <div className="editorial">
          <div className="flex items-center gap-4 border-t border-paper-300 py-4 text-ink-500">
            <Branch className="h-4 w-20 text-moss-700" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Desliza · scroll · continúa
            </span>
            <div className="ml-auto h-px flex-1 bg-paper-300" />
            <span className="font-mono text-[10px] uppercase tracking-widest">↓</span>
          </div>
        </div>
      </section>

      {/* ═════════════════════════ ¿QUIÉNES SOMOS? ═════════════════════════ */}
      <section id="nosotros" className="border-b border-paper-300 py-20 md:py-32">
        <div className="editorial grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-4">
            <p className="section-number">— 02</p>
            <h2 className="mt-3 font-display text-display-md font-light leading-[0.95] text-ink-900">
              ¿Quiénes{' '}
              <em className="fr-italic">somos</em>?
            </h2>
          </div>

          <div className="col-span-12 md:col-span-7 md:col-start-6">
            <p className="font-display text-2xl font-light leading-snug text-ink-700 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:font-medium first-letter:leading-[0.85] first-letter:text-moss-700">
              Somos una empresa dedicada a conocer y reconocer el origen ancestral de las personas,
              brindando soluciones innovadoras en genealogía. Creemos que entender de dónde venimos
              transforma cómo cuidamos a quienes amamos.
            </p>
            <div className="mt-10 grid gap-px bg-paper-300 sm:grid-cols-3">
              <Pillar
                title="Misión"
                body="Conectar a las personas con su historia familiar, impulsando el autoconocimiento y fortaleciendo la identidad."
              />
              <Pillar
                title="Visión"
                body="Ser la empresa líder en genealogía en Latinoamérica, reconocida por la calidad, tecnología y calidez."
              />
              <Pillar
                title="Valor agregado"
                body="Herramientas que empoderan a las personas para explorar su linaje de forma segura y confiable."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════ MÉTODO ═════════════════════════ */}
      <section id="metodo" className="relative overflow-hidden bg-ink-950 py-20 text-paper-100 md:py-32">
        {/* Background grain (extra dark) */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }} />

        <div className="editorial relative">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sand-500">— 03 / Método</p>
              <h2 className="mt-3 font-display text-display-md font-light text-paper-100">
                Tres pasos para{' '}
                <em className="fr-italic text-sand-500">construir</em>
                <br />
                tu árbol.
              </h2>
            </div>
            <Logo tone="light" className="hidden h-16 w-16 opacity-60 md:block" />
          </div>

          <div className="grid grid-cols-12 gap-x-6 gap-y-12">
            <Step
              n="I"
              title="Marca tu raíz"
              body="Te registras primero a ti mismo — el proband, el punto de referencia desde el que se construye todo."
              accent="sand"
            />
            <Step
              n="II"
              title="Añade generaciones"
              body="Padres, abuelos, hermanos, hijos. Relaciones biológicas, adoptivas, parejas y separaciones — con detección automática de inconsistencias."
              accent="moss"
            />
            <Step
              n="III"
              title="Registra la salud"
              body="Condiciones, alergias, hábitos. Catálogo CIE-10 incluido. Detecta patrones hereditarios en tu familia."
              accent="clay"
            />
          </div>
        </div>
      </section>

      {/* ═════════════════════════ VALORES ═════════════════════════ */}
      <section id="valores" className="border-b border-paper-300 py-20 md:py-32">
        <div className="editorial">
          <div className="mb-16 grid grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-7">
              <p className="section-number">— 04</p>
              <h2 className="mt-3 font-display text-display-md font-light leading-[0.95]">
                Lo que <em className="fr-italic">guía</em> cada decisión.
              </h2>
            </div>
            <p className="col-span-12 mt-6 max-w-md font-sans text-base leading-relaxed text-ink-500 md:col-span-4 md:col-start-9 md:mt-0">
              Nuestros valores no decoran un manifiesto. Son los filtros con los que decidimos qué
              construimos y qué no.
            </p>
          </div>

          <ul className="divide-y divide-paper-300 border-y border-paper-300">
            {[
              ['Compromiso', 'Sostener lo que prometemos, incluso cuando nadie mira.'],
              ['Integridad', 'Decir lo que pensamos y hacer lo que decimos.'],
              ['Pasión por la historia', 'Cada familia es un archivo irrepetible.'],
              ['Respeto por la diversidad', 'No hay una sola forma de ser familia.'],
              ['Confidencialidad', 'Tus datos clínicos no son nuestro negocio.'],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="group flex items-baseline gap-6 py-7 transition hover:bg-paper-50 md:gap-12 md:py-10"
              >
                <span className="w-12 font-mono text-xs uppercase tracking-widest text-ink-300 md:w-20">
                  0{i + 1}
                </span>
                <h3 className="w-40 shrink-0 font-display text-xl text-ink-900 md:w-72 md:text-3xl">
                  {title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-ink-500 transition group-hover:text-ink-700 md:text-base">
                  {body}
                </p>
                <span className="ml-auto hidden font-mono text-xs text-ink-300 transition group-hover:text-moss-700 md:block">
                  →
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═════════════════════════ PULL QUOTE ═════════════════════════ */}
      <section className="bg-paper-200 py-20 md:py-32">
        <div className="editorial">
          <div className="mx-auto max-w-3xl text-center">
            <Branch className="mx-auto h-8 w-40 text-moss-700" />
            <blockquote className="mt-8 font-display text-display-md font-light italic leading-tight text-ink-900 text-balance">
              «Heredar no es solo recibir.
              <br />
              Es saber qué se recibe,
              <br />y elegir qué se transmite.»
            </blockquote>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink-500">
              — Manifiesto Luca
            </p>
          </div>
        </div>
      </section>

      {/* ═════════════════════════ CTA FINAL ═════════════════════════ */}
      <section className="relative overflow-hidden border-b border-paper-300 bg-moss-800 py-20 text-paper-100 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 600 200" className="absolute -right-20 top-1/2 h-72 -translate-y-1/2 text-paper-100" fill="currentColor" aria-hidden>
            <path d="M50 100 Q150 50, 250 100 T450 100 T550 80" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
            <circle cx="50" cy="100" r="6"/>
            <circle cx="150" cy="80" r="5"/>
            <circle cx="250" cy="100" r="6"/>
            <circle cx="350" cy="90" r="5"/>
            <circle cx="450" cy="100" r="6"/>
            <circle cx="550" cy="80" r="5"/>
          </svg>
        </div>

        <div className="editorial relative grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7">
            {me ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sand-500">
                  — 05 / Tu archivo te espera
                </p>
                <h2 className="mt-3 font-display text-display-lg font-light leading-[0.95] text-paper-100">
                  Bienvenido,{' '}
                  <em className="fr-italic text-sand-500">
                    {me.fullName.split(' ')[0]}
                  </em>.
                </h2>
                <p className="mt-6 max-w-md font-sans text-lg leading-relaxed text-paper-300">
                  Tu sesión está abierta. Continúa donde lo dejaste — añade generaciones, registra
                  condiciones, comparte ramas.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center gap-3 rounded-full bg-paper-50 px-8 py-4 font-sans text-base font-medium text-ink-900 transition hover:bg-sand-500"
                  >
                    Ir a mis árboles
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link to="/profile" className="link-underline font-sans text-base text-paper-100">
                    Mi perfil
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-sand-500">— 05 / Empieza hoy</p>
                <h2 className="mt-3 font-display text-display-lg font-light leading-[0.95] text-paper-100">
                  Tu árbol está
                  <br />
                  <em className="fr-italic text-sand-500">esperando</em> ser plantado.
                </h2>
                <p className="mt-6 max-w-md font-sans text-lg leading-relaxed text-paper-300">
                  Registra a tu familia, conserva su historia clínica y descubre los patrones que te definen. Gratis para empezar.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-3 rounded-full bg-paper-50 px-8 py-4 font-sans text-base font-medium text-ink-900 transition hover:bg-sand-500"
                  >
                    Crear mi cuenta gratis
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link to="/login" className="link-underline font-sans text-base text-paper-100">
                    Ya tengo cuenta
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="col-span-12 hidden md:col-span-4 md:col-start-9 md:block">
            <Logo tone="light" className="h-32 w-32 animate-float opacity-80" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <dt className="font-display text-3xl font-light text-ink-900">{n}</dt>
      <dd className="mt-1 font-sans text-xs uppercase tracking-widest text-ink-500">{l}</dd>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-paper-100 p-6 transition hover:bg-paper-50 md:p-8">
      <h3 className="font-mono text-xs uppercase tracking-widest text-moss-700">{title}</h3>
      <p className="mt-3 font-display text-lg font-light leading-snug text-ink-900">{body}</p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  accent,
}: {
  n: string;
  title: string;
  body: string;
  accent: 'moss' | 'sand' | 'clay';
}) {
  const colorMap = {
    moss: 'text-moss-300',
    sand: 'text-sand-500',
    clay: 'text-clay-500',
  };
  return (
    <div className="group col-span-12 md:col-span-4">
      <div className="border-t border-paper-300/30 pt-6">
        <div className="flex items-baseline justify-between">
          <span className={`font-display text-7xl font-light ${colorMap[accent]} transition group-hover:scale-110`}>
            {n}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper-100/50">Paso</span>
        </div>
        <h3 className="mt-6 font-display text-2xl font-light text-paper-50">{title}</h3>
        <p className="mt-3 font-sans text-sm leading-relaxed text-paper-300">{body}</p>
      </div>
    </div>
  );
}
