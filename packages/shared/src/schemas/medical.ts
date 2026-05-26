import { z } from 'zod';
import { CONDITION_SEVERITIES, CONDITION_STATUSES } from '../constants/index.js';

export const PersonConditionCreateSchema = z
  .object({
    conditionId: z.string().uuid().optional(),
    customName: z.string().max(200).optional(),
    ageAtDiagnosis: z.number().int().min(0).max(130).optional(),
    status: z.enum(CONDITION_STATUSES).optional(),
    severity: z.enum(CONDITION_SEVERITIES).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => d.conditionId || d.customName, {
    message: 'Debe especificar conditionId o customName',
    path: ['conditionId'],
  });

export const AllergyCreateSchema = z.object({
  kind: z.enum(['drug', 'food', 'environmental', 'other']),
  name: z.string().min(1).max(120),
  severity: z.enum(['mild', 'moderate', 'severe', 'anaphylactic']).optional(),
  notes: z.string().max(1000).optional(),
});

export const HabitCreateSchema = z.object({
  kind: z.enum(['smoking', 'alcohol', 'drugs', 'sedentary', 'diet', 'exercise', 'other']),
  intensity: z.enum(['low', 'moderate', 'high']).optional(),
  startAge: z.number().int().min(0).max(130).optional(),
  endAge: z.number().int().min(0).max(130).optional(),
  notes: z.string().max(1000).optional(),
});
