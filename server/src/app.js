import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import LogService from "./services/logService.js";

// Routers
import authRoutes from "./routes/mongodb/auth.router.js";
import userRoutes from "./routes/mongodb/user.router.js";
import postRoutes from "./routes/mongodb/post.router.js";
import commentRoutes from "./routes/mongodb/comment.router.js";
import adminRoutes from "./routes/mongodb/admin.router.js";
import reportRoutes from "./routes/mongodb/report.router.js";

// Đọc biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9785;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Thêm logger middleware
app.use(LogService.requestLogger);

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    LogService.info(
      "Database Connection",
      "MongoDB connection established successfully",
      { module: "system" }
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    LogService.error(
      "Database Connection",
      `Failed to connect to MongoDB: ${err.message}`,
      { module: "system" }
    );
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 0,
    message: "Endpoint not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Log server errors
  LogService.error("Server Error", err.message, {
    module: "system",
    metadata: {
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
  });

  res.status(500).json({
    code: 0,
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  LogService.info(
    "Server Started",
    `API server started successfully on port ${PORT}`,
    { module: "system" }
  );
});

export default app;
