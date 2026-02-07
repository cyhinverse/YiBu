import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { COMMENT_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';

/**
 * Hook to fetch comments for a post
 * @param {string} postId - Post ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing comments list
 */
export const usePostComments = postId => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(COMMENT_API.GET_BY_POST(postId), {
        params: { page: 1, limit: 50 },
      });
      return extractData(response);
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to create a new comment
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to create comment
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content, parentId }) => {
      const response = await api.post(COMMENT_API.CREATE, {
        postId,
        content,
        parentId,
      });
      return extractData(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['comments', variables.postId]);
    },
  });
};

/**
 * Hook to update a comment
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update comment
 */
export const useUpdateComment = () => {
  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await api.put(COMMENT_API.UPDATE(commentId), {
        content,
      });
      return extractData(response);
    },
  });
};

/**
 * Hook to delete a comment
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete comment
 */
export const useDeleteComment = () => {
  return useMutation({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(COMMENT_API.DELETE(commentId));
      return { commentId, ...extractData(response) };
    },
  });
};

/**
 * Hook to toggle like/unlike on a comment
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to toggle comment like
 */
export const useToggleLikeComment = () => {
  return useMutation({
    mutationFn: async ({ commentId, isLiked }) => {
      const endpoint = isLiked
        ? COMMENT_API.UNLIKE(commentId)
        : COMMENT_API.LIKE(commentId);
      const method = isLiked ? 'delete' : 'post';
      const response = await api[method](endpoint);
      return extractData(response);
    },
  });
};
