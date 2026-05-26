import { http } from '../../../shared/lib/http.js';
import type { TreeCreateInput, PersonCreateInput, RelationshipCreateInput } from '@genograma/shared';

export interface TreeSummary {
  id: string;
  name: string;
  description: string | null;
  isOwner: boolean;
  personCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonDto {
  id: string;
  treeId: string;
  firstName: string;
  lastName: string | null;
  alias: string | null;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  bloodType: string | null;
  isProband: boolean;
  photoMediaId: string | null;
  notes: string | null;
  tags: string[];
}

export interface RelationshipDto {
  id: string;
  type: 'parent' | 'partner';
  fromPersonId: string;
  toPersonId: string;
  subtype: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface TreeDetail {
  id: string;
  name: string;
  description: string | null;
  persons: PersonDto[];
  relationships: RelationshipDto[];
}

export const listTrees = () =>
  http<{ data: TreeSummary[] }>('/api/trees').then((r) => r.data);

export const createTree = (input: TreeCreateInput) =>
  http<{ data: TreeSummary }>('/api/trees', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const getTree = (id: string) =>
  http<{ data: TreeDetail }>(`/api/trees/${id}`).then((r) => r.data);

export const deleteTree = (id: string) =>
  http<void>(`/api/trees/${id}`, { method: 'DELETE' });

export const addPerson = (treeId: string, input: PersonCreateInput) =>
  http<{ data: PersonDto }>(`/api/${treeId}/persons`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const updatePerson = (id: string, input: PersonCreateInput) =>
  http<{ data: PersonDto }>(`/api/persons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const deletePerson = (id: string) =>
  http<void>(`/api/persons/${id}`, { method: 'DELETE' });

export const addRelationship = (input: RelationshipCreateInput) =>
  http<{ data: RelationshipDto }>(`/api/relationships`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);

export const deleteRelationship = (id: string) =>
  http<void>(`/api/relationships/${id}`, { method: 'DELETE' });
