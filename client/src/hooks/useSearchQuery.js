import { useQuery } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { USER_API, POST_API } from '@/axios/apiEndpoint';

const extractData = response =>
  response?.data?.data || response?.data || response;

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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
