import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { POST_API, LIKE_API, SAVE_POST_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';
import { invalidateQueryKeys, removeQueryKeys } from './queryClientUtils';

const normalizeId = value => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const toSafeNumber = value => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getPostLikeCount = post => {
  if (!post || typeof post !== 'object') return 0;
  if (post.likesCount !== undefined) return toSafeNumber(post.likesCount);
  if (post.likeCount !== undefined) return toSafeNumber(post.likeCount);
  return 0;
};

const patchLikeOnPost = (post, postId, liked) => {
  if (!post || typeof post !== 'object') return post;
  const currentId = normalizeId(post._id || post.id);
  if (!currentId || currentId !== normalizeId(postId)) return post;

  const currentCount = getPostLikeCount(post);
  const nextCount = liked
    ? currentCount + 1
    : Math.max(0, currentCount - 1);

  return {
    ...post,
    isLiked: liked,
    likesCount: nextCount,
    likeCount: nextCount,
  };
};

const patchLikeOnPostArray = (posts, postId, liked) => {
  if (!Array.isArray(posts)) return posts;

  let hasChanges = false;
  const nextPosts = posts.map(post => {
    const patched = patchLikeOnPost(post, postId, liked);
    if (patched !== post) hasChanges = true;
    return patched;
  });

  return hasChanges ? nextPosts : posts;
};

const patchLikeInQueryData = (oldData, postId, liked) => {
  if (!oldData) return oldData;

  if (Array.isArray(oldData)) {
    return patchLikeOnPostArray(oldData, postId, liked);
  }

  if (oldData.pages && Array.isArray(oldData.pages)) {
    let hasChanges = false;
    const nextPages = oldData.pages.map(page => {
      if (Array.isArray(page)) {
        const nextPage = patchLikeOnPostArray(page, postId, liked);
        if (nextPage !== page) hasChanges = true;
        return nextPage;
      }

      if (!page || typeof page !== 'object') return page;
      if (!Array.isArray(page.posts)) return page;

      const nextPosts = patchLikeOnPostArray(page.posts, postId, liked);
      if (nextPosts === page.posts) return page;

      hasChanges = true;
      return {
        ...page,
        posts: nextPosts,
      };
    });

    return hasChanges
      ? {
          ...oldData,
          pages: nextPages,
        }
      : oldData;
  }

  if (Array.isArray(oldData.posts)) {
    const nextPosts = patchLikeOnPostArray(oldData.posts, postId, liked);
    if (nextPosts === oldData.posts) return oldData;
    return {
      ...oldData,
      posts: nextPosts,
    };
  }

  return patchLikeOnPost(oldData, postId, liked);
};

const patchLikeStatusData = (oldData, liked) => {
  if (!oldData || typeof oldData !== 'object') {
    return { isLiked: liked, liked };
  }

  const existingCount =
    oldData.count ?? oldData.likesCount ?? oldData.likeCount;
  const baseCount = toSafeNumber(existingCount);
  const nextCount = liked ? baseCount + 1 : Math.max(0, baseCount - 1);

  return {
    ...oldData,
    isLiked: liked,
    liked,
    count: nextCount,
    likesCount: nextCount,
    likeCount: nextCount,
  };
};

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
      const response = await api.get(POST_API.GET_SHARED_BY_USER(userId), {
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
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
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
    onSuccess: (result, postId) => {
      const liked = Boolean(result?.liked);

      queryClient.setQueryData(['post', postId], oldData =>
        patchLikeInQueryData(oldData, postId, liked)
      );
      queryClient.setQueryData(['likeStatus', postId], oldData =>
        patchLikeStatusData(oldData, liked)
      );

      queryClient.setQueriesData({ queryKey: ['feed'] }, oldData =>
        patchLikeInQueryData(oldData, postId, liked)
      );

      queryClient.setQueriesData({ queryKey: ['posts'] }, oldData =>
        patchLikeInQueryData(oldData, postId, liked)
      );

      queryClient.setQueriesData({ queryKey: ['sharedPosts'] }, oldData =>
        patchLikeInQueryData(oldData, postId, liked)
      );
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
      invalidateQueryKeys(queryClient, [
        { queryKey: ['posts', 'saved'] },
        { queryKey: ['saveStatus', postId] },
      ]);
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
      invalidateQueryKeys(queryClient, [
        { queryKey: ['posts'], refetchType: 'active' },
        { queryKey: ['feed'], refetchType: 'active' },
      ]);
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
      invalidateQueryKeys(queryClient, [
        ['post', postId],
        ['posts'],
        ['feed'],
      ]);
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
      removeQueryKeys(queryClient, [{ queryKey: ['post', postId] }]);
      invalidateQueryKeys(queryClient, [
        { queryKey: ['posts'], refetchType: 'active' },
        { queryKey: ['feed'], refetchType: 'active' },
      ]);
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
      invalidateQueryKeys(queryClient, [
        ['posts', 'user'],
        ['posts', 'shared'],
        ['post', postId],
        ['feed'],
      ]);
    },
  });
};
