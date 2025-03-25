import User from "../models/mongodb/Users.js";

/**
 * Middleware to check if the authenticated user is an admin
 * This should be used after the auth middleware
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    // User should already be authenticated at this point and req.user should be set
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        code: 0,
        message: "Unauthorized. Authentication required.",
      });
    }

    // Get user from database to check admin status
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        code: 0,
        message: "User not found.",
      });
    }

    // Check if user is an admin by checking both isAdmin field and role
    if (!user.isAdmin && user.role !== "admin") {
      return res.status(403).json({
        code: 0,
        message: "Forbidden. Admin privileges required.",
      });
    }

    // User is admin, continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      code: 0,
      message: "Server error while checking admin privileges.",
    });
  }
};
