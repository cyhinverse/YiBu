import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat2,
  AtSign,
} from 'lucide-react';
import React from 'react';

/**
 * Format time to relative string (e.g., "5m", "2h", "3d")
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted relative time
 */
export const formatNotificationTime = dateStr => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

/**
 * Get notification icon component based on notification type
 * @param {string} type - Notification type ('like' | 'comment' | 'follow' | 'repost' | 'share' | 'mention')
 * @returns {React.ReactElement} Icon component
 */
export const getNotificationIcon = type => {
  switch (type) {
    case 'like':
      return React.createElement(Heart, { size: 16, className: 'text-red-500' });
    case 'comment':
      return React.createElement(MessageCircle, { size: 16, className: 'text-blue-500' });
    case 'follow':
      return React.createElement(UserPlus, { size: 16, className: 'text-green-500' });
    case 'repost':
    case 'share':
      return React.createElement(Repeat2, { size: 16, className: 'text-purple-500' });
    case 'mention':
      return React.createElement(AtSign, { size: 16, className: 'text-orange-500' });
    default:
      return React.createElement(Bell, { size: 16, className: 'text-neutral-500' });
  }
};

/**
 * Get notification content text based on notification type (Vietnamese)
 * @param {Object} notification - Notification object
 * @returns {string} Notification content text
 */
export const getNotificationContent = notification => {
  switch (notification.type) {
    case 'like':
      return 'đã thích bài viết của bạn';
    case 'comment':
      return 'đã bình luận về bài viết của bạn';
    case 'follow':
      return 'đã bắt đầu theo dõi bạn';
    case 'repost':
      return 'đã chia sẻ bài viết của bạn';
    case 'mention':
      return 'đã nhắc đến bạn trong một bài viết';
    default:
      return 'có thông báo mới';
  }
};
