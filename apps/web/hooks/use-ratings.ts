"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, endpoints } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-client";

export interface RatingSummary {
  averageRating: number;
  ratingCount: number;
  userRating: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    updatedAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    };
  }>;
}

export function useContentRating(contentId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.content.detail(contentId), "rating"],
    queryFn: async () => {
      const response = await api.get<RatingSummary>(
        endpoints.content.rating(contentId),
      );
      return response.data;
    },
    enabled: enabled && !!contentId,
    staleTime: 30_000,
  });
}

export function useUpsertContentRating(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rating,
      comment,
    }: {
      rating: number;
      comment?: string;
    }) => {
      const response = await api.post<RatingSummary>(
        endpoints.content.rating(contentId),
        {
          rating,
          comment,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.content.detail(contentId), "rating"],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.details() });
    },
  });
}
