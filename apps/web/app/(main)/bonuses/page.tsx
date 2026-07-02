'use client';

import { Gift, ClockCounterClockwise, Wallet, TrendUp, ArrowRight, Question } from '@phosphor-icons/react';
import Link from 'next/link';
import * as React from 'react';

import {
  BonusBalanceCard,
  BonusExpiringAlert,
  BonusStatsSummary,
  RecentTransactions,
  MonthlyComparisonCard,
} from '@/components/bonus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

/**
 * Bonus dashboard page
 */
export default function BonusDashboardPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden pb-[calc(112px+env(safe-area-inset-bottom,0px))] md:pb-12">
      <div className="absolute inset-0 -z-20 bg-[#05020d]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,5,22,0.72),rgba(5,2,13,0.98)_38%,rgba(5,2,13,1)),radial-gradient(circle_at_16%_6%,rgba(199,15,79,0.2),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(145,23,130,0.18),transparent_28%)]" />
      <div className="absolute inset-0 -z-10 bg-[url('/images/mobile-bg.png')] bg-cover bg-center opacity-22 md:hidden" />
    <Container size="xl" className="py-6 md:py-10">
      {/* Header */}
      <div className="mb-6 rounded-3xl border border-white/[0.08] bg-[linear-gradient(137deg,rgba(23,9,35,0.68),rgba(10,4,22,0.58)_46%,rgba(7,3,15,0.76))] p-5 shadow-[0_20px_56px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl md:p-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ff2d6f]/[0.24] bg-[#ff2d6f]/[0.12] text-[#ff7b9d]">
            <Gift className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold leading-tight text-white md:text-4xl">
            Мои бонусы
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-mp-text-secondary md:text-base">
          Зарабатывайте бонусы и используйте их при оплате или выводите на счёт
        </p>
      </div>

      {/* Expiring alert */}
      <BonusExpiringAlert variant="banner" className="mb-6" />

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          asChild
          className="justify-start gap-3 h-auto py-4"
        >
          <Link href="/bonuses/history">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#b94bff]/[0.18] bg-[#b94bff]/10 text-[#e5b7ff]">
              <ClockCounterClockwise className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">История</p>
              <p className="text-xs text-mp-text-secondary">
                Все транзакции
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-mp-text-secondary" />
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="justify-start gap-3 h-auto py-4"
        >
          <Link href="/bonuses/withdraw">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/[0.18] bg-emerald-300/10 text-emerald-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">Вывести</p>
              <p className="text-xs text-mp-text-secondary">
                На банковский счёт
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-mp-text-secondary" />
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="justify-start gap-3 h-auto py-4"
        >
          <Link href="/bonuses/withdraw/how-it-works">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#b94bff]/[0.18] bg-[#b94bff]/10 text-[#e5b7ff]">
              <Question className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">Как вывести</p>
              <p className="text-xs text-mp-text-secondary">
                Будущий процесс
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-mp-text-secondary" />
          </Link>
        </Button>

        <Button
          variant="outline"
          asChild
          className="justify-start gap-3 h-auto py-4"
        >
          <Link href="/pricing">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ff2d6f]/[0.22] bg-[#ff2d6f]/[0.12] text-[#ff7b9d]">
              <TrendUp className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">Использовать</p>
              <p className="text-xs text-mp-text-secondary">
                При покупке подписки
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-mp-text-secondary" />
          </Link>
        </Button>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Balance card - spans 2 columns */}
        <div className="lg:col-span-2">
          <BonusBalanceCard showActions={false} className="h-full" />
        </div>

        {/* Monthly comparison */}
        <MonthlyComparisonCard />
      </div>

      {/* Statistics */}
      <BonusStatsSummary className="mt-6" />

      {/* Recent transactions */}
      <Card className="mt-6 rounded-3xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.58),rgba(8,3,18,0.78))] shadow-[0_16px_42px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClockCounterClockwise className="h-5 w-5 text-blue-400" />
            Последние операции
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bonuses/history">
              Все операции
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RecentTransactions limit={5} />
        </CardContent>
      </Card>

      {/* How to earn section */}
      <Card className="mt-6 rounded-3xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.58),rgba(8,3,18,0.78))] shadow-[0_16px_42px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg">Как заработать бонусы?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EarningMethod
              icon="👥"
              title="Партнёрская программа"
              description="Приглашайте друзей и получайте комиссию с их покупок"
              link="/partner"
            />
            <EarningMethod
              icon="🎁"
              title="Промо-акции"
              description="Участвуйте в акциях и получайте бонусы"
              link="#"
            />
            <EarningMethod
              icon="⭐"
              title="Активность"
              description="Получайте бонусы за активность на платформе"
              link="#"
            />
            <EarningMethod
              icon="💰"
              title="Возвраты"
              description="При возврате средства начисляются бонусами"
              link="#"
            />
          </div>
        </CardContent>
      </Card>
    </Container>
    </div>
  );
}

/**
 * Earning method card
 */
function EarningMethod({
  icon,
  title,
  description,
  link,
}: {
  icon: string;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition-colors hover:border-[#ff2d6f]/[0.24] hover:bg-white/[0.055]"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-mp-text-primary">{title}</p>
        <p className="mt-1 text-sm text-mp-text-secondary">{description}</p>
      </div>
    </Link>
  );
}
