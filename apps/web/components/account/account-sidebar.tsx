'use client';

import {
  Bell,
  CaretLeft,
  CaretRight,
  Clock,
  CreditCard,
  Crown,
  SquaresFour,
  Gear,
  GitBranch,
  Shield,
  User,
  Wallet,
} from '@phosphor-icons/react';
import { BookMarked } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';

import { CollapsedNavTooltip } from '@/components/layout/collapsed-nav-tooltip';
import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/use-account';
import { useUnreadCount } from '@/hooks/use-notifications';
import { canUsePartnerDashboard } from '@/lib/role-permissions';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

interface AccountNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
  badge?: boolean;
}

const BASE_ACCOUNT_NAV: AccountNavItem[] = [
  { href: '/account', icon: SquaresFour, label: 'Обзор', exact: true },
  { href: '/account/profile', icon: User, label: 'Профиль' },
  { href: '/account/watchlist', icon: BookMarked, label: 'Избранное' },
  { href: '/account/history', icon: Clock, label: 'История' },
  { href: '/account/notifications', icon: Bell, label: 'Уведомления', badge: true },
  { href: '/account/settings', icon: Gear, label: 'Настройки' },
  { href: '/account/subscriptions', icon: Crown, label: 'Подписки' },
  { href: '/account/payments', icon: CreditCard, label: 'Платежи' },
  { href: '/account/verification', icon: Shield, label: 'Верификация' },
];

const PARTNER_ACCOUNT_NAV: AccountNavItem[] = [
  { href: '/account/referrals', icon: GitBranch, label: 'Реферальная система' },
  { href: '/account/withdrawals', icon: Wallet, label: 'Вывод средств' },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { data: profile } = useProfile();
  const { data: unread } = useUnreadCount();

  const displayName = [
    profile?.firstName || user?.firstName,
    profile?.lastName || user?.lastName,
  ]
    .filter(Boolean)
    .join(' ') || 'Пользователь';

  const planName = (profile as any)?.activeSubscription?.plan?.name;
  const canAccessPartnerDashboard = canUsePartnerDashboard(
    user?.role,
    user?.verificationStatus,
  );
  const accountNav = canAccessPartnerDashboard
    ? [...BASE_ACCOUNT_NAV, ...PARTNER_ACCOUNT_NAV]
    : BASE_ACCOUNT_NAV;

  return (
    <aside className={cn('hidden shrink-0 transition-[width] duration-300 lg:block', isSidebarCollapsed ? 'w-[76px]' : 'w-60')}>
      <div className="sticky top-24 space-y-6">
        {/* User info */}
        <div className={cn('flex flex-col items-center rounded-xl border border-mp-border bg-mp-surface/50', isSidebarCollapsed ? 'p-3' : 'p-5')}>
          <UserAvatar
            src={profile?.avatarUrl || user?.avatarUrl}
            name={displayName}
            size="xl"
          />
          <p className={cn('mt-3 max-w-full truncate text-sm font-semibold text-mp-text-primary', isSidebarCollapsed && 'hidden')}>
            {displayName}
          </p>
          <p className={cn('mt-0.5 max-w-full truncate text-xs text-mp-text-secondary', isSidebarCollapsed && 'hidden')}>
            {user?.email || ''}
          </p>
          {planName && !isSidebarCollapsed && (
            <Badge variant="default" className="mt-2 text-[10px]">
              <Crown className="mr-1 h-3 w-3" />
              {planName}
            </Badge>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className={cn(
              'mb-2 hidden w-full items-center rounded-lg text-sm font-medium text-mp-text-secondary transition-colors hover:bg-mp-surface/80 hover:text-mp-text-primary lg:flex',
              isSidebarCollapsed ? 'h-11 justify-center px-0' : 'gap-3 px-3 py-2.5',
            )}
          >
            {isSidebarCollapsed ? (
              <CaretRight className="h-4 w-4 shrink-0" />
            ) : (
              <CaretLeft className="h-4 w-4 shrink-0" />
            )}
            <span className={cn(isSidebarCollapsed && 'hidden')}>Свернуть</span>
          </button>
          {accountNav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const badgeCount = ('badge' in item && item.badge && unread?.count) ? unread.count : 0;

            return (
              <CollapsedNavTooltip key={item.href} label={item.label} collapsed={isSidebarCollapsed}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  isSidebarCollapsed ? 'h-11 justify-center px-0 gap-0' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-mp-accent-primary/10 text-mp-accent-primary'
                    : 'text-mp-text-secondary hover:bg-mp-surface/80 hover:text-mp-text-primary'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn('truncate', isSidebarCollapsed && 'hidden')}>{item.label}</span>
                {badgeCount > 0 && !isSidebarCollapsed && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-mp-accent-primary px-1.5 text-[10px] font-bold text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
              </CollapsedNavTooltip>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/**
 * Mobile horizontal tabs for account navigation (shown on < lg screens)
 */
export function AccountMobileTabs() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const canAccessPartnerDashboard = canUsePartnerDashboard(
    user?.role,
    user?.verificationStatus,
  );
  const accountNav = canAccessPartnerDashboard
    ? [...BASE_ACCOUNT_NAV, ...PARTNER_ACCOUNT_NAV]
    : BASE_ACCOUNT_NAV;

  return (
    <div className="lg:hidden -mx-4 sm:-mx-6 mb-6 overflow-x-auto border-b border-mp-border">
      <div className="flex min-w-max gap-1 px-4 sm:px-6 pb-2">
        {accountNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-mp-accent-primary/10 text-mp-accent-primary'
                  : 'text-mp-text-secondary hover:bg-mp-surface/80 hover:text-mp-text-primary'
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
