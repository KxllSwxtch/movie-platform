'use client';

import Link from 'next/link';

import { SeshLogo } from '@/components/common/sesh-logo';
import { MobileHeader } from '@/components/layout/mobile-header';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

const navLinks = [
  { label: 'Сериалы', href: '/series' },
  { label: 'Обучение', href: '/tutorials' },
  { label: 'Тарифы', href: '/pricing' },
  { label: 'Партнерам', href: '/partner' },
];

export function LandingNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return (
    <>
      <MobileHeader mode="landing" />

      <header className="fixed left-0 right-0 top-0 z-50 hidden h-[104px] bg-transparent md:block">
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
        </div>
      </header>
    </>
  );
}
