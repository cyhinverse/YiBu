import amqplib from 'amqplib';
import logger from './logger.js';

const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queue: process.env.RABBITMQ_QUEUE || 'my_queue',
};

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqplib.connect(rabbitmqConfig.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(rabbitmqConfig.queue, { durable: true });

    logger.info('Connected to RabbitMQ', {
      module: 'rabbitmq',
      queue: rabbitmqConfig.queue,
      url: rabbitmqConfig.url,
    });

    return { connection, channel, queue: rabbitmqConfig.queue };
  } catch (error) {
    logger.error('Error connecting to RabbitMQ', {
      module: 'rabbitmq',
      message: error?.message,
      stack: error?.stack,
      url: rabbitmqConfig.url,
    });
    throw error;
  }
};
