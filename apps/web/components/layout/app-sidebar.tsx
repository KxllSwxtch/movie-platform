'use client';

import {
  Play,
  House,
  Television,
  FilmStrip,
  DeviceMobile,
  BookOpen,
  ClockCounterClockwise,
  Heart,
  Gear,
  SignOut,
  X,
  Users,
  GitBranch,
  Coins,
  ShareNetwork,
  User,
  ShieldCheck,
  FileText,
  Bag,
  Package,
  Plus,
  VideoCamera,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { GenreList, AddGenreDialog } from '@/components/sidebar';
import { CollapsedNavTooltip } from '@/components/layout/collapsed-nav-tooltip';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

/**
 * Navigation group configuration
 */
interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

/**
 * Navigation groups matching Figma design
 */
const baseNavGroups: NavGroup[] = [
  {
    label: 'МЕНЮ',
    items: [
      { href: '/dashboard', icon: House, label: 'Главная' },
      { href: '/series', icon: Television, label: 'Сериалы' },
      { href: '/videos', icon: FilmStrip, label: 'Видео' },
      { href: '/shorts', icon: DeviceMobile, label: 'Шортсы' },
      { href: '/tutorials', icon: BookOpen, label: 'Обучение' },
    ],
  },
  {
    label: 'БИБЛИОТЕКА',
    items: [
      { href: '/account/history', icon: ClockCounterClockwise, label: 'История' },
      { href: '/account/watchlist', icon: Heart, label: 'Избранное' },
    ],
  },
  {
    label: 'МАГАЗИН',
    items: [
      { href: '/store', icon: Bag, label: 'Каталог' },
      { href: '/store/orders', icon: Package, label: 'Мои заказы' },
    ],
  },
  {
    label: 'АККАУНТ',
    items: [
      { href: '/account', icon: User, label: 'Мой аккаунт' },
      { href: '/account/verification', icon: ShieldCheck, label: 'Верификация' },
      { href: '/documents', icon: FileText, label: 'Документы' },
    ],
  },
];

const studioNavGroup: NavGroup = {
  label: 'СТУДИЯ',
  items: [
    { href: '/studio/create', icon: Plus, label: 'Создать контент' },
    { href: '/studio', icon: VideoCamera, label: 'Мой контент' },
  ],
};

const partnerNavGroup: NavGroup = {
  label: 'ПАРТНЁРАМ',
  items: [
    { href: '/partner', icon: Users, label: 'Дашборд' },
    { href: '/partner/referrals', icon: GitBranch, label: 'Рефералы' },
    { href: '/partner/commissions', icon: Coins, label: 'Комиссии' },
    { href: '/partner/invite', icon: ShareNetwork, label: 'Пригласить' },
  ],
};

/**
 * Sidebar width constants
 */
const SIDEBAR_WIDTH = 230;
const SIDEBAR_COLLAPSED_WIDTH = 76;

interface AppSidebarProps {
  className?: string;
}

/**
 * Application sidebar with grouped navigation matching Figma design
 */
export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const {
    isMobileMenuOpen,
    isSidebarCollapsed,
    setMobileMenuOpen,
    toggleSidebarCollapsed,
  } = useUIStore();

  const canUseStudio =
    user?.role === 'ADMIN' ||
    user?.role === 'MODERATOR' ||
    user?.role === 'PARTNER';
  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const navGroups = React.useMemo(() => {
    const groups = [...baseNavGroups];
    if (canUseStudio) {
      groups.push({
        ...studioNavGroup,
        items: canModerate
          ? [
              studioNavGroup.items[0],
              { href: '/admin/content', icon: ShieldCheck, label: 'Модерация контента' },
              ...studioNavGroup.items.slice(1),
            ]
          : studioNavGroup.items,
      });
    }
    if (user?.role === 'PARTNER') {
      groups.push(partnerNavGroup);
    }
    return groups;
  }, [canModerate, canUseStudio, user?.role]);

  // State for add genre dialog
  const [isAddGenreDialogOpen, setAddGenreDialogOpen] = React.useState(false);

  /**
   * Check if a nav item is active
   */
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /**
   * Handle navigation click - close mobile menu (no-op on desktop)
   */
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const collapsedClass = isSidebarCollapsed ? 'md:w-[76px]' : 'md:w-[230px]';

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-mp-bg-secondary flex flex-col transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          collapsedClass,
          className
        )}
        style={{ width: isMobileMenuOpen ? SIDEBAR_WIDTH : undefined }}
      >
        {/* Logo section */}
        <div className={cn('h-16 flex items-center justify-between shrink-0', isSidebarCollapsed ? 'px-4' : 'px-5')}>
          <CollapsedNavTooltip label="MoviePlatform" collapsed={isSidebarCollapsed}>
          <Link
            href="/dashboard"
            className={cn('flex items-center gap-2 min-w-0', isSidebarCollapsed && 'md:justify-center md:w-full')}
            onClick={handleNavClick}
          >
            <div className="w-6 h-6 rounded bg-mp-accent-primary flex items-center justify-center shrink-0">
              <Play className="w-3 h-3 text-white" weight="fill" />
            </div>
            <span className={cn('text-lg font-semibold text-mp-text-primary tracking-tight transition-opacity duration-200', isSidebarCollapsed && 'md:hidden')}>
              Movie<span className="text-gradient">Platform</span>
            </span>
          </Link>
          </CollapsedNavTooltip>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-mp-text-secondary hover:text-mp-text-primary rounded-md hover:bg-mp-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation groups */}
        <nav className={cn('flex-1 overflow-y-auto custom-scrollbar py-4', isSidebarCollapsed ? 'px-2 space-y-5' : 'px-3 space-y-6')}>
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <div className={cn('px-3 mb-2', isSidebarCollapsed && 'md:hidden')}>
                <span className="text-xs font-medium text-mp-text-secondary tracking-wider">
                  {group.label}
                </span>
              </div>

              {/* Group items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <CollapsedNavTooltip key={item.href} label={item.label} collapsed={isSidebarCollapsed}>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        'relative flex items-center rounded-lg text-sm font-medium transition-all',
                        isSidebarCollapsed
                          ? 'md:h-11 md:w-11 md:justify-center md:px-0 md:mx-auto gap-0 px-3 py-2.5'
                          : 'gap-3 px-3 py-2.5',
                        active
                          ? 'text-mp-accent-primary bg-mp-accent-primary/12 shadow-[inset_3px_0_0_rgba(201,75,255,0.9)]'
                          : 'text-mp-text-secondary hover:text-mp-text-primary hover:bg-mp-surface/80'
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className={cn('truncate transition-opacity duration-200', isSidebarCollapsed && 'md:hidden')}>
                        {item.label}
                      </span>
                    </Link>
                    </CollapsedNavTooltip>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Your Genres section - now using real data */}
          {!isSidebarCollapsed && (
            <GenreList
              onNavigate={handleNavClick}
              onAddGenreClick={() => setAddGenreDialogOpen(true)}
            />
          )}
        </nav>

        {/* Bottom section - Settings & Logout */}
        <div className={cn('shrink-0 border-t border-mp-border space-y-1', isSidebarCollapsed ? 'px-2 py-4' : 'px-3 py-4')}>
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className={cn(
              'hidden md:flex w-full items-center rounded-lg text-sm font-medium text-mp-text-secondary hover:bg-mp-surface/80 hover:text-mp-text-primary transition-colors',
              isSidebarCollapsed ? 'h-11 justify-center px-0' : 'gap-3 px-3 py-2.5'
            )}
          >
            {isSidebarCollapsed ? (
              <CaretRight className="w-5 h-5 shrink-0" />
            ) : (
              <CaretLeft className="w-5 h-5 shrink-0" />
            )}
            <span className={cn(isSidebarCollapsed && 'md:hidden')}>Свернуть</span>
          </button>
          <CollapsedNavTooltip label="Настройки" collapsed={isSidebarCollapsed}>
          <Link
            href="/account/settings"
            onClick={handleNavClick}
            className={cn(
              'relative flex items-center rounded-lg text-sm font-medium transition-all',
              isSidebarCollapsed ? 'md:h-11 md:w-11 md:justify-center md:px-0 md:mx-auto gap-0 px-3 py-2.5' : 'gap-3 px-3 py-2.5',
              isActive('/account/settings')
                ? 'text-mp-accent-primary bg-mp-accent-primary/12 shadow-[inset_3px_0_0_rgba(201,75,255,0.9)]'
                : 'text-mp-text-secondary hover:text-mp-text-primary hover:bg-mp-surface/80'
            )}
          >
            <Gear className="w-5 h-5 shrink-0" />
            <span className={cn('truncate', isSidebarCollapsed && 'md:hidden')}>Настройки</span>
          </Link>
          </CollapsedNavTooltip>

          <CollapsedNavTooltip label="Выйти" collapsed={isSidebarCollapsed}>
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center rounded-lg text-sm font-medium text-mp-error-text hover:bg-mp-error-bg/50 transition-colors',
              isSidebarCollapsed ? 'md:h-11 md:w-11 md:justify-center md:px-0 md:mx-auto gap-0 px-3 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
          >
            <SignOut className="w-5 h-5 shrink-0" />
            <span className={cn('truncate', isSidebarCollapsed && 'md:hidden')}>Выйти</span>
          </button>
          </CollapsedNavTooltip>
        </div>
      </aside>

      {/* Add genre dialog */}
      <AddGenreDialog
        open={isAddGenreDialogOpen}
        onOpenChange={setAddGenreDialogOpen}
      />
    </>
  );
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
