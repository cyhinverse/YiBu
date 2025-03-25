import SystemLog from "../models/mongodb/SystemLogs.js";

/**
 * Service quản lý ghi nhật ký hệ thống
 */
export const LogService = {
  /**
   * Ghi log cấp độ info
   * @param {String} action Hành động
   * @param {String} details Chi tiết
   * @param {Object} options Tùy chọn bổ sung (user, ip, userAgent, module, metadata)
   */
  info: async (action, details, options = {}) => {
    return LogService.createLog(action, details, { ...options, level: "info" });
  },

  /**
   * Ghi log cấp độ cảnh báo
   * @param {String} action Hành động
   * @param {String} details Chi tiết
   * @param {Object} options Tùy chọn bổ sung (user, ip, userAgent, module, metadata)
   */
  warning: async (action, details, options = {}) => {
    return LogService.createLog(action, details, { ...options, level: "warning" });
  },

  /**
   * Ghi log cấp độ lỗi
   * @param {String} action Hành động
   * @param {String} details Chi tiết
   * @param {Object} options Tùy chọn bổ sung (user, ip, userAgent, module, metadata)
   */
  error: async (action, details, options = {}) => {
    return LogService.createLog(action, details, { ...options, level: "error" });
  },

  /**
   * Ghi log cấp độ nghiêm trọng
   * @param {String} action Hành động
   * @param {String} details Chi tiết
   * @param {Object} options Tùy chọn bổ sung (user, ip, userAgent, module, metadata)
   */
  critical: async (action, details, options = {}) => {
    return LogService.createLog(action, details, { ...options, level: "critical" });
  },

  /**
   * Ghi log vào cơ sở dữ liệu
   * @param {String} action Hành động
   * @param {String} details Chi tiết
   * @param {Object} options Tùy chọn (level, user, ip, userAgent, module, metadata)
   */
  createLog: async (action, details, options = {}) => {
    try {
      const logData = {
        action,
        details,
        level: options.level || "info",
        module: options.module || "system",
      };

      if (options.user) {
        logData.user = options.user;
      }

      if (options.ip) {
        logData.ip = options.ip;
      }

      if (options.userAgent) {
        logData.userAgent = options.userAgent;
      }

      if (options.metadata) {
        logData.metadata = options.metadata;
      }

      const log = new SystemLog(logData);
      await log.save();
      return log;
    } catch (error) {
      console.error("Error creating system log:", error);
      // Không ném lỗi vì ghi log không nên làm gián đoạn luồng chính
      return null;
    }
  },

  /**
   * Trợ giúp lấy thông tin từ request
   * @param {Object} req Express request object
   * @returns {Object} Request info (ip, userAgent, user)
   */
  getRequestInfo: (req) => {
    return {
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      user: req.user?._id
    };
  },

  /**
   * Middleware ghi log cho mọi request
   */
  requestLogger: (req, res, next) => {
    const startTime = Date.now();
    const requestInfo = LogService.getRequestInfo(req);
    
    // Khi response hoàn tất
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Chỉ log các lỗi hoặc request quan trọng
      if (res.statusCode >= 400 || req.method !== 'GET') {
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info';
        
        LogService.createLog(
          `HTTP ${req.method} ${res.statusCode}`,
          `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
          {
            level,
            module: 'system',
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            user: requestInfo.user,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
              duration,
              body: req.method !== 'GET' ? req.body : undefined
            }
          }
        );
      }
    });
    
    next();
  }
};

export default LogService; 