import { http } from '../../../shared/lib/http.js';

export interface ConditionDto {
  id: string;
  conditionId: string | null;
  conditionName: string | null;
  conditionCode: string | null;
  customName: string | null;
  ageAtDiagnosis: number | null;
  status: string | null;
  severity: string | null;
  notes: string | null;
}
export interface AllergyDto {
  id: string;
  kind: string;
  name: string;
  severity: string | null;
  notes: string | null;
}
export interface HabitDto {
  id: string;
  kind: string;
  intensity: string | null;
  startAge: number | null;
  endAge: number | null;
  notes: string | null;
}

export interface PersonMedical {
  conditions: ConditionDto[];
  allergies: AllergyDto[];
  habits: HabitDto[];
}

export interface CatalogCondition {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  isHereditary: boolean;
}

export const getPersonMedical = (personId: string) =>
  http<{ data: PersonMedical }>(`/api/persons/${personId}/medical`).then((r) => r.data);

export const searchConditions = (q: string) =>
  http<{ data: CatalogCondition[] }>(`/api/catalog/conditions?q=${encodeURIComponent(q)}`).then(
    (r) => r.data,
  );

export const addCondition = (personId: string, input: {
  conditionId?: string;
  customName?: string;
  ageAtDiagnosis?: number;
  status?: string;
  severity?: string;
  notes?: string;
}) =>
  http<{ data: unknown }>(`/api/persons/${personId}/conditions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const addAllergy = (personId: string, input: {
  kind: string;
  name: string;
  severity?: string;
  notes?: string;
}) =>
  http<{ data: unknown }>(`/api/persons/${personId}/allergies`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const addHabit = (personId: string, input: {
  kind: string;
  intensity?: string;
  startAge?: number;
  endAge?: number;
  notes?: string;
}) =>
  http<{ data: unknown }>(`/api/persons/${personId}/habits`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const deleteCondition = (id: string) =>
  http<void>(`/api/conditions/${id}`, { method: 'DELETE' });
export const deleteAllergy = (id: string) =>
  http<void>(`/api/allergies/${id}`, { method: 'DELETE' });
export const deleteHabit = (id: string) =>
  http<void>(`/api/habits/${id}`, { method: 'DELETE' });
