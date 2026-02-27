'use client';

import {
  Bell,
  Globe,
  Key,
  Laptop,
  SpinnerGap,
  SignOut,
  Monitor,
  Gear,
  Shield,
  DeviceMobile,
} from '@phosphor-icons/react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useChangePassword,
  useActiveSessions,
  useTerminateSession,
  useTerminateAllSessions,
} from '@/hooks/use-account';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ==============================
// Password Zod schema
// ==============================

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
      .regex(/[0-9]/, 'Должна быть хотя бы одна цифра'),
    confirmPassword: z.string().min(1, 'Подтвердите новый пароль'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// ==============================
// Notification toggle config
// ==============================

const NOTIFICATION_TOGGLES = [
  {
    key: 'emailMarketing' as const,
    label: 'Email рассылки',
    description: 'Получать маркетинговые письма и промо-акции',
    icon: Bell,
  },
  {
    key: 'emailUpdates' as const,
    label: 'Обновления',
    description: 'Уведомления о новом контенте, подписках и платежах',
    icon: Bell,
  },
  {
    key: 'pushNotifications' as const,
    label: 'Push уведомления',
    description: 'Уведомления в реальном времени в браузере',
    icon: Bell,
  },
];

// ==============================
// Password strength
// ==============================

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Слабый', color: 'bg-red-500' };
  if (score <= 3) return { score: 2, label: 'Средний', color: 'bg-yellow-500' };
  return { score: 3, label: 'Надёжный', color: 'bg-green-500' };
}

/**
 * Settings page with tabs
 */
