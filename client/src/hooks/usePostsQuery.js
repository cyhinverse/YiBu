import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { POST_API, LIKE_API, SAVE_POST_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';

/**
 * Hook to fetch user posts with infinite scroll
 * @param {string} userId - User ID
 * @param {number} [limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} Infinite query result containing posts
 */
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
    refetchOnMount: true,
    staleTime: 0,
  });
};

/**
 * Hook to fetch liked posts
 * @param {boolean} [enabled=true] - Enable query
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing liked posts
 */
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

/**
 * Hook to fetch saved posts
 * @param {boolean} [enabled=true] - Enable query
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing saved posts
 */
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

/**
 * Hook to fetch shared posts by user
 * @param {string} userId - User ID
 * @param {number} [limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} Infinite query result containing shared posts
 */
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

/**
 * Hook to fetch posts by hashtag
 * @param {string} hashtag - Hashtag to search
 * @param {number} [limit=20] - Number of posts
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing posts by hashtag
 */
export const useGetPostsByHashtag = (hashtag, limit = 20) => {
  return useQuery({
    queryKey: ['posts', 'hashtag', hashtag],
    queryFn: async () => {
      const response = await api.get(POST_API.GET_BY_HASHTAG(hashtag), {
        params: { limit },
      });
      return extractData(response);
    },
    enabled: !!hashtag,
  });
};

/**
 * Hook to fetch trending hashtags
 * @param {number} [limit=10] - Number of hashtags
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing trending hashtags
 */
export const useTrendingHashtags = (limit = 10) => {
  return useQuery({
    queryKey: ['hashtags', 'trending', { limit }],
    queryFn: async () => {
      const response = await api.get(POST_API.GET_TRENDING_HASHTAGS, {
        params: { limit },
      });
      return extractData(response);
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
};

/**
 * Hook to fetch explore feed
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing explore feed
 */
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

/**
 * Hook to toggle like on a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to toggle like
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      const response = await api.post(LIKE_API.TOGGLE, { postId });
      return extractData(response);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries(['feed']);
      queryClient.invalidateQueries(['posts', 'user']);
      queryClient.invalidateQueries(['posts', 'liked']);
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['likeStatus', postId]);
    },
  });
};

/**
 * Hook to toggle save on a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to toggle save
 */
export const useToggleSave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isSaved }) => {
      let response;
      if (isSaved) {
        response = await api.delete(SAVE_POST_API.UNSAVE(postId));
      } else {
        response = await api.post(SAVE_POST_API.SAVE(postId));
      }
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      const { postId } = variables;
      queryClient.invalidateQueries(['posts', 'saved']);
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['saveStatus', postId]);
    },
  });
};

/**
 * Hook to create a new post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to create post
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async formData => {
      const response = await api.post(POST_API.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['feed']);
    },
  });
};

/**
 * Hook to update a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update post
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, data }) => {
      const response = await api.put(POST_API.UPDATE(postId), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      const { postId } = variables;
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['feed']);
    },
  });
};

/**
 * Hook to delete a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete post
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      const response = await api.delete(POST_API.DELETE(postId));
      return extractData(response);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['feed']);
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Hook to share a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to share post
 */
export const useSharePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      const response = await api.post(POST_API.SHARE(postId));
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      const { postId } = variables;
      queryClient.invalidateQueries(['posts', 'user']);
      queryClient.invalidateQueries(['posts', 'shared']);
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['feed']);
    },
  });
};
