import { defineConfig } from '@playwright/test';
import { buildTestEnvironment } from './server/src/test/test-env';

const databaseEnv = buildTestEnvironment({
  clientUrl: 'http://127.0.0.1:4173',
  uploadDir: '.tmp/uploads-e2e',
  jwtAccessSecret: 'playwright-access-secret',
  jwtRefreshSecret: 'playwright-refresh-secret',
  openApiDocs: 'false',
  ci: process.env.CI ?? 'true',
});

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: '.tmp/qa/playwright-report.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run start:test:server',
      url: 'http://127.0.0.1:4000/api/health',
      reuseExistingServer: false,
      timeout: 120000,
      env: databaseEnv,
    },
    {
      command: 'npm run start:test:client',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...databaseEnv,
        VITE_API_URL: 'http://127.0.0.1:4000/api',
        VITE_OPEN_BROWSER: 'false',
      },
    },
  ],
});
