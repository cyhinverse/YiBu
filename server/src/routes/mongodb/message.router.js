import express from "express";
const router = express.Router();

// Create a new message
router.post("/");

// Get all messages for a specific user
router.get("/user/:userId");

// Delete a message
router.delete("/:id");

// Update a message
router.put("/:id");

export default router;
