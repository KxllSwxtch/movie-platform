import { NextRequest, NextResponse } from 'next/server';

import {
  canUseAdmin,
  canUsePartnerDashboard,
  getPartnerRedirectPath,
} from '@/lib/role-permissions';

/**
 * Routes that require authentication — redirect to /login if no token
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

/**
 * Routes only for unauthenticated users — redirect to / if has token
 */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * Check if pathname starts with any of the given prefixes
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if user has an auth token.
 * We check the cookie set by the auth store persistence.
 * This is a lightweight check — full JWT validation happens server-side.
 */
function hasAuthToken(request: NextRequest): boolean {
  // Check cookie first (set by Zustand persist middleware)
  const authCookie = request.cookies.get('mp-auth-token');
  if (authCookie?.value) {
    // Lightweight JWT expiry check (decode payload without verification)
    try {
      const payload = JSON.parse(atob(authCookie.value.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired — treat as unauthenticated
        return false;
      }
    } catch {
      // Malformed token — treat as unauthenticated
      return false;
    }
    return true;
  }

  // Fallback: check localStorage-backed cookie
  const storageCookie = request.cookies.get('mp-authenticated');
  if (storageCookie?.value === 'true') return true;

  return false;
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
  const role = isAuthenticated ? getUserRole(request) : null;
  const verificationStatus = isAuthenticated
    ? getVerificationStatus(request)
    : null;

  // If not authenticated but stale cookies remain, clear them proactively
  if (!isAuthenticated) {
    const authCookie = request.cookies.get('mp-auth-token');
    const markerCookie = request.cookies.get('mp-authenticated');
    if (authCookie?.value || markerCookie?.value === 'true') {
      const response = NextResponse.next();
      response.cookies.delete('mp-auth-token');
      response.cookies.delete('mp-authenticated');
      return response;
    }
  }

  // Protected routes: redirect to login if not authenticated
  if (matchesRoute(pathname, PROTECTED_ROUTES) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesRoute(pathname, PARTNER_ONLY_ROUTES)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canUsePartnerDashboard(role, verificationStatus)) {
      const redirectPath = getPartnerRedirectPath(role, verificationStatus);
      const redirectUrl = new URL(redirectPath || '/account', request.url);
      if (redirectPath === '/account/verification') {
        redirectUrl.searchParams.set('restricted', pathname);
      }
      return NextResponse.redirect(redirectUrl);
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
    return NextResponse.redirect(verificationUrl);
  }

  // Auth routes: redirect to home if already authenticated
  if (matchesRoute(pathname, AUTH_ROUTES) && isAuthenticated) {
    const redirectTo =
      request.nextUrl.searchParams.get('redirect') ||
      request.nextUrl.searchParams.get('returnUrl') ||
      '/dashboard';
    const isRelativePath = redirectTo.startsWith('/') && !redirectTo.startsWith('//');
    const redirectUrl = isRelativePath
      ? new URL(redirectTo, request.url)
      : new URL('/dashboard', request.url);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
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
