import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { ADMIN_API, REPORT_API } from '@/axios/apiEndpoint';
import { notify } from '@/utils/notify';
import { extractData } from '@/utils/apiUtils';
import { invalidateQueryKeys } from './queryClientUtils';

const buildPagination = data => {
  const pagination = data?.pagination || {};
  const total = data?.total ?? pagination.total ?? 0;
  const page = data?.page ?? pagination.page ?? 1;
  const totalPages = data?.totalPages ?? pagination.totalPages ?? 1;
  const hasMore = data?.hasMore ?? pagination.hasMore ?? page < totalPages;

  return {
    total,
    page,
    totalPages,
    hasMore,
    pagination: { total, page, totalPages, hasMore },
  };
};

const normalizeUser = user => {
  if (!user) return user;

  const role =
    user.role || (user.isAdmin || user?.permissions?.isAdmin ? 'admin' : 'user');
  const status =
    user.status ||
    user?.moderation?.status ||
    (user.isActive === false ? 'suspended' : 'active');
  const verified = Boolean(user.verified ?? user.isVerified);

  return {
    ...user,
    role,
    status,
    verified,
    isVerified: verified,
    fullName: user.fullName || user.name || user.username || 'User',
    banReason: user.banReason || user?.moderation?.reason || '',
    bannedAt: user.bannedAt || user?.moderation?.moderatedAt || null,
    banDuration:
      user.banDuration ||
      (user?.moderation?.suspendedUntil
        ? new Date(user.moderation.suspendedUntil).toLocaleDateString('vi-VN')
        : null),
    bannedBy: user.bannedBy || user?.moderation?.moderatedBy || null,
  };
};

const normalizeUsersPayload = data => {
  const users = Array.isArray(data?.users)
    ? data.users.map(normalizeUser)
    : Array.isArray(data)
    ? data.map(normalizeUser)
    : [];
  const pagination = buildPagination(data);

  return {
    ...data,
    users,
    ...pagination,
  };
};

const inferPostType = media => {
  if (!Array.isArray(media) || media.length === 0) return 'text';
  const hasImage = media.some(item => item?.type === 'image');
  const hasVideo = media.some(item => item?.type === 'video');
  if (hasImage && hasVideo) return 'mixed';
  if (hasVideo) return 'video';
  return 'image';
};

const normalizePostStatus = post => {
  if (post?.status) return post.status;
  const moderationStatus = post?.moderation?.status;

  if (post?.isDeleted) {
    if (moderationStatus === 'flagged') return 'flagged';
    return 'hidden';
  }

  switch (moderationStatus) {
    case 'approved':
      return 'active';
    case 'flagged':
      return 'flagged';
    case 'pending':
      return 'pending';
    case 'rejected':
      return 'rejected';
    case 'removed':
      return 'hidden';
    default:
      return 'active';
  }
};

const normalizePost = post => {
  if (!post) return post;
  const media = Array.isArray(post.media) ? post.media : [];

  return {
    ...post,
    status: normalizePostStatus(post),
    type: post.type || inferPostType(media),
    content: post.content || post.caption || '',
    reports: post.reports ?? post.reportsCount ?? 0,
  };
};

const normalizePostsPayload = data => {
  const posts = Array.isArray(data?.posts)
    ? data.posts.map(normalizePost)
    : Array.isArray(data)
    ? data.map(normalizePost)
    : [];
  const pagination = buildPagination(data);

  return {
    ...data,
    posts,
    ...pagination,
  };
};

const normalizeCommentStatus = comment => {
  if (comment?.status) return comment.status;
  const moderationStatus = comment?.moderation?.status;
  if (comment?.isDeleted || moderationStatus === 'removed') return 'hidden';

  switch (moderationStatus) {
    case 'approved':
      return 'active';
    case 'pending':
      return 'pending';
    case 'flagged':
      return 'flagged';
    default:
      return 'active';
  }
};

