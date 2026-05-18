'use client';

import { Check, Copy, GitBranch, ShoppingBag, Star, Users } from '@phosphor-icons/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBonusHistory } from '@/hooks/bonus';
import { useCommissions, usePartnerDashboard, useReferralTree } from '@/hooks/use-partner';
import { buildAbsoluteAppUrl, copyTextToClipboard } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

function formatNumber(value?: number) {
  return new Intl.NumberFormat('ru-RU').format(value ?? 0);
}

export default function AccountReferralsPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = React.useState(false);
  const { data: dashboard, isLoading } = usePartnerDashboard();
  const { data: tree } = useReferralTree(1);
  const { data: commissions } = useCommissions({ page: 1, limit: 8 });
  const { data: bonusHistory } = useBonusHistory({
    source: 'REFERRAL_BONUS',
    page: 1,
    limit: 8,
  });

  const isPartner = user?.role === 'PARTNER';

  if (!isPartner) {
    return (
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-mp-text-primary">Реферальная система</h1>
          <p className="mt-2 text-mp-text-secondary">
            Реферальная система доступна партнёрам платформы.
          </p>
        </CardContent>
      </Card>
    );
  }

  const referralUrl =
    dashboard?.referralUrl ||
    `/register?ref=${dashboard?.referralCode || user?.referralCode || ''}`;
  const absoluteReferralUrl = buildAbsoluteAppUrl(referralUrl);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(absoluteReferralUrl);
    if (ok) {
      setCopied(true);
      toast.success('Ссылка скопирована');
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error('Не удалось скопировать. Выделите ссылку вручную.');
    }
  };

  const purchasesCount = commissions?.items?.length ?? 0;
  const accruedPoints =
    bonusHistory?.items?.reduce((sum, item) => sum + Math.max(0, item.amount), 0) ??
    dashboard?.totalEarnings ??
    0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mp-text-primary">Реферальная система</h1>
        <p className="mt-1 text-sm text-mp-text-secondary">
          Ссылка, статистика приглашений и история начисления баллов.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Реферальная ссылка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1 rounded-lg border border-mp-border bg-mp-bg-primary px-3 py-2 text-sm text-mp-text-secondary">
              <span className="block truncate">{isLoading ? 'Загрузка...' : absoluteReferralUrl}</span>
            </div>
            <Button onClick={handleCopy} disabled={isLoading} data-testid="copy-account-referral-link">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Скопировано' : 'Скопировать'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Приглашено', value: dashboard?.totalReferrals ?? tree?.stats?.totalReferrals, icon: Users },
          { label: 'Покупки', value: purchasesCount, icon: ShoppingBag },
          { label: 'Начислено баллов', value: accruedPoints, icon: Star },
          { label: 'Статус партнёра', value: dashboard?.levelName || 'Партнёр', icon: GitBranch },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-mp-accent-primary/15 p-2 text-mp-accent-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-mp-text-secondary">{item.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-6 w-20" />
                ) : (
                  <p className="truncate text-lg font-semibold text-mp-text-primary">
                    {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История начислений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bonusHistory?.items?.length ? (
            bonusHistory.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-mp-border p-3">
                <div>
                  <p className="text-sm font-medium text-mp-text-primary">{item.description}</p>
                  <p className="text-xs text-mp-text-secondary">
                    {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">+{formatNumber(item.amount)}</span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-mp-text-secondary">
              Начислений пока нет. Они появятся после успешных оплат по вашей ссылке.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
