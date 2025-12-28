import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { POST_API, LIKE_API, SAVE_POST_API } from '@/axios/apiEndpoint';

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
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      const response = await api.post(LIKE_API.TOGGLE, { postId });
      return extractData(response);
    },
    onSuccess: (_, postId) => {
      // Invalidate relevant queries to refresh like status and counts
      queryClient.invalidateQueries(['feed']);
      queryClient.invalidateQueries(['posts', 'user']);
      queryClient.invalidateQueries(['posts', 'liked']);
      queryClient.invalidateQueries(['post', postId]);
      queryClient.invalidateQueries(['likeStatus', postId]);
    },
  });
};

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
