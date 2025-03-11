import express from "express";
const router = express.Router();

// Create a new savepost
router.post("/");

// Get all saveposts for a specific user
router.get("/user/:userId");

// Delete a savepost
router.delete("/:id");

// Get all saveposts for a specific post
router.get("/post/:postId");

// Update a savepost
router.put("/:id");



export default router;
