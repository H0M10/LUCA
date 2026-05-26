import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '../features/auth/hooks/useAuth.js';

/**
 * Envuelve páginas como /login y /register para que redirijan al dashboard
 * si el usuario ya está autenticado.
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMe();
  if (isLoading) return null;
  if (data) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
