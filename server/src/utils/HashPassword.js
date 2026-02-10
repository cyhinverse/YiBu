import bcrypt from 'bcrypt';
import logger from '../configs/logger.js';

export const hashPassword = async password => {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (err) {
    logger.error('Password hash failed', {
      module: 'auth',
      message: err?.message,
      stack: err?.stack,
    });
    throw err;
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    logger.error('Password compare failed', {
      module: 'auth',
      message: err?.message,
      stack: err?.stack,
    });
    throw err;
  }
};
