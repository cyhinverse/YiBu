import mongoose from 'mongoose';
import os from 'os';
import logger from '../configs/logger.js';
import ApiError from '../helpers/ApiError.js';
import config from '../configs/config.js';

const ConnectToMongodb = async uri => {
  if (!uri) {
    throw ApiError.internal('MongoDB URI is undefined in configuration');
  }

  const cpuCount = typeof os !== 'undefined' ? os.cpus().length : 4;
  const maxPoolSize = Math.min(Math.max(cpuCount * 5, 10), 100);
  const minPoolSize = Math.max(Math.floor(maxPoolSize / 10), 2);

  try {
    const connect = await mongoose.connect(uri, {
      autoCreate: true,
      autoIndex: config.env !== 'production',
      maxPoolSize,
      minPoolSize,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryReads: true,
      retryWrites: true,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });
    if (connect) {
      logger.info(`MongoDB connected to: ${connect.connection.host}`, {
        module: 'database',
        poolSize: { min: minPoolSize, max: maxPoolSize },
      });
    }
  } catch (error) {
    logger.error('MongoDB connection error', {
      module: 'database',
      message: error?.message,
      name: error?.name,
      code: error?.code,
      ...(config.env === 'development' && { stack: error?.stack }),
    });
    throw ApiError.internal('MongoDB connection failed', {
      errorCode: 'DB_CONNECTION_FAILED',
      details: { message: error?.message },
    });
  }
};

export default ConnectToMongodb;
