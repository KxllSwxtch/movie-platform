'use client';

import { AccountSidebar, AccountMobileTabs } from '@/components/account';
import { useAuthStore } from '@/stores/auth.store';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import AccountDashboardLoading from './loading';

export function AccountLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated } = useAuthStore();

  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isHydrated, pathname, router]);

  if (!isHydrated || !isAuthenticated) {
    return <AccountDashboardLoading />;
  }

  return (
    <div className="sesh-account-page mx-auto flex w-full max-w-6xl gap-6 py-6 md:gap-8 md:py-8">
      <AccountSidebar />
      <div className="sesh-account-content min-w-0 flex-1">
        <AccountMobileTabs />
        {children}
      </div>
    </div>
  );
}
