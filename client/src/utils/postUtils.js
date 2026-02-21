import { Image, Video, FileText } from 'lucide-react';
import React from 'react';
import { formatNumber } from './numberUtils';
import { formatRelativeShortTime } from './dateUtils';

/**
 * Format count to human-readable string (e.g., "1.5K", "2.3M")
 * @param {number} count - Number to format
 * @returns {string} Formatted count string
 */
export const formatCount = count => {
  return formatNumber(count, { trimTrailingZero: true, fallback: '0' });
};

/**
 * Format post time to relative string (e.g., "5m", "2h", "3d")
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted relative time
 */
export const formatPostTime = date => {
  return formatRelativeShortTime(date);
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
 * @param {string} status - Post status ('active' | 'hidden' | 'flagged' | 'deleted')
 * @returns {string} Tailwind CSS classes
 */
export const getPostStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'admin-pill-success';
    case 'pending':
      return 'admin-pill-warning';
    case 'hidden':
      return 'admin-pill-muted';
    case 'flagged':
      return 'admin-pill-warning';
    case 'rejected':
      return 'admin-pill-danger';
    case 'deleted':
      return 'admin-pill-danger';
    default:
      return 'admin-pill-muted';
  }
};
