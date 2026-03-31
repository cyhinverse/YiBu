import mongoose from 'mongoose';
import config from '../configs/config.js';
import logger from '../configs/logger.js';
import {
  rabbit,
  closeRabbit,
  getChannel,
  startRabbit,
} from '../configs/rabbitmq.config.js';
import ConnectToMongodb from '../database/connect.mongodb.js';
import NotificationService from '../modules/notification/notification.service.js';

let channelWrapper = null;
let isShuttingDown = false;

const shutdown = async signal => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  try {
    logger.info(`Notification worker shutdown started (${signal})`);

    await closeRabbit();
    await mongoose.disconnect();

    logger.info(`Notification worker shutdown complete (${signal})`);
    process.exit(0);
  } catch (error) {
    logger.error('Notification worker shutdown failed', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection in notification worker', { reason });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception in notification worker', {
    message: error?.message,
    stack: error?.stack,
  });
  shutdown('uncaughtException');
});

const startWorker = async () => {
  try {
    await ConnectToMongodb(config.mongodb.uri);
    await startRabbit();

    const queue = rabbit.notification;
    channelWrapper = await getChannel('notification');

    await channelWrapper.consume(
      queue.queue,
      async message => {
        if (!message || isShuttingDown) {
          return;
        }

        try {
          await NotificationService.handleMessage(message, {
            emitRealtime: false,
          });
        } catch (error) {
          logger.error('Notification consumer error', {
            message: error?.message,
            stack: error?.stack,
          });
        } finally {
          channelWrapper.ack(message);
        }
      },
      {
        noAck: false,
        prefetch: 10,
      }
    );

    logger.info('Notification worker started', {
      queue: queue.queue,
      prefetch: 10,
      maxRetries: NotificationService.getRetryLimit(),
    });
  } catch (error) {
    logger.error('Notification worker startup failed', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

startWorker();
