import jwt from "jsonwebtoken";
import config from "../configs/config.js";
import logger from "../configs/logger.js";

const VerifyToken = {
  VerifyAccessToken: (req, res, next) => {
    try {
      // Try to get token from cookie first, then fallback to Authorization header
      let accessToken = req.cookies?.accessToken;
      
      // Fallback to Authorization header for backward compatibility
      if (!accessToken) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          accessToken = authHeader.split(" ")[1];
        }
      }

      if (!accessToken) {
        return res
          .status(401)
          .json({ code: 0, message: "You are not authenticated" });
      }

      jwt.verify(accessToken, config.jwt.accessSecret, async (err, user) => {
        if (err) {
          logger.error("JWT Verify Error:", err.message);
          return res
            .status(401)
            .json({ code: 0, message: "Token is not valid" });
        }

        const User = (await import('../models/User.js')).default;
        const userRecord = await User.findById(user.id).select(
          'isAdmin moderation.status moderation.suspendedUntil isActive'
        );

        if (!userRecord || userRecord.isActive === false) {
          return res
            .status(401)
            .json({ code: 0, message: "User not found or inactive" });
        }

        if (userRecord.moderation?.status === 'banned') {
          return res.status(403).json({
            code: 0,
            message: "Tài khoản đã bị khóa vĩnh viễn",
          });
        }

        if (userRecord.moderation?.status === 'suspended') {
          const suspendedUntil = userRecord.moderation?.suspendedUntil;
          if (suspendedUntil && suspendedUntil > new Date()) {
            const remainingDays = Math.ceil(
              (suspendedUntil - new Date()) / (1000 * 60 * 60 * 24)
            );
            return res.status(403).json({
              code: 0,
              message: `Tài khoản bị tạm khóa, còn ${remainingDays} ngày`,
            });
          }
        }

        req.user = {
          ...user,
          isAdmin: userRecord.isAdmin,
        };
        next();
      });

    } catch (error) {
      logger.error("Unexpected error in token verification:", error);
      return res
        .status(500)
        .json({ code: 0, message: "Internal Server Error" });
    }
  },
};

export const verifyToken = VerifyToken.VerifyAccessToken;
export default VerifyToken;
