import express from "express";
import UserController from "../../controllers/mongodb/user.controller.js";
const router = express.Router();

router.get("/users", UserController.GET_TOP_USERS_BY_LIKES);
router.post("/get-user", UserController.Get_User_By_Id);

export default router;
