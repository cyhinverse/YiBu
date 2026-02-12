import http from 'http';
import mongoose from 'mongoose';
import config from './configs/config.js';
import app from './app.js';
import ConnectToMongodb from './database/connect.mongodb.js';
import { initSocket } from './socket/index.js';
import logger from './configs/logger.js';

let server;
let io;

const shutdown = async signal => {
  try {
    logger.info(`Shutdown started (${signal})`, { module: 'system' });

    if (io) {
      await io.close();
      io = null;
    }

    if (server) {
      await new Promise(resolve => server.close(resolve));
      server = null;
    }

    if (mongoose.connection?.readyState === 1) {
      await mongoose.connection.close(false);
    }

    logger.info(`Shutdown complete (${signal})`, { module: 'system' });
    process.exit(0);
  } catch (err) {
    logger.error('Shutdown failed', { module: 'system', message: err?.message, stack: err?.stack });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection', { module: 'system', reason });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', err => {
  logger.error('Uncaught exception', { module: 'system', message: err?.message, stack: err?.stack });
  shutdown('uncaughtException');
});

const startServer = async () => {
  try {
    config.validateCriticalConfig();
    await ConnectToMongodb(config.mongodb.uri);

    server = http.createServer(app);

    server.on('error', error => {
      if (error?.code === 'EADDRINUSE') {
        logger.error(
          `Port ${config.port} is already in use. Please stop other server instances running on this port.`
        );
        process.exit(1);
      }

      logger.error('HTTP server error', {
        module: 'system',
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
      });
      process.exit(1);
    });

    io = initSocket(server);

    server.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port}`);
      logger.info('Server Started', {
        module: 'system',
        details: `Server started successfully on port ${config.port}`,
      });
    });
  } catch (error) {
    logger.error('Server Startup Failed', {
      module: 'system',
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

startServer();
