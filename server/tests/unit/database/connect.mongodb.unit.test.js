import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import os from 'os';
import ConnectToMongodb from '../../../src/database/connect.mongodb.js';
import config from '../../../src/configs/config.js';
import logger from '../../../src/configs/logger.js';

describe('database/connect.mongodb', () => {
  const originalConnect = mongoose.connect;
  const originalCpus = os.cpus;
  const originalInfo = logger.info;
  const originalError = logger.error;
  const originalEnv = config.env;

  afterEach(() => {
    mongoose.connect = originalConnect;
    os.cpus = originalCpus;
    logger.info = originalInfo;
    logger.error = originalError;
    config.env = originalEnv;
  });

  it('should reject when MongoDB URI is missing', async () => {
    await assert.rejects(
      () => ConnectToMongodb(),
      error =>
        error.message === 'MongoDB URI is undefined in configuration' &&
        error.statusCode === 500
    );
  });

  it('should connect with computed pool sizes and log the connected host', async () => {
    let receivedUri = null;
    let receivedOptions = null;
    let logCall = null;

    os.cpus = () => new Array(8).fill({});
    mongoose.connect = async (uri, options) => {
      receivedUri = uri;
      receivedOptions = options;
      return {
        connection: {
          host: 'mongo.internal',
        },
      };
    };
    logger.info = (message, meta) => {
      logCall = { message, meta };
    };

    await ConnectToMongodb('mongodb://localhost:27017/social');

    assert.equal(receivedUri, 'mongodb://localhost:27017/social');
    assert.equal(receivedOptions.autoCreate, true);
    assert.equal(receivedOptions.autoIndex, config.env !== 'production');
    assert.equal(receivedOptions.maxPoolSize, 40);
    assert.equal(receivedOptions.minPoolSize, 4);
    assert.equal(receivedOptions.retryReads, true);
    assert.equal(receivedOptions.retryWrites, true);
    assert.deepEqual(logCall, {
      message: 'MongoDB connected to: mongo.internal',
      meta: {
        module: 'database',
        poolSize: { min: 4, max: 40 },
      },
    });
  });

  it('should log connection errors and rethrow a standardized ApiError', async () => {
    const mongoError = new Error('connection refused');
    let logCall = null;

    config.env = 'development';
    mongoose.connect = async () => {
      throw mongoError;
    };
    logger.error = (message, meta) => {
      logCall = { message, meta };
    };

    await assert.rejects(
      () => ConnectToMongodb('mongodb://localhost:27017/social'),
      error =>
        error.message === 'MongoDB connection failed' &&
        error.statusCode === 500 &&
        error.errorCode === 'DB_CONNECTION_FAILED' &&
        error.details?.message === 'connection refused'
    );

    assert.equal(logCall.message, 'MongoDB connection error');
    assert.equal(logCall.meta.module, 'database');
    assert.equal(logCall.meta.message, 'connection refused');
    assert.ok(typeof logCall.meta.stack === 'string');
  });
});
