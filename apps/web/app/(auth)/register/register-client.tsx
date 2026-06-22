'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeSlash,
  Envelope,
  Lock,
  User,
  Calendar,
  Gift,
  Users,
  VideoCamera,
  Play,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { api, endpoints } from '@/lib/api-client';
import {
  getPublicUsernameUrl,
  normalizeUsername,
  validatePublicUsername,
} from '@/lib/username';
import { cn } from '@/lib/utils';

const REFERRAL_STORAGE_KEY = 'mp-referral-code';
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{6,12}$/;
const REGISTRATION_ROLES = ['CLIENT', 'PARTNER', 'AUTHOR'] as const;

const ROLE_OPTIONS = [
  {
    value: 'CLIENT',
    title: 'Клиент',
    description: 'Смотреть контент',
    icon: Play,
  },
  {
    value: 'PARTNER',
    title: 'Партнёр',
    description: 'Зарабатывать с нами',
    icon: Users,
  },
  {
    value: 'AUTHOR',
    title: 'Автор',
    description: 'Публиковать контент',
    icon: VideoCamera,
  },
] as const;

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Имя обязательно')
      .min(2, 'Имя должно быть не менее 2 символов'),
    lastName: z
      .string()
      .min(1, 'Фамилия обязательна')
      .min(2, 'Фамилия должна быть не менее 2 символов'),
    email: z
      .string()
      .min(1, 'Email обязателен')
      .email('Введите корректный email'),
    dateOfBirth: z.string().min(1, 'Дата рождения обязательна'),
    role: z.enum(REGISTRATION_ROLES),
    username: z.string().optional(),
    password: z
      .string()
      .min(1, 'Пароль обязателен')
      .min(8, 'Пароль должен быть не менее 8 символов')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Пароль должен содержать заглавную букву, строчную букву и цифру',
      ),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    referralCode: z.string().optional().refine((value) => {
      const code = extractReferralCode(value);
      return !code || REFERRAL_CODE_PATTERN.test(code);
    }, 'Введите реферальный код партнера из ссылки, например ABC12345. Email партнера не подходит.'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'Необходимо принять условия использования',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (
      data.role === 'AUTHOR' ||
      data.role === 'PARTNER' ||
      data.username?.trim()
    ) {
      const error = validatePublicUsername(data.username ?? '');

      if (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['username'],
          message: error,
        });
      }
    }
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function extractReferralCode(value?: string) {
  if (!value) return undefined;

  const input = value.trim();
  if (!input) return undefined;

  try {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://movieplatform.local';

    const url = new URL(input, baseUrl);
    const code =
      url.searchParams.get('ref') ||
      url.searchParams.get('referralCode') ||
      url.searchParams.get('referral');

    if (code) return code.trim().toUpperCase();
  } catch {
    // Treat non-URL input as a plain referral code.
  }

  return input.toUpperCase();
}

function getStoredReferralCode() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const storedCode = extractReferralCode(
      window.sessionStorage.getItem(REFERRAL_STORAGE_KEY) || '',
    );

    return storedCode && REFERRAL_CODE_PATTERN.test(storedCode)
      ? storedCode
      : '';
  } catch {
    return '';
  }
}

