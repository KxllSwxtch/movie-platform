'use client';

import { CheckCircle, GitBranch, ArrowLeft, ShieldCheck, XCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import * as React from 'react';

import { ReferralTreeView, ReferralLinkCompact } from '@/components/partner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  useConfirmPartnerVerificationRequest,
  usePartnerDashboard,
  usePartnerVerificationRequests,
  useReferralTree,
  useRejectPartnerVerificationRequest,
} from '@/hooks/use-partner';
import { usePartnerStore } from '@/stores/partner.store';

/**
 * Referral tree page
 */
export default function PartnerReferralsPage() {
  const { treeDepth } = usePartnerStore();
  const { data: tree, isLoading: isTreeLoading, refetch } = useReferralTree(treeDepth);
  const { data: dashboard } = usePartnerDashboard();
  const { data: verificationRequests } = usePartnerVerificationRequests();
  const confirmVerification = useConfirmPartnerVerificationRequest();
  const rejectVerification = useRejectPartnerVerificationRequest();

  const handleDepthChange = React.useCallback(
    (depth: number) => {
      refetch();
    },
    [refetch]
  );

  return (
    <Container size="xl" className="py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/partner">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к дашборду
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-mp-accent-secondary/20">
                <GitBranch className="h-6 w-6 text-mp-accent-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-mp-text-primary md:text-3xl">
                Мои рефералы
              </h1>
            </div>
            <p className="text-mp-text-secondary">
              Дерево рефералов до 5 уровней вглубь
            </p>
          </div>

          {dashboard?.referralUrl && (
            <ReferralLinkCompact referralUrl={dashboard.referralUrl} />
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-mp-accent-primary" />
            Запросы на подтверждение
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-mp-text-secondary">
            Подтверждать можно только прямых рефералов. После подтверждения заявка остается на финальной проверке администратора или модератора.
          </p>
          {verificationRequests?.items.length ? (
            <div className="space-y-2">
              {verificationRequests.items.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-lg border border-mp-border bg-mp-surface/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-mp-text-primary">
                        {request.user.firstName} {request.user.lastName}
                      </span>
                      <Badge variant={request.confirmedAt ? 'warning' : 'secondary'}>
                        {request.confirmedAt ? 'Подтверждено, ждет модератора' : 'Ожидает партнера'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-mp-text-secondary">{request.user.email}</div>
                    <div className="mt-1 text-xs text-mp-text-disabled">
                      Создана: {new Date(request.createdAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  {!request.confirmedAt && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!request.canConfirm || confirmVerification.isPending}
                        onClick={() => confirmVerification.mutate(request.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Подтвердить
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!request.canConfirm || rejectVerification.isPending}
                        onClick={() =>
                          rejectVerification.mutate({
                            id: request.id,
                            reason: 'Партнер не подтвердил связь с пользователем',
                          })
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-mp-border p-6 text-center text-sm text-mp-text-secondary">
              Активных запросов на партнерское подтверждение нет.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral tree */}
      <ReferralTreeView
        data={tree}
        isLoading={isTreeLoading}
        onDepthChange={handleDepthChange}
      />
    </Container>
  );
}
