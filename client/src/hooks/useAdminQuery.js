import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { ADMIN_API, REPORT_API } from '@/axios/apiEndpoint';
import { toast } from 'react-hot-toast';
import { extractData } from '@/utils/apiUtils';

/**
 * Hook to fetch admin dashboard statistics
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing dashboard stats
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_DASHBOARD_STATS);
      return extractData(response);
    },
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch user growth data within a date range
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing growth data
 */
export const useUserGrowth = (startDate, endDate) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'userGrowth', startDate, endDate],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_USER_GROWTH, {
        params: { startDate, endDate },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch post statistics by period
 * @param {string} [period='month'] - Statistics period ('day' | 'week' | 'month' | 'year')
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing post stats
 */
export const usePostStats = (period = 'month') => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'postStats', period],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_POST_STATS, {
        params: { period },
      });
      return extractData(response);
    },
  });
};

/**
 * Hook to fetch top users list
 * @param {number} [page=1] - Page number
 * @param {number} [limit=50] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing top users
 */
export const useTopUsers = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'topUsers', page, limit],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_TOP_USERS, {
        params: { page, limit },
      });
      return extractData(response);
    },
  });
};

/**
 * Hook to fetch admin interactions list
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.type] - Interaction type
 * @param {string} [options.search] - Search keyword
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing interactions
 */
export const useAdminInteractions = ({
  page = 1,
  limit = 20,
  type,
  search,
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'interactions', 'list', { page, limit, type, search }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_INTERACTIONS, {
        params: { page, limit, type, search },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};


/**
 * Hook to fetch users list for admin
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.search] - Search keyword
 * @param {string} [options.status] - User status
 * @param {string} [options.role] - User role
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing users list
 */
export const useAdminUsers = ({
  page = 1,
  limit = 20,
  search,
  status,
  role,
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', 'list', { page, limit, search, status, role }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_ALL_USERS, {
        params: { page, limit, search, status, role },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch user details
 * @param {string} userId - User ID
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing user details
 */
export const useUserDetails = userId => {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_USER_DETAILS(userId));
      return extractData(response);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to ban a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to ban user
 */
export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason, duration }) => {
      const response = await api.post(ADMIN_API.BAN_USER, {
        userId,
        reason,
        duration,
      });
      return extractData(response);
    },
    onSuccess: (_, { userId }) => {
      toast.success('User banned successfully');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'dashboard']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to ban user');
    },
  });
};

/**
 * Hook to unban a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to unban user
 */
export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }) => {
      await api.post(ADMIN_API.UNBAN_USER, { userId });
      return { userId };
    },
    onSuccess: (_, { userId }) => {
      toast.success('User unbanned successfully');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to unban user');
    },
  });
};

/**
 * Hook to suspend a user account
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to suspend user
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days, reason }) => {
      const response = await api.post(ADMIN_API.SUSPEND_USER, {
        userId,
        duration: days,
        reason,
      });
      return extractData(response);
    },
    onSuccess: (_, { userId }) => {
      toast.success('Account suspended successfully');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to suspend account');
    },
  });
};

/**
 * Hook to send warning to a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to warn user
 */
export const useWarnUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }) => {
      const response = await api.post(ADMIN_API.WARN_USER, {
        userId,
        reason,
      });
      return extractData(response);
    },
    onSuccess: (_, { userId }) => {
      toast.success('Warning sent successfully');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to send warning');
    },
  });
};

/**
 * Hook to delete a user
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      await api.delete(ADMIN_API.DELETE_USER(userId));
      return userId;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'dashboard']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
};

/**
 * Hook to update user information
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await api.put(ADMIN_API.UPDATE_USER(userId), data);
      return extractData(response);
    },
    onSuccess: (_, { userId }) => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });
};

/**
 * Hook to fetch banned users list
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.search] - Search keyword
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing banned users
 */
export const useBannedUsers = ({ page = 1, limit = 20, search } = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', 'banned', { page, limit, search }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_BANNED_USERS, {
        params: { page, limit, search },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};


/**
 * Hook to fetch user posts for admin
 * @param {Object} [options] - Query options
 * @param {string} [options.userId] - User ID
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing user posts
 */
