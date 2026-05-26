export const GENDERS = ['male', 'female', 'nonbinary', 'unknown'] as const;
export type Gender = (typeof GENDERS)[number];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const RELATIONSHIP_TYPES = ['parent', 'partner'] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const PARENT_SUBTYPES = ['biological', 'adoptive', 'step', 'foster', 'surrogate'] as const;
export const PARTNER_SUBTYPES = [
  'marriage',
  'civil_union',
  'cohabitation',
  'engaged',
  'separated',
  'divorced',
  'widowed',
] as const;

export const CONDITION_STATUSES = ['active', 'remission', 'controlled', 'cause_of_death'] as const;
export const CONDITION_SEVERITIES = ['mild', 'moderate', 'severe'] as const;

export const TREE_PERMISSIONS = ['read', 'edit', 'admin'] as const;
export type TreePermission = (typeof TREE_PERMISSIONS)[number];

export const OAUTH_PROVIDERS = ['google', 'microsoft', 'apple'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