function storeReferralCode(code: string) {
  try {
    window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    // Registration still works if browser storage is unavailable.
  }
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [usernameStatus, setUsernameStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'unavailable';
    reason?: string;
    normalized?: string;
  }>({ state: 'idle' });

  const searchParams = useSearchParams();

  const referralParam =
    searchParams.get('ref') ||
    searchParams.get('referralCode') ||
    searchParams.get('referral') ||
    '';

  const referralCode = useMemo(() => {
    const codeFromUrl = extractReferralCode(referralParam);

    if (codeFromUrl && REFERRAL_CODE_PATTERN.test(codeFromUrl)) {
      return codeFromUrl;
    }

    return getStoredReferralCode();
  }, [referralParam]);

  const [appliedReferralCode, setAppliedReferralCode] = useState(referralCode);

  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      role: 'CLIENT',
      username: '',
      password: '',
      confirmPassword: '',
      referralCode,
      acceptTerms: undefined,
    },
  });

  const selectedRole = watch('role');
  const usernameValue = watch('username') || '';
  const normalizedUsername = normalizeUsername(usernameValue);
  const requiresUsername =
    selectedRole === 'AUTHOR' || selectedRole === 'PARTNER';

  const showUsernameField = requiresUsername || Boolean(usernameValue.trim());

  const usernamePreview = usernameValue.trim()
    ? getPublicUsernameUrl(selectedRole, usernameValue, origin)
    : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('sesh-register-page-active');

    return () => {
      document.documentElement.classList.remove('sesh-register-page-active');
    };
  }, []);

  useEffect(() => {
    if (!usernameValue.trim()) {
      setUsernameStatus({ state: 'idle' });
      return;
    }

    const localError = validatePublicUsername(usernameValue);

    if (localError) {
      setUsernameStatus({
        state: 'unavailable',
        reason: localError,
        normalized: normalizedUsername,
      });
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setUsernameStatus({
        state: 'checking',
        normalized: normalizedUsername,
      });

      try {
        const response = await api.get<{
          available: boolean;
          normalized: string;
          reason?: string;
        }>(endpoints.users.usernameAvailable, {
          params: { username: normalizedUsername },
          skipAuth: true,
          skipRefresh: true,
          signal: controller.signal,
        });

        setUsernameStatus({
          state: response.data.available ? 'available' : 'unavailable',
          reason: response.data.reason,
          normalized: response.data.normalized,
        });
      } catch {
        setUsernameStatus({
          state: 'unavailable',
          reason: 'Unable to check username availability',
          normalized: normalizedUsername,
        });
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [normalizedUsername, usernameValue]);

  useEffect(() => {
    const codeFromUrl = extractReferralCode(referralParam);

    if (referralParam && codeFromUrl && !REFERRAL_CODE_PATTERN.test(codeFromUrl)) {
      setAppliedReferralCode('');
      setError('referralCode', {
        type: 'validate',
        message: 'Реферальный код из ссылки некорректен. Проверьте ссылку партнёра.',
      });
      return;
    }

    if (referralCode) {
      storeReferralCode(referralCode);
      setValue('referralCode', referralCode, { shouldValidate: true });
      setAppliedReferralCode(referralCode);
      clearErrors('referralCode');
    }
  }, [clearErrors, referralCode, referralParam, setError, setValue]);

  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      role: data.role,
      username: data.username?.trim()
        ? normalizeUsername(data.username)
        : undefined,
      password: data.password,
      referralCode: extractReferralCode(data.referralCode),
      acceptTerms: data.acceptTerms,
    });
  };

  const disableSubmitForUsername =
    requiresUsername &&
    (!usernameValue.trim() ||
      usernameStatus.state === 'checking' ||
      usernameStatus.state === 'unavailable' ||
      usernameStatus.state === 'idle');

  return (
    <div className="sesh-register-page">
      <Card className="sesh-auth-card sesh-register-card">
        <CardHeader className="pb-5 text-center">
          <CardTitle className="text-[30px] font-extrabold tracking-[-0.03em] text-white">
            Создать аккаунт
          </CardTitle>

          <CardDescription className="mt-3 text-[15px] font-medium text-[#aeb8d0]">
            Заполните форму для регистрации
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-[13px] font-bold text-white"
                >
                  Имя
                </label>

                <Input
                  id="firstName"
                  placeholder="Иван"
                  autoComplete="given-name"
                  error={!!errors.firstName}
                  leftIcon={<User className="h-4 w-4" />}
                  className="sesh-auth-input"
                  {...register('firstName')}
                />

                {errors.firstName && (
                  <p className="text-xs text-mp-error-text">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-[13px] font-bold text-white"
                >
                  Фамилия
                </label>

                <Input
                  id="lastName"
                  placeholder="Иванов"
                  autoComplete="family-name"
                  error={!!errors.lastName}
                  className="sesh-auth-input"
                  {...register('lastName')}
                />

                {errors.lastName && (
                  <p className="text-xs text-mp-error-text">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-[13px] font-bold text-white"
              >
                Email
              </label>

              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                error={!!errors.email}
                leftIcon={<Envelope className="h-4 w-4" />}
                className="sesh-auth-input"
                {...register('email')}
              />

              {errors.email && (
                <p className="text-xs text-mp-error-text">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[13px] font-bold text-white">Роль</span>

              <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedRole === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setValue('role', option.value, {
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        'sesh-role-card',
                        isSelected && 'sesh-role-card-active',
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <Icon className="h-5 w-5 shrink-0" />

                        {isSelected && (
                          <span className="sesh-role-active-dot" />
                        )}
                      </span>

                      <span className="mt-3 block text-[14px] font-bold text-white">
                        {option.title}
                      </span>

                      <span className="mt-2 block text-[12px] leading-5 text-[#aeb8d0]">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {errors.role && (
                <p className="text-xs text-mp-error-text">
                  {errors.role.message}
                </p>
              )}
            </div>

            {showUsernameField && (
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-[13px] font-bold text-white"
                >
                  Имя пользователя{' '}
                  {requiresUsername && (
                    <span className="text-[#C70F4F]">*</span>
                  )}
                </label>

                <Input
                  id="username"
                  placeholder="testauthor"
                  autoComplete="username"
                  error={
                    !!errors.username ||
                    usernameStatus.state === 'unavailable'
                  }
                  leftIcon={<User className="h-4 w-4" />}
                  className="sesh-auth-input"
                  {...register('username', {
                    setValueAs: (value) =>
                      typeof value === 'string'
                        ? normalizeUsername(value)
                        : value,
                  })}
                />

                <p className="text-xs leading-5 text-[#aeb8d0]">
                  Публичный профиль: /author/username или /partner/username.
                </p>

                {usernamePreview && (
                  <p className="break-all rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#aeb8d0]">
                    {selectedRole === 'PARTNER'
                      ? 'Публичная страница / реферальная ссылка'
                      : 'Публичная страница'}
                    : <span className="text-white">{usernamePreview}</span>
                  </p>
                )}

                {usernameStatus.state === 'checking' && (
                  <p className="text-xs text-[#aeb8d0]">
                    Проверяем имя пользователя...
                  </p>
                )}

                {usernameStatus.state === 'available' && (
                  <p className="text-xs text-mp-success-text">
                    Имя пользователя доступно
                  </p>
                )}

                {(errors.username ||
                  usernameStatus.state === 'unavailable') && (
                  <p className="text-xs text-mp-error-text">
                    {errors.username?.message || usernameStatus.reason}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="dateOfBirth"
                className="text-[13px] font-bold text-white"
              >
                Дата рождения
              </label>

              <Input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                error={!!errors.dateOfBirth}
                leftIcon={<Calendar className="h-4 w-4" />}
                className="sesh-auth-input"
                {...register('dateOfBirth')}
              />

              {errors.dateOfBirth && (
                <p className="text-xs text-mp-error-text">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[13px] font-bold text-white"
                >
                  Пароль
                </label>

                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={!!errors.password}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-[#aeb8d0] transition-colors hover:text-white"
                      aria-label={
                        showPassword ? 'Скрыть пароль' : 'Показать пароль'
                      }
                    >
                      {showPassword ? (
                        <EyeSlash className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  className="sesh-auth-input"
                  {...register('password')}
                />

                {errors.password && (
                  <p className="text-xs text-mp-error-text">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-[13px] font-bold text-white"
                >
                  Подтвердите пароль
                </label>

                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="text-[#aeb8d0] transition-colors hover:text-white"
                      aria-label={
                        showConfirmPassword
                          ? 'Скрыть пароль'
                          : 'Показать пароль'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeSlash className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  className="sesh-auth-input"
                  {...register('confirmPassword')}
                />

                {errors.confirmPassword && (
                  <p className="text-xs text-mp-error-text">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {appliedReferralCode && (
                <div className="rounded-lg border border-[#0F66EB]/40 bg-[#0F66EB]/10 p-3 text-xs text-white">
                  <p className="font-semibold">Реферальный код применён</p>
                  <p className="mt-1 text-[#aeb8d0]">
                    Вы приглашены партнёром. Код:{' '}
                    <span className="font-mono text-[#69bfff]">
                      {appliedReferralCode}
                    </span>
                  </p>
                </div>
              )}

              <label
                htmlFor="referralCode"
                className="text-[13px] font-bold text-white"
              >
                Реферальный код{' '}
                <span className="font-medium text-[#7f8aa6]">
                  (необязательно)
                </span>
              </label>

              <Input
                id="referralCode"
                placeholder="ABC12345 или ссылка с ?ref=ABC12345"
                error={!!errors.referralCode}
                leftIcon={<Gift className="h-4 w-4" />}
                className="sesh-auth-input"
                {...register('referralCode', {
                  setValueAs: (value) => extractReferralCode(value) || '',
                })}
              />

              {errors.referralCode && (
                <p className="text-xs text-mp-error-text">
                  {errors.referralCode.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acceptTerms"
                className="mt-1 h-4 w-4 rounded border-white/15 bg-transparent text-[#C70F4F] accent-[#C70F4F] focus:ring-[#C70F4F] focus:ring-offset-0"
                {...register('acceptTerms')}
              />

              <label
                htmlFor="acceptTerms"
                className="text-[12px] leading-5 text-[#aeb8d0]"
              >
                Я принимаю{' '}
                <Link
                  href="/documents/terms"
                  className="font-semibold text-[#C70F4F] transition-colors hover:text-white"
                  target="_blank"
                >
                  условия использования
                </Link>{' '}
                и{' '}
                <Link
                  href="/documents/privacy"
                  className="font-semibold text-[#C70F4F] transition-colors hover:text-white"
                  target="_blank"
                >
                  политику конфиденциальности
                </Link>
              </label>
            </div>

            {errors.acceptTerms && (
              <p className="text-xs text-mp-error-text">
                {errors.acceptTerms.message}
              </p>
            )}

            <Button
              type="submit"
              variant="gradient"
              className="sesh-auth-submit w-full"
              disabled={disableSubmitForUsername}
              isLoading={isRegistering}
            >
              Зарегистрироваться
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/14" />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="bg-transparent px-4 font-medium text-[#aeb8d0]">
                или
              </span>
            </div>
          </div>

          <p className="text-center text-[16px] font-medium text-[#aeb8d0]">
          Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#C70F4F] transition-colors hover:text-white"
            >
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
