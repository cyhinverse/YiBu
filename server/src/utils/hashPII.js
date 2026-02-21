import crypto from 'crypto';

export const hashPII = (value, length = 12) => {
  if (!value) return null;

  return crypto
    .createHash('sha256')
    .update(String(value).toLowerCase())
    .digest('hex')
    .slice(0, length);
};
