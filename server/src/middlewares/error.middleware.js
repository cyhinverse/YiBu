import logger from "../configs/logger.js";
import config from "../configs/config.js";
import { buildErrorResponse } from '../helpers/apiResponse.js';

const userErrors = [
  "Email hoặc mật khẩu không đúng",
  "Invalid verification code",
  "Token không hợp lệ",
  "Token đã hết hạn",
  "Email đã được sử dụng",
  "Username đã được sử dụng",
  "Mật khẩu hiện tại không đúng",
  "Mật khẩu mới phải khác mật khẩu cũ",
  "Bạn không thể báo cáo nội dung của chính mình",
  "Bạn đã báo cáo nội dung này rồi",
  "Bạn đã báo cáo bài viết này rồi",
  "Không tìm thấy bài viết",
  "Không tìm thấy bình luận",
  "Bạn không có quyền xóa bình luận này",
  "Bình luận này không thuộc bài viết này",
  "Bạn không có quyền xóa bài viết này",
  "Bạn không có quyền cập nhật bài viết này",
  "Không tìm thấy người dùng",
  "Email không tồn tại",
];


const errorMiddleware = (err, req, res, next) => {
  // Determine status code
  let statusCode = err.statusCode || 500;
  if (err.name === 'ApiError' && err.statusCode) {
    statusCode = err.statusCode;
  }

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
  }


  // Check if it's a user-facing error
  if (
    userErrors.some((msg) => err.message?.includes(msg)) ||
    err.message?.includes("Tài khoản bị tạm khóa") ||
    err.code === '2FA_REQUIRED' ||
    err.code === '2FA_INVALID' ||
    err.errorCode === '2FA_REQUIRED' ||
    err.errorCode === '2FA_INVALID'
  ) {
    statusCode = err.statusCode || 400;
  }


  const message = err.message || "Internal Server Error";
  const errorCode = err.errorCode || err.code;
  const details = err.details || (err.errors ? err.errors : null);


  // Always log error stack for debugging
  logger.error("Error Caught", {
    module: "system",
    message: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  const response = buildErrorResponse({
    message,
    errorCode,
    details,
  });

  res.status(statusCode).json({
    ...response,
    ...(config.env === "development" &&
      statusCode >= 500 && { stack: err.stack }),
  });

};

export default errorMiddleware;
