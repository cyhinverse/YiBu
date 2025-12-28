import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { NOTIFICATION_API } from '@/axios/apiEndpoint';

// Helper to extract data
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

export const useNotifications = (filter = 'all') => {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { page: pageParam, limit: 20 };
      if (filter !== 'all') {
        params.type = filter === 'unread' ? undefined : filter;
      }

      const response = await api.get(NOTIFICATION_API.GET_ALL, { params });
      return extractData(response);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore
        ? lastPage.pagination?.page + 1 || allPages.length + 1
        : undefined;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useNotificationsPage = (page = 1, limit = 10, filter = 'all') => {
  return useQuery({
    queryKey: ['notifications', 'page', page, limit, filter],
    queryFn: async () => {
      const params = { page, limit };
      if (filter && filter !== 'all') {
        params.type = filter;
      }
      const response = await api.get(NOTIFICATION_API.GET_ALL, { params });
      return extractData(response);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const response = await api.get(NOTIFICATION_API.GET_UNREAD_COUNT);
      // Logic from notificationActions.js
      const data = response.data;
      const count = data?.data?.unreadCount ?? data?.unreadCount ?? data ?? 0;
      return typeof count === 'number' ? count : 0;
    },
    // Refetch often or rely on socket invalidation
    staleTime: 1000 * 60,
  });
};

// --- Mutations ---

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async notificationId => {
      await api.put(NOTIFICATION_API.MARK_READ(notificationId));
      return { notificationId };
    },
    onSuccess: data => {
      // Update unread count
      queryClient.invalidateQueries(['notifications', 'unreadCount']);

      // Update list cache - mark specific item as read
      queryClient.setQueriesData(['notifications', 'list'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(n =>
              n._id === data.notificationId ? { ...n, isRead: true } : n
            ),
          })),
        };
      });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post(NOTIFICATION_API.MARK_ALL_READ);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);

      // Optimistically mark all as read in cache
      queryClient.setQueriesData(['notifications', 'list'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.map(n => ({
              ...n,
              isRead: true,
            })),
          })),
        };
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async notificationId => {
      await api.delete(NOTIFICATION_API.DELETE(notificationId));
      return { notificationId };
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);

      // Remove from cache
      queryClient.setQueriesData(['notifications', 'list'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: page.notifications.filter(
              n => n._id !== data.notificationId
            ),
          })),
        };
      });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(NOTIFICATION_API.DELETE_ALL);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      queryClient.setQueriesData(['notifications', 'list'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            notifications: [],
          })),
        };
      });
      // Optionally just invalidate to refresh from empty state
      queryClient.invalidateQueries(['notifications', 'list']);
    },
  });
};
