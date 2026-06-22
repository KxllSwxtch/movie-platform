'use client';

import { PaperPlaneTilt, InstagramLogo, YoutubeLogo } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

import { SeshLogo } from '@/components/common/sesh-logo';
import { Button } from '@/components/ui/button';

const footerLinks = {
  content: [
    { label: 'Сериалы', href: '/series' },
    { label: 'Обучение', href: '/tutorials' },
    { label: 'Видео', href: '/videos' },
    { label: 'Шортс', href: '/shorts' },
  ],
  company: [
    { label: 'О нас', href: '/about' },
    { label: 'Партнерам', href: '/partner' },
    { label: 'Тарифы', href: '/pricing' },
    { label: 'Поддержка', href: '/support' },
  ],
  legal: [
    { label: 'Условия использования', href: '/documents/terms' },
    { label: 'Конфиденциальность', href: '/documents/privacy' },
    { label: 'Правила платформы', href: '/documents/rules' },
  ],
};

const socialLinks = [
  { icon: YoutubeLogo, href: '#', label: 'YouTube' },
  { icon: InstagramLogo, href: '#', label: 'Instagram' },
  { icon: PaperPlaneTilt, href: '#', label: 'Telegram' },
];

export function LandingFooter() {
  const [email, setEmail] = useState('');

  return (
    <footer className="sesh-lower-section sesh-footer relative pb-8 pt-12 md:pt-16">
      <div className="sesh-section-inner container mx-auto px-4 sm:px-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 mb-10 md:mb-12">
          {/* Brand + Social */}
          <div className="col-span-2 md:col-span-2">
            <SeshLogo
              href="/"
              className="mb-4"
              imageClassName="h-10 w-auto"
            />
            <p className="text-sm text-[#aeb8d0] leading-relaxed mb-6 max-w-xs">
              Платформа для качественного видеоконтента и обучающих материалов
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="sesh-social-button flex h-10 w-10 items-center justify-center"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Content links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">
              Контент
            </h4>
            <ul className="space-y-3">
              {footerLinks.content.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="sesh-footer-link relative text-sm"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-mp-accent-primary group-hover:w-full transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">
              Компания
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="sesh-footer-link relative text-sm"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-mp-accent-primary group-hover:w-full transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Newsletter */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">
              Документы
            </h4>
            <ul className="space-y-3 mb-6">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="sesh-footer-link relative text-sm"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-mp-accent-primary group-hover:w-full transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <div className="hidden md:block">
              <p className="text-xs text-[#7f8aa6] mb-2">Рассылка</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="sesh-footer-input h-9 min-w-0 flex-1 px-3 text-sm"
                />
                <Button variant="glass" size="sm" className="sesh-landing-secondary">
                  Подписаться
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#c70f4f]/14 pt-8 md:flex-row">
          <p className="text-sm text-[#7f8aa6]" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} SESH. Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/documents/terms"
              className="text-sm text-[#aeb8d0] transition-colors hover:text-white"
            >
              Условия
            </Link>
            <Link
              href="/documents/privacy"
              className="text-sm text-[#aeb8d0] transition-colors hover:text-white"
            >
              Конфиденциальность
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
