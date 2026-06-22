'use client';

import { Check, ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollReveal } from './scroll-reveal';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  featured: boolean;
  badge?: string;
  buttonVariant: 'ghost' | 'gradient' | 'outline';
}

const plans: PricingPlan[] = [
  {
    name: 'Базовый',
    price: '0₽',
    period: 'навсегда',
    description: 'Для знакомства с платформой',
    features: [
      'Доступ к бесплатному контенту',
      'SD качество (480p)',
      'Просмотр на 1 устройстве',
      'Базовые рекомендации',
    ],
    featured: false,
    buttonVariant: 'ghost',
  },
  {
    name: 'Стандарт',
    price: '299₽',
    period: '/мес',
    description: 'Всё, что нужно для комфортного просмотра',
    features: [
      'Весь каталог сериалов и курсов',
      'Full HD качество (1080p)',
      'Просмотр на 3 устройствах',
      'Бонусная программа',
      'Без рекламы',
    ],
    featured: true,
    badge: 'Популярный',
    buttonVariant: 'gradient',
  },
  {
    name: 'Премиум',
    price: '599₽',
    period: '/мес',
    description: 'Максимум возможностей',
    features: [
      'Ранний доступ к новинкам',
      '4K Ultra HD + HDR',
      'Просмотр на 5 устройствах',
      'Приоритетная поддержка',
      'Партнерская программа',
    ],
    featured: false,
    buttonVariant: 'outline',
  },
];

export function LandingPricing() {
  return (
    <section className="sesh-lower-section sesh-section-pricing py-16 md:py-24">
      <div className="sesh-section-inner container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-14">
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
              Выберите свой тариф
            </h2>
            <p className="mx-auto max-w-md text-[#aeb8d0]">
              Начните бесплатно и переходите на премиум, когда будете готовы
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div
                className={cn(
                  'relative h-full',
                  plan.featured && 'md:-mt-4 md:mb-[-16px]'
                )}
              >
                {/* Gradient border for featured card */}
                {plan.featured && (
                  <div className="absolute -inset-px rounded-2xl bg-[linear-gradient(135deg,rgba(215,10,42,0.72),rgba(177,17,100,0.46),rgba(58,62,216,0.34),rgba(15,102,235,0.32))]" />
                )}

                <div
                  className={cn(
                    'sesh-pricing-card relative flex h-full flex-col p-6 md:p-7',
                    plan.featured
                      ? 'sesh-pricing-card-featured'
                      : ''
                  )}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="sesh-price-badge px-4 py-1.5 text-xs font-semibold">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-[#aeb8d0]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl md:text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-[#aeb8d0] ml-1">
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check
                          className={cn(
                            'w-4 h-4 mt-0.5 flex-shrink-0',
                            plan.featured
                              ? 'text-[#0F66EB]'
                              : 'text-[#C70F4F]/70'
                          )}
                        />
                        <span className="text-sm text-[#aeb8d0]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.buttonVariant}
                    size="lg"
                    className={cn(
                      'w-full shrink-0 justify-center',
                      plan.buttonVariant === 'gradient'
                        ? 'sesh-landing-primary'
                        : 'sesh-landing-secondary'
                    )}
                    asChild
                  >
                    <Link href="/register">
                      Начать
                      {plan.featured && <ArrowRight className="w-4 h-4" />}
                    </Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="text-center mt-8 md:mt-10">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm text-[#aeb8d0] transition-colors hover:text-white"
            >
              Подробнее о тарифах
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
