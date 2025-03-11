const express = require("express");
const router = express.Router();

// Create a new comment
router.post("/");

// Get all comments for a specific post
router.get("/post/:postId");

// Update a comment
router.put("/:id");

// Delete a comment
router.delete("/:id");

module.exports = router;
