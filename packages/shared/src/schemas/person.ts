import { z } from 'zod';
import {
  BLOOD_TYPES,
  GENDERS,
  PARENT_SUBTYPES,
  PARTNER_SUBTYPES,
  RELATIONSHIP_TYPES,
} from '../constants/index.js';

/**
 * Normaliza nombres al estilo de documento oficial mexicano:
 * recorta extremos, colapsa espacios dobles y convierte a MAYÚSCULAS.
 */
export const normalizeName = (s: string): string => s.trim().replace(/\s+/g, ' ').toUpperCase();

export const PersonCreateSchema = z
  .object({
    firstName: z.string().min(1).max(80).transform(normalizeName),
    apellidoPaterno: z.string().max(80).transform(normalizeName).optional(),
    apellidoMaterno: z.string().max(80).transform(normalizeName).optional(),
    alias: z.string().max(80).transform(normalizeName).optional(),
    gender: z.enum(GENDERS).optional(),
    birthDate: z.coerce.date().optional(),
    deathDate: z.coerce.date().optional(),
    birthPlace: z.string().max(120).trim().optional(),
    birthCountry: z.string().max(80).trim().optional(),
    birthLat: z.number().min(-90).max(90).optional(),
    birthLng: z.number().min(-180).max(180).optional(),
    bloodType: z.enum(BLOOD_TYPES).optional(),
    isProband: z.boolean().optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(30)).max(20).optional(),
  })
  .refine((d) => !d.deathDate || !d.birthDate || d.deathDate >= d.birthDate, {
    message: 'La fecha de defunción no puede ser anterior al nacimiento',
    path: ['deathDate'],
  });
export type PersonCreateInput = z.infer<typeof PersonCreateSchema>;

/**
 * Update permite enviar SOLO los campos que cambian (PATCH parcial).
 * Sin el refine de fechas porque al actualizar solo una el cliente no envía la otra.
 */
export const PersonUpdateSchema = z
  .object({
    firstName: z.string().min(1).max(80).transform(normalizeName).optional(),
    apellidoPaterno: z.string().max(80).transform(normalizeName).optional(),
    apellidoMaterno: z.string().max(80).transform(normalizeName).optional(),
    alias: z.string().max(80).transform(normalizeName).optional(),
    gender: z.enum(GENDERS).optional(),
    birthDate: z.coerce.date().nullable().optional(),
    deathDate: z.coerce.date().nullable().optional(),
    birthPlace: z.string().max(120).trim().optional(),
    birthCountry: z.string().max(80).trim().optional(),
    birthLat: z.number().min(-90).max(90).nullable().optional(),
    birthLng: z.number().min(-180).max(180).nullable().optional(),
    bloodType: z.enum(BLOOD_TYPES).optional(),
    isProband: z.boolean().optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(30)).max(20).optional(),
  })
  .partial();

export const RelationshipCreateSchema = z
  .object({
    type: z.enum(RELATIONSHIP_TYPES),
    fromPersonId: z.string().uuid(),
    toPersonId: z.string().uuid(),
    subtype: z.string().max(40).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.fromPersonId !== d.toPersonId, {
    message: 'Una persona no puede relacionarse consigo misma',
    path: ['toPersonId'],
  })
  .refine(
    (d) =>
      d.type === 'parent'
        ? !d.subtype || (PARENT_SUBTYPES as readonly string[]).includes(d.subtype)
        : !d.subtype || (PARTNER_SUBTYPES as readonly string[]).includes(d.subtype),
    { message: 'subtype no coincide con type', path: ['subtype'] },
  );
export type RelationshipCreateInput = z.infer<typeof RelationshipCreateSchema>;
