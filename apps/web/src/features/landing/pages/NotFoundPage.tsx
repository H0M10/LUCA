import { Link } from 'react-router-dom';
import { Navbar } from '../../../shared/components/Navbar.js';
import { Footer } from '../../../shared/components/Footer.js';
import { Branch } from '../../../shared/brand/Logo.js';

export function NotFoundPage() {
  return (
    <div>
      <Navbar />
      <main className="editorial flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">— Error 404 / Página perdida</p>
        <h1 className="mt-6 font-display text-[clamp(5rem,18vw,12rem)] font-light leading-none text-ink-900">
          <em className="fr-italic text-moss-700">Esta</em> rama
          <br />
          no <em className="fr-italic">existe</em>.
        </h1>
        <Branch className="mt-10 h-6 w-40 text-moss-700" />
        <p className="mt-8 max-w-md font-display text-xl italic leading-snug text-ink-500">
          O la página fue movida, o nunca floreció. Volvamos al jardín.
        </p>
        <Link
          to="/"
          className="group mt-10 inline-flex items-center gap-3 rounded-full bg-ink-900 px-7 py-3.5 font-sans text-base font-medium text-paper-50 transition hover:bg-moss-700"
        >
          Volver al inicio
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
