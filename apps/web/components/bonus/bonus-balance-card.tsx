'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Gift,
  ArrowsClockwise,
  TrendUp,
  Wallet,
} from '@phosphor-icons/react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useBonus, formatBonusAmount, useBonusStatistics } from '@/hooks/use-bonus';

/**
 * Full bonus balance card with statistics
 */
interface BonusBalanceCardProps {
  showActions?: boolean;
  showStatistics?: boolean;
  className?: string;
}

export function BonusBalanceCard({
  showActions = true,
  showStatistics = true,
  className,
}: BonusBalanceCardProps) {
  const {
    balance,
    lifetimeEarned,
    lifetimeSpent,
    expiringIn30Days,
    isLoading,
    refetchBalance,
  } = useBonus();

  const { data: statistics, isLoading: isLoadingStats } = useBonusStatistics();

  return (
    <Card className={cn('overflow-hidden rounded-3xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.68),rgba(8,3,18,0.84))] shadow-[0_20px_54px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl', className)}>
      {/* Header */}
      <CardHeader className="border-b border-white/[0.06] bg-[linear-gradient(90deg,rgba(255,45,111,0.13),rgba(145,23,130,0.08),transparent)] pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#ff2d6f]/[0.24] bg-[#ff2d6f]/[0.12] text-[#ff7b9d]">
                <Gift className="h-4 w-4" />
              </span>
              Баланс бонусов
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchBalance()}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.035]"
          >
            <ArrowsClockwise
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {/* Main balance */}
        <div className="mb-6 rounded-3xl border border-white/[0.07] bg-white/[0.035] px-4 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {isLoading ? (
            <Skeleton className="mx-auto h-12 w-48" />
          ) : (
            <div>
              <span className="text-4xl font-bold leading-none text-white md:text-5xl">
                {formatBonusAmount(balance)}
              </span>
              <span className="ml-2 text-xl text-mp-text-secondary">₽</span>
            </div>
          )}
          <p className="mt-1 text-sm text-mp-text-secondary">
            Доступно для использования
          </p>
        </div>

        {/* Statistics grid */}
        {showStatistics && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatItem
              icon={TrendUp}
              iconColor="text-green-400"
              label="Всего заработано"
              value={formatBonusAmount(lifetimeEarned)}
              isLoading={isLoading}
            />
            <StatItem
              icon={ArrowUpRight}
              iconColor="text-red-400"
              label="Всего потрачено"
              value={formatBonusAmount(lifetimeSpent)}
              isLoading={isLoading}
            />
            <StatItem
              icon={ArrowDownLeft}
              iconColor="text-blue-400"
              label="За этот месяц"
              value={formatBonusAmount(statistics?.earnedThisMonth ?? 0)}
              isLoading={isLoadingStats}
            />
            <StatItem
              icon={Clock}
              iconColor="text-yellow-400"
              label="Истекает (30 дней)"
              value={formatBonusAmount(expiringIn30Days)}
              isLoading={isLoading}
              highlight={expiringIn30Days > 0}
            />
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2">
            <Button asChild className="flex-1">
              <Link href="/bonuses">
                <Gift className="mr-2 h-4 w-4" />
                Подробнее
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/bonuses/withdraw">
                <Wallet className="mr-2 h-4 w-4" />
                Вывести
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Single stat item
 */
interface StatItemProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  isLoading?: boolean;
  highlight?: boolean;
}

function StatItem({
  icon: Icon,
  iconColor,
  label,
  value,
  isLoading,
  highlight,
}: StatItemProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
        highlight && 'border-[#ffb86b]/[0.32] bg-[#ffb86b]/[0.07]'
      )}
    >
      <Icon className={cn('mx-auto mb-1 h-4 w-4', iconColor)} />
      {isLoading ? (
        <Skeleton className="mx-auto mb-1 h-5 w-16" />
      ) : (
        <p
          className={cn(
            'text-lg font-semibold',
            highlight ? 'text-[#ffcf8a]' : 'text-mp-text-primary'
          )}
        >
          {value}
        </p>
      )}
      <p className="mt-1 text-xs leading-4 text-mp-text-secondary">{label}</p>
    </div>
  );
}

/**
 * Skeleton for the full card
 */
export function BonusBalanceCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden rounded-3xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.68),rgba(8,3,18,0.84))] shadow-[0_20px_54px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl', className)}>
      <CardHeader className="border-b border-white/[0.06] bg-[linear-gradient(90deg,rgba(255,45,111,0.13),rgba(145,23,130,0.08),transparent)] pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="mb-6 rounded-3xl border border-white/[0.07] bg-white/[0.035] px-4 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Skeleton className="mx-auto h-12 w-48" />
          <Skeleton className="mx-auto mt-1 h-4 w-40" />
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-center"
            >
              <Skeleton className="mx-auto mb-1 h-4 w-4" />
              <Skeleton className="mx-auto mb-1 h-5 w-16" />
              <Skeleton className="mx-auto h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
