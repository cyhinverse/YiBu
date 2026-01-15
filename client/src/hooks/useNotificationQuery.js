import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import api from '@/axios/axiosConfig';
import { NOTIFICATION_API } from '@/axios/apiEndpoint';

/**
 * Extract data from API response
 * @param {Object} response - Axios response object
 * @returns {*} Extracted data
 */
const extractData = response => {
  const responseData = response.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};

/**
 * Hook to fetch notifications with infinite scroll
 * @param {string} [filter='all'] - Notification filter ('all' | 'unread' | specific type)
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult} Infinite query result containing notifications
 */
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
    staleTime: 1000 * 60,
  });
};

/**
 * Hook to fetch notifications by page
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @param {string} [filter='all'] - Notification filter
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing notifications
 */
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

/**
 * Hook to fetch unread notifications count
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result containing unread count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const response = await api.get(NOTIFICATION_API.GET_UNREAD_COUNT);
      const data = response.data;
      const count = data?.data?.unreadCount ?? data?.unreadCount ?? data ?? 0;
      return typeof count === 'number' ? count : 0;
    },
    staleTime: 1000 * 60,
  });
};

/**
 * Hook to mark notification as read
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to mark as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async notificationId => {
      await api.put(NOTIFICATION_API.MARK_READ(notificationId));
      return { notificationId };
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
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

/**
 * Hook to mark all notifications as read
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to mark all as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post(NOTIFICATION_API.MARK_ALL_READ);
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

/**
 * Hook to delete a notification
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async notificationId => {
      await api.delete(NOTIFICATION_API.DELETE(notificationId));
      return { notificationId };
    },
    onSuccess: data => {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
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

/**
 * Hook to delete all notifications
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation to delete all notifications
 */
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
      queryClient.invalidateQueries(['notifications', 'list']);
    },
  });
};
