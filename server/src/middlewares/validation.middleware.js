/**
 * Validation Middleware Factory
 * Tạo middleware để validate request body/params/query với Joi schema
 */

/**
 * Validate request body
 * @param {Joi.Schema} schema - Joi schema để validate
 * @returns {Function} Express middleware
 */
export const validateBody = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true, // Loại bỏ các field không có trong schema
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        code: 0,
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
    }

    // Gán giá trị đã validate vào req.body
    req.body = value;
    next();
  };
};

/**
 * Validate request params
 * @param {Joi.Schema} schema - Joi schema để validate
 * @returns {Function} Express middleware
 */
export const validateParams = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        code: 0,
        message: 'Tham số không hợp lệ',
        errors,
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Validate request query
 * @param {Joi.Schema} schema - Joi schema để validate
 * @returns {Function} Express middleware
 */
export const validateQuery = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        code: 0,
        message: 'Query parameters không hợp lệ',
        errors,
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validate nhiều phần của request cùng lúc
 * @param {Object} schemas - Object chứa các schema cho body, params, query
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
      return res.status(400).json({
        code: 0,
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
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
