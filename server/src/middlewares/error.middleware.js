import logger from "../configs/logger.js";
import config from "../configs/config.js";

// List of known user-facing error messages that should return 400
const userErrors = [
  "Email đã được sử dụng",
  "Username đã được sử dụng",
  "Email hoặc mật khẩu không đúng",
  "Tài khoản đã bị khóa vĩnh viễn",
  "Mật khẩu hiện tại không đúng",
  "Mật khẩu mới phải khác mật khẩu cũ",
  "Token không hợp lệ hoặc đã hết hạn",
  "Email đã được xác thực",
  "Invalid verification code",
  "Mật khẩu không đúng",
  "User not found",
  "Invalid refresh token",
  "Refresh token expired",
];

const errorMiddleware = (err, req, res, next) => {
  // Determine status code
  let statusCode = err.statusCode || 500;

  // Check if it's a user-facing error
  if (
    userErrors.some((msg) => err.message?.includes(msg)) ||
    err.message?.includes("Tài khoản bị tạm khóa")
  ) {
    statusCode = 400;
  }

  const message = err.message || "Internal Server Error";

  // Only log as error if it's a server error (500)
  if (statusCode >= 500) {
    logger.error("Server Error", {
      module: "system",
      message: message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    code: 0,
    message,
    ...(config.env === "development" &&
      statusCode >= 500 && { stack: err.stack }),
  });
};

export default errorMiddleware;
