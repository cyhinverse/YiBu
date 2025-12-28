import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { POST_API } from '@/axios/apiEndpoint';

const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

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
        default:
          endpoint = POST_API.GET_ALL;
      }

      const response = await api.get(endpoint, { params });
      return extractData(response);
    },
    getNextPageParam: (lastPage, allPages) => {
      // Assuming backend returns { posts: [], hasMore: boolean } or similar
      // Adjust based on actual API response structure
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 1, // 1 minute stale time for feed
  });
};
