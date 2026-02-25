import { NextRequest, NextResponse } from 'next/server';

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
  if (authCookie?.value) return true;

  // Fallback: check localStorage-backed cookie
  // The auth store persists to localStorage with key 'mp-auth-storage'
  // We also check for a lightweight cookie marker
  const storageCookie = request.cookies.get('mp-authenticated');
  if (storageCookie?.value === 'true') return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = hasAuthToken(request);

  // Protected routes: redirect to login if not authenticated
  if (matchesRoute(pathname, PROTECTED_ROUTES) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: redirect to home if already authenticated
  if (matchesRoute(pathname, AUTH_ROUTES) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
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
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
