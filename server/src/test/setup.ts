import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import { resetAuthRateLimitState } from '../middleware/security';
import { cleanDatabase } from '../scripts/db-utils';
import { applyTestEnvironment, ensureTestDatabaseExists } from './test-env';

let dataSource: DataSource;
const testEnvironment = applyTestEnvironment({
  clientUrl: 'http://localhost:5173',
  uploadDir: '.tmp/uploads-test',
  jwtAccessSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
});

const uploadsRoot = path.resolve(process.cwd(), testEnvironment.UPLOAD_DIR);

const resetUploadsDirectory = () => {
  rmSync(uploadsRoot, { recursive: true, force: true });
  mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
};

const resetPublicSchema = async () => {
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
};

beforeAll(async () => {
  await ensureTestDatabaseExists(testEnvironment);

  const { AppDataSource } = await import('../config/data-source');

  dataSource = AppDataSource;

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  await resetPublicSchema();
  await dataSource.runMigrations();
  resetUploadsDirectory();
});

beforeEach(async () => {
  resetAuthRateLimitState();
  await cleanDatabase(dataSource);
  resetUploadsDirectory();
});

afterAll(async () => {
  resetUploadsDirectory();

  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});
