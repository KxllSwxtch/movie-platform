'use client';

import { List, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SeshLogo } from '@/components/common/sesh-logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

const navLinks = [
  { label: 'Сериалы', href: '/series' },
  { label: 'Обучение', href: '/tutorials' },
  { label: 'Тарифы', href: '/pricing' },
  { label: 'Партнерам', href: '/partner' },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 h-[104px] bg-transparent">
        <div className="relative mx-auto h-full max-w-[1693px]">
          <SeshLogo
            href="/"
            className="absolute left-[30px] top-[23px] z-10"
            imageClassName="h-10 w-auto md:h-12"
            priority
          />

          <nav className="absolute left-[641px] top-[45px] hidden items-center gap-[49px] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[17px] font-bold leading-none text-white transition-opacity hover:opacity-80"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="absolute right-[49px] top-[28px] hidden items-center gap-[31px] sm:flex">
            {isHydrated && isAuthenticated ? (
              <Button variant="gradient" className="sesh-header-start h-[49px] px-[29px]" asChild>
                <Link href="/dashboard">Личный кабинет</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[19px] font-normal leading-none text-white transition-opacity hover:opacity-80"
                >
                  Войти
                </Link>
                <Button variant="gradient" className="sesh-header-start h-[49px] w-[122px]" asChild>
                  <Link href="/register">Начать</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="absolute right-6 top-6 z-10 p-2 text-white md:hidden"
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 right-0 top-0 w-[280px] border-l border-white/10 bg-[#080414]/95 px-6 pt-24">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-semibold text-white hover:bg-white/[0.05]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              {isHydrated && isAuthenticated ? (
                <Button variant="gradient" className="sesh-landing-primary h-12 w-full justify-center" asChild>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Личный кабинет
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="sesh-landing-secondary h-12 w-full justify-center" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Войти
                    </Link>
                  </Button>
                  <Button variant="gradient" className="sesh-landing-primary h-12 w-full justify-center" asChild>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      Начать
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
