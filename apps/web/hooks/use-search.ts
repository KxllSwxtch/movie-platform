'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { api, endpoints } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { PaginatedList } from '@/types';
import type { SeriesContent } from '@/components/content';

interface SearchSuggestion {
  id: string;
  title: string;
  type?: string;
}

interface SearchResultsParams {
  query: string;
  type?: string;
  category?: string;
  age?: string;
  year?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook for fetching search suggestions as the user types
 */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: queryKeys.content.search(query),
    queryFn: async () => {
      const response = await api.get<SearchSuggestion[]>(endpoints.content.search, {
        params: { q: query, limit: 5 },
      });
      return response.data ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook for fetching full search results on the search page
 */
export function useSearchResults(params: SearchResultsParams) {
  const { query, type, category, age, year, sortBy, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: queryKeys.content.list({ search: query, type, category, age, year, sortBy, page, limit }),
    queryFn: async () => {
      const response = await api.get<PaginatedList<SeriesContent>>(endpoints.content.list, {
        params: {
          search: query,
          contentType: type !== 'all' ? type : undefined,
          categoryId: category !== 'all' ? category : undefined,
          ageCategory: age !== 'all' ? age : undefined,
          year: year !== 'all' ? year : undefined,
          sortBy: sortBy !== 'relevance' ? sortBy : undefined,
          page,
          limit,
        },
      });
      return response;
    },
    enabled: !!query,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
