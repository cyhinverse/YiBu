import { useQuery } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { USER_API, POST_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';

/**
 * Hook to search users
 * @param {Object} [options] - Search options
 * @param {string} [options.query] - Search keyword
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing user search results
 */
export const useSearchUsers = ({ query, page = 1, limit = 10 } = {}) => {
  return useQuery({
    queryKey: ['search', 'users', { query, page, limit }],
    queryFn: async () => {
      if (!query?.trim()) return { data: [], total: 0 };
      const response = await api.get(USER_API.SEARCH, {
        params: { q: query, page, limit },
      });
      return extractData(response);
    },
    enabled: !!query?.trim(),
    keepPreviousData: true,
  });
};

/**
 * Hook to search posts
 * @param {Object} [options] - Search options
 * @param {string} [options.query] - Search keyword
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing post search results
 */
export const useSearchPosts = ({ query, page = 1, limit = 10 } = {}) => {
  return useQuery({
    queryKey: ['search', 'posts', { query, page, limit }],
    queryFn: async () => {
      if (!query?.trim()) return { data: [], total: 0 };
      const response = await api.get(POST_API.SEARCH, {
        params: { q: query, page, limit },
      });
      return extractData(response);
    },
    enabled: !!query?.trim(),
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch search suggestions
 * @param {string} query - Search keyword
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing suggestions
 */
export const useSearchSuggestions = query => {
  return useQuery({
    queryKey: ['search', 'suggestions', query],
    queryFn: async () => {
      if (!query?.trim()) return [];
      const response = await api.get(USER_API.SUGGESTIONS, {
        params: { query },
      });
      return extractData(response);
    },
    enabled: !!query?.trim() && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};
