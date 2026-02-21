/**
 * Format a number to a human-readable string with K/M suffixes
 * @param {number|null|undefined} num - Number to format
 * @param {Object} [options]
 * @param {boolean} [options.trimTrailingZero=false] - Remove trailing `.0`
 * @param {string} [options.fallback='0'] - Value when input is nullish
 * @returns {string} Formatted number string (e.g., "1.5K", "2.3M")
 * @example
 * formatNumber(1500) // "1.5K"
 * formatNumber(2300000) // "2.3M"
 * formatNumber(500) // "500"
 * formatNumber(null) // "0"
 */
const formatWithSuffix = (value, divisor, suffix, trimTrailingZero) => {
  const formatted = (value / divisor).toFixed(1);
  const normalized = trimTrailingZero ? formatted.replace(/\.0$/, '') : formatted;
  return `${normalized}${suffix}`;
};

export const formatNumber = (num, options = {}) => {
  const { trimTrailingZero = false, fallback = '0' } = options;

  if (num == null) return fallback;
  if (num >= 1000000) {
    return formatWithSuffix(num, 1000000, 'M', trimTrailingZero);
  }
  if (num >= 1000) return formatWithSuffix(num, 1000, 'K', trimTrailingZero);
  return num.toString();
};
