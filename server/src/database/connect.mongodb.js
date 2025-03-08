import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const ConnectToMongodb = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Error file config .env not found");
  }
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI, {
      autoCreate: true,
      autoIndex: true,
    });
    if (connect) {
      console.log(`MongoDB connected to mongodb `);
    }
  } catch (error) {
    console.error("Error: ", error);
    process.exit(1);
  }
};

export default ConnectToMongodb;
