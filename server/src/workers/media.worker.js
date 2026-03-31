import mongoose from 'mongoose';
import config from '../configs/config.js';
import logger from '../configs/logger.js';
import { rabbit, closeRabbit, getChannel, startRabbit } from '../configs/rabbitmq.config.js';
import ConnectToMongodb from '../database/connect.mongodb.js';
import MediaService from '../modules/shared/media/media.service.js';

let channelWrapper = null;
let stopping = false;

const shutdown = async signal => {
  if (stopping) {
    return;
  }

  stopping = true;

  try {
    logger.info(`Media worker shutdown started (${signal})`);
    await closeRabbit();
    await mongoose.disconnect();

    logger.info(`Media worker shutdown complete (${signal})`);
    process.exit(0);
  } catch (error) {
    logger.error('Media worker shutdown failed', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection in media worker', { reason });
  shutdown('unhandledRejection');
});
process.on('uncaughtException', error => {
  logger.error('Uncaught exception in media worker', {
    message: error?.message,
    stack: error?.stack,
  });
  shutdown('uncaughtException');
});

const startWorker = async () => {
  try {
    await ConnectToMongodb(config.mongodb.uri);
    await startRabbit();

    const queue = rabbit.media;
    channelWrapper = await getChannel('media');

    await channelWrapper.consume(
      queue.queue,
      async message => {
        if (!message || stopping) {
          return;
        }

        try {
          await MediaService.handleMessage(message);
        } catch (error) {
          logger.error('Media consumer error', {
            message: error?.message,
            stack: error?.stack,
          });
        } finally {
          channelWrapper.ack(message);
        }
      },
      {
        noAck: false,
        prefetch: 5,
      }
    );

    logger.info('Media worker started', {
      queue: queue.queue,
      prefetch: 5,
      maxRetries: MediaService.getRetryLimit(),
    });
  } catch (error) {
    logger.error('Media worker startup failed', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

startWorker();
