import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Logo, Wordmark } from '../brand/Logo.js';
import { useMe } from '../../features/auth/hooks/useAuth.js';

export function Navbar() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const onLanding = loc.pathname === '/';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md ${onLanding ? 'border-paper-300/60 bg-paper-100/85' : 'border-paper-300 bg-paper-50/95'}`}
    >
      <nav className="editorial flex items-center justify-between py-4 md:py-5">
        <Link to={me ? '/dashboard' : '/'} className="group flex items-center gap-3">
          <Logo className="h-9 w-9 transition-transform group-hover:rotate-3" />
          <div className="flex items-baseline gap-2">
            <Wordmark className="text-[22px] md:text-[26px]" />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 sm:inline">
              · 2026
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {me ? (
            <>
              <NavItem to="/dashboard">Mis árboles</NavItem>
              <NavItem to="/profile">Perfil</NavItem>
            </>
          ) : (
            <>
              <NavItem to="/" end>Inicio</NavItem>
              <HashItem href="/#nosotros">Nosotros</HashItem>
              <HashItem href="/#valores">Valores</HashItem>
              <HashItem href="/#metodo">Método</HashItem>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {me ? (
            <Link
              to="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-900 bg-ink-900 font-display text-base font-medium text-paper-50 transition hover:bg-moss-700 hover:border-moss-700"
              title={me.fullName}
            >
              {me.fullName?.[0]?.toUpperCase() ?? '?'}
            </Link>
          ) : (
            <>
              <Link to="/login" className="link-underline font-sans text-sm font-medium text-ink-700">
                Entrar
              </Link>
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 font-sans text-sm font-medium text-paper-50 transition hover:bg-moss-700"
              >
                Crear cuenta
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 md:hidden"
          aria-label="Menú"
        >
          <div className="flex flex-col gap-1.5">
            <span className={`block h-px w-5 bg-ink-900 transition ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-px w-5 bg-ink-900 transition ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-5 bg-ink-900 transition ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-paper-300 bg-paper-50 md:hidden">
          <div className="editorial flex flex-col gap-4 py-6">
            {me ? (
              <>
                <MobileLink to="/dashboard" onClick={() => setOpen(false)}>Mis árboles</MobileLink>
                <MobileLink to="/profile" onClick={() => setOpen(false)}>Perfil</MobileLink>
              </>
            ) : (
              <>
                <MobileLink to="/" onClick={() => setOpen(false)}>Inicio</MobileLink>
                <a href="/#nosotros" onClick={() => setOpen(false)} className="font-display text-2xl text-ink-900">Nosotros</a>
                <a href="/#valores" onClick={() => setOpen(false)} className="font-display text-2xl text-ink-900">Valores</a>
                <a href="/#metodo" onClick={() => setOpen(false)} className="font-display text-2xl text-ink-900">Método</a>
                <div className="mt-4 flex flex-col gap-2 border-t border-paper-300 pt-4">
                  <Link to="/login" onClick={() => setOpen(false)} className="text-base font-medium text-ink-700">Entrar</Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-paper-50"
                  >
                    Crear cuenta →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `link-underline font-sans text-sm ${isActive ? 'font-medium text-ink-900' : 'text-ink-500 hover:text-ink-900'}`
      }
    >
      {children}
    </NavLink>
  );
}

function HashItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="link-underline font-sans text-sm text-ink-500 hover:text-ink-900">
      {children}
    </a>
  );
}

function MobileLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="font-display text-2xl text-ink-900">
      {children}
    </Link>
  );
}
