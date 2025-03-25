import express from "express";
import UserController from "../../controllers/mongodb/user.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.get("/list", UserController.getAllUsers);
router.get("/users", UserController.GET_TOP_USERS_BY_LIKES);
router.get("/search", UserController.searchUsers);
router.get("/:id", UserController.Get_User_By_Id);
router.post("/follow", UserController.followUser);
router.post("/unfollow", UserController.unfollowUser);
router.get("/follow-status/:targetUserId", UserController.checkFollowStatus);

export default router;
