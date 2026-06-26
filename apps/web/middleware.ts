import { NextRequest, NextResponse } from 'next/server';

import {
  canUseAdmin,
  canUsePartnerDashboard,
  getPartnerRedirectPath,
} from '@/lib/role-permissions';

/**
 * Routes that require authentication.
 */
const PROTECTED_ROUTES = [
  '/account',
  '/partner',
  '/checkout',
  '/store/checkout',
  '/store/orders',
  '/bonuses',
  '/studio',
];

const PARTNER_ONLY_ROUTES = [
  '/account/referrals',
  '/account/withdrawals',
  '/bonuses/withdraw',
];

const VERIFIED_ONLY_ROUTES = [
  '/account/referrals',
  '/account/withdrawals',
  '/bonuses/withdraw',
  '/store/checkout',
  '/checkout',
];

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getTokenPayload(request: NextRequest): Record<string, unknown> | null {
  const authCookie = request.cookies.get('mp-auth-token');
  if (!authCookie?.value) return null;

  try {
    const [, payload] = authCookie.value.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function hasAuthToken(request: NextRequest): boolean {
  const authCookie = request.cookies.get('mp-auth-token');
  if (!authCookie?.value) return false;

  const payload = getTokenPayload(request);
  if (!payload) return false;

  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    return false;
  }

  return true;
}

function getUserRole(request: NextRequest): string | null {
  const payload = getTokenPayload(request);
  return typeof payload?.role === 'string' ? payload.role : null;
}

function getVerificationStatus(request: NextRequest): string | null {
  const explicit = request.cookies.get('mp-verification-status')?.value;
  if (explicit) return explicit;

  const payload = getTokenPayload(request);
  return typeof payload?.verificationStatus === 'string'
    ? payload.verificationStatus
    : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = hasAuthToken(request);
  const hasStaleAuthCookies =
    !isAuthenticated &&
    Boolean(
      request.cookies.get('mp-auth-token')?.value ||
        request.cookies.get('mp-authenticated')?.value === 'true',
    );
  const role = isAuthenticated ? getUserRole(request) : null;
  const verificationStatus = isAuthenticated
    ? getVerificationStatus(request)
    : null;

  const clearStaleCookies = (response: NextResponse) => {
    if (hasStaleAuthCookies) {
      response.cookies.delete('mp-auth-token');
      response.cookies.delete('mp-authenticated');
      response.cookies.delete('mp-verification-status');
    }
    return response;
  };

  if (matchesRoute(pathname, PROTECTED_ROUTES) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return clearStaleCookies(NextResponse.redirect(loginUrl));
  }

  if (matchesRoute(pathname, PARTNER_ONLY_ROUTES)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return clearStaleCookies(NextResponse.redirect(loginUrl));
    }

    if (!canUsePartnerDashboard(role, verificationStatus)) {
      const redirectPath = getPartnerRedirectPath(role, verificationStatus);
      const redirectUrl = new URL(redirectPath || '/account', request.url);
      if (redirectPath === '/account/verification') {
        redirectUrl.searchParams.set('restricted', pathname);
      }
      return clearStaleCookies(NextResponse.redirect(redirectUrl));
    }
  }

  if (
    matchesRoute(pathname, VERIFIED_ONLY_ROUTES) &&
    isAuthenticated &&
    !canUseAdmin(role) &&
    verificationStatus !== 'VERIFIED'
  ) {
    const verificationUrl = new URL('/account/verification', request.url);
    verificationUrl.searchParams.set('restricted', pathname);
    return clearStaleCookies(NextResponse.redirect(verificationUrl));
  }

  if (matchesRoute(pathname, AUTH_ROUTES) && isAuthenticated) {
    const redirectTo =
      request.nextUrl.searchParams.get('redirect') ||
      request.nextUrl.searchParams.get('returnUrl') ||
      '/dashboard';
    const isRelativePath = redirectTo.startsWith('/') && !redirectTo.startsWith('//');
    const redirectUrl = isRelativePath
      ? new URL(redirectTo, request.url)
      : new URL('/dashboard', request.url);

    return clearStaleCookies(NextResponse.redirect(redirectUrl));
  }

  return clearStaleCookies(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match specific route groups only.
     * Skip: API routes, _next internals, static files, images
     */
    '/account/:path*',
    '/partner/:path*',
    '/checkout',
    '/store/checkout',
    '/store/orders/:path*',
    '/bonuses/:path*',
    '/studio/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
