import jwt from 'jsonwebtoken';
import config from '../configs/config.js';

export const generateAccessToken = payload => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: '1h',
  });
};
