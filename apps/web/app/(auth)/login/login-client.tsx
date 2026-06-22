'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeSlash, Envelope, Lock } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Введите корректный email'),
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль должен быть не менее 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add('sesh-login-page-active');

    return () => {
      document.documentElement.classList.remove('sesh-login-page-active');
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div className="sesh-auth-panel">
      <div className="sesh-auth-heading">
        <h1>Добро пожаловать</h1>
        <p>Войдите в аккаунт, чтобы продолжить</p>
      </div>

      <Card className="sesh-auth-card">
        <CardContent className="px-[38px] pb-[39px] pt-[37px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[30px]">
          <div className="space-y-3">
            <label
              htmlFor="email"
              className="text-[16px] font-bold text-white"
            >
              Email
            </label>

            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              error={!!errors.email}
              leftIcon={<Envelope className="h-5 w-5" />}
              className="sesh-auth-input"
              {...register('email')}
            />

            {errors.email && (
              <p className="text-sm text-mp-error-text">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[16px] font-bold text-white"
              >
                Пароль
              </label>

              <Link
                href="/forgot-password"
                className="text-[16px] font-medium text-[#C70F4F] transition-colors hover:text-white"
              >
                Забыли пароль?
              </Link>
            </div>

            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              error={!!errors.password}
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-[#aeb8d0] transition-colors hover:text-white"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? (
                    <EyeSlash className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              className="sesh-auth-input"
              {...register('password')}
            />

            {errors.password && (
              <p className="text-sm text-mp-error-text">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="sesh-auth-submit w-full"
            isLoading={isLoggingIn}
          >
            Войти
          </Button>
        </form>

        <div className="relative my-[35px]">
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
          Нет аккаунта?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#C70F4F] transition-colors hover:text-white"
          >
            Зарегистрируйтесь
          </Link>
        </p>
        </CardContent>
      </Card>
    </div>
  );
}
