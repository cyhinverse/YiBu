import express from "express";
const router = express.Router();

// Create a new notification
router.post("/");

// Get all notifications for a specific user
router.get("/user/:userId");

// Delete a notification
router.delete("/:id");

// Update a notification
router.put("/:id");



export default router;
