import express from "express";
import * as MessageController from "../controllers/message.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multerUpload.js"; // In case media upload is handled here or in controller

const router = express.Router();

router.use(verifyToken);

router.get("/conversations", MessageController.getConversations);
router.get("/:userId", MessageController.getMessages);

router.post("/send", MessageController.sendMessage); // Assuming media handled in body or separate upload if needed? Controller takes media in body.
router.post("/read", MessageController.markAsRead);

router.delete("/:messageId", MessageController.deleteMessage);
router.delete("/conversation/:userId", MessageController.deleteConversation);

export default router;
