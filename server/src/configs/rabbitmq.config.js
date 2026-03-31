import amqp from 'amqp-connection-manager';
import logger from './logger.js';

const MODULE = 'rabbitmq';
const urls = (process.env.RABBITMQ_URLS || process.env.RABBITMQ_URL || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

if (urls.length === 0) {
  throw new Error('Missing RabbitMQ URL. Set RABBITMQ_URLS or RABBITMQ_URL.');
}

export const rabbit = {
  notification: {
    exchange: 'notification_exchange',
    type: 'topic',
    queue: 'notification_queue',
    key: 'notification.send',
    retryExchange: 'notification_retry_exchange',
    retryType: 'direct',
    retryQueue: 'notification_retry_queue',
    retryKey: 'notification.retry',
    retryTtl: 60000,
    deadExchange: 'notification_dlx',
    deadType: 'direct',
    deadQueue: 'notification_dlx_queue',
    deadKey: 'notification.dlx',
  },
  email: {
    exchange: 'email_exchange',
    type: 'topic',
    queue: 'email_queue',
    key: 'email.send',
    retryExchange: 'email_retry_exchange',
    retryType: 'direct',
    retryQueue: 'email_retry_queue',
    retryKey: 'email.retry',
    retryTtl: 60000,
    deadExchange: 'email_dlx',
    deadType: 'direct',
    deadQueue: 'email_dlx_queue',
    deadKey: 'email.dlx',
  },
  media: {
    exchange: 'media_exchange',
    type: 'topic',
    queue: 'media_queue',
    key: 'media.send',
    retryExchange: 'media_retry_exchange',
    retryType: 'direct',
    retryQueue: 'media_retry_queue',
    retryKey: 'media.retry',
    retryTtl: 60000,
    deadExchange: 'media_dlx',
    deadType: 'direct',
    deadQueue: 'media_dlx_queue',
    deadKey: 'media.dlx',
  },
};

let conn = null;
const channels = new Map();

const setup = async (channel, q) => {
  await channel.assertExchange(q.exchange, q.type, { durable: true });
  await channel.assertExchange(q.retryExchange, q.retryType, { durable: true });
  await channel.assertExchange(q.deadExchange, q.deadType, { durable: true });

  await channel.assertQueue(q.queue, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': q.retryExchange,
      'x-dead-letter-routing-key': q.retryKey,
    },
  });
  await channel.bindQueue(q.queue, q.exchange, q.key);

  await channel.assertQueue(q.retryQueue, {
    durable: true,
    arguments: {
      'x-message-ttl': q.retryTtl,
      'x-dead-letter-exchange': q.exchange,
      'x-dead-letter-routing-key': q.key,
    },
  });
  await channel.bindQueue(q.retryQueue, q.retryExchange, q.retryKey);

  await channel.assertQueue(q.deadQueue, { durable: true });
  await channel.bindQueue(q.deadQueue, q.deadExchange, q.deadKey);
};

export const startRabbit = async () => {
  if (conn) {
    return conn;
  }

  conn = amqp.connect(urls, {
    heartbeatIntervalInSeconds: 5,
    reconnectTimeInSeconds: 5,
  });

  conn.on('connect', () => {
    logger.info('RabbitMQ connected', { module: MODULE });
  });

  conn.on('connectFailed', ({ err }) => {
    logger.error('RabbitMQ connect failed', {
      module: MODULE,
      message: err?.message,
      stack: err?.stack,
    });
  });

  conn.on('disconnect', ({ err }) => {
    logger.error('RabbitMQ disconnected', {
      module: MODULE,
      message: err?.message,
      stack: err?.stack,
    });
  });

  await conn.connect({ timeout: 10000 });
  return conn;
};

export const getChannel = async name => {
  if (channels.has(name)) {
    return channels.get(name);
  }

  await startRabbit();

  const q = rabbit[name];
  const channel = conn.createChannel({
    name,
    json: true,
    publishTimeout: 10000,
    setup: currentChannel => setup(currentChannel, q),
  });

  channel.on('error', err => {
    logger.error('RabbitMQ channel error', {
      module: MODULE,
      channel: name,
      message: err?.message,
      stack: err?.stack,
    });
  });

  await channel.waitForConnect();
  channels.set(name, channel);

  return channel;
};

export const closeRabbit = async () => {
  const activeChannels = Array.from(channels.values());
  const activeConn = conn;

  channels.clear();
  conn = null;

  await Promise.allSettled(activeChannels.map(channel => channel.close()));

  if (activeConn) {
    await activeConn.close();
    logger.info('RabbitMQ closed', { module: MODULE });
  }
};

export default {
  rabbit,
  startRabbit,
  getChannel,
  closeRabbit,
};
