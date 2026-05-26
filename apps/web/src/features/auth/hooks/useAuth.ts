import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/auth.js';

/**
 * Pregunta una sola vez al servidor por la sesión. Si responde 401, NO reintenta
 * y NO refetchea al montar otros componentes que también usen useMe. Solo se vuelve
 * a evaluar cuando un login/register/logout actualiza explícitamente la cache.
 */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.register,
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Limpiamos toda la cache (árboles, etc) y marcamos 'me' como null
      qc.clear();
      qc.setQueryData(['me'], null);
    },
  });
}
