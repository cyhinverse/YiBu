import express from "express";
import cors from "cors";
import config from "./configs/config.js";
import logger from "./configs/logger.js";
import errorMiddleware from "./middlewares/error.middleware.js";

// Import Routes
import authRoutes from "./routes/auth.router.js";
import userRoutes from "./routes/user.router.js";
import postRoutes from "./routes/post.router.js";
import commentRoutes from "./routes/comment.router.js";
import adminRoutes from "./routes/admin.router.js";
import reportRoutes from "./routes/reports.router.js";
import likeRoutes from "./routes/like.router.js";
import profileRoutes from "./routes/profile.router.js";
import messageRoutes from "./routes/message.router.js";
import savePostRoutes from "./routes/savepost.router.js";
import notificationRoutes from "./routes/notification.router.js";
import userSettingsRoutes from "./routes/userSettings.router.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:9258",
      "http://localhost:5173",
      "http://localhost:3000",
      config.CLIENT_URL,
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logger.error(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date(),
    env: config.env,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // server.js used /user, app.js used /api/users. Keeping /api/users for consistency, might break frontend if they use /user. Let's support both or standardize. Plan said standardize. I'll stick to /api prefixes but I should be careful. 
// CHECK: server.js had "app.use("/user", routerUser);" -> This is risky. 
// Let's add an alias if needed, or better, stick to the cleaner /api/users and we might need to fix frontend later. 
// For now, I will map as per app.js intent but include all from server.js.
// Waittt, `app.use("/user", routerUser)` in server.js vs `app.use("/api/users", ...)` in app.js. 
// I will keep both for backward compatibility if I can't check frontend.
app.use("/api/users", userRoutes);
app.use("/user", userRoutes); // Alias for legacy support

app.use("/api/posts", postRoutes); // server.js had /api/v1 for posts.
app.use("/api/v1", postRoutes); // Alias for legacy support

app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes); // check filename
app.use("/api/like", likeRoutes);
app.use("/profile", profileRoutes); // Legacy path?
app.use("/api/profile", profileRoutes); // New standard path

app.use("/api/messages", messageRoutes);
app.use("/api/savepost", savePostRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", userSettingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    code: 0,
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
