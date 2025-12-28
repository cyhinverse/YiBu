import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { USER_API } from '@/axios/apiEndpoint';

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
    mutationFn: async targetUserId => {
      const response = await api.post(USER_API.FOLLOW, { targetUserId });
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
    mutationFn: async targetUserId => {
      const response = await api.post(USER_API.UNFOLLOW, { targetUserId });
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

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async profileData => {
      const response = await api.put(USER_API.UPDATE_PROFILE, profileData);
      return extractData(response);
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['profile', data?._id || data?.id]);
    },
  });
};

export const useFollowers = userId => {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_FOLLOWERS(userId));
      return extractData(response);
    },
    enabled: !!userId,
  });
};

export const useFollowing = userId => {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_FOLLOWING(userId));
      return extractData(response);
    },
    enabled: !!userId,
  });
};

export const useSettings = (options = {}) => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_SETTINGS);
      return extractData(response);
    },
    ...options,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, settings }) => {
      let endpoint;
      switch (type) {
        case 'theme':
          endpoint = USER_API.UPDATE_THEME;
          break;
        case 'privacy':
          endpoint = USER_API.UPDATE_PRIVACY;
          break;
        case 'notifications':
          endpoint = USER_API.UPDATE_NOTIFICATIONS;
          break;
        case 'security':
          endpoint = USER_API.UPDATE_SECURITY;
          break;
        case 'content':
          endpoint = USER_API.UPDATE_CONTENT;
          break;
        default:
          throw new Error('Invalid settings type');
      }
      const response = await api.put(endpoint, settings);
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
    },
  });
};

export const useFollowRequests = (options = {}) => {
  return useQuery({
    queryKey: ['followRequests'],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_FOLLOW_REQUESTS);
      return extractData(response);
    },
    ...options,
  });
};

export const useAcceptFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async requestId => {
      const response = await api.post(
        USER_API.ACCEPT_FOLLOW_REQUEST(requestId)
      );
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followRequests']);
      queryClient.invalidateQueries(['followers']);
    },
  });
};

export const useRejectFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async requestId => {
      const response = await api.post(
        USER_API.REJECT_FOLLOW_REQUEST(requestId)
      );
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followRequests']);
    },
  });
};

export const useBlockedUsers = () => {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_BLOCKED);
      return extractData(response);
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.BLOCK_USER(userId));
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blockedUsers']);
      queryClient.invalidateQueries(['following']);
      queryClient.invalidateQueries(['followers']);
      queryClient.invalidateQueries(['suggestions']);
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.UNBLOCK_USER(userId)); // Should be UNBLOCK_USER or DELETE based on API style, assuming POST for now from apiEndpoint
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blockedUsers']);
    },
  });
};

export const useMutedUsers = () => {
  return useQuery({
    queryKey: ['mutedUsers'],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_MUTED);
      return extractData(response);
    },
  });
};

export const useMuteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.MUTE_USER(userId));
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mutedUsers']);
    },
  });
};

export const useUnmuteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.UNMUTE_USER(userId));
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mutedUsers']);
    },
  });
};
