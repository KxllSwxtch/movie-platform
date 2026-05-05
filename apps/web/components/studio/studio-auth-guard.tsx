'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@movie-platform/shared';

interface StudioAuthGuardProps {
  children: React.ReactNode;
}

const STUDIO_ALLOWED_ROLES = [
  UserRole.ADMIN,
  UserRole.MODERATOR,
  UserRole.BUYER,
  UserRole.PARTNER,
];

/**
 * Studio authentication guard.
 * Redirects to login if not authenticated, to dashboard if not authorized.
 */
export function StudioAuthGuard({ children }: StudioAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, isLoadingUser } = useAuth();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!isHydrated || (isAuthenticated && isLoadingUser)) {
      setIsAuthorized(null);
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user?.role) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!STUDIO_ALLOWED_ROLES.includes(user.role as UserRole)) {
      setIsAuthorized(false);
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [isHydrated, isAuthenticated, isLoadingUser, pathname, user?.role, router]);

  if (!isHydrated || (isAuthenticated && isLoadingUser) || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8 text-mp-accent-primary" />
          <p className="text-sm text-mp-text-secondary">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}
