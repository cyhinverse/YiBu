import { formatNumber } from './numberUtils';

/**
 * Format count to human-readable string (e.g., "1.5K", "2.3M")
 * @param {number} count - Number to format
 * @returns {string} Formatted count string
 */
export const formatCount = count => {
  return formatNumber(count, { trimTrailingZero: true, fallback: '0' });
};
