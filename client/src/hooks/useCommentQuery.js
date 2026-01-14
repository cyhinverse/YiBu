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
      queryClient.invalidateQueries(['comments', variables.postId]);
    },
  });
};

export const useUpdateComment = () => {
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
  return useMutation({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(COMMENT_API.DELETE(commentId));
      return { commentId, ...extractData(response) };
    },
  });
};

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
