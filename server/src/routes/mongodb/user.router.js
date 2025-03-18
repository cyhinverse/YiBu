import express from "express";
import UserController from "../../controllers/mongodb/user.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.get("/list", UserController.getAllUsers);
router.get("/users", UserController.GET_TOP_USERS_BY_LIKES);
router.get("/:id", UserController.Get_User_By_Id);

export default router;
