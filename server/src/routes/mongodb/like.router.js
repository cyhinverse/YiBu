import express from "express";
const router = express.Router();

// Create a new like
router.post("/");

// Get all likes for a specific post
router.get("/post/:postId");

// Delete a like
router.delete("/:id");

// Get all likes for a specific user
router.get("/user/:userId");

// Get all likes for a specific post
router.get("/post/:postId");

export default router;
