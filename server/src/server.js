import http from "http";
import config from "./configs/config.js";
import app from "./app.js";
import ConnectToMongodb from "./database/connect.mongodb.js";
import { initSocket } from "./socket/index.js";
import logger from "./configs/logger.js";

const startServer = async () => {
  try {
    // Connect to Database
    await ConnectToMongodb(config.mongodb.uri);

    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    // Start Listening
    server.listen(config.port, () => {
      logger.info(
        `Server running in ${config.env} mode on port ${config.port}`
      );
      logger.info(
        "Server Started",
        {
          module: "system",
          details: `Server started successfully on port ${config.port}`,
        }
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    logger.error("Server Startup Failed", {
      module: "system",
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
