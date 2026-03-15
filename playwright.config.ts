import { defineConfig } from '@playwright/test';

const databaseEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  CLIENT_URL: 'http://127.0.0.1:4173',
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '5432',
  DATABASE_NAME: 'inkwell_test',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: 'postgres',
  JWT_ACCESS_SECRET: 'playwright-access-secret',
  JWT_REFRESH_SECRET: 'playwright-refresh-secret',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL_DAYS: '7',
  AUTO_RUN_MIGRATIONS: 'true',
  UPLOAD_DIR: '.tmp/uploads-e2e',
  OPEN_API_DOCS: 'false',
  CI: 'true',
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
