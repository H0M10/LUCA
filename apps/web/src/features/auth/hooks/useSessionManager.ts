import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../shared/lib/http.js';
import { toast } from '../../../shared/stores/toast.js';
import { useMe } from './useAuth.js';

/**
 * Maneja el ciclo de vida de la sesión del usuario logueado:
 *
 * - **Auto-refresh** del access token cada 13 minutos (expira a los 15)
 *   silenciosamente, mientras el usuario esté activo.
 * - **Idle timeout**: si no hay actividad (click, key, scroll) por 30 minutos,
 *   cierra sesión automáticamente con un toast.
 * - **Warning de expiración**: si el refresh falla, avisa al usuario que se
 *   cierra sesión.
 */
const ACCESS_TTL_MS = 15 * 60 * 1000;       // 15 min
const REFRESH_BEFORE = 2 * 60 * 1000;        // refresh 2 min antes de expirar
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;      // 30 min de inactividad

export function useSessionManager(): void {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());

  // Auto-refresh
  useEffect(() => {
    if (!me) return;
    const refreshInterval = ACCESS_TTL_MS - REFRESH_BEFORE;
    const id = window.setInterval(async () => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor > IDLE_TIMEOUT_MS) {
        // No refrescar si el usuario está inactivo — el siguiente check de idle lo cerrará
        return;
      }
      try {
        await http('/api/auth/refresh', { method: 'POST' });
      } catch {
        toast.error('Tu sesión expiró', 'Por favor entra de nuevo.');
        qc.setQueryData(['me'], null);
        qc.clear();
        navigate('/login');
      }
    }, refreshInterval);
    return () => window.clearInterval(id);
  }, [me, qc, navigate]);

  // Track activity
  useEffect(() => {
    if (!me) return;
    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    for (const ev of events) document.addEventListener(ev, onActivity, { passive: true });
    return () => {
      for (const ev of events) document.removeEventListener(ev, onActivity);
    };
  }, [me]);

  // Idle check (every minute)
  useEffect(() => {
    if (!me) return;
    const id = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor > IDLE_TIMEOUT_MS) {
        toast.info('Sesión cerrada por inactividad', 'Estuviste sin moverte 30 min.');
        http('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        qc.setQueryData(['me'], null);
        qc.clear();
        navigate('/');
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [me, qc, navigate]);
}
