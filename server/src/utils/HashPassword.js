import bcrypt from "bcrypt";

import logger from "../configs/logger.js";

export const hashPassword = async (password) => {
  try {
    const salt = 10;
    const PasswordHashed = await bcrypt.hash(password, salt);
    return PasswordHashed;
  } catch (e) {
    logger.error(`Error hash password ${e}`);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

// Default export for backward compatibility
export default hashPassword;
