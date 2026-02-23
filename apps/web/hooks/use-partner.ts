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
  ReferralNode,
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
// Map level numbers to PartnerLevel strings
const LEVEL_NUMBER_TO_NAME: Record<number, string> = {
  1: 'STARTER',
  2: 'BRONZE',
  3: 'SILVER',
  4: 'GOLD',
  5: 'PLATINUM',
};

export function usePartnerLevels() {
  return useQuery({
    queryKey: queryKeys.partners.levels(),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<any[]>(endpoints.partners.levels);
      // Normalize API response fields to match frontend PartnerLevelConfig type
      return (response.data ?? []).map((l) => ({
        level: l.level ?? LEVEL_NUMBER_TO_NAME[l.levelNumber] ?? 'STARTER',
        name: l.name ?? '',
        minReferrals: l.minReferrals ?? 0,
        minEarnings: l.minEarnings ?? l.minTeamVolume ?? 0,
        commissionRate: l.commissionRate ?? 0,
        benefits: Array.isArray(l.benefits) ? l.benefits : [],
      })) as PartnerLevelConfig[];
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<any>(endpoints.partners.dashboard);
      const d = response.data;
      // Normalize API response fields to match frontend PartnerDashboard type
      const np = d.nextLevelProgress;
      // Convert numeric level to PartnerLevel string if needed
      const rawLevel = d.currentLevel ?? d.level ?? 1;
      const level = typeof rawLevel === 'number' ? (LEVEL_NUMBER_TO_NAME[rawLevel] ?? 'STARTER') : rawLevel;
      return {
        level,
        levelName: d.levelName ?? 'Стартер',
        referralCode: d.referralCode ?? '',
        referralUrl: d.referralUrl ?? '',
        totalReferrals: d.totalReferrals ?? 0,
        activeReferrals: d.activeReferrals ?? 0,
        totalEarnings: d.totalEarnings ?? 0,
        pendingEarnings: d.pendingEarnings ?? 0,
        availableBalance: d.availableBalance ?? 0,
        withdrawnAmount: d.withdrawnAmount ?? 0,
        currentMonthEarnings: d.currentMonthEarnings ?? d.thisMonthEarnings ?? 0,
        previousMonthEarnings: d.previousMonthEarnings ?? d.lastMonthEarnings ?? 0,
        levelProgress: d.levelProgress ?? (np ? {
          currentLevel: level,
          nextLevel: np.nextLevel ? (typeof np.nextLevel === 'number' ? (LEVEL_NUMBER_TO_NAME[np.nextLevel] ?? null) : np.nextLevel) : null,
          referralsProgress: {
            current: np.currentReferrals ?? 0,
            required: np.referralsNeeded ?? 0,
            percentage: np.referralsNeeded ? Math.round((np.currentReferrals / np.referralsNeeded) * 100) : 0,
          },
          earningsProgress: {
            current: np.currentTeamVolume ?? 0,
            required: np.teamVolumeNeeded ?? 0,
            percentage: np.teamVolumeNeeded ? Math.round((np.currentTeamVolume / np.teamVolumeNeeded) * 100) : 0,
          },
        } : { currentLevel: 1, nextLevel: null, referralsProgress: { current: 0, required: 0, percentage: 0 }, earningsProgress: { current: 0, required: 0, percentage: 0 } }),
        recentCommissions: d.recentCommissions ?? [],
      } as PartnerDashboard;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<any>(endpoints.partners.referrals, {
        params: { depth },
      });
      const d = response.data;

      // Normalize API ReferralNodeDto → frontend ReferralNode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapNode = (node: any): ReferralNode => ({
        id: node.userId ?? node.id ?? '',
        email: node.email ?? '',
        firstName: node.firstName ?? '',
        lastName: node.lastName,
        level: node.level ?? 1,
        registeredAt: node.joinedAt ?? node.registeredAt ?? new Date().toISOString(),
        isActive: node.isActive ?? true,
        totalPaid: node.totalSpent ?? node.totalPaid ?? 0,
        commissionsGenerated: node.commissionsGenerated ?? 0,
        children: Array.isArray(node.children) ? node.children.map(mapNode) : [],
      });

      const nodes = Array.isArray(d.directReferrals)
        ? d.directReferrals.map(mapNode)
        : Array.isArray(d.nodes)
          ? d.nodes.map(mapNode)
          : [];

      // Count nodes by level
      const byLevel: Record<number, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countByLevel = (nodeList: any[], lvl: number) => {
        byLevel[lvl] = (byLevel[lvl] ?? 0) + nodeList.length;
        nodeList.forEach((n) => n.children && countByLevel(n.children, lvl + 1));
      };
      countByLevel(nodes, 1);

      const totalCount = d.totalTeamSize ?? d.totalCount ?? nodes.length;

      return {
        nodes,
        totalCount,
        depth: d.depth ?? depth,
        stats: d.stats ?? {
          totalReferrals: totalCount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          activeReferrals: d.activeReferrals ?? nodes.filter((n: any) => n.isActive).length,
          byLevel,
        },
      } as ReferralTree;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.get<any>(endpoints.partners.balance);
      const d = response.data;
      // Normalize API response fields to match frontend AvailableBalance type
      const available = d.available ?? d.availableBalance ?? 0;
      const pending = d.pending ?? d.pendingWithdrawals ?? 0;
      const processing = d.processing ?? 0;
      const minimumWithdrawal = d.minimumWithdrawal ?? 1000;
      return {
        available,
        pending,
        processing,
        minimumWithdrawal,
        canWithdraw: d.canWithdraw ?? available >= minimumWithdrawal,
      } as AvailableBalance;
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
