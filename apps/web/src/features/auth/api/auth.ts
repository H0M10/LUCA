import { http } from '../../../shared/lib/http.js';
import type { LoginInput, RegisterInput, UserPublic } from '@genograma/shared';

export const register = (input: RegisterInput) =>
  http<{ data: UserPublic }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export type LoginResult =
  | { kind: 'ok'; user: UserPublic }
  | { kind: '2fa'; challengeId: string };

export const login = async (input: LoginInput): Promise<LoginResult> => {
  const r = await http<{ data: UserPublic | { requires2FA: true; challengeId: string } }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
  );
  if ('requires2FA' in r.data && r.data.requires2FA) {
    return { kind: '2fa', challengeId: r.data.challengeId };
  }
  return { kind: 'ok', user: r.data as UserPublic };
};

export const logout = () => http<void>('/api/auth/logout', { method: 'POST' });

export const me = async (): Promise<UserPublic | null> => {
  try {
    const r = await http<{ data: UserPublic }>('/api/auth/me');
    return r.data;
  } catch (e) {
    if ((e as { status?: number }).status === 401) return null;
    throw e;
  }
};
