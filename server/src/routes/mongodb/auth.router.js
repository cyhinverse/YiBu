import express from "express";
import UserController from "../../controllers/mongodb/auth.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
const router = express.Router();

router.post("/register", UserController.Register);
router.post("/login", UserController.Login);
router.post("/refresh-token", UserController.RefreshToken);
router.post("/logout", VerifyToken.VerifyAccessToken, UserController.Logout);

export default router;
