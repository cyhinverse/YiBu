import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { POST_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';

/**
 * Hook to fetch home feed with infinite scroll
 * @param {string} [type='forYou'] - Feed type ('forYou' | 'following' | 'latest' | 'hashtags')
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} Infinite query result containing feed data
 * @example
 * const { data, fetchNextPage, hasNextPage } = useHomeFeed('following');
 */
export const useHomeFeed = (type = 'forYou') => {
  return useInfiniteQuery({
    queryKey: ['feed', type],
    queryFn: async ({ pageParam = 1 }) => {
      let endpoint;
      const params = { page: pageParam, limit: 20 };

      switch (type) {
        case 'forYou':
          endpoint = POST_API.GET_PERSONALIZED;
          break;
        case 'following':
          endpoint = POST_API.GET_ALL;
          break;
        case 'latest':
          endpoint = POST_API.GET_TRENDING;
          break;
        case 'hashtags':
          endpoint = POST_API.GET_HASHTAG_FEED;
          break;
        default:
          endpoint = POST_API.GET_ALL;
      }

      const response = await api.get(endpoint, { params });
      return extractData(response);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 1,
  });
};
