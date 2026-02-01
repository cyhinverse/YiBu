export const buildSuccessResponse = ({
  message = 'Success',
  data = null,
  meta = {},
} = {}) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
};

export const buildErrorResponse = ({
  message = 'Internal Server Error',
  errorCode = null,
  details = null,
} = {}) => {
  const response = {
    success: false,
    message,
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (details) {
    response.details = details;
  }

  return response;
};

export const sendSuccess = (res, statusCode, payload) => {
  return res.status(statusCode).json(buildSuccessResponse(payload));
};

export const sendCreated = (res, payload) => {
  return sendSuccess(res, 201, payload);
};

export const sendOk = (res, payload) => {
  return sendSuccess(res, 200, payload);
};
