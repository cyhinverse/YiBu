import mongoose from 'mongoose';
import logger from '../configs/logger.js';
import ApiError from '../helpers/ApiError.js';
import config from '../configs/config.js';

const ConnectToMongodb = async uri => {
  if (!uri) {
    throw ApiError.internal('MongoDB URI is undefined in configuration');
  }

  try {
    const connect = await mongoose.connect(uri, {
      autoCreate: true,
      // Avoid costly index builds on production startup unless explicitly intended.
      autoIndex: config.env !== 'production',
    });
    if (connect) {
      logger.info(`MongoDB connected to: ${connect.connection.host}`);
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
