'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, endpoints } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export function useContentLikeStatus(contentId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.likes.status(contentId),
    queryFn: async () => {
      const res = await api.get<LikeResponse>(endpoints.content.like(contentId));
      return res.data;
    },
    enabled: enabled && !!contentId,
    staleTime: 0,
  });
}

export function useLikeContent(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<LikeResponse>(endpoints.content.like(contentId));
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.likes.status(contentId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.content.details() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() });
    },
  });
}

export function useUnlikeContent(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<LikeResponse>(endpoints.content.like(contentId));
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.likes.status(contentId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.content.details() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.lists() });
    },
  });
}
