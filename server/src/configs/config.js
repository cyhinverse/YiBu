import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile =
  nodeEnv === 'production' ? '.env.production' : '.env.development';

// Load .env file (if it exists) and then specific env file
dotenv.config();
dotenv.config({ path: envFile });

const config = {
  env: nodeEnv,
  port: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
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
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

export default config;
