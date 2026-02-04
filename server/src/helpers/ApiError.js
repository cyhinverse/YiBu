class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = options.errorCode;
    this.details = options.details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = 'Unauthorized', options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = 'Forbidden', options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = 'Not Found', options) {
    return new ApiError(404, message, options);
  }

  static conflict(message = 'Conflict', options) {
    return new ApiError(409, message, options);
  }

  static unsupportedMediaType(message = 'Unsupported Media Type', options) {
    return new ApiError(415, message, options);
  }

  static internal(message = 'Internal Server Error', options) {
    return new ApiError(500, message, options);
  }
}

export default ApiError;
