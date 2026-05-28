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
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  lastName: string | null;
  alias: string | null;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  birthLat: number | null;
  birthLng: number | null;
  bloodType: string | null;
  isProband: boolean;
  photoMediaId: string | null;
  photoData: string | null;
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

export const updatePerson = (
  id: string,
  input: Omit<Partial<PersonCreateInput>, 'birthDate' | 'deathDate' | 'birthLat' | 'birthLng'> & {
    bloodType?: string;
    notes?: string;
    birthDate?: Date | null;
    deathDate?: Date | null;
    birthCountry?: string;
    birthLat?: number | null;
    birthLng?: number | null;
  },
) =>
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

// ───────── Miembros / compartir ─────────

export interface TreeMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  permission: 'read' | 'edit' | 'admin';
  acceptedAt?: string | null;
}

export interface TreeMembership {
  owner: { id: string; email: string; fullName: string } | null;
  members: TreeMember[];
}

export const listMembers = (treeId: string) =>
  http<{ data: TreeMembership }>(`/api/trees/${treeId}/members`).then((r) => r.data);

export const inviteMember = (treeId: string, email: string, permission: 'read' | 'edit' | 'admin') =>
  http<{ data: TreeMember }>(`/api/trees/${treeId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, permission }),
  }).then((r) => r.data);

export const removeMember = (treeId: string, memberId: string) =>
  http<void>(`/api/trees/${treeId}/members/${memberId}`, { method: 'DELETE' });

export const updateMember = (treeId: string, memberId: string, permission: 'read' | 'edit' | 'admin') =>
  http<void>(`/api/trees/${treeId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({ permission }),
  });
