import express from "express";
const router = express.Router();

// Create a new profile
router.post("/");

// Get all profiles
router.get("/");

// Update a profile
router.put("/:id");

// Delete a profile
router.delete("/:id");

// Get a profile by id
router.get("/:id");

// Get a profile by username
router.get("/username/:username");

// Get a profile by email
router.get("/email/:email");

// Get a profile by user id
router.get("/user/:userId");

export default router;
