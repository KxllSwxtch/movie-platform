import { canUseAdmin } from './role-permissions';

export type ContentPublicationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export function canManageContentPublication(role?: string | null): boolean {
  return canUseAdmin(role);
}

export function normalizeCreatorContentStatus(
  status?: string | null,
): 'DRAFT' | 'PENDING' {
  return status === 'DRAFT' ? 'DRAFT' : 'PENDING';
}

export function getAllowedContentStatuses(
  canManagePublication: boolean,
): ContentPublicationStatus[] {
  return canManagePublication
    ? ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED']
    : ['DRAFT', 'PENDING'];
}
