'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { canUseStudio, canUseStudioRole } from '@/lib/role-permissions';

interface StudioAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Studio authentication guard.
 * Redirects to login if not authenticated, to dashboard if not authorized.
 */
export function StudioAuthGuard({ children }: StudioAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, isLoadingUser, isUserLoadError } = useAuth();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);
  const isWaitingForUser = isAuthenticated && isLoadingUser && !isUserLoadError;

  React.useEffect(() => {
    if (!isHydrated || isWaitingForUser) {
      setIsAuthorized(null);
      return;
    }

    if (!isAuthenticated) {
      setIsAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user?.role) {
      setIsAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canUseStudioRole(user.role)) {
      setIsAuthorized(false);
      router.replace('/dashboard');
      return;
    }

    if (!canUseStudio(user.role, user.verificationStatus)) {
      setIsAuthorized(false);
      router.replace(`/account/verification?restricted=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAuthorized(true);
  }, [
    isHydrated,
    isAuthenticated,
    isWaitingForUser,
    pathname,
    user?.role,
    user?.verificationStatus,
    router,
  ]);

  if (!isHydrated || isWaitingForUser || isAuthorized === null) {
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
