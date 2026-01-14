import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { ADMIN_API, REPORT_API } from '@/axios/apiEndpoint';
import { toast } from 'react-hot-toast';

// Helper to extract data
const extractData = response => {
  return response.data?.data !== undefined ? response.data.data : response.data;
};

// ==================== DASHBOARD ====================

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_DASHBOARD_STATS);
      return extractData(response);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

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

// ==================== USERS ====================

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
      toast.success('Đã cấm người dùng thành công');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'dashboard']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Cấm người dùng thất bại');
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }) => {
      await api.post(ADMIN_API.UNBAN_USER, { userId });
      return { userId };
    },
    onSuccess: (_, { userId }) => {
      toast.success('Đã bỏ cấm người dùng thành công');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Bỏ cấm người dùng thất bại'
      );
    },
  });
};

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
      toast.success('Đã tạm ngưng tài khoản thành công');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Tạm ngưng tài khoản thất bại'
      );
    },
  });
};

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
      toast.success('Đã gửi cảnh báo thành công');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Gửi cảnh báo thất bại');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async userId => {
      await api.delete(ADMIN_API.DELETE_USER(userId));
      return userId;
    },
    onSuccess: () => {
      toast.success('Đã xóa người dùng thành công');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'dashboard']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Xóa người dùng thất bại');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await api.put(ADMIN_API.UPDATE_USER(userId), data);
      return extractData(response);
    },
    onSuccess: (_, { userId }) => {
      toast.success('Cập nhật người dùng thành công');
      queryClient.invalidateQueries(['admin', 'users']);
      queryClient.invalidateQueries(['admin', 'users', 'detail', userId]);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Cập nhật người dùng thất bại'
      );
    },
  });
};

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

// ==================== CONTENT (POSTS) ====================

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

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      await api.delete(ADMIN_API.DELETE_POST(postId));
      return postId;
    },
    onSuccess: () => {
      toast.success('Đã xóa bài viết thành công');
      queryClient.invalidateQueries(['admin', 'posts']);
      queryClient.invalidateQueries(['admin', 'dashboard']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Xóa bài viết thất bại');
    },
  });
};

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
      toast.success('Xử lý bài viết thành công');
      queryClient.invalidateQueries(['admin', 'posts']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Xử lý bài viết thất bại');
    },
  });
};

export const useApprovePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async postId => {
      await api.post(ADMIN_API.APPROVE_POST(postId));
      return postId;
    },
    onSuccess: () => {
      toast.success('Đã duyệt bài viết');
      queryClient.invalidateQueries(['admin', 'posts']);
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Duyệt bài viết thất bại');
    },
  });
};

// ==================== REPORTS ====================

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
      toast.success('Đã giải quyết báo cáo');
      queryClient.invalidateQueries(['admin', 'reports']);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Giải quyết báo cáo thất bại'
      );
    },
  });
};

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

export const useStartReportReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async reportId => {
      const response = await api.post(ADMIN_API.START_REPORT_REVIEW(reportId));
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Đã bắt đầu xem xét báo cáo');
      queryClient.invalidateQueries(['admin', 'reports']);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Bắt đầu xem xét báo cáo thất bại'
      );
    },
  });
};

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
      toast.success('Cập nhật trạng thái báo cáo thành công');
      queryClient.invalidateQueries(['admin', 'reports']);
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Cập nhật trạng thái báo cáo thất bại'
      );
    },
  });
};

// ==================== SYSTEM ====================

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: async () => {
      const response = await api.get(ADMIN_API.GET_SYSTEM_HEALTH);
      return extractData(response);
    },
    refetchInterval: 30000, // Every 30s
  });
};

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
      toast.success('Gửi thông báo thành công');
    },
    onError: error => {
      toast.error(
        error.response?.data?.message || 'Gửi thông báo hàng loạt thất bại'
      );
    },
  });
};

// ==================== COMMENTS ====================

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
      toast.error(error.response?.data?.message || 'Xử lý bình luận thất bại');
    },
  });
};

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
      toast.error(error.response?.data?.message || 'Xóa bình luận thất bại');
    },
  });
};
