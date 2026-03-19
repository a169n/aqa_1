import { defineConfig } from '@playwright/test';

const envOrDefault = (key: string, fallback: string) => process.env[key] ?? fallback;

const databaseEnv = {
  NODE_ENV: envOrDefault('NODE_ENV', 'test'),
  PORT: envOrDefault('PORT', '4000'),
  CLIENT_URL: envOrDefault('CLIENT_URL', 'http://127.0.0.1:4173'),
  DATABASE_HOST: envOrDefault('DATABASE_HOST', '127.0.0.1'),
  DATABASE_PORT: envOrDefault('DATABASE_PORT', '5432'),
  DATABASE_NAME: envOrDefault('DATABASE_NAME', 'inkwell_test'),
  DATABASE_USER: envOrDefault('DATABASE_USER', 'postgres'),
  DATABASE_PASSWORD: envOrDefault('DATABASE_PASSWORD', 'postgres'),
  JWT_ACCESS_SECRET: envOrDefault('JWT_ACCESS_SECRET', 'playwright-access-secret'),
  JWT_REFRESH_SECRET: envOrDefault('JWT_REFRESH_SECRET', 'playwright-refresh-secret'),
  ACCESS_TOKEN_TTL: envOrDefault('ACCESS_TOKEN_TTL', '15m'),
  REFRESH_TOKEN_TTL_DAYS: envOrDefault('REFRESH_TOKEN_TTL_DAYS', '7'),
  AUTO_RUN_MIGRATIONS: envOrDefault('AUTO_RUN_MIGRATIONS', 'true'),
  UPLOAD_DIR: envOrDefault('UPLOAD_DIR', '.tmp/uploads-e2e'),
  OPEN_API_DOCS: envOrDefault('OPEN_API_DOCS', 'false'),
  CI: envOrDefault('CI', 'true'),
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run start:test:server',
      url: 'http://127.0.0.1:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: databaseEnv,
    },
    {
      command: 'npm run start:test:client',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        ...databaseEnv,
        VITE_API_URL: 'http://127.0.0.1:4000/api',
        VITE_OPEN_BROWSER: 'false',
      },
    },
  ],
});
