import express from "express";
import dotenv from "dotenv";
import CheckConnectionToMongoDB from "./configs/StartServer.js";
import cors from "cors";
import routerPosts from "./routes/mongodb/post.router.js";
import routerAuth from "./routes/mongodb/auth.router.js";
import routerUser from "./routes/mongodb/user.router.js";
import routerLike from "./routes/like.router.js";
import routerProfile from "./routes/mongodb/profile.router.js";
import routerMessage from "./routes/mongodb/message.router.js";
import { initSocket } from "./socket.js";
import http from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const environment =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: environment });

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:9258",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", routerAuth);
app.use("/api/v1", routerPosts);
app.use("/user", routerUser);
app.use("/api/like", routerLike);
app.use("/profile", routerProfile);
app.use("/api/messages", routerMessage);

CheckConnectionToMongoDB()
  .then(() => {
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
