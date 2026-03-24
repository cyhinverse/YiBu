import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import amqplib from 'amqplib';
import logger from '../../../src/configs/logger.js';

const RABBITMQ_MODULE_URL = new URL(
  '../../../src/configs/rabbitmq.config.js',
  import.meta.url
);
const ORIGINAL_ENV = { ...process.env };

const importFreshRabbitMqConfig = async () =>
  import(`${RABBITMQ_MODULE_URL.href}?t=${Date.now()}-${Math.random()}`);

describe('configs/rabbitmq', () => {
  const originalConnect = amqplib.connect;
  const originalInfo = logger.info;
  const originalError = logger.error;

  afterEach(() => {
    amqplib.connect = originalConnect;
    logger.info = originalInfo;
    logger.error = originalError;

    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL_ENV)) {
        delete process.env[key];
      }
    }

    Object.assign(process.env, ORIGINAL_ENV);
  });

  it('connectRabbitMQ should connect, assert the queue, and return connection metadata', async () => {
    let receivedUrl = null;
    let assertQueueArgs = null;
    let infoCall = null;

    process.env.RABBITMQ_URL = 'amqp://rabbitmq.internal:5672';
    process.env.RABBITMQ_QUEUE = 'notifications';

    const channel = {
      assertQueue: async (...args) => {
        assertQueueArgs = args;
      },
    };
    const connection = {
      createChannel: async () => channel,
    };

    amqplib.connect = async url => {
      receivedUrl = url;
      return connection;
    };
    logger.info = (message, meta) => {
      infoCall = { message, meta };
    };

    const { connectRabbitMQ } = await importFreshRabbitMqConfig();
    const result = await connectRabbitMQ();

    assert.equal(receivedUrl, 'amqp://rabbitmq.internal:5672');
    assert.deepEqual(assertQueueArgs, ['notifications', { durable: true }]);
    assert.deepEqual(result, {
      connection,
      channel,
      queue: 'notifications',
    });
    assert.deepEqual(infoCall, {
      message: 'Connected to RabbitMQ',
      meta: {
        module: 'rabbitmq',
        queue: 'notifications',
        url: 'amqp://rabbitmq.internal:5672',
      },
    });
  });

  it('connectRabbitMQ should log failures and rethrow the original error', async () => {
    const failure = new Error('broker unavailable');
    let errorCall = null;

    process.env.RABBITMQ_URL = 'amqp://rabbitmq.internal:5672';
    process.env.RABBITMQ_QUEUE = 'notifications';

    amqplib.connect = async () => {
      throw failure;
    };
    logger.error = (message, meta) => {
      errorCall = { message, meta };
    };

    const { connectRabbitMQ } = await importFreshRabbitMqConfig();

    await assert.rejects(() => connectRabbitMQ(), error => error === failure);
    assert.equal(errorCall.message, 'Error connecting to RabbitMQ');
    assert.equal(errorCall.meta.module, 'rabbitmq');
    assert.equal(errorCall.meta.message, 'broker unavailable');
    assert.equal(errorCall.meta.url, 'amqp://rabbitmq.internal:5672');
  });
});
