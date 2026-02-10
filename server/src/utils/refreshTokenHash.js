import crypto from 'crypto';

const pepper = process.env.REFRESH_TOKEN_PEPPER;

export const hashRefreshToken = token => {
  if (!token) return null;
  const input = pepper ? `${pepper}:${token}` : token;
  return crypto.createHash('sha256').update(input).digest('hex');
};

