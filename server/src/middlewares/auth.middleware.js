import jwt from "jsonwebtoken";

const VerifyToken = {
  VerifyAccessToken: (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .json({ code: 0, message: "You are not authenticated" });
      }

      const accessToken = authHeader.split(" ")[1];
      if (!accessToken) {
        return res
          .status(401)
          .json({ code: 0, message: "Access token is missing" });
      }

      jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
          console.error("JWT Verify Error:", err.message);
          return res
            .status(403)
            .json({ code: 0, message: "Token is not valid" });
        }

        req.user = user;
        next();
      });
    } catch (error) {
      console.error("Unexpected error in token verification:", error);
      return res
        .status(500)
        .json({ code: 0, message: "Internal Server Error" });
    }
  },
};

export const verifyToken = VerifyToken.VerifyAccessToken;
export default VerifyToken;
