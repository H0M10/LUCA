import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../features/auth/hooks/useAuth.js';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Cargando…
      </div>
    );
  }
  if (error || !data) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
