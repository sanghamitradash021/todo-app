import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env['PORT'] ?? '3001', 10),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '24h',
  LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
} as const;
