'use client';

import { CaretLeft, CaretRight, Plus, SquaresFour } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CollapsedNavTooltip } from '@/components/layout/collapsed-nav-tooltip';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';

const STUDIO_NAV = [
  { href: '/studio', icon: SquaresFour, label: 'Мой контент', exact: true },
  { href: '/studio/create', icon: Plus, label: 'Создать' },
];

export function StudioSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        'hidden shrink-0 transition-[width] duration-300 lg:block',
        isSidebarCollapsed ? 'w-[76px]' : 'w-56',
      )}
    >
      <div className="sticky top-24 space-y-1">
        <div className={cn('mb-3 px-3', isSidebarCollapsed && 'hidden')}>
          <span className="text-xs font-medium uppercase tracking-wider text-mp-text-secondary">
            Студия
          </span>
        </div>
        <nav className="space-y-1">
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className={cn(
              'sesh-nav-item mb-2 hidden w-full items-center rounded-lg text-sm font-medium transition-colors lg:flex',
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

          {STUDIO_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <CollapsedNavTooltip key={item.href} label={item.label} collapsed={isSidebarCollapsed}>
                <Link
                  href={item.href}
                  className={cn(
                    'sesh-nav-item flex items-center rounded-lg text-sm font-medium transition-colors',
                    isSidebarCollapsed ? 'h-11 justify-center gap-0 px-0' : 'gap-3 px-3 py-2.5',
                    isActive && 'sesh-nav-item-active',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={cn('truncate', isSidebarCollapsed && 'hidden')}>
                    {item.label}
                  </span>
                </Link>
              </CollapsedNavTooltip>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function StudioMobileTabs() {
  const pathname = usePathname();

  return (
    <div className="sesh-account-mobile-tabs lg:hidden mb-6">
      <div className="sesh-account-mobile-tabs-grid">
        {STUDIO_NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sesh-nav-item flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive && 'sesh-nav-item-active',
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
