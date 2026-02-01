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
  const limit = Math.max(1, parseInt(query.limit) || defaultLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Formats data into a standardized pagination response structure.
 * @param {Object} options - Pagination options.
 * @param {Array} options.data - The array of data items.
 * @param {number} options.total - Total count of items available.
 * @param {number} options.page - Current page number.
 * @param {number} options.limit - Current limit.
 * @returns {Object} Object containing data and pagination metadata.
 */
export const getPaginationResponse = ({ data, total, page, limit }) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

/**
 * Helper to perform a paginated find query on a Mongoose model.
 * Note: This executes the query. Complex queries requiring populate should use manual steps.
 * @param {Object} model - Mongoose model.
 * @param {Object} query - Mongoose query object (filter).
 * @param {Object} pagination - { page, limit, skip }.
 * @param {Object} [options] - additional options like sort, select, populate.
 * @returns {Promise<Object>} Formatted pagination response.
 */
// Optional: We can add a more "all-in-one" helper if needed, but given the diverse population needs, 
// the two functions above are more flexible.
