'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  api,
  ApiError,
  attemptTokenRefresh,
  buildUrl,
  endpoints,
  getAuthToken,
} from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

export interface AdminVerification {
  id: string;
  userId: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  userFirstName: string;
  userLastName: string;
  userRole: string;
  userAgeCategory: string;
  userDateOfBirth?: string | null;
  userCreatedAt: string;
  userUpdatedAt: string;
  userVerificationStatus: string;
  method: 'PAYMENT' | 'DOCUMENT' | 'THIRD_PARTY';
  documentKey?: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNVERIFIED';
  reviewedByEmail?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  confirmedByPartnerId?: string | null;
  confirmedByPartnerEmail?: string | null;
  confirmedAt?: string | null;
  partnerRelationshipId?: string | null;
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    externalPaymentId?: string | null;
    createdAt: string;
    completedAt?: string | null;
    metadata?: Record<string, unknown>;
  } | null;
  auditEventsCount?: number;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface AdminVerificationList {
  items: AdminVerification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminVerificationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  overdueCount: number;
}

export interface AdminVerificationParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
}

function useCanModerate() {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  return {
    enabled:
      isAuthenticated &&
      isHydrated &&
      (user?.role === 'ADMIN' || user?.role === 'MODERATOR'),
  };
}

export function useAdminVerifications(params?: AdminVerificationParams) {
  const { enabled } = useCanModerate();

  return useQuery({
    queryKey: queryKeys.adminVerifications.list(params as Record<string, unknown> | undefined),
    queryFn: async () => {
      const response = await api.get<AdminVerificationList>(
        endpoints.adminVerifications.list,
        { params: params as Record<string, string | number | boolean | undefined | null> },
      );
      return response.data;
    },
    enabled,
  });
}

export function useAdminVerificationStats() {
  const { enabled } = useCanModerate();

  return useQuery({
    queryKey: queryKeys.adminVerifications.stats(),
    queryFn: async () => {
      const response = await api.get<AdminVerificationStats>(
        endpoints.adminVerifications.stats,
      );
      return response.data;
    },
    enabled,
  });
}

export function useAdminVerification(id: string | null) {
  const { enabled } = useCanModerate();

  return useQuery({
    queryKey: queryKeys.adminVerifications.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Verification ID required');
      const response = await api.get<AdminVerification>(
        endpoints.adminVerifications.detail(id),
      );
      return response.data;
    },
    enabled: enabled && !!id,
  });
}

export function useApproveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(endpoints.adminVerifications.approve(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVerifications.all });
      toast.success('Заявка одобрена');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось одобрить заявку');
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(endpoints.adminVerifications.reject(id), { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVerifications.all });
      toast.success('Заявка отклонена');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Не удалось отклонить заявку');
    },
  });
}

export async function openVerificationDocument(id: string) {
  const previewWindow = window.open('about:blank', '_blank');
  if (previewWindow) {
    previewWindow.opener = null;
  }

  try {
    const response = await fetchVerificationDocument(id);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    if (previewWindow) {
      previewWindow.location.href = objectUrl;
    } else {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    previewWindow?.close();
    const message = error instanceof ApiError
      ? error.message
      : 'Не удалось открыть документ';
    toast.error(message);
  }
}

async function fetchVerificationDocument(id: string): Promise<Response> {
  const endpoint = endpoints.adminVerifications.document(id);
  const headers = new Headers({ Accept: 'application/pdf,image/*,*/*' });
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(buildUrl(endpoint), {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh();
    const newToken = getAuthToken();
    if (refreshed && newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(buildUrl(endpoint), {
        method: 'GET',
        headers,
        credentials: 'include',
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(
      `Не удалось открыть документ (${response.status})`,
      response.status,
    );
  }

  return response;
}