const normalizeComment = comment => {
  if (!comment) return comment;
  const likesCount = Number.isFinite(comment.likesCount)
    ? comment.likesCount
    : Array.isArray(comment.likes)
    ? comment.likes.length
    : 0;
  const repliesCount = Number.isFinite(comment.repliesCount)
    ? comment.repliesCount
    : Array.isArray(comment.replies)
    ? comment.replies.length
    : 0;

  return {
    ...comment,
    status: normalizeCommentStatus(comment),
    postId: comment.postId || comment.post || null,
    likesCount,
    repliesCount,
  };
};

const normalizeCommentsPayload = data => {
  const comments = Array.isArray(data?.comments)
    ? data.comments.map(normalizeComment)
    : Array.isArray(data)
    ? data.map(normalizeComment)
    : [];
  const pagination = buildPagination(data);

  return {
    ...data,
    comments,
    ...pagination,
  };
};

const normalizeReportStatus = status => {
  if (status === 'in_review') return 'reviewing';
  if (status === 'dismissed') return 'rejected';
  return status || 'pending';
};

const normalizeReport = report => {
  if (!report) return report;
  const snapshotText =
    report?.contentSnapshot?.text || report?.contentSnapshot?.caption || '';

  return {
    ...report,
    status: normalizeReportStatus(report.status),
    type: report.type || report.targetType,
    targetType: report.targetType || report.type,
    targetContent:
      report.targetContent || report.target?.content || snapshotText || '',
    targetAuthor:
      report.targetAuthor || report.target?.author || report.targetUser?.name || '',
  };
};

const normalizeReportsPayload = data => {
  const reports = Array.isArray(data?.reports)
    ? data.reports.map(normalizeReport)
    : Array.isArray(data)
    ? data.map(normalizeReport)
    : [];
  const pagination = buildPagination(data);

  return {
    ...data,
    reports,
    ...pagination,
  };
};

const normalizeInteractionsPayload = data => {
  const interactions = Array.isArray(data?.interactions) ? data.interactions : [];
  const stats = data?.stats || data?.interactionStats || {};
  const pagination = buildPagination(data);

  return {
    ...data,
    interactions,
    stats,
    interactionStats: stats,
    ...pagination,
  };
};

const getApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const notifyMutationError = fallbackMessage => error => {
  notify.error(getApiErrorMessage(error, fallbackMessage));
};

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
 * @param {number} [days=30] - Number of days
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing growth data
 */
export const useUserGrowth = (days = 30) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'userGrowth', days],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_USER_GROWTH, {
        params: { days },
      });
      return extractData(response);
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch post statistics by period
 * @param {number} [days=30] - Number of days
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing post stats
 */
export const usePostStats = (days = 30) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'postStats', days],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_POST_STATS, {
        params: { days },
      });
      return extractData(response);
    },
  });
};

/**
 * Hook to fetch top users list
 * @param {number} [limit=50] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing top users
 */
export const useTopUsers = (limit = 50) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'topUsers', limit],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_TOP_USERS, {
        params: { limit },
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
      return normalizeInteractionsPayload(extractData(response));
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
      return normalizeUsersPayload(extractData(response));
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
      return normalizeUser(extractData(response));
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
      notify.success('User banned successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'users'],
        ['admin', 'dashboard'],
        ['admin', 'users', 'detail', userId],
      ]);
    },
    onError: notifyMutationError('Failed to ban user'),
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
      notify.success('User unbanned successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'users'],
        ['admin', 'users', 'detail', userId],
      ]);
    },
    onError: notifyMutationError('Failed to unban user'),
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
      notify.success('Account suspended successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'users'],
        ['admin', 'users', 'detail', userId],
      ]);
    },
    onError: notifyMutationError('Failed to suspend account'),
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
      notify.success('Warning sent successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'users'],
        ['admin', 'users', 'detail', userId],
      ]);
    },
    onError: notifyMutationError('Failed to send warning'),
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
      notify.success('User deleted successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'users'],
        ['admin', 'dashboard'],
      ]);
    },
    onError: notifyMutationError('Failed to delete user'),
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
      notify.success('User updated successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'users'],
        ['admin', 'users', 'detail', userId],
      ]);
    },
    onError: notifyMutationError('Failed to update user'),
  });
};