export const useAdminUserPosts = ({ userId, page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', 'posts', userId, { page, limit }],
    queryFn: async () => {
      if (!userId) return { posts: [], total: 0 };
      const response = await api.get(ADMIN_API.GET_USER_POSTS(userId), {
        params: { page, limit },
      });
      return extractData(response);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to fetch all posts for admin
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.search] - Search keyword
 * @param {string} [options.status] - Post status
 * @param {string} [options.type] - Post type
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing posts list
 */
export const useAdminPosts = ({
  page = 1,
  limit = 20,
  search,
  status,
  type,
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'posts', 'list', { page, limit, search, status, type }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_ALL_POSTS, {
        params: { page, limit, search, status, type },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch reports for a specific post
 * @param {Object} [options] - Query options
 * @param {string} [options.postId] - Post ID
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing post reports
 */
export const useAdminPostReports = ({ postId, page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['admin', 'posts', 'reports', postId, { page, limit }],
    queryFn: async () => {
      if (!postId) return { reports: [], total: 0 };
      const response = await api.get(ADMIN_API.GET_POST_REPORTS(postId), {
        params: { page, limit },
      });
      return extractData(response);
    },
    enabled: !!postId,
  });
};

/**
 * Hook to delete a post (admin)
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete post
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      await api.delete(ADMIN_API.DELETE_POST(postId));
      return postId;
    },
    onSuccess: () => {
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries(['admin', 'posts']);
      queryClient.invalidateQueries(['admin', 'dashboard']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    },
  });
};

/**
 * Hook to moderate a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to moderate post
 */
export const useModeratePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, action, reason }) => {
      const response = await api.post(ADMIN_API.MODERATE_POST(postId), {
        action,
        reason,
      });
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Post moderated successfully');
      queryClient.invalidateQueries(['admin', 'posts']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to moderate post');
    },
  });
};

/**
 * Hook to approve a post
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to approve post
 */
export const useApprovePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      await api.post(ADMIN_API.APPROVE_POST(postId));
      return postId;
    },
    onSuccess: () => {
      toast.success('Post approved');
      queryClient.invalidateQueries(['admin', 'posts']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to approve post');
    },
  });
};


/**
 * Hook to fetch reports for a specific user
 * @param {Object} [options] - Query options
 * @param {string} [options.userId] - User ID
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing user reports
 */
export const useAdminUserReports = ({ userId, page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', 'reports', userId, { page, limit }],
    queryFn: async () => {
      if (!userId) return { reports: [], total: 0 };
      const response = await api.get(ADMIN_API.GET_USER_REPORTS(userId));
      return extractData(response);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to fetch all reports for admin
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.search] - Search keyword
 * @param {string} [options.status] - Report status
 * @param {string} [options.type] - Report type
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing reports list
 */
export const useAdminReports = ({
  page = 1,
  limit = 20,
  search,
  status,
  type,
} = {}) => {
  return useQuery({
    queryKey: [
      'admin',
      'reports',
      'list',
      { page, limit, search, status, type },
    ],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_REPORTS, {
        params: { page, limit, search, status, type },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to resolve a report
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to resolve report
 */
export const useResolveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, decision, actionTaken, notes }) => {
      const response = await api.put(ADMIN_API.RESOLVE_REPORT(reportId), {
        decision,
        actionTaken,
        notes,
      });
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Report resolved');
      queryClient.invalidateQueries(['admin', 'reports']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to resolve report');
    },
  });
};

/**
 * Hook to fetch pending reports
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing pending reports
 */
export const usePendingReports = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['admin', 'reports', 'pending', { page, limit }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_PENDING_REPORTS, {
        params: { page, limit },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to start reviewing a report
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to start report review
 */
export const useStartReportReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async reportId => {
      const response = await api.post(ADMIN_API.START_REPORT_REVIEW(reportId));
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Started reviewing report');
      queryClient.invalidateQueries(['admin', 'reports']);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Failed to start report review'
      );
    },
  });
};

/**
 * Hook to update report status
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to update report status
 */
export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, status, notes }) => {
      const response = await api.put(REPORT_API.UPDATE_STATUS(reportId), {
        status,
        notes,
      });
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Report status updated successfully');
      queryClient.invalidateQueries(['admin', 'reports']);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Failed to update report status'
      );
    },
  });
};


/**
 * Hook to fetch system health information
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing system health data
 */
export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_SYSTEM_HEALTH);
      return extractData(response);
    },
    refetchInterval: 30000,
  });
};

/**
 * Hook to broadcast notification to users
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to broadcast notification
 */
export const useBroadcastNotification = () => {
  return useMutation({
    mutationFn: async ({
      title,
      message,
      type,
      targetAudience,
      priority,
      link,
    }) => {
      const response = await api.post(ADMIN_API.BROADCAST, {
        title,
        message,
        type,
        targetAudience,
        priority,
        link,
      });
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Notification sent successfully');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Failed to broadcast notification'
      );
    },
  });
};

/**
 * Hook to fetch all comments for admin
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.search] - Search keyword
 * @param {string} [options.status] - Comment status
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing comments list
 */
export const useAdminComments = ({
  page = 1,
  limit = 20,
  search,
  status,
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'comments', 'list', { page, limit, search, status }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_ALL_COMMENTS, {
        params: { page, limit, search, status },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to moderate a comment
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to moderate comment
 */
export const useModerateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, action, reason }) => {
      const response = await api.post(ADMIN_API.MODERATE_COMMENT(commentId), {
        action,
        reason,
      });
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'comments']);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Failed to moderate comment'
      );
    },
  });
};

/**
 * Hook to delete a comment (admin)
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete comment
 */
export const useDeleteCommentAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }) => {
      const response = await api.delete(ADMIN_API.DELETE_COMMENT(commentId));
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'comments']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    },
  });
};
