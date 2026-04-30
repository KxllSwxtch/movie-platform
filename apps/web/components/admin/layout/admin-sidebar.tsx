'use client';

import {
  ChartBar,
  FilmStrip,
  Play,
  SignOut,
  SquaresFour,
  Users,
  X,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
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
    ],
  },
  {
    label: 'Контент',
    items: [
      { href: '/admin/content', icon: FilmStrip, label: 'Библиотека контента' },
    ],
  },
];

const ADMIN_SIDEBAR_WIDTH = 250;

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

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
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/10 bg-mp-bg-secondary/95 shadow-2xl shadow-black/20 backdrop-blur-xl transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          className
        )}
        style={{ width: ADMIN_SIDEBAR_WIDTH }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
            onClick={handleNavClick}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mp-accent-primary shadow-glow-primary">
              <Play className="h-4 w-4 text-white" weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none text-mp-text-primary">
                MoviePlatform
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-mp-text-disabled">
                Модерация
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md p-2 text-mp-text-secondary transition-colors hover:bg-white/5 hover:text-mp-text-primary md:hidden"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {adminNavGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-3">
                <span className="text-xs font-medium uppercase tracking-wider text-mp-text-disabled">
                  {group.label}
                </span>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        active
                          ? 'bg-mp-accent-primary text-white shadow-glow-primary'
                          : 'text-mp-text-secondary hover:bg-white/5 hover:text-mp-text-primary'
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 px-3 py-4">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-mp-text-secondary transition-colors hover:bg-white/5 hover:text-mp-text-primary"
          >
            <Play className="h-4.5 w-4.5 shrink-0" />
            <span>На главную</span>
          </Link>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-mp-error-text transition-colors hover:bg-mp-error-bg/50"
          >
            <SignOut className="h-4.5 w-4.5 shrink-0" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export { ADMIN_SIDEBAR_WIDTH };
