import jwt from "jsonwebtoken";
import config from "../configs/config.js";

const GenerateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: "1h",
  });
};

const GenerateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: "15d",
  });
};
export { GenerateAccessToken, GenerateRefreshToken };
