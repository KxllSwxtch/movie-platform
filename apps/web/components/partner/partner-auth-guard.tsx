'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { canUsePartnerDashboard, canUsePartnerRole, getPartnerRedirectPath } from '@/lib/role-permissions';

interface PartnerAuthGuardProps {
  children: React.ReactNode;
}

export function PartnerAuthGuard({ children }: PartnerAuthGuardProps) {
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

    if (!canUsePartnerRole(user?.role)) {
      setIsAuthorized(false);
      router.replace(getPartnerRedirectPath(user?.role, user?.verificationStatus) || '/account');
      return;
    }

    if (!canUsePartnerDashboard(user?.role, user?.verificationStatus)) {
      setIsAuthorized(false);
      router.replace(`/account/verification?restricted=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAuthorized(true);
  }, [
    isAuthenticated,
    isHydrated,
    isLoadingUser,
    pathname,
    router,
    user?.role,
    user?.verificationStatus,
  ]);

  if (!isHydrated || (isAuthenticated && isLoadingUser) || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-mp-accent-primary" />
          <p className="text-sm text-mp-text-secondary">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}
