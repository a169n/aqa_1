import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import { cleanDatabase } from '../scripts/db-utils';

const defaultTestEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  CLIENT_URL: 'http://localhost:5173',
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '5432',
  DATABASE_NAME: 'inkwell_test',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: 'postgres',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL_DAYS: '7',
  AUTO_RUN_MIGRATIONS: 'false',
  UPLOAD_DIR: '.tmp/uploads-test',
};

for (const [key, value] of Object.entries(defaultTestEnv)) {
  process.env[key] ??= value;
}

let dataSource: DataSource;

const uploadsRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR!);

const resetUploadsDirectory = () => {
  rmSync(uploadsRoot, { recursive: true, force: true });
  mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
};

beforeAll(async () => {
  const { AppDataSource } = await import('../config/data-source');

  dataSource = AppDataSource;

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  await dataSource.dropDatabase();
  await dataSource.runMigrations();
  resetUploadsDirectory();
});

beforeEach(async () => {
  await cleanDatabase(dataSource);
  resetUploadsDirectory();
});

afterAll(async () => {
  resetUploadsDirectory();

  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});
