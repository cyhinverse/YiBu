import express from "express";
import dotenv from "dotenv";
import CheckConnectionToMongoDB from "./configs/StartServer.js";
import cors from "cors";
import routerPosts from "./routes/mongodb/post.router.js";
import routerAuth from "./routes/mongodb/auth.router.js";
import routerUser from "./routes/mongodb/user.router.js";
import routerLike from "./routes/mongodb/like.router.js";
import routerProfile from "./routes/mongodb/profile.router.js";
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
    origin: "http://localhost:9258",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", routerAuth);
app.use("/api/v1", routerPosts);
app.use("/user", routerUser);
app.use("/like", routerLike);
app.use("/profile", routerProfile);

CheckConnectionToMongoDB(app, PORT);
