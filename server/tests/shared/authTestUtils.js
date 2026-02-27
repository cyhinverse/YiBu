import jwt from 'jsonwebtoken';
import config from '../../src/configs/config.js';
import UserModel from '../../src/models/User.js';

export const TEST_USER_ID = '507f191e810c19729de860ea';
export const TEST_ADMIN_ID = '507f191e810c19729de860eb';

export const ensureJwtSecret = () => {
  if (!config.jwt.accessSecret) {
    config.jwt.accessSecret = 'test_access_token_secret_with_min_length_32';
  }
  return config.jwt.accessSecret;
};

export const createAccessToken = (payload = { id: TEST_USER_ID }) => {
  const secret = ensureJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

export const mockUserLookup = usersById => {
  const originalFindById = UserModel.findById;
  const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;

  UserModel.findById = id => {
    const user = usersById[String(id)] ?? null;
    return {
      select: async () => user,
    };
  };

  UserModel.findByIdAndUpdate = async () => null;

  return () => {
    UserModel.findById = originalFindById;
    UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;
  };
};
