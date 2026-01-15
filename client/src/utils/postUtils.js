import { Image, Video, FileText } from 'lucide-react';
import React from 'react';

/**
 * Format count to human-readable string (e.g., "1.5K", "2.3M")
 * @param {number} count - Number to format
 * @returns {string} Formatted count string
 */
export const formatCount = count => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

/**
 * Format post time to relative string (e.g., "5m", "2h", "3d")
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted relative time
 */
export const formatPostTime = date => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return postDate.toLocaleDateString();
};

/**
 * Get post type icon component
 * @param {string} type - Post type ('image' | 'video' | 'text')
 * @returns {React.ReactElement} Icon component
 */
export const getPostTypeIcon = type => {
  switch (type) {
    case 'image':
      return React.createElement(Image, { size: 16, strokeWidth: 1.5 });
    case 'video':
      return React.createElement(Video, { size: 16, strokeWidth: 1.5 });
    default:
      return React.createElement(FileText, { size: 16, strokeWidth: 1.5 });
  }
};

/**
 * Get post status style classes
 * @param {string} status - Post status ('active' | 'hidden' | 'pending')
 * @returns {string} Tailwind CSS classes
 */
export const getPostStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'hidden':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
    case 'pending':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    default:
      return 'bg-neutral-50 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400';
  }
};
