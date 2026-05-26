import { http } from '../../../shared/lib/http.js';
import type { UserPublic } from '@genograma/shared';

export interface UpdateProfileInput {
  fullName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'nonbinary' | 'unknown';
  locale?: string;
}

export const updateProfile = (input: UpdateProfileInput) =>
  http<{ data: UserPublic }>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((r) => r.data);
