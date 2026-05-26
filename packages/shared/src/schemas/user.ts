import { z } from 'zod';
import { GENDERS, USER_ROLES, USER_STATUSES } from '../constants/index.js';

export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  avatarMediaId: z.string().uuid().nullable(),
  birthDate: z.string().nullable(),
  gender: z.enum(GENDERS).nullable(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  emailVerifiedAt: z.string().nullable(),
  locale: z.string().nullable(),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  birthDate: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional(),
  locale: z.string().min(2).max(8).optional(),
});
