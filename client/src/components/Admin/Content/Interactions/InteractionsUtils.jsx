import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Bookmark,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const getInteractionIcon = type => {
  switch (type) {
    case 'like':
      return <Heart size={18} className="text-red-500" fill="currentColor" />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-500" />;
    case 'share':
      return <Share2 size={18} className="text-green-500" />;
    case 'follow':
      return <UserPlus size={18} className="text-purple-500" />;
    case 'save':
      return (
        <Bookmark size={18} className="text-amber-500" fill="currentColor" />
      );
    default:
      return <Activity size={18} className="text-neutral-500" />;
  }
};

export const getInteractionText = type => {
  switch (type) {
    case 'like':
      return 'đã thích';
    case 'comment':
      return 'đã bình luận';
    case 'share':
      return 'đã chia sẻ';
    case 'follow':
      return 'đã theo dõi';
    case 'save':
      return 'đã lưu';
    default:
      return 'tương tác';
  }
};

export const getInteractionBg = type => {
  switch (type) {
    case 'like':
      return 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20';
    case 'comment':
      return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20';
    case 'share':
      return 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20';
    case 'follow':
      return 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20';
    case 'save':
      return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20';
    default:
      return 'bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800';
  }
};

export const formatTime = date => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  } catch {
    return 'vừa xong';
  }
};
