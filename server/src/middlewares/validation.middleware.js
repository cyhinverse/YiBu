import ApiError from '../helpers/ApiError.js';

const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

const mapValidationDetails = (error, location) => {
  if (!error?.details) {
    return [];
  }

  return error.details.map(detail => ({
    ...(location ? { location } : {}),
    field: detail.path.join('.'),
    message: detail.message,
  }));
};

const validateInput = ({ input, schema, message, options, location }) => {
  const { error, value } = schema.validate(input, options);

  if (error) {
    return {
      error: ApiError.badRequest(message, {
        errorCode: VALIDATION_ERROR_CODE,
        details: mapValidationDetails(error, location),
      }),
    };
  }

  return { value };
};

export const validateBody = schema => {
  return (req, res, next) => {
    const result = validateInput({
      input: req.body,
      schema,
      message: 'Invalid request body',
      options: { abortEarly: false, stripUnknown: true },
    });

    if (result.error) {
      return next(result.error);
    }

    req.body = result.value;
    return next();
  };
};

export const validateParams = schema => {
  return (req, res, next) => {
    const result = validateInput({
      input: req.params,
      schema,
      message: 'Invalid request params',
      options: { abortEarly: false },
    });

    if (result.error) {
      return next(result.error);
    }

    req.params = result.value;
    return next();
  };
};

export const validateQuery = schema => {
  return (req, res, next) => {
    const result = validateInput({
      input: req.query,
      schema,
      message: 'Invalid request query',
      options: { abortEarly: false, stripUnknown: true },
    });

    if (result.error) {
      return next(result.error);
    }

    req.query = result.value;
    return next();
  };
};

export const validate = ({ body, params, query }) => {
  return (req, res, next) => {
    const errors = [];

    if (body) {
      const result = validateInput({
        input: req.body,
        schema: body,
        message: 'Invalid request data',
        options: { abortEarly: false, stripUnknown: true },
        location: 'body',
      });

      if (result.error) {
        errors.push(...result.error.details);
      } else {
        req.body = result.value;
      }
    }

    if (params) {
      const result = validateInput({
        input: req.params,
        schema: params,
        message: 'Invalid request data',
        options: { abortEarly: false },
        location: 'params',
      });

      if (result.error) {
        errors.push(...result.error.details);
      } else {
        req.params = result.value;
      }
    }

    if (query) {
      const result = validateInput({
        input: req.query,
        schema: query,
        message: 'Invalid request data',
        options: { abortEarly: false, stripUnknown: true },
        location: 'query',
      });

      if (result.error) {
        errors.push(...result.error.details);
      } else {
        req.query = result.value;
      }
    }

    if (errors.length > 0) {
      return next(
        ApiError.badRequest('Invalid request data', {
          errorCode: VALIDATION_ERROR_CODE,
          details: errors,
        })
      );
    }

    return next();
  };
};

export default {
  validateBody,
  validateParams,
  validateQuery,
  validate,
};
