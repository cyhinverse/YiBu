import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat2,
  AtSign,
  Bookmark,
  Reply,
  Tag,
  Mail,
  Megaphone,
} from 'lucide-react';
import React from 'react';
import { formatRelativeShortTime } from './dateUtils';

/**
 * Format time to relative string (e.g., "5m", "2h", "3d")
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted relative time
 */
export const formatNotificationTime = dateStr => {
  return formatRelativeShortTime(dateStr);
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
      return React.createElement(Repeat2, {
        size: 16,
        className: 'text-neutral-600 dark:text-neutral-300',
      });
    case 'mention':
      return React.createElement(AtSign, { size: 16, className: 'text-orange-500' });
    case 'save':
      return React.createElement(Bookmark, {
        size: 16,
        className: 'text-emerald-500',
      });
    case 'reply':
      return React.createElement(Reply, { size: 16, className: 'text-blue-500' });
    case 'tag':
      return React.createElement(Tag, { size: 16, className: 'text-amber-500' });
    case 'message':
      return React.createElement(Mail, { size: 16, className: 'text-indigo-500' });
    case 'announcement':
      return React.createElement(Megaphone, {
        size: 16,
        className: 'text-fuchsia-500',
      });
    case 'system':
      return React.createElement(Bell, { size: 16, className: 'text-cyan-500' });
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
  if (notification?.displayContent || notification?.content || notification?.message) {
    return (
      notification.displayContent || notification.content || notification.message
    );
  }

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
    case 'message':
      return 'đã gửi cho bạn một tin nhắn';
    case 'save':
      return 'đã lưu bài viết của bạn';
    case 'reply':
      return 'đã trả lời bình luận của bạn';
    case 'tag':
      return 'đã gắn thẻ bạn';
    case 'system':
      return 'thông báo hệ thống';
    case 'announcement':
      return 'thông báo mới';
    default:
      return 'có thông báo mới';
  }
};
