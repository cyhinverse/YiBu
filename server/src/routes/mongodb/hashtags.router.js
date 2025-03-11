import express from "express";
const router = express.Router();

// Create a new hashtag
router.post("/");

// Get all hashtags
router.get("/");

// Update a hashtag
router.put("/:id");

// Delete a hashtag
router.delete("/:id");

// Get all hashtags for a specific post
router.get("/post/:postId");

// Get all hashtags for a specific user
router.get("/user/:userId");




export default router;
