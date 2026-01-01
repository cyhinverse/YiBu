import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import morgan from 'morgan';

const logDir = 'logs';

// Create logs directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

const logger = winston.createLogger({
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
    }),
    // Error log file rotate
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    // Combined log file rotate
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

/**
 * Morgan stream - Write HTTP request logs to Winston
 */
const morganStream = {
  write: message => {
    // Remove trailing newline
    const logMessage = message.trim();

    // Classify log level based on status code
    const statusCode = parseInt(logMessage.split(' ')[2]) || 200;

    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  },
};

/**
 * Custom Morgan format
 * Format: :method :url :status :response-time ms - :res[content-length]
 */
const morganFormat =
  ':method :url :status :response-time ms - :res[content-length]';

/**
 * Morgan middleware for development (with colors)
 */
export const morganDev = morgan('dev');

/**
 * Morgan middleware for production (combined with Winston)
 */
export const morganProd = morgan(morganFormat, { stream: morganStream });

/**
 * Morgan middleware skip health check
 */
export const morganMiddleware = morgan(morganFormat, {
  stream: morganStream,
  skip: req => req.url === '/api/health', // Skip health check logs
});

export default logger;
