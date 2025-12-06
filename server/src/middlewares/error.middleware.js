import logger from "../configs/logger.js";
import config from "../configs/config.js";

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log the error
  // Log the error
  logger.error("Server Error", {
      module: "system",
      message: message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      statusCode,
  });

  if (config.env === "development") {
    // Console log is fine for development specifically, but logger handles it too. 
    // Let's rely on logger's console transport for dev.
  }

  res.status(statusCode).json({
    success: false,
    code: 0,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  });
};

export default errorMiddleware;
