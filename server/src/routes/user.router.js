import express from "express";
import UserController from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", UserController.Register);
router.post("/login", UserController.Login);
router.post("/refresh-token", UserController.RefreshToken);
// router.post("/logout", UserController);
// router.get("/users", UserController);
// router.get("/user/:id", UserController);
// router.put("/update-user/:id", UserController);
// router.delete("/delete-user/:id", UserController);
// router.post("/reset-password", UserController);
// router.post("/forgot-password", UserController);
// router.post("/change-password", UserController);
// router.post("/update-profile", UserController);

export default router;
