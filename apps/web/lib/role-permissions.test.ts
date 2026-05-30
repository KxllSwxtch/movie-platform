import { describe, expect, it } from 'vitest';

import {
  canUseAdmin,
  canUsePartnerDashboard,
  canUseStudio,
  getPartnerRedirectPath,
  getStudioRedirectPath,
  normalizeLegacyRole,
} from './role-permissions';

describe('role permissions', () => {
  it('treats legacy BUYER and MINOR as CLIENT', () => {
    expect(normalizeLegacyRole('BUYER')).toBe('CLIENT');
    expect(normalizeLegacyRole('MINOR')).toBe('CLIENT');
  });

  it('keeps GUEST out of protected product areas', () => {
    expect(normalizeLegacyRole('GUEST')).toBe('GUEST');
    expect(canUseStudio('GUEST', 'VERIFIED')).toBe(false);
    expect(canUsePartnerDashboard('GUEST', 'VERIFIED')).toBe(false);
    expect(canUseAdmin('GUEST')).toBe(false);
  });

  it('allows only verified AUTHOR plus admins into studio', () => {
    expect(canUseStudio('CLIENT', 'VERIFIED')).toBe(false);
    expect(canUseStudio('PARTNER', 'VERIFIED')).toBe(false);
    expect(canUseStudio('AUTHOR', 'UNVERIFIED')).toBe(false);
    expect(canUseStudio('AUTHOR', 'VERIFIED')).toBe(true);
    expect(canUseStudio('ADMIN', 'UNVERIFIED')).toBe(true);
    expect(canUseStudio('MODERATOR', 'UNVERIFIED')).toBe(true);
  });

  it('allows only verified PARTNER into partner dashboard', () => {
    expect(canUsePartnerDashboard('CLIENT', 'VERIFIED')).toBe(false);
    expect(canUsePartnerDashboard('AUTHOR', 'VERIFIED')).toBe(false);
    expect(canUsePartnerDashboard('PARTNER', 'UNVERIFIED')).toBe(false);
    expect(canUsePartnerDashboard('PARTNER', 'VERIFIED')).toBe(true);
    expect(canUsePartnerDashboard('ADMIN', 'VERIFIED')).toBe(false);
  });

  it('returns non-looping direct route redirects', () => {
    expect(getStudioRedirectPath('CLIENT', 'VERIFIED')).toBe('/account');
    expect(getStudioRedirectPath('PARTNER', 'VERIFIED')).toBe('/partner');
    expect(getStudioRedirectPath('AUTHOR', 'UNVERIFIED')).toBe('/account/verification');
    expect(getStudioRedirectPath('AUTHOR', 'VERIFIED')).toBeNull();

    expect(getPartnerRedirectPath('CLIENT', 'VERIFIED')).toBe('/account');
    expect(getPartnerRedirectPath('AUTHOR', 'VERIFIED')).toBe('/studio');
    expect(getPartnerRedirectPath('PARTNER', 'UNVERIFIED')).toBe('/account/verification');
    expect(getPartnerRedirectPath('PARTNER', 'VERIFIED')).toBeNull();
    expect(getPartnerRedirectPath('ADMIN', 'VERIFIED')).toBe('/admin/dashboard');
  });
});
