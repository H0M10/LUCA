import { z } from 'zod';
import { TREE_PERMISSIONS } from '../constants/index.js';

export const TreeCreateSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(2000).optional(),
});
export type TreeCreateInput = z.infer<typeof TreeCreateSchema>;

export const TreeUpdateSchema = TreeCreateSchema.partial();

export const TreeShareSchema = z.object({
  email: z.string().email(),
  permission: z.enum(TREE_PERMISSIONS),
});
