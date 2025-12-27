import { useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '../../../hooks/useNotificationQuery';
import { useQueryClient } from '@tanstack/react-query';

const NotificationBell = ({ onClick }) => {
  const queryClient = useQueryClient();
  const { data: unreadCount = 0 } = useUnreadCount();

  // Listen for refresh notifications event (triggered by socket)
  const handleRefreshNotifications = useCallback(() => {
    queryClient.invalidateQueries(['notifications', 'unreadCount']);
    queryClient.invalidateQueries(['notifications', 'list']);
  }, [queryClient]);

  useEffect(() => {
    document.addEventListener(
      'refresh:notifications',
      handleRefreshNotifications
    );
    return () => {
      document.removeEventListener(
        'refresh:notifications',
        handleRefreshNotifications
      );
    };
  }, [handleRefreshNotifications]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      <Bell size={20} className="text-neutral-600 dark:text-neutral-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
