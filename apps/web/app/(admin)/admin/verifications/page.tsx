'use client';

import {
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Handshake,
  ShieldCheck,
  UserCircle,
  XCircle,
} from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { AdminPageHeader } from '@/components/admin/layout/admin-page-header';
import { StatsCard } from '@/components/admin/dashboard/stats-card';
import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AdminVerification,
  openVerificationDocument,
  useAdminVerification,
  useAdminVerificationStats,
  useAdminVerifications,
  useApproveVerification,
  useRejectVerification,
} from '@/hooks/use-admin-verifications';
import { cn } from '@/lib/utils';

const STATUS_COPY: Record<string, { label: string; hint: string; variant: 'success' | 'error' | 'warning' | 'secondary' }> = {
  UNVERIFIED: {
    label: 'Не верифицирован',
    hint: 'Требуется пройти верификацию',
    variant: 'secondary',
  },
  PENDING: {
    label: 'Ожидает проверки',
    hint: 'Заявка отправлена и ожидает модератора',
    variant: 'warning',
  },
  VERIFIED: {
    label: 'Верифицирован',
    hint: 'Аккаунт успешно верифицирован',
    variant: 'success',
  },
  REJECTED: {
    label: 'Отклонена',
    hint: 'Заявка отклонена',
    variant: 'error',
  },
};

const METHOD_COPY: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = {
  DOCUMENT: {
    label: 'Документ',
    icon: FileText,
    hint: 'Проверить загруженный файл и данные пользователя',
  },
  PAYMENT: {
    label: 'Платеж',
    icon: CreditCard,
    hint: 'Проверить транзакцию, статус оплаты и webhook-данные',
  },
  THIRD_PARTY: {
    label: 'Партнер',
    icon: Handshake,
    hint: 'Партнер подтверждает связь, финальное решение остается за модератором',
  },
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ru-RU');
}

function statusBadge(item: AdminVerification) {
  const isPartnerConfirmed = item.method === 'THIRD_PARTY' && item.status === 'PENDING' && item.confirmedAt;
  if (isPartnerConfirmed) {
    return (
      <Badge variant="warning" className="whitespace-nowrap">
        Партнер подтвердил
      </Badge>
    );
  }

  const config = STATUS_COPY[item.status] ?? STATUS_COPY.PENDING;
  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-md border border-mp-border/70 bg-mp-surface/40 p-3">
      <span className="text-xs text-mp-text-secondary">{label}</span>
      <span className="min-w-0 break-words text-sm text-mp-text-primary">{value || '-'}</span>
    </div>
  );
}

