import { UserRole } from '@movie-platform/shared';

export const CLIENT_EQUIVALENT_ROLES = [
  UserRole.CLIENT,
  UserRole.BUYER,
  UserRole.MINOR,
  UserRole.GUEST,
] as const;

export const CREATOR_ROLES = [
  UserRole.AUTHOR,
  UserRole.ADMIN,
] as const;

export const MODERATION_ROLES = [
  UserRole.ADMIN,
  UserRole.MODERATOR,
] as const;

export const PARTNER_ROLES = [UserRole.PARTNER] as const;

export function normalizePermissionRole(role?: string | null): UserRole | null {
  if (!role) return null;

  if (role === UserRole.BUYER || role === UserRole.MINOR) {
    return UserRole.CLIENT;
  }

  if (role === UserRole.GUEST) {
    return UserRole.GUEST;
  }

  return Object.values(UserRole).includes(role as UserRole)
    ? (role as UserRole)
    : null;
}

export function isModerationRole(role?: string | null): boolean {
  return normalizePermissionRole(role) === UserRole.ADMIN ||
    normalizePermissionRole(role) === UserRole.MODERATOR;
}

export function isCreatorRole(role?: string | null): boolean {
  const normalized = normalizePermissionRole(role);
  return normalized === UserRole.AUTHOR || isModerationRole(normalized);
}
