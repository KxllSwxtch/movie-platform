'use client';

import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';

import { api, endpoints } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { PaginatedList } from '@/types';

interface ContentListParams {
  type?: string;
  categorySlug?: string;
  age?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  search?: string;
  instructor?: string;
}

interface ContentListItem {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  contentType: string;
  ageCategory: string;
  duration: number;
  viewCount: number;
  category?: string;
  rating?: number;
  year?: number;
  seasonCount?: number;
  episodeCount?: number;
  lessonCount?: number;
  completedLessons?: number;
  instructor?: string;
  creator?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  videoUrl?: string;
}

interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  iconUrl?: string;
}

interface TutorialDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  ageCategory: string;
  category: string;
  instructor: string;
  duration: string;
  lessons: TutorialLesson[];
}

export interface TutorialLesson {
  id: string;
  number: number;
  title: string;
  duration: number;
  isCompleted: boolean;
}

/**
 * Hook for fetching a paginated list of content with filters
 */
export function useContentList(params: ContentListParams) {
  const { type, categorySlug, age, sortBy, page = 1, limit = 20, search, instructor } = params;

  return useQuery({
    queryKey: queryKeys.content.list({ type, categorySlug, age, sortBy, page, limit, search, instructor }),
    queryFn: async () => {
      const response = await api.get<PaginatedList<ContentListItem>>(endpoints.content.list, {
        params: {
          contentType: type,
          categorySlug: categorySlug,
          ageCategory: age,
          sortBy,
          page,
          limit,
          search,
          instructor,
        },
      });
      return response;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook for fetching infinite scrollable content (for shorts)
 */
export function useContentInfinite(params: Omit<ContentListParams, 'page'>) {
  const { type, categorySlug, age, sortBy, limit = 10 } = params;

  return useInfiniteQuery({
    queryKey: [...queryKeys.content.lists(), 'infinite', { type, categorySlug, age, sortBy }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<PaginatedList<ContentListItem>>(endpoints.content.list, {
        params: {
          contentType: type,
          categorySlug,
          ageCategory: age,
          sortBy,
          page: pageParam,
          limit,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: 60_000,
  });
}

/**
 * Hook for fetching category detail by slug
 */
export function useCategoryDetail(slug: string) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'detail', slug],
    queryFn: async () => {
      const response = await api.get<CategoryDetail>(`/categories/slug/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook for fetching tutorial detail by slug (including lessons)
 */
export function useTutorialDetail(slug: string) {
  return useQuery({
    queryKey: [...queryKeys.content.details(), 'tutorial', slug],
    queryFn: async () => {
      const response = await api.get<TutorialDetail>(endpoints.content.detail(slug));
      return response.data;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export type { ContentListItem, CategoryDetail, TutorialDetail };
