import { Link } from 'react-router-dom';
import { Branch, Logo, Wordmark } from '../brand/Logo.js';

export function Footer() {
  return (
    <footer className="relative mt-24 bg-ink-900 text-paper-100">
      {/* Ornament centered above */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900 px-6 py-1">
        <Branch className="h-6 w-32 text-sand-500" />
      </div>

      <div className="editorial py-14">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand block */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" tone="light" />
              <Wordmark className="text-3xl" tone="light" />
            </div>
            <p className="mt-4 max-w-sm font-display text-xl leading-snug text-white/90">
              <em className="fr-italic">«Cada árbol tiene la edad de quien lo recuerda»</em>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper-100/60">
              Luca es la casa donde tu historia familiar y tu salud descansan en un mismo lugar.
            </p>
          </div>

          {/* Nav columns */}
          <div className="md:col-span-2">
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-moss-300">Producto</h4>
            <ul className="space-y-2 font-sans text-sm">
              <li><Link to="/register" className="text-paper-100/70 transition hover:text-moss-300">Empezar</Link></li>
              <li><Link to="/login" className="text-paper-100/70 transition hover:text-moss-300">Entrar</Link></li>
              <li><Link to="/#metodo" className="text-paper-100/70 transition hover:text-moss-300">Método</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-moss-300">Empresa</h4>
            <ul className="space-y-2 font-sans text-sm">
              <li><Link to="/#nosotros" className="text-paper-100/70 transition hover:text-moss-300">Nosotros</Link></li>
              <li><Link to="/#valores" className="text-paper-100/70 transition hover:text-moss-300">Valores</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-moss-300">Contacto</h4>
            <p className="font-sans text-sm text-paper-100/70">
              hola@luca.app<br/>
              <span className="text-paper-100/50">Quito · Ciudad de México · Lima</span>
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="mt-12 flex flex-col gap-4 border-t border-ink-700/50 pt-6 text-xs text-paper-100/60 md:flex-row md:items-center md:justify-between">
          <p className="font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} · Luca
          </p>
          <p className="font-sans">
            Desarrollado por{' '}
            <span className="font-display text-base italic text-white">3gm</span>
          </p>
          <p className="font-mono uppercase tracking-widest">
            Lat-Am · ES / EN
          </p>
        </div>
      </div>
    </footer>
  );
}