/**
 * Hook to fetch banned users list
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing banned users
 */
export const useBannedUsers = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', 'banned', { page, limit }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_BANNED_USERS, {
        params: { page, limit },
      });
      return normalizeUsersPayload(extractData(response));
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
      return normalizePostsPayload(extractData(response));
    },
    enabled: !!userId,
  });
};

/**
 * Hook to fetch all posts for admin
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.status] - Post status
 * @param {string} [options.type] - Post type
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing posts list
 */
export const useAdminPosts = ({
  page = 1,
  limit = 20,
  status,
  type,
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'posts', 'list', { page, limit, status, type }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_ALL_POSTS, {
        params: { page, limit, status, type },
      });
      return normalizePostsPayload(extractData(response));
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
      return normalizeReportsPayload(extractData(response));
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
      notify.success('Post deleted successfully');
      invalidateQueryKeys(queryClient, [
        ['admin', 'posts'],
        ['admin', 'dashboard'],
      ]);
    },
    onError: notifyMutationError('Failed to delete post'),
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
      notify.success('Post moderated successfully');
      invalidateQueryKeys(queryClient, [['admin', 'posts']]);
    },
    onError: notifyMutationError('Failed to moderate post'),
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
      notify.success('Post approved');
      invalidateQueryKeys(queryClient, [['admin', 'posts']]);
    },
    onError: notifyMutationError('Failed to approve post'),
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
      const response = await api.get(ADMIN_API.GET_USER_REPORTS(userId), {
        params: { page, limit },
      });
      return normalizeReportsPayload(extractData(response));
    },
    enabled: !!userId,
  });
};

/**
 * Hook to fetch all reports for admin
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.status] - Report status
 * @param {string} [options.type] - Report type
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing reports list
 */
export const useAdminReports = ({
  page = 1,
  limit = 20,
  status,
  type,
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'reports', 'list', { page, limit, status, type }],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_REPORTS, {
        params: { page, limit, status, type },
      });
      return normalizeReportsPayload(extractData(response));
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
      notify.success('Report resolved');
      invalidateQueryKeys(queryClient, [['admin', 'reports']]);
    },
    onError: notifyMutationError('Failed to resolve report'),
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
      return normalizeReportsPayload(extractData(response));
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
      notify.success('Started reviewing report');
      invalidateQueryKeys(queryClient, [['admin', 'reports']]);
    },
    onError: notifyMutationError('Failed to start report review'),
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
      notify.success('Report status updated successfully');
      invalidateQueryKeys(queryClient, [['admin', 'reports']]);
    },
    onError: notifyMutationError('Failed to update report status'),
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
      content,
      type,
      targetAudience,
      priority,
      link,
    }) => {
      const response = await api.post(ADMIN_API.BROADCAST, {
        title,
        message: message || content,
        type,
        targetAudience,
        priority,
        link,
      });
      return extractData(response);
    },
    onSuccess: data => {
      const sentCount = data?.sentCount ?? 0;
      const skippedCount = data?.skippedCount ?? 0;
      notify.success(
        `Đã gửi ${sentCount} thông báo${skippedCount ? `, bỏ qua ${skippedCount}` : ''}`
      );
    },
    onError: notifyMutationError('Failed to broadcast notification'),
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
      return normalizeCommentsPayload(extractData(response));
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
      invalidateQueryKeys(queryClient, [['admin', 'comments']]);
    },
    onError: notifyMutationError('Failed to moderate comment'),
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
      invalidateQueryKeys(queryClient, [['admin', 'comments']]);
    },
    onError: notifyMutationError('Failed to delete comment'),
  });
};

