/**
 * Format a number to a human-readable string with K/M suffixes
 * @param {number|null|undefined} num - Number to format
 * @returns {string} Formatted number string (e.g., "1.5K", "2.3M")
 * @example
 * formatNumber(1500) // "1.5K"
 * formatNumber(2300000) // "2.3M"
 * formatNumber(500) // "500"
 * formatNumber(null) // "0"
 */
export const formatNumber = num => {
  if (num == null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
