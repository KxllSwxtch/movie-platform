export type AppRole =
  | 'GUEST'
  | 'CLIENT'
  | 'BUYER'
  | 'PARTNER'
  | 'AUTHOR'
  | 'MINOR'
  | 'MODERATOR'
  | 'ADMIN';

export type NormalizedRole = 'GUEST' | 'CLIENT' | 'PARTNER' | 'AUTHOR' | 'MODERATOR' | 'ADMIN';

export type VerificationState = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export function normalizeLegacyRole(role?: string | null): NormalizedRole {
  if (role === 'ADMIN' || role === 'MODERATOR' || role === 'PARTNER' || role === 'AUTHOR') {
    return role;
  }

  if (role === 'GUEST' || !role) {
    return 'GUEST';
  }

  return 'CLIENT';
}

export function isVerified(verificationStatus?: string | null): boolean {
  return verificationStatus === 'VERIFIED';
}

export function canUseAdmin(role?: string | null): boolean {
  const normalizedRole = normalizeLegacyRole(role);
  return normalizedRole === 'ADMIN' || normalizedRole === 'MODERATOR';
}

export function canUseStudio(
  role?: string | null,
  verificationStatus?: string | null,
): boolean {
  const normalizedRole = normalizeLegacyRole(role);

  if (canUseAdmin(normalizedRole)) {
    return true;
  }

  return normalizedRole === 'AUTHOR' && isVerified(verificationStatus);
}

export function canUseStudioRole(role?: string | null): boolean {
  const normalizedRole = normalizeLegacyRole(role);
  return normalizedRole === 'AUTHOR' || canUseAdmin(normalizedRole);
}

export function canUsePartnerDashboard(
  role?: string | null,
  verificationStatus?: string | null,
): boolean {
  return normalizeLegacyRole(role) === 'PARTNER' && isVerified(verificationStatus);
}

export function canUsePartnerRole(role?: string | null): boolean {
  return normalizeLegacyRole(role) === 'PARTNER';
}

export function getStudioRedirectPath(
  role?: string | null,
  verificationStatus?: string | null,
): string | null {
  const normalizedRole = normalizeLegacyRole(role);

  if (canUseStudio(role, verificationStatus)) {
    return null;
  }

  if (normalizedRole === 'AUTHOR' && !isVerified(verificationStatus)) {
    return '/account/verification';
  }

  if (normalizedRole === 'PARTNER') {
    return canUsePartnerDashboard(role, verificationStatus) ? '/partner' : '/account/verification';
  }

  return '/account';
}

export function getPartnerRedirectPath(
  role?: string | null,
  verificationStatus?: string | null,
): string | null {
  const normalizedRole = normalizeLegacyRole(role);

  if (canUsePartnerDashboard(role, verificationStatus)) {
    return null;
  }

  if (normalizedRole === 'PARTNER' && !isVerified(verificationStatus)) {
    return '/account/verification';
  }

  if (normalizedRole === 'AUTHOR') {
    return canUseStudio(role, verificationStatus) ? '/studio' : '/account/verification';
  }

  if (canUseAdmin(normalizedRole)) {
    return '/admin/dashboard';
  }

  return '/account';
}
