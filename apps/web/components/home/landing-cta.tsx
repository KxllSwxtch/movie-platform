'use client';

import { ArrowRight } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';

const bgImages = [
  'https://picsum.photos/seed/cta1/400/300',
  'https://picsum.photos/seed/cta2/400/300',
  'https://picsum.photos/seed/cta3/400/300',
  'https://picsum.photos/seed/cta4/400/300',
  'https://picsum.photos/seed/cta5/400/300',
  'https://picsum.photos/seed/cta6/400/300',
];

const avatars = [
  'https://picsum.photos/seed/face1/80/80',
  'https://picsum.photos/seed/face2/80/80',
  'https://picsum.photos/seed/face3/80/80',
  'https://picsum.photos/seed/face4/80/80',
  'https://picsum.photos/seed/face5/80/80',
];

export function LandingCTA() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background collage — tiled images, blurred + dimmed */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 opacity-20">
        {bgImages.map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <Image
              src={src}
              fill
              className="object-cover blur-sm brightness-50"
              alt=""
              sizes="33vw"
            />
          </div>
        ))}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#05060A]/80" />

      {/* Violet radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(201,75,255,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-mp-text-primary mb-4 md:mb-6">
              Готовы начать смотреть?
            </h2>

            <p className="text-base sm:text-lg text-mp-text-secondary mb-8 leading-relaxed">
              Присоединяйтесь бесплатно. Отмена подписки в любой момент.
            </p>

            {/* Stacked avatars */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex -space-x-3">
                {avatars.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-10 h-10 rounded-full border-2 border-[#05060A] overflow-hidden"
                    style={{ zIndex: avatars.length - i }}
                  >
                    <Image
                      src={src}
                      fill
                      className="object-cover"
                      alt=""
                      sizes="40px"
                    />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-mp-text-secondary mb-8">
              Присоединились{' '}
              <span className="text-mp-text-primary font-semibold">
                10,000+
              </span>{' '}
              зрителей
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Button
                variant="gradient"
                size="xl"
                className="w-full sm:w-auto shadow-lg shadow-mp-accent-primary/25"
                asChild
              >
                <Link href="/register">
                  Начать бесплатно
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" className="w-full sm:w-auto" asChild>
                <Link href="/pricing">Узнать о тарифах</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