export default function SettingsPage() {
  return (
    <div className="py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-mp-accent-primary/20 p-2">
            <Gear className="h-6 w-6 text-mp-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-mp-text-primary md:text-3xl">
            Настройки
          </h1>
        </div>
        <p className="text-mp-text-secondary">
          Управляйте уведомлениями, безопасностью и активными сессиями
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Monitor className="h-4 w-4" />
            Сессии
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==============================
// Notifications Tab
// ==============================

function NotificationsTab() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const handleToggle = (key: string, checked: boolean) => {
    updatePreferences.mutate(
      { [key]: checked },
      {
        onSuccess: () => {
          toast.success('Настройки уведомлений обновлены');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-5 w-9" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Настройки уведомлений</CardTitle>
        <CardDescription>
          Управляйте какие уведомления вы хотите получать
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {NOTIFICATION_TOGGLES.map((toggle, index) => {
            const value = preferences?.[toggle.key] ?? false;

            return (
              <React.Fragment key={toggle.key}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mp-surface">
                      <toggle.icon className="h-4 w-4 text-mp-text-secondary" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-mp-text-primary">
                        {toggle.label}
                      </Label>
                      <p className="mt-0.5 text-sm text-mp-text-secondary">
                        {toggle.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handleToggle(toggle.key, checked)}
                    disabled={updatePreferences.isPending}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ==============================
// Security Tab
// ==============================

function SecurityTab() {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const strength = newPassword ? getPasswordStrength(newPassword) : null;

  const onSubmit = (data: PasswordFormValues) => {
    changePassword.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          reset();
          toast.success('Пароль успешно изменён');
        },
        onError: () => {
          toast.error('Не удалось изменить пароль');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5 text-mp-accent-primary" />
          Смена пароля
        </CardTitle>
        <CardDescription>
          Регулярно меняйте пароль для обеспечения безопасности аккаунта
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              Текущий пароль <span className="text-mp-accent-tertiary">*</span>
            </Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Введите текущий пароль"
              error={!!errors.currentPassword}
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-sm text-mp-error-text">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <Separator />

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              Новый пароль <span className="text-mp-accent-tertiary">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Введите новый пароль"
              error={!!errors.newPassword}
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-sm text-mp-error-text">
                {errors.newPassword.message}
              </p>
            )}

            {/* Password strength indicator */}
            {strength && (
              <div className="space-y-1.5">
                <div className="flex h-1.5 gap-1 rounded-full overflow-hidden">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-full flex-1 rounded-full transition-colors',
                        level <= strength.score
                          ? strength.color
                          : 'bg-mp-border'
                      )}
                    />
                  ))}
                </div>
                <p className={cn(
                  'text-xs',
                  strength.score === 1 && 'text-red-400',
                  strength.score === 2 && 'text-yellow-400',
                  strength.score === 3 && 'text-green-400',
                )}>
                  {strength.label}
                </p>
              </div>
            )}

            <p className="text-xs text-mp-text-secondary">
              Минимум 8 символов, заглавная буква и цифра
            </p>
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Подтвердите пароль <span className="text-mp-accent-tertiary">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Повторите новый пароль"
              error={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-mp-error-text">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Separator />

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="gradient"
              disabled={changePassword.isPending}
              isLoading={changePassword.isPending}
            >
              <Key className="mr-2 h-4 w-4" />
              Изменить пароль
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ==============================
// Sessions Tab
// ==============================

function SessionsTab() {
  const { data: sessions, isLoading } = useActiveSessions();
  const terminateSession = useTerminateSession();
  const terminateAllSessions = useTerminateAllSessions();

  const sessionsList = Array.isArray(sessions) ? sessions : sessions?.items || [];

  // Try to identify current session by checking if the session token matches
  // We compare by checking if the session was created most recently and is from the same IP
  const currentSessionId = React.useMemo(() => {
    if (sessionsList.length === 0) return null;
    // The current session is typically the most recently active one
    // Since we don't have a direct way to identify it, we mark the first session
    // (API typically returns current session first)
    return sessionsList[0]?.id || null;
  }, [sessionsList]);

  const getDeviceIcon = (deviceInfo?: string) => {
    if (!deviceInfo) return Monitor;
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return DeviceMobile;
    }
    if (info.includes('tablet') || info.includes('ipad')) {
      return Laptop;
    }
    return Monitor;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-mp-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-mp-accent-primary" />
              Активные сессии
            </CardTitle>
            <CardDescription className="mt-1">
              Управляйте устройствами, на которых выполнен вход в аккаунт
            </CardDescription>
          </div>
          {sessionsList.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-mp-accent-tertiary hover:text-mp-accent-tertiary"
              onClick={() => terminateAllSessions.mutate()}
              disabled={terminateAllSessions.isPending}
            >
              {terminateAllSessions.isPending ? (
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SignOut className="mr-2 h-4 w-4" />
              )}
              Завершить все другие сессии
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sessionsList.length === 0 ? (
          <div className="py-8 text-center">
            <Monitor className="mx-auto mb-3 h-10 w-10 text-mp-text-disabled" />
            <p className="text-mp-text-secondary">Нет активных сессий</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsList.map((session: any) => {
              const DeviceIcon = getDeviceIcon(session.deviceInfo);
              const isCurrentSession = session.id === currentSessionId;
              const isTerminating =
                terminateSession.isPending &&
                terminateSession.variables === session.id;

              return (
                <div
                  key={session.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-mp-surface/50',
                    isCurrentSession
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-mp-border bg-mp-surface/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mp-surface">
                      <DeviceIcon className="h-5 w-5 text-mp-text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-mp-text-primary">
                          {session.deviceInfo || 'Неизвестное устройство'}
                        </p>
                        {isCurrentSession && (
                          <Badge variant="success" className="text-[10px]">
                            Это устройство
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-mp-text-secondary">
                        {session.ipAddress && (
                          <span>IP: {session.ipAddress}</span>
                        )}
                        {session.createdAt && (
                          <span>
                            Вход: {formatDate(session.createdAt, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'shrink-0',
                      isCurrentSession
                        ? 'cursor-not-allowed opacity-50'
                        : 'text-mp-accent-tertiary hover:border-mp-accent-tertiary/50 hover:text-mp-accent-tertiary'
                    )}
                    onClick={() => terminateSession.mutate(session.id)}
                    disabled={isTerminating || isCurrentSession}
                  >
                    {isTerminating ? (
                      <SpinnerGap className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <SignOut className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Завершить
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
