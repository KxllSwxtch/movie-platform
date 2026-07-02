'use client';

import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Info,
  Sparkle,
  WarningCircle,
} from '@phosphor-icons/react';
import Link from 'next/link';
import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinancialInfoPageShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FinancialInfoPageShell({
  children,
  className,
  contentClassName,
}: FinancialInfoPageShellProps) {
  return (
    <main
      className={cn(
        'relative isolate min-h-screen overflow-hidden pb-[calc(112px+env(safe-area-inset-bottom,0px))] pt-5 md:pb-16 md:pt-8',
        className
      )}
    >
      <div className="absolute inset-0 -z-30 bg-[#05020d]" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(11,5,22,0.72),rgba(5,2,13,0.98)_38%,rgba(5,2,13,1)),radial-gradient(circle_at_16%_6%,rgba(199,15,79,0.2),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(145,23,130,0.18),transparent_28%),radial-gradient(circle_at_52%_18%,rgba(106,31,179,0.12),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#ff2d6f]/[0.55] to-transparent" />
      <div className="absolute inset-0 -z-10 bg-[url('/images/mobile-bg.png')] bg-cover bg-center opacity-22 md:hidden" />
      <div
        className={cn(
          'mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 sm:px-6 md:gap-6 lg:px-8',
          contentClassName
        )}
      >
        {children}
      </div>
    </main>
  );
}

interface FutureFeatureBadgeProps {
  children?: React.ReactNode;
  className?: string;
}

export function FutureFeatureBadge({
  children = 'Готово к будущему модулю',
  className,
}: FutureFeatureBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'w-fit rounded-full border-[#ff2d6f]/30 bg-[#ff2d6f]/10 px-3 py-1 text-[11px] font-semibold text-[#ffd4df] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
        className
      )}
    >
      <Sparkle className="mr-1 h-3 w-3" />
      {children}
    </Badge>
  );
}

interface FinancialInfoHeroProps {
  icon: Icon;
  eyebrow?: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

export function FinancialInfoHero({
  icon: IconComponent,
  eyebrow,
  title,
  description,
  children,
  className,
}: FinancialInfoHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[linear-gradient(137deg,rgba(23,9,35,0.74),rgba(10,4,22,0.66)_46%,rgba(7,3,15,0.82))] p-5 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8 md:p-7',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(255,45,111,0.18),rgba(145,23,130,0.12),transparent)]" />
      <div className="min-w-0">
        <div className="relative mb-4 flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ff2d6f]/[0.24] bg-[linear-gradient(145deg,rgba(255,45,111,0.2),rgba(145,23,130,0.12))] text-[#ff6a91] shadow-[0_10px_28px_rgba(199,15,79,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <IconComponent className="h-5 w-5" />
          </div>
          {eyebrow}
        </div>
        <h1 className="relative max-w-3xl text-[clamp(1.75rem,3.2vw,2.85rem)] font-bold leading-[1.06] text-white">
          {title}
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-mp-text-secondary md:text-base md:leading-7">
          {description}
        </p>
      </div>
      {children && <div className="relative mt-5 flex flex-col gap-3 md:mt-0 md:min-w-56">{children}</div>}
    </section>
  );
}

export interface FinancialStep {
  title: string;
  description: string;
  icon: Icon;
}

interface FinancialStepCardProps extends FinancialStep {
  index: number;
  className?: string;
}

