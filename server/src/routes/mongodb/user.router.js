import express from "express";
import UserController from "../../controllers/mongodb/user.controller.js";
import VerifyToken from "../../middlewares/middlewareController.js";
const router = express.Router();

router.post("/register", UserController.Register);
router.post("/login", UserController.Login);
router.post("/refresh-token", UserController.RefreshToken);
router.post("/logout", VerifyToken.VerifyAccessToken, UserController.Logout);
router.get("/users", UserController.GET_TOP_USERS_BY_LIKES);
// router.get("/user/:id", UserController);
// router.put("/update-user/:id", UserController);
// router.delete("/delete-user/:id", UserController);
// router.post("/reset-password", UserController);
// router.post("/forgot-password", UserController);
// router.post("/change-password", UserController);
// router.post("/update-profile", UserController);

export default router;
