'use client';

import { ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';

const avatarGradients = [
  'linear-gradient(135deg, #D70A2A, #911782)',
  'linear-gradient(135deg, #D00F47, #0F66EB)',
  'linear-gradient(135deg, #B11164, #3A3ED8)',
  'linear-gradient(135deg, #D70E35, #6D1BAC)',
  'linear-gradient(135deg, #C70F4F, #0F66EB)',
];

export function LandingCTA() {
  return (
    <section className="sesh-lower-section sesh-section-cta py-16 md:py-24">
      <div className="sesh-section-inner container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="sesh-cta-panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 md:px-14 md:py-14">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:mb-6 md:text-4xl">
              Готовы начать смотреть?
            </h2>

            <p className="mb-8 text-base leading-relaxed text-[#aeb8d0] sm:text-lg">
              Присоединяйтесь бесплатно. Отмена подписки в любой момент.
            </p>

            {/* Stacked avatars */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex -space-x-3">
                {avatarGradients.map((gradient, i) => (
                  <div
                    key={i}
                    className="sesh-avatar-dot h-10 w-10 rounded-full"
                    style={{ zIndex: avatarGradients.length - i, background: gradient }}
                  />
                ))}
              </div>
            </div>

            <p className="mb-8 text-sm text-[#aeb8d0]">
              Присоединились{' '}
              <span className="font-semibold text-white">
                10,000+
              </span>{' '}
              зрителей
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Button
                variant="gradient"
                size="xl"
                className="sesh-landing-primary w-full sm:w-auto"
                asChild
              >
                <Link href="/register">
                  Начать бесплатно
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" className="sesh-landing-secondary w-full sm:w-auto" asChild>
                <Link href="/pricing">Узнать о тарифах</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
