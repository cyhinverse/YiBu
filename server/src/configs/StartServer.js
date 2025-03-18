import ConnectToMongodb from "../database/connect.mongodb.js";

const CheckConnectionToMongoDB = async () => {
  try {
    await ConnectToMongodb();
    console.log("MongoDB connected successfully");
  } catch (e) {
    console.log(`Failed to connect to MongoDB`, e);
    process.exit(1);
  }
};

export default CheckConnectionToMongoDB;
