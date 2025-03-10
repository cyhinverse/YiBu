import express from "express";
import dotenv from "dotenv";
import CheckConnectionToMongoDB from "./configs/StartServer.js";
import cors from "cors";
import router from "./routes/user.router.js";
const environment =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: environment });

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:9258",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", router);

CheckConnectionToMongoDB(app, PORT);
