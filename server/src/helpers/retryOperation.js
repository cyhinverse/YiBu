/**
 * Retry helper for MongoDB operations that may encounter write conflicts
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Retry options
 * @param {Number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {Number} options.baseDelay - Base delay in ms between retries (default: 100)
 * @param {Boolean} options.exponentialBackoff - Use exponential backoff (default: true)
 * @returns {Promise} - Result of the operation
 */
export const retryOperation = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 100,
    exponentialBackoff = true,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if it's a write conflict error that should be retried
      // MongoDB error code 112 is WriteConflict
      // Also check for various message formats
      const errorMessage = error.message?.toLowerCase() || '';
      const isWriteConflict =
        error.code === 112 ||
        error.codeName === 'WriteConflict' ||
        errorMessage.includes('write conflict') ||
        errorMessage.includes('writeconflict') ||
        (error.name === 'MongoServerError' &&
          errorMessage.includes('yielding is disabled'));

      if (!isWriteConflict || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with optional exponential backoff
      const delay = exponentialBackoff
        ? baseDelay * Math.pow(2, attempt - 1)
        : baseDelay;

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 50;

      console.log(
        `[RetryOperation] Write conflict detected, retrying (attempt ${attempt}/${maxRetries}) after ${Math.round(
          delay + jitter
        )}ms`
      );

      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
};

/**
 * Wrapper for findOneAndUpdate with automatic retry
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} update - Update operations
 * @param {Object} options - Mongoose options
 * @param {Object} retryOptions - Retry options
 * @returns {Promise} - Updated document
 */
export const findOneAndUpdateWithRetry = async (
  model,
  filter,
  update,
  options = {},
  retryOptions = {}
) => {
  return retryOperation(
    () => model.findOneAndUpdate(filter, update, options),
    retryOptions
  );
};

export default retryOperation;
