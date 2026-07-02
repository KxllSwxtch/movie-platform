'use client';

import {
  ArrowRight,
  ClockCounterClockwise,
  Coins,
  CreditCard,
  Gift,
  Wallet,
} from '@phosphor-icons/react';
import Link from 'next/link';

import { BonusBalanceCard } from '@/components/bonus';
import {
  FinancialCTAGroup,
  FinancialNoticeCard,
  FutureFeatureBadge,
} from '@/components/finance';
import {
  TransactionCard,
  TransactionCardSkeleton,
} from '@/components/payment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionHistory } from '@/hooks';

export default function AccountWalletPage() {
  const {
    data: transactions,
    isLoading,
    error,
  } = useTransactionHistory({ page: 1, limit: 3 });

  const recentTransactions = transactions?.items ?? [];

  return (
    <div className="relative pb-[calc(112px+env(safe-area-inset-bottom,0px))] md:pb-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d5203a]/15 text-[#ff6a78]">
              <Wallet className="h-6 w-6" />
            </div>
            <FutureFeatureBadge>Финансовый центр</FutureFeatureBadge>
          </div>
          <h1 className="text-2xl font-bold text-mp-text-primary md:text-3xl">
            Кошелек
          </h1>
          <p className="mt-2 max-w-2xl text-mp-text-secondary">
            Здесь собраны бонусы, будущий баланс токенов и история финансовых операций.
            Раздел подготовлен так, чтобы его можно было расширять без редизайна.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/account/payments">
            История платежей
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <BonusBalanceCard showActions={false} className="h-full" />

        <Card className="h-full overflow-hidden rounded-3xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(24,8,38,0.62),rgba(8,3,18,0.82))] shadow-[0_20px_54px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-[#e5b7ff]" />
              Баланс токенов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-sm text-mp-text-secondary">Будущий баланс</p>
              <p className="mt-2 text-3xl font-bold text-mp-text-primary">Будет доступен</p>
              <p className="mt-3 text-sm leading-6 text-mp-text-secondary">
                Функция будет доступна после подключения финансового модуля.
                Сейчас здесь не отображаются тестовые или фиктивные токены.
              </p>
            </div>
            <FinancialCTAGroup
              actions={[
                { href: '/tokens/how-to-buy', label: 'Как купить токены' },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <FinancialNoticeCard
          title="Бонусный баланс"
          description="Используйте текущий бонусный баланс как источник правды для будущего вывода и финансовых операций."
          icon={Gift}
          tone="success"
        />
        <FinancialNoticeCard
          title="Платежные методы"
          description="Выбор и сохранение методов оплаты должны подключаться только через защищенный платежный слой."
          icon={CreditCard}
          tone="info"
        />
        <FinancialNoticeCard
          title="Статусы операций"
          description="Здесь будет отображаться статус операций: успешно, ожидает оплаты, ошибка или возврат."
          icon={ClockCounterClockwise}
          tone="warning"
        />
      </div>

      <Card className="mt-6 rounded-3xl border-white/[0.08] bg-[linear-gradient(145deg,rgba(20,9,34,0.58),rgba(8,3,18,0.78))] shadow-[0_16px_42px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClockCounterClockwise className="h-5 w-5 text-[#69bfff]" />
            Последние финансовые операции
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account/payments">
              Все операции
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <TransactionCardSkeleton key={item} />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <FinancialNoticeCard
              title="Не удалось загрузить операции"
              description="История будет доступна после успешной загрузки данных платежного раздела."
              tone="warning"
            />
          )}

          {!isLoading && !error && recentTransactions.length === 0 && (
            <FinancialNoticeCard
              title="История операций пока пуста"
              description="После подключения покупок, выводов и возвратов здесь появятся последние финансовые события."
              tone="info"
            />
          )}

          {!isLoading && !error && recentTransactions.length > 0 && (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <FinancialCTAGroup
          actions={[
            { href: '/bonuses/withdraw/how-it-works', label: 'Как вывести бонусы' },
            { href: '/tokens/how-to-buy', label: 'Как купить токены', variant: 'outline' },
            { href: '/account/payments', label: 'История платежей', variant: 'outline' },
          ]}
        />
      </div>
    </div>
  );
}
