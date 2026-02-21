/**
 * Parses pagination parameters from the request query.
 * @param {Object} query - Express request query object.
 * @param {Object} [defaults] - Default values.
 * @param {number} [defaults.defaultLimit=10] - Default limit.
 * @param {number} [defaults.defaultPage=1] - Default page.
 * @returns {Object} { page, limit, skip }
 */
export const getPaginationParams = (query, defaults = {}) => {
  const defaultLimit = defaults.defaultLimit || 10;
  const defaultPage = defaults.defaultPage || 1;

  const page = Math.max(1, parseInt(query.page) || defaultPage);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
