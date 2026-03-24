import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Bookmark,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from '@/utils/dateUtils';

// Re-export from utils for backward compatibility
export { getInteractionText } from './interactionText.utils';

/**
 * Get interaction icon component based on type
 * @param {string} type - Interaction type
 * @returns {JSX.Element} Icon component
 */
export const getInteractionIcon = type => {
  switch (type) {
    case 'like':
      return <Heart size={18} className="text-red-500" fill="currentColor" />;
    case 'comment':
      return <MessageCircle size={18} className="text-blue-500" />;
    case 'share':
      return <Share2 size={18} className="text-green-500" />;
    case 'follow':
      return (
        <UserPlus size={18} className="text-neutral-700 dark:text-neutral-300" />
      );
    case 'save':
      return (
        <Bookmark size={18} className="text-amber-500" fill="currentColor" />
      );
    default:
      return <Activity size={18} className="text-neutral-500" />;
  }
};

/**
 * Format time to relative string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted relative time
 */
export const formatTime = date => {
  const formatted = formatDistanceToNow(date);
  return formatted || 'vừa xong';
};
