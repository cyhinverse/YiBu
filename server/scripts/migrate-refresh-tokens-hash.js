import mongoose from 'mongoose';
import config from '../src/configs/config.js';
import RefreshToken from '../src/models/RefreshToken.js';
import { hashRefreshToken } from '../src/utils/refreshTokenHash.js';
import logger from '../src/configs/logger.js';
import { pathToFileURL } from 'url';

// One-time migration: replace legacy plaintext refresh tokens stored in DB with SHA-256 hashes.
// Safe to re-run; already-hashed tokens are ignored.

const looksLikeLegacyPlaintextToken = token => {
  // Legacy tokens are generated as 40 bytes hex => 80 hex chars.
  return typeof token === 'string' && /^[0-9a-f]{80}$/i.test(token);
};

export const main = async () => {
  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is missing');
  }

  await mongoose.connect(config.mongodb.uri, {
    autoCreate: true,
    autoIndex: config.env !== 'production',
  });

  const cursor = RefreshToken.find({}).select('token').cursor();
  let scanned = 0;
  let migrated = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const current = doc?.token;
    if (!looksLikeLegacyPlaintextToken(current)) continue;

    const hashed = hashRefreshToken(current);
    await RefreshToken.updateOne({ _id: doc._id }, { $set: { token: hashed } });
    migrated += 1;
  }

  logger.info('Refresh token migration complete', {
    module: 'migration',
    scanned,
    migrated,
  });

  await mongoose.disconnect();
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
