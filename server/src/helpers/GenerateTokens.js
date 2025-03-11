import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const GenerateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

const GenerateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "15d",
  });
};
export { GenerateAccessToken, GenerateRefreshToken };
