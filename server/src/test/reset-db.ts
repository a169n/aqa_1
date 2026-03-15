import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const defaultTestEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  CLIENT_URL: 'http://127.0.0.1:5173',
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
  UPLOAD_DIR: '.tmp/uploads-e2e',
};

for (const [key, value] of Object.entries(defaultTestEnv)) {
  process.env[key] ??= value;
}

const ensureSafeDatabaseName = () => {
  const databaseName = process.env.DATABASE_NAME ?? '';

  if (!databaseName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to reset database "${databaseName}". Test resets are limited to *test* databases.`,
    );
  }
};

const resetUploadsDirectory = () => {
  const uploadsRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR!);

  rmSync(uploadsRoot, { recursive: true, force: true });
  mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
};

const main = async () => {
  ensureSafeDatabaseName();
  resetUploadsDirectory();

  const { AppDataSource } = await import('../config/data-source');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.dropDatabase();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();

  console.log(`Reset test database: ${process.env.DATABASE_NAME}`);
};

void main().catch((error) => {
  console.error('Failed to reset the test database.', error);
  process.exit(1);
});
