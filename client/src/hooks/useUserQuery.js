import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { USER_API } from '@/axios/apiEndpoint';
import { extractData } from '@/utils/apiUtils';

/**
 * Hook to fetch user profile
 * @param {string} userId - User ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing profile data
 */
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

/**
 * Hook to check follow status
 * @param {string} targetUserId - Target user ID
 * @param {boolean} [enabled=true] - Enable query
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing follow status
 */
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

/**
 * Hook to follow a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to follow user
 */
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

/**
 * Hook to unfollow a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to unfollow user
 */
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

/**
 * Hook to fetch user suggestions
 * @param {number} [limit=10] - Number of suggestions
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing suggestions
 */
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

/**
 * Hook to update profile
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update profile
 */
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

/**
 * Hook to fetch followers list
 * @param {string} userId - User ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing followers
 */
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

/**
 * Hook to fetch following list
 * @param {string} userId - User ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing following
 */
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

/**
 * Hook to fetch user settings
 * @param {Object} [options] - Query options
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing settings
 */
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

/**
 * Hook to update settings
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update settings
 */
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

/**
 * Hook to fetch follow requests
 * @param {Object} [options] - Query options
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing follow requests
 */
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

/**
 * Hook to accept follow request
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to accept follow request
 */
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

/**
 * Hook to reject follow request
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to reject follow request
 */
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

/**
 * Hook to fetch blocked users
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing blocked users
 */
export const useBlockedUsers = () => {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_BLOCKED);
      return extractData(response);
    },
  });
};

/**
 * Hook to block a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to block user
 */
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

/**
 * Hook to unblock a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to unblock user
 */
export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      const response = await api.post(USER_API.UNBLOCK_USER(userId));
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blockedUsers']);
    },
  });
};

/**
 * Hook to fetch muted users
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing muted users
 */
export const useMutedUsers = () => {
  return useQuery({
    queryKey: ['mutedUsers'],
    queryFn: async () => {
      const response = await api.get(USER_API.GET_MUTED);
      return extractData(response);
    },
  });
};

/**
 * Hook to mute a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to mute user
 */
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

/**
 * Hook to unmute a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to unmute user
 */
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
