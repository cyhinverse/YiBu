/**
 * Format date to relative time string (Vietnamese)
 * @param {Date|string} date - Date to format
 * @param {Object} [options] - Format options
 * @returns {string} Relative time string
 * @example
 * formatDistanceToNow(new Date()) // "vừa xong"
 * formatDistanceToNow(new Date(Date.now() - 3600000)) // "1 giờ trước"
 */
export const formatDistanceToNow = (date, options = {}) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'vừa xong';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;

  return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
};

/**
 * Format distance between two dates
 * @param {Date|string} date - Target date
 * @param {Date|string} baseDate - Base date for comparison
 * @param {Object} [options] - Format options
 * @returns {string} Relative time string
 */
export const formatDistance = (date, baseDate, options = {}) => {
  return formatDistanceToNow(date, options);
};
