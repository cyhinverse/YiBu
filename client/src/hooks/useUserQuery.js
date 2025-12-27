import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios/axiosConfig';
import { USER_API } from '../axios/apiEndpoint';

const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

export const useProfile = userId => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_PROFILE(userId));
      return extractData(response);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCheckFollow = (targetUserId, enabled = true) => {
  return useQuery({
    queryKey: ['followStatus', targetUserId],
    queryFn: async () => {
      const response = await api.get(USER_API.CHECK_FOLLOW(targetUserId));
      return extractData(response);
    },
    enabled: !!targetUserId && enabled,
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.FOLLOW, { userId });
      return extractData(response);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries(['followStatus', userId]);
      queryClient.invalidateQueries(['profile', userId]);
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.UNFOLLOW, { userId });
      return extractData(response);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries(['followStatus', userId]);
      queryClient.invalidateQueries(['profile', userId]);
    },
  });
};

export const useSuggestions = (limit = 10) => {
  return useQuery({
    queryKey: ['suggestions', { limit }],
    queryFn: async () => {
      const response = await api.get(USER_API.SUGGESTIONS, {
        params: { limit },
      });
      return extractData(response);
    },
  });
};
