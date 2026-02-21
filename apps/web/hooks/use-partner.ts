'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, ApiError, endpoints } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
  PartnerDashboard,
  PartnerLevelConfig,
  ReferralTree,
  Commission,
  CommissionList,
  CommissionQueryParams,
  AvailableBalance,
  TaxCalculation,
  TaxStatus,
  Withdrawal,
  WithdrawalList,
  WithdrawalQueryParams,
  CreateWithdrawalRequest,
  SavedPaymentMethod,
} from '@/types';

/**
 * Hook to fetch partner program levels (public)
 */
export function usePartnerLevels() {
  return useQuery({
    queryKey: queryKeys.partners.levels(),
    queryFn: async () => {
      const response = await api.get<PartnerLevelConfig[]>(endpoints.partners.levels);
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour - levels don't change often
  });
}

/**
 * Hook to fetch partner dashboard data
 */
export function usePartnerDashboard() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.dashboard(),
    queryFn: async () => {
      const response = await api.get<PartnerDashboard>(endpoints.partners.dashboard);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch referral tree
 */
export function useReferralTree(depth: number = 3) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.referrals(depth),
    queryFn: async () => {
      const response = await api.get<ReferralTree>(endpoints.partners.referrals, {
        params: { depth },
      });
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch commissions list
 */
export function useCommissions(params?: CommissionQueryParams) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.commissions(params as Record<string, unknown> | undefined),
    queryFn: async () => {
      const response = await api.get<CommissionList>(endpoints.partners.commissions, {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a single commission
 */
export function useCommission(id: string | undefined) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.commission(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Commission ID required');
      const response = await api.get<Commission>(endpoints.partners.commission(id));
      return response.data;
    },
    enabled: !!id && isAuthenticated && isHydrated,
  });
}

/**
 * Hook to fetch available balance
 */
export function usePartnerBalance() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.balance(),
    queryFn: async () => {
      const response = await api.get<AvailableBalance>(endpoints.partners.balance);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 30 * 1000, // 30 seconds - balance changes more frequently
  });
}

/**
 * Hook to fetch withdrawals list
 */
export function useWithdrawals(params?: WithdrawalQueryParams) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.withdrawals(params as Record<string, unknown> | undefined),
    queryFn: async () => {
      const response = await api.get<WithdrawalList>(endpoints.partners.withdrawals, {
        params: params as Record<string, string | number | boolean | undefined | null>,
      });
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a single withdrawal
 */
export function useWithdrawal(id: string | undefined) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.withdrawal(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Withdrawal ID required');
      const response = await api.get<Withdrawal>(endpoints.partners.withdrawal(id));
      return response.data;
    },
    enabled: !!id && isAuthenticated && isHydrated,
  });
}

/**
 * Hook to preview tax calculation
 */
export function useTaxPreview(amount: number, taxStatus: TaxStatus) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.taxPreview(amount, taxStatus),
    queryFn: async () => {
      const response = await api.get<TaxCalculation>(endpoints.partners.taxPreview, {
        params: { amount, taxStatus },
      });
      return response.data;
    },
    enabled: isAuthenticated && isHydrated && amount > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - tax rates don't change often
  });
}

/**
 * Hook to fetch saved payment methods
 */
export function usePaymentMethods() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.partners.paymentMethods(),
    queryFn: async () => {
      const response = await api.get<SavedPaymentMethod[]>(endpoints.partners.paymentMethods);
      return response.data;
    },
    enabled: isAuthenticated && isHydrated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new withdrawal
 */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWithdrawalRequest) => {
      const response = await api.post<Withdrawal>(endpoints.partners.createWithdrawal, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.withdrawals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.balance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.dashboard() });

      toast.success('Заявка на вывод успешно создана');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось создать заявку на вывод');
    },
  });
}

/**
 * Hook to add a payment method
 */
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { type: 'card' | 'bank_account'; details: Record<string, string> }) => {
      const response = await api.post<SavedPaymentMethod>(endpoints.partners.addPaymentMethod, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.paymentMethods() });
      toast.success('Способ оплаты добавлен');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось добавить способ оплаты');
    },
  });
}

/**
 * Hook to delete a payment method
 */
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.partners.deletePaymentMethod(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners.paymentMethods() });
      toast.success('Способ оплаты удален');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось удалить способ оплаты');
    },
  });
}

/**
 * Combined hook for partner program management
 */
export function usePartner() {
  const levels = usePartnerLevels();
  const dashboard = usePartnerDashboard();
  const balance = usePartnerBalance();
  const createWithdrawalMutation = useCreateWithdrawal();

  return {
    // Levels (public)
    levels: levels.data,
    isLoadingLevels: levels.isLoading,
    levelsError: levels.error,

    // Dashboard
    dashboard: dashboard.data,
    isLoadingDashboard: dashboard.isLoading,
    dashboardError: dashboard.error,
    refetchDashboard: dashboard.refetch,

    // Balance
    balance: balance.data,
    isLoadingBalance: balance.isLoading,
    balanceError: balance.error,
    refetchBalance: balance.refetch,

    // Computed values from dashboard
    level: dashboard.data?.level,
    levelName: dashboard.data?.levelName,
    referralCode: dashboard.data?.referralCode,
    referralUrl: dashboard.data?.referralUrl,
    totalEarnings: dashboard.data?.totalEarnings ?? 0,
    pendingEarnings: dashboard.data?.pendingEarnings ?? 0,
    availableBalance: dashboard.data?.availableBalance ?? 0,
    totalReferrals: dashboard.data?.totalReferrals ?? 0,
    activeReferrals: dashboard.data?.activeReferrals ?? 0,

    // Withdrawal
    createWithdrawal: createWithdrawalMutation.mutate,
    createWithdrawalAsync: createWithdrawalMutation.mutateAsync,
    isCreatingWithdrawal: createWithdrawalMutation.isPending,
    withdrawalResult: createWithdrawalMutation.data,
    withdrawalError: createWithdrawalMutation.error,
  };
}
