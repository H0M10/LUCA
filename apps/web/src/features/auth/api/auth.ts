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

export const me = () => http<{ data: UserPublic }>('/api/auth/me').then((r) => r.data);
