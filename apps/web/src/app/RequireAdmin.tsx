import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../features/auth/hooks/useAuth.js';

/** Solo administradores y trabajadores pueden ver el panel. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans text-ink-500">
        Cargando…
      </div>
    );
  }
  if (error || !data) return <Navigate to="/login" replace />;
  if (data.role !== 'admin' && data.role !== 'worker') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
