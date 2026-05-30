'use client';

import { ArrowRight, Clock, Wallet } from '@phosphor-icons/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBonusBalance, useBonusRate, useBonusWithdrawals } from '@/hooks/bonus';
import { canUsePartnerDashboard } from '@/lib/role-permissions';
import { useAuthStore } from '@/stores/auth.store';

function formatRub(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPoints(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount));
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'на рассмотрении',
  APPROVED: 'одобрено',
  REJECTED: 'отклонено',
  COMPLETED: 'выполнено',
  PROCESSING: 'в обработке',
};

export default function AccountWithdrawalsPage() {
  const { user } = useAuthStore();
  const { data: balance } = useBonusBalance();
  const { data: rate } = useBonusRate();
  const { data: withdrawals } = useBonusWithdrawals();

  const canAccessPartnerDashboard = canUsePartnerDashboard(
    user?.role,
    user?.verificationStatus,
  );

  if (!canAccessPartnerDashboard) {
    return (
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-mp-text-primary">Вывод средств</h1>
          <p className="mt-2 text-mp-text-secondary">
            Вывод баллов в рубли доступен партнёрам платформы.
          </p>
        </CardContent>
      </Card>
    );
  }

  const points = balance?.balance ?? user?.bonusBalance ?? 0;
  const rubRate = rate?.rate ?? 1;
  const rubBalance = points * rubRate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mp-text-primary">Вывод средств</h1>
        <p className="mt-1 text-sm text-mp-text-secondary">
          Баланс, конвертация баллов в рубли и история заявок.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-mp-text-secondary">Баланс баллов</p>
            <p className="mt-2 text-2xl font-bold text-mp-text-primary">{formatPoints(points)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-mp-text-secondary">К выводу в рублях</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{formatRub(rubBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-mp-text-secondary">Курс</p>
            <p className="mt-2 text-2xl font-bold text-mp-text-primary">1 балл = {formatRub(rubRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Подготовлено к подключению выплат</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-mp-accent-primary/15 p-2 text-mp-accent-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-mp-text-primary">
                Статусы заявок: {Object.values(STATUS_LABELS).join(', ')}.
              </p>
              <p className="mt-1 text-sm text-mp-text-secondary">
                Backend уже хранит заявки и расчёт курса, позже сюда подключаются YooKassa, SBP, крипта или банк.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/bonuses/withdraw">
              Создать заявку
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История выводов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {withdrawals?.length ? (
            withdrawals.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-mp-border p-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-mp-text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mp-text-primary">
                      {STATUS_LABELS[item.status] ?? item.status}
                      {item.rejectionReason ? `: ${item.rejectionReason}` : ''}
                    </p>
                    <p className="text-xs text-mp-text-secondary">
                      {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-mp-text-primary">
                  {formatPoints(item.bonusAmount)} / {formatRub(item.netAmount)}
                </span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-mp-text-secondary">
              Заявок на вывод пока нет.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
