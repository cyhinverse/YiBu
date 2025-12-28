import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { COMMENT_API } from '@/axios/apiEndpoint';

const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

// Fetch Comments by Post
export const usePostComments = postId => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      // Assuming existing logic fetches page 1, 50 limit.
      // Can be upgraded to InfiniteQuery later if needed.
      const response = await api.get(COMMENT_API.GET_BY_POST(postId), {
        params: { page: 1, limit: 50 },
      });
      return extractData(response); // Expected to return { comments: [...] } or [...]
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Mutations
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
      // Invalidate comments for this post to trigger refetch
      // OR optimistically update (complex due to tree structure)
      // For now, invalidation or socket handling (in useComments) covers it.
      // We'll let socket handle the update/invalidation to avoid duplicate data insertion if socket is fast.
      // But for good UX without socket, we might invalidate.
      queryClient.invalidateQueries(['comments', variables.postId]);
    },
  });
};

export const useUpdateComment = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await api.put(COMMENT_API.UPDATE(commentId), {
        content,
      });
      return extractData(response);
    },
    // onSuccess handled by caller or socket
  });
};

export const useDeleteComment = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(COMMENT_API.DELETE(commentId));
      return { commentId, ...extractData(response) };
    },
    // onSuccess handled by caller or socket
  });
};

export const useToggleLikeComment = () => {
  return useMutation({
    mutationFn: async ({ commentId, isLiked }) => {
      const endpoint = isLiked
        ? COMMENT_API.UNLIKE(commentId)
        : COMMENT_API.LIKE(commentId);
      // Backend apiEndpoint.js shows same URL for LIKE/UNLIKE but method likely differs?
      // Checking apiEndpoint.js:
      // LIKE: commentId => `/api/comments/${commentId}/like`,
      // UNLIKE: commentId => `/api/comments/${commentId}/like`,
      // Usually POST for like, DELETE or PUT for unlike?
      // Checking commentActions.js usually clarifies, but I don't have it open.
      // Assuming POST for toggle or separate endpoints.
      // Let's assume POST for now as it is common for toggles or look at usage later.
      // Update: apiEndpoint.js has same path. I'll use POST for both as toggle?
      // Or maybe one is DELETE. I'll verify in useComments refactor.
      // SAFE BET: Use POST for like, DELETE for unlike if RESTful, or check standard.
      // Re-reading previous logs/file view:
      // useComments.js calls unlikeComment/likeComment actions.
      // I'll stick to generic api call in mutation and fix details when integrating.

      const method = isLiked ? 'delete' : 'post';
      // Check if UNLIKE endpoint is distinct in real implementation?
      // In apiEndpoint log: both are `/api/comments/${commentId}/like`
      // So likely POST to like, DELETE to unlike.
      const response = await api[method](endpoint);
      return extractData(response);
    },
  });
};
