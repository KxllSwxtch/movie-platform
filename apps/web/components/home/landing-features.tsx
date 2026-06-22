'use client';

import {
  Play,
  Sparkle,
  Users,
  Shield,
  Monitor,
  Brain,
} from '@phosphor-icons/react';

import { ScrollReveal } from './scroll-reveal';

interface Feature {
  icon: typeof Play;
  title: string;
  description: string;
  accent: string; // hex
  glowColor: string; // rgba for shadow
}

const features: Feature[] = [
  {
    icon: Play,
    title: 'HD Качество',
    description:
      'Смотрите в Full HD и 4K с адаптивным стримингом на любом устройстве',
    accent: '#D70A2A',
    glowColor: 'rgba(215,10,42,0.28)',
  },
  {
    icon: Sparkle,
    title: 'Бонусная система',
    description:
      'Получайте бонусы за активность и тратьте их на любой контент платформы',
    accent: '#0F66EB',
    glowColor: 'rgba(15,102,235,0.28)',
  },
  {
    icon: Users,
    title: 'Партнерская программа',
    description:
      'Приглашайте друзей и получайте до 15% от их платежей на 5 уровнях',
    accent: '#C70F4F',
    glowColor: 'rgba(199,15,79,0.28)',
  },
  {
    icon: Shield,
    title: 'Безопасность',
    description:
      'Возрастные ограничения и надёжная защита вашего аккаунта и данных',
    accent: '#B11164',
    glowColor: 'rgba(177,17,100,0.26)',
  },
  {
    icon: Monitor,
    title: 'Мультиустройства',
    description:
      'Смотрите на телефоне, планшете, ноутбуке или телевизоре без ограничений',
    accent: '#3A3ED8',
    glowColor: 'rgba(58,62,216,0.26)',
  },
  {
    icon: Brain,
    title: 'Умные рекомендации',
    description:
      'Персональные подборки на основе ваших предпочтений и истории просмотров',
    accent: '#6D1BAC',
    glowColor: 'rgba(109,27,172,0.27)',
  },
];

export function LandingFeatures() {
  return (
    <section className="sesh-lower-section sesh-section-features py-16 md:py-24">
      <div className="sesh-section-inner container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="sesh-section-heading mb-10 max-w-lg md:mb-14">
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
              Почему выбирают нас
            </h2>
            <p className="leading-relaxed text-[#aeb8d0]">
              Платформа, созданная для удобства и качественного контента
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 0.08}>
              <div className="group relative h-full sesh-feature-wrap">
                {/* Gradient border — visible on hover */}
                <div
                  className="absolute -inset-px rounded-[18px] opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${feature.accent}55, rgba(15,102,235,0.18), transparent 70%)`,
                  }}
                />

                {/* Card content */}
                <div className="sesh-feature-card relative h-full p-6 transition-all duration-300 group-hover:-translate-y-1">
                  {/* Icon with accent glow */}
                  <div
                    className="sesh-icon-capsule mb-5 flex h-11 w-11 items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(215,10,42,0.24), rgba(177,17,100,0.18), rgba(15,102,235,0.18))',
                      boxShadow: `0 0 22px ${feature.glowColor}`,
                    }}
                  >
                    <feature.icon
                      className="w-5 h-5 transition-colors duration-300"
                      style={{ color: feature.accent }}
                    />
                  </div>

                  <h3 className="mb-2 font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#aeb8d0]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
