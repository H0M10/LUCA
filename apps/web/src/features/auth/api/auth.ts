import { http } from '../../../shared/lib/http.js';
import type { LoginInput, RegisterInput, UserPublic } from '@genograma/shared';

export const register = (input: RegisterInput) =>
  http<{ data: UserPublic }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const login = (input: LoginInput) =>
  http<{ data: UserPublic }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const logout = () => http<void>('/api/auth/logout', { method: 'POST' });

/**
 * Devuelve el usuario actual o null si no hay sesión (401).
 * No queremos que React Query trate "no logueado" como ERROR — es un estado válido.
 */
export const me = async (): Promise<UserPublic | null> => {
  try {
    const r = await http<{ data: UserPublic }>('/api/auth/me');
    return r.data;
  } catch (e) {
    if ((e as { status?: number }).status === 401) return null;
    throw e;
  }
};