export function FinancialStepCard({
  index,
  title,
  description,
  icon: IconComponent,
  className,
}: FinancialStepCardProps) {
  return (
    <Card
      className={cn(
        'group h-full overflow-hidden rounded-2xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.62),rgba(9,4,19,0.78))] shadow-[0_16px_40px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl transition-colors hover:border-[#ff2d6f]/[0.22]',
        className
      )}
    >
      <CardContent className="flex h-full gap-4 p-4 md:p-5">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff2d6f]/[0.32] bg-[#ff2d6f]/[0.12] text-sm font-bold text-white shadow-[0_8px_20px_rgba(199,15,79,0.15)]">
            {index}
          </div>
          <div className="h-full min-h-10 w-px bg-gradient-to-b from-[#ff2d6f]/[0.38] to-transparent md:hidden" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#b94bff]/[0.18] bg-[#b94bff]/10 text-[#e5b7ff] transition-colors group-hover:bg-[#ff2d6f]/[0.12] group-hover:text-[#ff8aad]">
            <IconComponent className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-mp-text-secondary">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface FinancialStepsTimelineProps {
  steps: FinancialStep[];
  className?: string;
}

export function FinancialStepsTimeline({
  steps,
  className,
}: FinancialStepsTimelineProps) {
  return (
    <section className={cn('grid gap-3 md:grid-cols-2 xl:grid-cols-3', className)}>
      {steps.map((step, index) => (
        <FinancialStepCard key={step.title} {...step} index={index + 1} />
      ))}
    </section>
  );
}

type NoticeTone = 'info' | 'success' | 'warning';

const noticeToneConfig: Record<NoticeTone, { icon: Icon; className: string; iconClassName: string }> = {
  info: {
    icon: Info,
    className: 'border-[#b94bff]/[0.22] bg-[#b94bff]/[0.07]',
    iconClassName: 'border-[#b94bff]/20 bg-[#b94bff]/[0.12] text-[#e5b7ff]',
  },
  success: {
    icon: CheckCircle,
    className: 'border-emerald-300/[0.18] bg-emerald-300/[0.06]',
    iconClassName: 'border-emerald-300/[0.18] bg-emerald-300/10 text-emerald-300',
  },
  warning: {
    icon: WarningCircle,
    className: 'border-[#ffb86b]/[0.22] bg-[#ffb86b]/[0.07]',
    iconClassName: 'border-[#ffb86b]/20 bg-[#ffb86b]/[0.12] text-[#ffcf8a]',
  },
};

interface FinancialNoticeCardProps {
  title: string;
  description: string;
  tone?: NoticeTone;
  icon?: Icon;
  children?: React.ReactNode;
  className?: string;
}

export function FinancialNoticeCard({
  title,
  description,
  tone = 'info',
  icon,
  children,
  className,
}: FinancialNoticeCardProps) {
  const config = noticeToneConfig[tone];
  const IconComponent = icon ?? config.icon;

  return (
    <Card
      className={cn(
        'rounded-2xl border bg-[linear-gradient(145deg,rgba(20,8,34,0.58),rgba(8,3,18,0.74))] shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl',
        config.className,
        className
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start md:p-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border', config.iconClassName)}>
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-mp-text-secondary">{description}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

interface FinancialCTA {
  href: string;
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
}

interface FinancialCTAGroupProps {
  actions: FinancialCTA[];
  className?: string;
}

export function FinancialCTAGroup({ actions, className }: FinancialCTAGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap', className)}>
      {actions.map((action) => (
        <Button
          key={action.href}
          variant={action.variant ?? 'gradient'}
          asChild
          className="min-h-11 justify-center rounded-xl px-5 text-sm"
        >
          <Link href={action.href}>
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ))}
    </div>
  );
}

interface FinancialFAQItem {
  question: string;
  answer: string;
}

interface FinancialFAQProps {
  items: FinancialFAQItem[];
  className?: string;
}

export function FinancialFAQ({ items, className }: FinancialFAQProps) {
  return (
    <section className={cn('grid gap-4 md:grid-cols-2', className)}>
      {items.map((item) => (
        <Card
          key={item.question}
          className="rounded-2xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(20,9,34,0.56),rgba(8,3,18,0.72))] shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
        >
          <CardContent className="p-5">
            <h3 className="font-semibold text-white">{item.question}</h3>
            <p className="mt-2 text-sm leading-6 text-mp-text-secondary">{item.answer}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

interface FinancialProcessPreviewItem {
  label: string;
  value: string;
}

interface FinancialProcessPreviewProps {
  title: string;
  description: string;
  items: FinancialProcessPreviewItem[];
  className?: string;
}

export function FinancialProcessPreview({
  title,
  description,
  items,
  className,
}: FinancialProcessPreviewProps) {
  return (
    <Card className={cn('overflow-hidden rounded-2xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.58),rgba(8,3,18,0.74))] shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl', className)}>
      <CardContent className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ff2d6f]/20 bg-[#ff2d6f]/[0.12] text-[#ff8aad]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-mp-text-secondary">{description}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
            >
              <p className="text-xs uppercase tracking-[0.08em] text-mp-text-disabled">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
