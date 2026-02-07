import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile =
  nodeEnv === 'production' ? '.env.production' : '.env.development';

const serverRootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

// Load base .env (if present) then overlay env-specific file.
dotenv.config({ path: path.join(serverRootDir, '.env') });
dotenv.config({ path: path.join(serverRootDir, envFile) });

const parseCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

const uniq = arr => Array.from(new Set(arr.filter(Boolean)));

const config = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number.parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  debugMode: process.env.DEBUG_MODE === 'true',
  cors: {
    // Comma-separated list, e.g. "http://localhost:3000,http://localhost:5173"
    origins: uniq(
      parseCsv(process.env.CORS_ORIGINS, [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:9258',
        'http://localhost:9259',
        'http://localhost:5173',
        'http://127.0.0.1:9258',
        'http://127.0.0.1:9259',
      ])
    ),
  },
  mongodb: {
    uri: process.env.MONGODB_URI || process.env.MONGO_URI, // Handle both naming conventions found in code
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

export default config;
