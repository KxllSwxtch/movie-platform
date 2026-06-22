'use client';

import {
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useRef } from 'react';

import { ScrollReveal } from './scroll-reveal';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000, bounce: 0 });
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
      return undefined;
    } else {
      // Fallback: if IntersectionObserver hasn't fired within 2s, animate anyway
      const timer = setTimeout(() => {
        motionValue.set(value);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [inView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent =
          Math.round(latest).toLocaleString('ru-RU') + suffix;
      }
    });
    return unsubscribe;
  }, [springValue, suffix]);

  const formatted = value.toLocaleString('ru-RU') + suffix;

  if (prefersReducedMotion) {
    return (
      <span ref={ref} className="sesh-stat-value">
        {formatted}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className="sesh-stat-value"
    >
      {formatted}
    </span>
  );
}

function StatItem({ value, suffix, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-5 text-center">
      <AnimatedCounter value={value} suffix={suffix} />
      <span className="text-sm font-medium text-[#aeb8d0]">
        {label}
      </span>
    </div>
  );
}

const stats = [
  { value: 10000, suffix: '+', label: 'Единиц контента' },
  { value: 50000, suffix: '+', label: 'Зрителей' },
  { value: 4, suffix: 'K', label: 'Качество видео' },
  { value: 24, suffix: '/7', label: 'Поддержка' },
];

export function LandingStats() {
  return (
    <section className="sesh-lower-section sesh-section-stats py-14 md:py-20">
      <div className="sesh-section-inner container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="sesh-glass-panel sesh-stats-panel p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
              {stats.map((stat, i) => (
                <div key={i} className="relative">
                  <StatItem {...stat} />
                  {/* Glass divider — hidden on last item and on mobile between rows */}
                  {i < stats.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-1/2 h-14 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#c70f4f]/24 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
