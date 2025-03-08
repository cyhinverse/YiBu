import ConnectToMongodb from "../database/connect.mongodb.js";

const CheckConnectionToMongoDB = async (app, PORT) => {
  try {
    await ConnectToMongodb();
    app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
  } catch (e) {
    console.log(`Server failed to start`, e);
    process.exit(1);
  }
};
export default CheckConnectionToMongoDB;
