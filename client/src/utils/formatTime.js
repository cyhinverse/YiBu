import { formatDistanceToNow } from './dateUtils';

/**
 * Format date to human-readable relative time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 * @example
 * formatTime(new Date()) // "Vừa xong"
 * formatTime('2024-01-01') // "1 năm trước"
 */
const formatTime = date => {
  if (!date) return 'Không xác định';
  try {
    const formattedRelative = formatDistanceToNow(new Date(date));
    return formattedRelative.includes('dưới 1 phút trước')
      ? 'Vừa xong'
      : formattedRelative;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Không xác định';
  }
};

export default formatTime;
