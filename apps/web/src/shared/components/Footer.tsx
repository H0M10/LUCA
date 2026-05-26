import { Link } from 'react-router-dom';
import { Branch, Logo, Wordmark } from '../brand/Logo.js';

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-paper-300 bg-paper-50">
      {/* Ornament centered above */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-paper-100 px-6">
        <Branch className="h-6 w-32 text-moss-700" />
      </div>

      <div className="editorial py-14">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand block */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <Wordmark className="text-3xl" />
            </div>
            <p className="mt-4 max-w-sm font-display text-xl leading-snug text-ink-700">
              <em className="fr-italic">«Cada árbol tiene la edad de quien lo recuerda»</em>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
              Luca es la casa donde tu historia familiar y tu salud descansan en un mismo lugar.
            </p>
          </div>

          {/* Nav columns */}
          <div className="md:col-span-2">
            <h4 className="eyebrow mb-4">Producto</h4>
            <ul className="space-y-2 font-sans text-sm">
              <li><Link to="/register" className="text-ink-700 hover:text-moss-700">Empezar</Link></li>
              <li><Link to="/login" className="text-ink-700 hover:text-moss-700">Entrar</Link></li>
              <li><a href="/#metodo" className="text-ink-700 hover:text-moss-700">Método</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="eyebrow mb-4">Empresa</h4>
            <ul className="space-y-2 font-sans text-sm">
              <li><a href="/#nosotros" className="text-ink-700 hover:text-moss-700">Nosotros</a></li>
              <li><a href="/#valores" className="text-ink-700 hover:text-moss-700">Valores</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="eyebrow mb-4">Contacto</h4>
            <p className="font-sans text-sm text-ink-700">
              hola@luca.app<br/>
              <span className="text-ink-500">Quito · Ciudad de México · Lima</span>
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="mt-12 flex flex-col gap-4 border-t border-paper-300 pt-6 text-xs text-ink-500 md:flex-row md:items-center md:justify-between">
          <p className="font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} · Luca
          </p>
          <p className="font-sans">
            Desarrollado por{' '}
            <span className="font-display text-base italic text-ink-700">3gm</span>
          </p>
          <p className="font-mono uppercase tracking-widest">
            Lat-Am · ES / EN
          </p>
        </div>
      </div>
    </footer>
  );
}
