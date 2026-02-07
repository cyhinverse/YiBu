/**
 * Standardize API Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Number} code - Internal application code (e.g. 1 for success)
 * @param {String} message - Response message
 * @param {Object} data - Optional data payload
 * @param {Object} extras - Optional extra fields (e.g. pagination)
 */
import { buildSuccessResponse, buildErrorResponse } from './apiResponse.js';

export const formatResponse = (
  res,
  statusCode = 200,
  code = 1,
  message = 'Success',
  data = null,
  extras = {}
) => {
  const hasExtras = extras && Object.keys(extras).length > 0;

  if (code === 1) {
    return res.status(statusCode).json(
      buildSuccessResponse({
        code,
        message,
        data,
        meta: hasExtras ? { ...extras } : undefined,
      })
    );
  }

  // Back-compat: callers sometimes pass `data` as extra info even for errors.
  const details = data ?? (hasExtras ? { ...extras } : null);
  return res.status(statusCode).json(
    buildErrorResponse({
      code,
      message,
      details,
    })
  );
};
