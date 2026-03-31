import logger from '../configs/logger.js';
import {
  rabbit,
  closeRabbit,
  getChannel,
  startRabbit,
} from '../configs/rabbitmq.config.js';
import EmailService from '../modules/shared/email/email.service.js';

let channelWrapper = null;
let stopping = false;

const shutdown = async signal => {
  if (stopping) {
    return;
  }

  stopping = true;

  try {
    logger.info(`Email worker shutdown started (${signal})`);
    await closeRabbit();
    logger.info(`Email worker shutdown complete (${signal})`);
    process.exit(0);
  } catch (error) {
    logger.error('Email worker shutdown failed', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection in email worker', { reason });
  shutdown('unhandledRejection');
});
process.on('uncaughtException', error => {
  logger.error('Uncaught exception in email worker', {
    message: error?.message,
    stack: error?.stack,
  });
  shutdown('uncaughtException');
});

const startWorker = async () => {
  try {
    await startRabbit();

    const queue = rabbit.email;
    channelWrapper = await getChannel('email');

    await channelWrapper.consume(
      queue.queue,
      async message => {
        if (!message || stopping) {
          return;
        }

        try {
          await EmailService.handleMessage(message);
        } catch (error) {
          logger.error('Email consumer error', {
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

    logger.info('Email worker started', {
      queue: queue.queue,
      prefetch: 10,
      maxRetries: EmailService.getRetryLimit(),
    });
  } catch (error) {
    logger.error('Email worker startup failed', {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

startWorker();
