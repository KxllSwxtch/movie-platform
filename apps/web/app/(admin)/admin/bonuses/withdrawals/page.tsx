'use client';

import * as React from 'react';
import { CheckCircle, Clock, Eye, XCircle } from '@phosphor-icons/react';

import { AdminPageHeader } from '@/components/admin/layout/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  type AdminBonusWithdrawal,
  useAdminBonusWithdrawals,
  useUpdateBonusWithdrawalStatus,
} from '@/hooks/use-admin-bonus';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const;

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Все',
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрено',
  COMPLETED: 'Выполнено',
  REJECTED: 'Отклонено',
  PROCESSING: 'В обработке',
};

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

function formatUser(withdrawal: AdminBonusWithdrawal) {
  const name = [withdrawal.user?.firstName, withdrawal.user?.lastName].filter(Boolean).join(' ');
  return name || withdrawal.user?.email || withdrawal.userId;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'COMPLETED'
      ? 'success'
      : status === 'REJECTED'
        ? 'destructive'
        : status === 'APPROVED'
          ? 'secondary'
          : 'outline';

  return <Badge variant={variant as never}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export default function AdminBonusWithdrawalsPage() {
  const [status, setStatus] = React.useState<(typeof STATUS_OPTIONS)[number]>('PENDING');
  const [selected, setSelected] = React.useState<AdminBonusWithdrawal | null>(null);
  const [action, setAction] = React.useState<'approve' | 'reject' | 'complete' | null>(null);
  const [note, setNote] = React.useState('');

  const { data: withdrawals = [], isLoading } = useAdminBonusWithdrawals(status);
  const updateStatus = useUpdateBonusWithdrawalStatus();

  const openAction = (
    withdrawal: AdminBonusWithdrawal,
    nextAction: 'approve' | 'reject' | 'complete',
  ) => {
    setSelected(withdrawal);
    setAction(nextAction);
    setNote('');
  };

  const closeDialog = () => {
    setSelected(null);
    setAction(null);
    setNote('');
  };

  const submitAction = () => {
    if (!selected || !action) return;
    updateStatus.mutate(
      { id: selected.id, action, note },
      { onSuccess: closeDialog },
    );
  };

  return (
    <Container size="xl" className="py-8">
      <AdminPageHeader
        title="Заявки на вывод баллов"
        description="Проверка, одобрение и завершение выплат партнёрам"
      >
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminPageHeader>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-5 w-56" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </CardContent>
            </Card>
          ))
        ) : withdrawals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <Clock className="mb-3 h-10 w-10 text-mp-text-secondary" />
              <p className="text-sm text-mp-text-secondary">Заявок с таким статусом нет.</p>
            </CardContent>
          </Card>
        ) : (
          withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-semibold text-mp-text-primary">
                      {formatUser(withdrawal)}
                    </h2>
                    <StatusBadge status={withdrawal.status} />
                    <span className="text-xs text-mp-text-secondary">
                      {new Date(withdrawal.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-mp-text-secondary">Баллы</p>
                      <p className="font-semibold text-mp-text-primary">
                        {formatPoints(withdrawal.bonusAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-mp-text-secondary">К выплате</p>
                      <p className="font-semibold text-mp-text-primary">
                        {formatRub(withdrawal.netAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-mp-text-secondary">Налог</p>
                      <p className="font-semibold text-mp-text-primary">
                        {formatRub(withdrawal.taxAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-mp-text-secondary">Курс</p>
                      <p className="font-semibold text-mp-text-primary">
                        1 балл = {formatRub(withdrawal.rate)}
                      </p>
                    </div>
                  </div>

                  <details className="rounded-lg border border-mp-border bg-mp-surface/40 p-3">
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-mp-text-primary">
                      <Eye className="h-4 w-4" />
                      Реквизиты и история
                    </summary>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <pre className="max-h-40 overflow-auto rounded bg-mp-bg-primary p-3 text-xs text-mp-text-secondary">
                        {JSON.stringify(withdrawal.paymentDetails ?? {}, null, 2)}
                      </pre>
                      <div className="space-y-1 text-mp-text-secondary">
                        <p>Создано: {new Date(withdrawal.createdAt).toLocaleString('ru-RU')}</p>
                        {withdrawal.processedAt && (
                          <p>Обработано: {new Date(withdrawal.processedAt).toLocaleString('ru-RU')}</p>
                        )}
                        {withdrawal.processedBy && (
                          <p>Модератор: {formatUser({ ...withdrawal, user: withdrawal.processedBy })}</p>
                        )}
                        {withdrawal.rejectionReason && <p>Причина отказа: {withdrawal.rejectionReason}</p>}
                      </div>
                    </div>
                  </details>
                </div>

                <div className="flex flex-wrap items-start gap-2 lg:flex-col">
                  {withdrawal.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => openAction(withdrawal, 'approve')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openAction(withdrawal, 'reject')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {withdrawal.status === 'APPROVED' && (
                    <Button size="sm" onClick={() => openAction(withdrawal, 'complete')}>
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selected && !!action} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve'
                ? 'Одобрить заявку'
                : action === 'reject'
                  ? 'Отклонить заявку'
                  : 'Завершить выплату'}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `${formatUser(selected)}: ${formatPoints(selected.bonusAmount)} баллов / ${formatRub(selected.netAmount)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-mp-text-primary">
              {action === 'reject' ? 'Причина отказа' : 'Комментарий'}
            </label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={action === 'reject' ? 'Укажите причину отказа' : 'Комментарий для истории'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Отмена
            </Button>
            <Button
              variant={action === 'reject' ? 'destructive' : 'default'}
              onClick={submitAction}
              disabled={updateStatus.isPending || (action === 'reject' && !note.trim())}
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
