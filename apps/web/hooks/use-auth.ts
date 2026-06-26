'use client';

import type { User } from '@movie-platform/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import {
  api,
  ApiError,
  clearAuthState,
  endpoints,
  resetAuthSessionInvalidation,
} from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { canUsePartnerRole, isVerified, normalizeLegacyRole } from '@/lib/role-permissions';
import { useAuthStore } from '@/stores/auth.store';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types';

function requiresVerificationRedirect(user: User): boolean {
  return (
    (canUsePartnerRole(user.role) || normalizeLegacyRole(user.role) === 'AUTHOR') &&
    !isVerified(user.verificationStatus)
  );
}

/**
 * Authentication hook providing login, register, logout, and session management
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isHydrated,
    setAuth,
    setTokens,
    updateUser,
    logout: clearAuth,
  } = useAuthStore();

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.post<LoginResponse>(endpoints.auth.login, credentials, {
        skipRefresh: true,
        skipAuth: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      resetAuthSessionInvalidation();
      setAuth(data.user, data.accessToken, data.refreshToken, data.sessionId);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success('Добро пожаловать!');
      router.push(requiresVerificationRedirect(data.user) ? '/account/verification' : '/dashboard');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Ошибка входа. Проверьте данные и попробуйте снова.');
    },
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<LoginResponse>(endpoints.auth.register, data, {
        skipRefresh: true,
        skipAuth: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      resetAuthSessionInvalidation();
      setAuth(data.user, data.accessToken, data.refreshToken, data.sessionId);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success('Регистрация успешна! Добро пожаловать!');
      router.push(requiresVerificationRedirect(data.user) ? '/account/verification' : '/dashboard');
    },
    onError: (error: ApiError) => {
      if (error.details) {
        const messages = Object.values(error.details).flat();
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error(error.message || 'Ошибка регистрации. Попробуйте позже.');
      }
    },
  });

  /**
   * Refresh token mutation
   */
  const refreshMutation = useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await api.post<RefreshTokenResponse>(endpoints.auth.refresh, {
        refreshToken,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.sessionId);
    },
    onError: () => {
      // If refresh fails, logout
      clearAuth();
      router.push('/login');
    },
  });

  /**
   * Forgot password mutation
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      await api.post(endpoints.auth.forgotPassword, data, {
        skipRefresh: true,
        skipAuth: true,
      });
    },
    onSuccess: () => {
      toast.success('Инструкции по сбросу пароля отправлены на вашу почту.');
    },
    onError: () => {
      // Always show success for security (don't reveal if email exists)
      toast.success('Если email зарегистрирован, инструкции будут отправлены.');
    },
  });

  /**
   * Reset password mutation
   */
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      await api.post(endpoints.auth.resetPassword, data, {
        skipRefresh: true,
        skipAuth: true,
      });
    },
    onSuccess: () => {
      toast.success('Пароль успешно изменён. Войдите с новым паролем.');
      router.push('/login');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось сбросить пароль. Ссылка могла устареть.');
    },
  });

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      if (refreshToken) {
        await api.post(endpoints.auth.logout, { refreshToken }, { skipRefresh: true });
      }
    } catch {
      // Ignore logout errors
    } finally {
      await queryClient.cancelQueries();
      clearAuth();
      queryClient.clear();
      router.replace('/login');
      toast.success('Вы вышли из аккаунта');
    }
  };

  /**
   * Get current user query (for refreshing user data)
   */
  const userQuery = useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const response = await api.get<User>(endpoints.users.me);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Role and verification are mutable server-side (for example after admin
    // approval), so protected-area guards must not rely on the persisted user.
    refetchOnMount: 'always',
  });

  // Update user in store when query data changes
  React.useEffect(() => {
    if (userQuery.data) {
      updateUser(userQuery.data);
    }
  }, [userQuery.data, updateUser]);

  React.useEffect(() => {
    if (!userQuery.isError) return;

    if (process.env.NODE_ENV === 'development') {
      console.warn('[auth] /me failed', userQuery.error);
    }

    if (userQuery.error instanceof ApiError && userQuery.error.status === 401) {
      clearAuthState();
      queryClient.removeQueries({ queryKey: queryKeys.users.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    }
  }, [queryClient, userQuery.error, userQuery.isError]);

  const resolvedUser = userQuery.data ?? user;

  return {
    // State
    user: resolvedUser,
    accessToken,
    isAuthenticated,
    isHydrated,

    // Mutations
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    forgotPassword: forgotPasswordMutation.mutate,
    isSendingResetEmail: forgotPasswordMutation.isPending,

    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,

    refreshToken: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,

    logout,

    // User data refresh
    refreshUser: userQuery.refetch,
    isLoadingUser: userQuery.isFetching,
    isUserLoadError: userQuery.isError,
  };
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isHydrated, isAuthenticated, redirectTo, router]);

  return { isAuthenticated, isHydrated };
}

/**
 * Hook to redirect authenticated users
 * Useful for login/register pages
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  React.useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isHydrated, isAuthenticated, redirectTo, router]);

  return { isAuthenticated, isHydrated };
}
