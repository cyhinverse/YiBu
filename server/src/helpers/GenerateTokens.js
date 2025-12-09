import jwt from "jsonwebtoken";
import config from "../configs/config.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: "1h",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: "15d",
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

// Backward compatibility
export {
  generateAccessToken as GenerateAccessToken,
  generateRefreshToken as GenerateRefreshToken,
};
