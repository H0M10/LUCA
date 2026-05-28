import { http } from '../../../shared/lib/http.js';
import type { UserRole, UserStatus } from '@genograma/shared';

export interface AdminStats {
  totals: { users: number; trees: number; persons: number; conditions: number };
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  registrationsByMonth: Array<{ month: string; count: number }>;
  topConditions: Array<{ name: string; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  treeCount: number;
}

export const getStats = () =>
  http<{ data: AdminStats }>('/api/admin/stats').then((r) => r.data);

export const listUsers = () =>
  http<{ data: AdminUser[] }>('/api/admin/users').then((r) => r.data);

export const updateUser = (id: string, input: { role?: UserRole; status?: UserStatus }) =>
  http<{ data: { id: string; role: UserRole; status: UserStatus } }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((r) => r.data);
