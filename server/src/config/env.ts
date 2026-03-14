import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const toNumber = (value: string, key: string) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number.`);
  }

  return parsed;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: toNumber(getEnv('PORT', '4000'), 'PORT'),
  CLIENT_URL: getEnv('CLIENT_URL', 'http://localhost:5173'),
  DATABASE_HOST: getEnv('DATABASE_HOST', 'localhost'),
  DATABASE_PORT: toNumber(getEnv('DATABASE_PORT', '5432'), 'DATABASE_PORT'),
  DATABASE_NAME: getEnv('DATABASE_NAME', 'inkwell'),
  DATABASE_USER: getEnv('DATABASE_USER', 'postgres'),
  DATABASE_PASSWORD: getEnv('DATABASE_PASSWORD', 'postgres'),
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET', 'change-me-access'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', 'change-me-refresh'),
  ACCESS_TOKEN_TTL: getEnv('ACCESS_TOKEN_TTL', '15m'),
  REFRESH_TOKEN_TTL_DAYS: toNumber(getEnv('REFRESH_TOKEN_TTL_DAYS', '7'), 'REFRESH_TOKEN_TTL_DAYS'),
  AUTO_RUN_MIGRATIONS: getEnv('AUTO_RUN_MIGRATIONS', 'true') === 'true',
  UPLOAD_DIR: getEnv('UPLOAD_DIR', 'uploads'),
};

