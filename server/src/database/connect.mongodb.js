import mongoose from "mongoose";
import logger from "../configs/logger.js";
import ApiError from "../helpers/ApiError.js";


const ConnectToMongodb = async (uri) => {
  if (!uri) {
    throw ApiError.internal("MongoDB URI is undefined in configuration");
  }

  try {
    const connect = await mongoose.connect(uri, {
      autoCreate: true,
      autoIndex: true,
    });
    if (connect) {
      logger.info(`MongoDB connected to: ${connect.connection.host}`);
    }
  } catch (error) {
    logger.error("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default ConnectToMongodb;
