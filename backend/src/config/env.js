import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databasePath: process.env.DATABASE_PATH || './data/projnan.sqlite',
  githubDefaultToken: process.env.GITHUB_DEFAULT_TOKEN || '',
};
