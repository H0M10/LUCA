import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo, Wordmark } from '../brand/Logo.js';
import { useLogout, useMe } from '../../features/auth/hooks/useAuth.js';
import { toast } from '../stores/toast.js';

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
              <HashItem to="/#nosotros">Nosotros</HashItem>
              <HashItem to="/#valores">Valores</HashItem>
              <HashItem to="/#metodo">Método</HashItem>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {me ? (
            <AvatarMenu name={me.fullName} email={me.email} />
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
                <Link to="/#nosotros" onClick={() => setOpen(false)} className="font-display text-2xl text-ink-900">Nosotros</Link>
                <Link to="/#valores" onClick={() => setOpen(false)} className="font-display text-2xl text-ink-900">Valores</Link>
                <Link to="/#metodo" onClick={() => setOpen(false)} className="font-display text-2xl text-ink-900">Método</Link>
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

function HashItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="link-underline font-sans text-sm text-ink-500 hover:text-ink-900">
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="font-display text-2xl text-ink-900">
      {children}
    </Link>
  );
}

function AvatarMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-900 bg-ink-900 font-display text-base font-medium text-paper-50 transition hover:bg-moss-700 hover:border-moss-700"
        title={name}
      >
        {name?.[0]?.toUpperCase() ?? '?'}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 animate-scale-in origin-top-right border border-paper-300 bg-paper-50 shadow-paper-lg">
          <div className="border-b border-paper-300 px-4 py-3">
            <p className="font-display text-base font-medium text-ink-900">{name}</p>
            <p className="truncate font-sans text-xs text-ink-500">{email}</p>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 font-sans text-sm text-ink-700 transition hover:bg-paper-100 hover:text-ink-900"
          >
            Mi árbol
          </Link>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 font-sans text-sm text-ink-700 transition hover:bg-paper-100 hover:text-ink-900"
          >
            Perfil
          </Link>
          <div className="border-t border-paper-300" />
          <button
            onClick={() => {
              setOpen(false);
              logout.mutate(undefined, {
                onSuccess: () => {
                  toast.info('Sesión cerrada');
                  navigate('/');
                },
              });
            }}
            className="block w-full px-4 py-2.5 text-left font-sans text-sm text-clay-600 transition hover:bg-clay-100 hover:text-clay-700"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
