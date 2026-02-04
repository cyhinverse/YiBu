/**
 * Standardize API Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Number} code - Internal application code (e.g. 1 for success)
 * @param {String} message - Response message
 * @param {Object} data - Optional data payload
 * @param {Object} extras - Optional extra fields (e.g. pagination)
 */
import { buildSuccessResponse } from './apiResponse.js';

export const formatResponse = (
  res,
  statusCode = 200,
  code = 1,
  message = 'Success',
  data = null,
  extras = {}
) => {
  const response = buildSuccessResponse({
    message,
    data,
    meta: Object.keys(extras).length > 0 ? { ...extras } : undefined,
  });

  response.success = code === 1;

  if (!response.success && response.data) {
    delete response.data;
  }

  return res.status(statusCode).json(response);
};
