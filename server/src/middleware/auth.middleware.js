import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No Bearer token found in headers");
      console.log("All headers:", req.headers);
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log(
      "Token received:",
      token ? token.substring(0, 20) + "..." : "invalid"
    );

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("Token verified successfully for user:", decoded.username);

      req.user = {
        id: decoded.id,
        username: decoded.username,
      };

      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: jwtError.message,
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};
