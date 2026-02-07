/**
 * Validation Middleware Factory
 * Create middleware to validate request body/params/query with Joi schema
 */

import ApiError from '../helpers/ApiError.js';

/**
 * Validate request body
 * @param {Joi.Schema} schema - Joi schema for validation
 * @returns {Function} Express middleware
 */
export const validateBody = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, don't stop at first error
      stripUnknown: true, // Remove fields not in schema
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(
        ApiError.badRequest('Invalid request body', {
          errorCode: 'VALIDATION_ERROR',
          details,
        })
      );
    }

    // Assign validated value to req.body
    req.body = value;
    next();
  };
};


/**
 * Validate request params
 * @param {Joi.Schema} schema - Joi schema for validation
 * @returns {Function} Express middleware
 */
export const validateParams = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(
        ApiError.badRequest('Invalid request params', {
          errorCode: 'VALIDATION_ERROR',
          details,
        })
      );
    }

    req.params = value;
    next();
  };
};


/**
 * Validate request query
 * @param {Joi.Schema} schema - Joi schema for validation
 * @returns {Function} Express middleware
 */
export const validateQuery = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(
        ApiError.badRequest('Invalid request query', {
          errorCode: 'VALIDATION_ERROR',
          details,
        })
      );
    }

    req.query = value;
    next();
  };
};


/**
 * Validate multiple parts of request at once
 * @param {Object} schemas - Object containing schemas for body, params, query
 * @returns {Function} Express middleware
 */
export const validate = ({ body, params, query }) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (body) {
      const { error, value } = body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            location: 'body',
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
      } else {
        req.body = value;
      }
    }

    // Validate params
    if (params) {
      const { error, value } = params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            location: 'params',
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
      } else {
        req.params = value;
      }
    }

    // Validate query
    if (query) {
      const { error, value } = query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            location: 'query',
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      const error = new Error('Dữ liệu không hợp lệ');
      return next(
        ApiError.badRequest('Invalid request data', {
          errorCode: 'VALIDATION_ERROR',
          details: errors,
        })
      );
    }

    next();
  };
};


export default {
  validateBody,
  validateParams,
  validateQuery,
  validate,
};
