import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionManager } from '../features/auth/hooks/useSessionManager.js';
import { setOnUnauthorized } from '../shared/lib/http.js';
import { toast } from '../shared/stores/toast.js';

/**
 * Componente fantasma que vive dentro del router y le dice a `http.ts`
 * qué hacer si llega un 401 de un endpoint que SÍ requería auth.
 * También ejecuta el `useSessionManager` (auto-refresh + idle timeout).
 */
export function SessionGuard(): null {
  useSessionManager();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    setOnUnauthorized(() => {
      toast.error('Tu sesión expiró', 'Por favor entra de nuevo.');
      qc.setQueryData(['me'], null);
      qc.clear();
      navigate('/login');
    });
    return () => setOnUnauthorized(null);
  }, [qc, navigate]);

  return null;
}
