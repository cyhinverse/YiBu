/**
 * Standardize API Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Number} code - Internal application code (e.g. 1 for success)
 * @param {String} message - Response message
 * @param {Object} data - Optional data payload
 * @param {Object} extras - Optional extra fields (e.g. pagination)
 */
export const formatResponse = (res, statusCode = 200, code = 1, message = "Success", data = null, extras = {}) => {
  const response = {
    code,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (Object.keys(extras).length > 0) {
    Object.assign(response, extras);
  }

  return res.status(statusCode).json(response);
};
