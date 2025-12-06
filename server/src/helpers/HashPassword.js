import bcrypt from "bcrypt";

import logger from "../configs/logger.js";

const HashPasswordForUser = async (password) => {
  try {
    const salt = 10;
    const PasswordHashed = await bcrypt.hash(password, salt);
    return PasswordHashed;
  } catch (e) {
    logger.error(`Error hash password ${e}`);
  }
};

export default HashPasswordForUser;
