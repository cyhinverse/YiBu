import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const nodeEnv = process.env.NODE_ENV || 'development';

const serverRootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

// Load only .env from backend project root.
dotenv.config({ path: path.join(serverRootDir, '.env') });

const parseCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

const parseInteger = (value, fallback, options = {}) => {
  const { min, max } = options;
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) return fallback;

  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
};

const uniq = arr => Array.from(new Set(arr.filter(Boolean)));

const parseTrustProxy = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === false) return value;

  const str = String(value).trim().toLowerCase();
  if (str === 'true') return true;
  if (str === 'false') return false;

  const asInt = Number.parseInt(str, 10);
  if (Number.isFinite(asInt) && String(asInt) === str) return asInt;

  // Express also accepts strings like "loopback", "uniquelocal", "127.0.0.1"
  return value;
};

const INSECURE_SECRET_VALUES = new Set([
  'dev_access_token_secret_change_me',
  'dev_refresh_token_secret_change_me',
  'your_access_token_secret_here_change_in_production',
  'your_refresh_token_secret_here_change_in_production',
  'changeme',
  'change_me',
  'secret',
  'default_secret',
]);

const calculateEntropy = str => {
  if (!str || typeof str !== 'string') return 0;
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

const assertSecureSecret = (name, value) => {
  if (!value) {
    throw new Error(`${name} is required in production`);
  }

  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production`);
  }

  if (INSECURE_SECRET_VALUES.has(value.toLowerCase())) {
    throw new Error(`${name} uses an insecure default value`);
  }

  const entropy = calculateEntropy(value);
  if (entropy < 3.5) {
    console.warn(
      `Warning: ${name} has low entropy (${entropy.toFixed(2)}). Consider using a more random secret.`
    );
  }
};

const DEFAULT_CLIENT_URL = 'http://localhost:3000';
const clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
const defaultCorsOrigins = [
  clientUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:9258',
  'http://localhost:9259',
  'http://localhost:5173',
  'http://127.0.0.1:9258',
  'http://127.0.0.1:9259',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const config = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parseInteger(process.env.PORT, 5000, { min: 1 }),
  // Default to trusting the first proxy hop in production (typical for reverse proxies / load balancers).
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, nodeEnv === 'production' ? 1 : false),
  CLIENT_URL: clientUrl,
  debugMode: process.env.DEBUG_MODE === 'true',
  cors: {
    // Comma-separated list, e.g. "http://localhost:3000,http://localhost:5173"
    origins: uniq(parseCsv(process.env.CORS_ORIGINS, defaultCorsOrigins)),
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
    port: parseInteger(process.env.EMAIL_PORT, 587, { min: 1 }),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    // Only enable for local/dev when using self-signed certs. Never enable in production.
    allowInsecureTls: process.env.EMAIL_ALLOW_INSECURE_TLS === 'true',
  },
  validateCriticalConfig: () => {
    if (nodeEnv !== 'production') return;

    assertSecureSecret('ACCESS_TOKEN_SECRET', process.env.ACCESS_TOKEN_SECRET);
    assertSecureSecret('REFRESH_TOKEN_SECRET', process.env.REFRESH_TOKEN_SECRET);
  },
};

export default config;
