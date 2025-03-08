import express from "express";
import UserController from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", UserController.Register);
router.post("/login", UserController.Login);

export default router;
