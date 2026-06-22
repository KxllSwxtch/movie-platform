'use client';

import {
  CaretLeft,
  CaretRight,
  ChartBar,
  FilmStrip,
  Gift,
  Play,
  ShieldCheck,
  SignOut,
  SquaresFour,
  Users,
  X,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { SeshLogo } from '@/components/common/sesh-logo';
import { CollapsedNavTooltip } from '@/components/layout/collapsed-nav-tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'Обзор',
    items: [
      { href: '/admin/dashboard', icon: SquaresFour, label: 'Дашборд' },
      { href: '/admin/reports', icon: ChartBar, label: 'Отчеты' },
    ],
  },
  {
    label: 'Пользователи',
    items: [
      { href: '/admin/users', icon: Users, label: 'Пользователи' },
      { href: '/admin/verifications', icon: ShieldCheck, label: 'Верификация пользователей' },
    ],
  },
  {
    label: 'Контент',
    items: [
      { href: '/admin/content', icon: FilmStrip, label: 'Модерация' },
      { href: '/admin/content/categories', icon: FilmStrip, label: 'Категории видео' },
      { href: '/admin/content/genres', icon: FilmStrip, label: 'Жанры' },
    ],
  },
  {
    label: 'Финансы',
    items: [
      { href: '/admin/bonuses', icon: Gift, label: 'Бонусы' },
      { href: '/admin/bonuses/withdrawals', icon: Gift, label: 'Вывод баллов' },
    ],
  },
];

const ADMIN_SIDEBAR_WIDTH = 250;
const ADMIN_SIDEBAR_COLLAPSED_WIDTH = 76;

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  const {
    isMobileMenuOpen,
    isSidebarCollapsed,
    setMobileMenuOpen,
    toggleSidebarCollapsed,
  } = useUIStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-md transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'sesh-admin-sidebar fixed left-0 top-0 z-50 flex h-full flex-col border-r transition-[transform,width] duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          isSidebarCollapsed ? 'md:w-[76px]' : 'md:w-[250px]',
          className,
        )}
        style={{ width: isMobileMenuOpen ? ADMIN_SIDEBAR_WIDTH : undefined }}
      >
        <div
          className={cn(
            'relative flex h-16 shrink-0 items-center justify-between border-b border-white/10',
            isSidebarCollapsed ? 'px-4' : 'px-5',
          )}
        >
          <CollapsedNavTooltip label="SESH" collapsed={isSidebarCollapsed}>
            <SeshLogo
              href="/admin"
              className="min-w-0 md:absolute md:left-1/2 md:-translate-x-1/2"
              imageClassName={cn(
                'h-10 w-auto',
                isSidebarCollapsed ? 'md:h-9' : 'md:h-11',
              )}
              priority
              mobile={isMobile || isSidebarCollapsed}
              onClick={handleNavClick}
            />
          </CollapsedNavTooltip>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md p-2 text-mp-text-secondary transition-colors hover:bg-white/5 hover:text-mp-text-primary md:hidden"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className={cn(
            'custom-scrollbar flex-1 overflow-y-auto py-5',
            isSidebarCollapsed ? 'space-y-5 px-2' : 'space-y-5 px-3',
          )}
        >
          {adminNavGroups.map((group) => (
            <div key={group.label}>
              <div className={cn('mb-2 px-3', isSidebarCollapsed && 'md:hidden')}>
                <span className="text-xs font-medium uppercase tracking-wider text-mp-text-disabled">
                  {group.label}
                </span>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <CollapsedNavTooltip
                      key={item.href}
                      label={item.label}
                      collapsed={isSidebarCollapsed}
                    >
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'sesh-admin-nav-item relative flex items-center rounded-lg text-sm font-medium transition-all',
                          isSidebarCollapsed
                            ? 'gap-0 px-3 py-2.5 md:mx-auto md:h-11 md:w-11 md:justify-center md:px-0'
                            : 'gap-3 px-3 py-2.5',
                          active
                            ? 'sesh-admin-nav-item-active text-white'
                            : 'text-mp-text-secondary hover:text-mp-text-primary',
                        )}
                      >
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        <span className={cn('flex-1 truncate', isSidebarCollapsed && 'md:hidden')}>
                          {item.label}
                        </span>
                      </Link>
                    </CollapsedNavTooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className={cn(
            'shrink-0 space-y-1 border-t border-white/10 py-4',
            isSidebarCollapsed ? 'px-2' : 'px-3',
          )}
        >
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className={cn(
              'hidden w-full items-center rounded-lg text-sm font-medium text-mp-text-secondary transition-colors hover:bg-white/5 hover:text-mp-text-primary md:flex',
              isSidebarCollapsed ? 'h-11 justify-center px-0' : 'gap-3 px-3 py-2',
            )}
          >
            {isSidebarCollapsed ? (
              <CaretRight className="h-4.5 w-4.5 shrink-0" />
            ) : (
              <CaretLeft className="h-4.5 w-4.5 shrink-0" />
            )}
            <span className={cn(isSidebarCollapsed && 'md:hidden')}>Свернуть</span>
          </button>

          <CollapsedNavTooltip label="На главную" collapsed={isSidebarCollapsed}>
            <Link
              href="/dashboard"
              onClick={handleNavClick}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium text-mp-text-secondary transition-colors hover:bg-white/5 hover:text-mp-text-primary',
                isSidebarCollapsed
                  ? 'gap-0 px-3 py-2 md:mx-auto md:h-11 md:w-11 md:justify-center md:px-0'
                  : 'gap-3 px-3 py-2',
              )}
            >
              <Play className="h-4.5 w-4.5 shrink-0" />
              <span className={cn(isSidebarCollapsed && 'md:hidden')}>На главную</span>
            </Link>
          </CollapsedNavTooltip>

          <CollapsedNavTooltip label="Выйти" collapsed={isSidebarCollapsed}>
            <button
              onClick={logout}
              className={cn(
                'flex w-full items-center rounded-lg text-sm font-medium text-mp-error-text transition-colors hover:bg-mp-error-bg/50',
                isSidebarCollapsed
                  ? 'gap-0 px-3 py-2 md:mx-auto md:h-11 md:w-11 md:justify-center md:px-0'
                  : 'gap-3 px-3 py-2',
              )}
            >
              <SignOut className="h-4.5 w-4.5 shrink-0" />
              <span className={cn(isSidebarCollapsed && 'md:hidden')}>Выйти</span>
            </button>
          </CollapsedNavTooltip>
        </div>
      </aside>
    </>
  );
}

export { ADMIN_SIDEBAR_WIDTH, ADMIN_SIDEBAR_COLLAPSED_WIDTH };
