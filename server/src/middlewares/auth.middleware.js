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

      jwt.verify(accessToken, config.jwt.accessSecret, (err, user) => {
        if (err) {
          logger.error("JWT Verify Error:", err.message);
          return res
            .status(401)
            .json({ code: 0, message: "Token is not valid" });
        }

        req.user = user;
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