function VerificationDetails({
  item,
  onApprove,
  onReject,
  isApproving,
}: {
  item: AdminVerification;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
}) {
  const method = METHOD_COPY[item.method];
  const MethodIcon = method.icon;
  const displayName = `${item.userFirstName} ${item.userLastName}`.trim();

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <UserAvatar src={item.userAvatarUrl} name={displayName || item.userEmail} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-mp-text-primary">{displayName}</h2>
            {statusBadge(item)}
          </div>
          <p className="mt-1 text-sm text-mp-text-secondary">{item.userEmail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{item.userRole}</Badge>
            <Badge variant="outline">{item.userAgeCategory}</Badge>
            <Badge variant="outline">{method.label}</Badge>
          </div>
        </div>
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-mp-accent-primary" />
          <h3 className="font-semibold text-mp-text-primary">Пользователь</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="ID" value={item.userId} />
          <InfoRow label="Роль" value={item.userRole} />
          <InfoRow label="Дата рождения" value={formatDate(item.userDateOfBirth)} />
          <InfoRow label="Возрастная категория" value={item.userAgeCategory} />
          <InfoRow label="Регистрация" value={formatDate(item.userCreatedAt)} />
          <InfoRow label="Обновлен" value={formatDate(item.userUpdatedAt)} />
          <InfoRow label="Текущий статус аккаунта" value={item.userVerificationStatus} />
          <InfoRow label="Метод аккаунта" value={item.method} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MethodIcon className="h-5 w-5 text-mp-accent-primary" />
          <h3 className="font-semibold text-mp-text-primary">Метод проверки</h3>
        </div>
        <p className="text-sm text-mp-text-secondary">{method.hint}</p>

        {item.method === 'DOCUMENT' && (
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow label="Документ" value={item.documentKey ? 'Загружен' : 'Нет файла'} />
            <InfoRow label="Ключ файла" value={item.documentKey} />
            <InfoRow label="Дата загрузки" value={formatDate(item.createdAt)} />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={!item.documentKey}
                onClick={() => openVerificationDocument(item.id)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Открыть документ
              </Button>
            </div>
          </div>
        )}

        {item.method === 'PAYMENT' && (
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow label="Transaction ID" value={item.payment?.id} />
            <InfoRow label="Сумма" value={item.payment ? `${item.payment.amount} ${item.payment.currency}` : '-'} />
            <InfoRow label="Статус платежа" value={item.payment?.status} />
            <InfoRow label="Метод оплаты" value={item.payment?.paymentMethod} />
            <InfoRow label="External payment ID" value={item.payment?.externalPaymentId} />
            <InfoRow label="Completed at" value={formatDate(item.payment?.completedAt)} />
          </div>
        )}

        {item.method === 'THIRD_PARTY' && (
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow label="Партнер" value={item.confirmedByPartnerEmail || 'Ожидает партнера'} />
            <InfoRow label="Partner ID" value={item.confirmedByPartnerId} />
            <InfoRow label="Relationship ID" value={item.partnerRelationshipId} />
            <InfoRow label="Подтверждено партнером" value={formatDate(item.confirmedAt)} />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-mp-accent-primary" />
          <h3 className="font-semibold text-mp-text-primary">Аудит</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Создана" value={formatDate(item.createdAt)} />
          <InfoRow label="Проверена" value={formatDate(item.reviewedAt)} />
          <InfoRow label="Верифицирована" value={formatDate(item.verifiedAt)} />
          <InfoRow label="Кто проверил" value={item.reviewedByEmail} />
          <InfoRow label="Причина отклонения" value={item.rejectionReason} />
          <InfoRow label="Audit events" value={item.auditEventsCount?.toString()} />
        </div>
      </section>

      {item.status === 'PENDING' && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-mp-border pt-4">
          <Button type="button" variant="outline" onClick={onReject}>
            Отклонить
          </Button>
          <Button type="button" disabled={isApproving} onClick={onApprove}>
            Одобрить
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationId = searchParams.get('verificationId');
  const [status, setStatus] = React.useState('ALL');
  const [method, setMethod] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<AdminVerification | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<AdminVerification | null>(null);
  const [reason, setReason] = React.useState('');

  const params = React.useMemo(
    () => ({
      status: status === 'ALL' ? undefined : status,
      method: method === 'ALL' ? undefined : method,
      search: search || undefined,
      limit: 50,
    }),
    [method, search, status],
  );

  const { data, isLoading } = useAdminVerifications(params);
  const { data: linkedVerification } = useAdminVerification(verificationId);
  const { data: stats } = useAdminVerificationStats();
  const approve = useApproveVerification();
  const reject = useRejectVerification();

  React.useEffect(() => {
    if (linkedVerification) {
      setSelected(linkedVerification);
    }
  }, [linkedVerification]);

  const openDetails = (item: AdminVerification) => {
    setSelected(item);
    router.replace(`/admin/verifications?verificationId=${item.id}`, { scroll: false });
  };

  const closeDetails = () => {
    setSelected(null);
    if (verificationId) {
      router.replace('/admin/verifications', { scroll: false });
    }
  };

  const approveItem = (item: AdminVerification) => {
    approve.mutate(item.id, { onSuccess: closeDetails });
  };

  const submitReject = () => {
    if (!rejectTarget || !reason.trim()) return;
    reject.mutate(
      { id: rejectTarget.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setRejectTarget(null);
          closeDetails();
          setReason('');
        },
      },
    );
  };

  return (
    <Container size="xl" className="py-8">
      <AdminPageHeader
        title="Верификация пользователей"
        description="Очередь заявок, документы, платежи и партнерские подтверждения"
        breadcrumbItems={[
          { label: 'Админ', href: '/admin/dashboard' },
          { label: 'Верификация пользователей' },
        ]}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatsCard title="Ожидают" value={stats?.pending ?? 0} icon={Clock} />
        <StatsCard title="Одобрены" value={stats?.approved ?? 0} icon={CheckCircle} />
        <StatsCard title="Отклонены" value={stats?.rejected ?? 0} icon={XCircle} />
        <StatsCard title="Просрочены 24ч+" value={stats?.overdueCount ?? 0} icon={ShieldCheck} />
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по email или имени"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все статусы</SelectItem>
                <SelectItem value="PENDING">Ожидает</SelectItem>
                <SelectItem value="VERIFIED">Одобрено</SelectItem>
                <SelectItem value="REJECTED">Отклонено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Все методы</SelectItem>
                <SelectItem value="PAYMENT">Платеж</SelectItem>
                <SelectItem value="DOCUMENT">Документ</SelectItem>
                <SelectItem value="THIRD_PARTY">Партнер</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Роль и возраст</TableHead>
                <TableHead>Метод</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Документ/платеж/партнер</TableHead>
                <TableHead>Аудит</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-mp-text-secondary">
                    Загрузка...
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((item) => {
                const methodConfig = METHOD_COPY[item.method];
                const MethodIcon = methodConfig.icon;
                const name = `${item.userFirstName} ${item.userLastName}`.trim();

                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => openDetails(item)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar src={item.userAvatarUrl} name={name || item.userEmail} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-mp-text-primary">{name}</div>
                          <div className="truncate text-xs text-mp-text-secondary">{item.userEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{item.userRole}</Badge>
                        <Badge variant="outline">{item.userAgeCategory}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MethodIcon className="h-4 w-4 text-mp-text-secondary" />
                        <span>{methodConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {statusBadge(item)}
                        <div className="text-xs text-mp-text-secondary">
                          {(STATUS_COPY[item.status] ?? STATUS_COPY.PENDING).hint}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="space-y-1 text-sm">
                        {item.method === 'DOCUMENT' && (
                          <span>{item.documentKey ? 'Документ загружен' : 'Нет документа'}</span>
                        )}
                        {item.method === 'PAYMENT' && (
                          <span>{item.payment ? `${item.payment.status} / ${item.payment.paymentMethod}` : 'Платеж не найден'}</span>
                        )}
                        {item.method === 'THIRD_PARTY' && (
                          <span>{item.confirmedByPartnerEmail || 'Ожидает партнера'}</span>
                        )}
                        <div className="text-xs text-mp-text-secondary">{formatDate(item.createdAt)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-mp-text-secondary">
                        <div>{item.reviewedByEmail || item.confirmedByPartnerEmail || '-'}</div>
                        <div className={cn('text-xs', item.rejectionReason && 'text-mp-error-text')}>
                          {item.rejectionReason || `${item.auditEventsCount ?? 0} событий`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        <Button type="button" variant="outline" size="sm" onClick={() => openDetails(item)}>
                          Подробнее
                        </Button>
                        {item.status === 'PENDING' && (
                          <>
                            <Button type="button" size="sm" onClick={() => approveItem(item)}>
                              Одобрить
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setRejectTarget(item)}
                            >
                              Отклонить
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-mp-text-secondary">
                    Заявки не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-mp-border bg-[#0b0f18] text-mp-text-primary shadow-2xl shadow-black">
          <DialogHeader>
            <DialogTitle>Детали заявки</DialogTitle>
            <DialogDescription>
              Полная информация о пользователе, методе проверки и аудите заявки.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <VerificationDetails
              item={selected}
              isApproving={approve.isPending}
              onApprove={() => approveItem(selected)}
              onReject={() => setRejectTarget(selected)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="border-mp-border bg-[#0b0f18] text-mp-text-primary shadow-2xl shadow-black">
          <DialogHeader>
            <DialogTitle>Отклонить заявку</DialogTitle>
            <DialogDescription>
              Укажите причину, которую увидит пользователь.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Причина отклонения"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || reject.isPending}
              onClick={submitReject}
            >
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
