import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../axios/axiosConfig';
import { POST_API, LIKE_API, SAVE_POST_API } from '../axios/apiEndpoint';

const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

export const useUserPosts = (userId, limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(POST_API.GET_BY_USER(userId), {
        params: { page: pageParam, limit },
      });
      return extractData(response);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
  });
};

export const useLikedPosts = (enabled = true) => {
  return useQuery({
    queryKey: ['posts', 'liked'],
    queryFn: async () => {
      const response = await api.get(LIKE_API.GET_MY_LIKES);
      return extractData(response);
    },
    enabled,
  });
};

export const useSavedPosts = (enabled = true) => {
  return useQuery({
    queryKey: ['posts', 'saved'],
    queryFn: async () => {
      const response = await api.get(SAVE_POST_API.GET_ALL);
      return extractData(response);
    },
    enabled,
  });
};

export const useSharedPosts = (userId, limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['sharedPosts', userId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(POST_API.GET_BY_USER(userId) + '/shared', {
        params: { page: pageParam, limit },
      });
      return extractData(response);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!userId,
  });
};
export const useTrendingHashtags = (limit = 10) => {
  return useQuery({
    queryKey: ['hashtags', 'trending', { limit }],
    queryFn: async () => {
      const response = await api.get(POST_API.GET_TRENDING_HASHTAGS, {
        params: { limit },
      });
      return extractData(response);
    },
  });
};

export const useExploreFeed = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['posts', 'explore', { page, limit }],
    queryFn: async () => {
      const response = await api.get(POST_API.GET_EXPLORE, {
        params: { page, limit },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};
