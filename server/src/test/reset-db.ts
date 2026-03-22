import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { applyTestEnvironment, ensureTestDatabaseExists } from './test-env';

const testEnvironment = applyTestEnvironment({
  clientUrl: 'http://127.0.0.1:4173',
  uploadDir: '.tmp/uploads-e2e',
  jwtAccessSecret: 'playwright-access-secret',
  jwtRefreshSecret: 'playwright-refresh-secret',
});

const ensureSafeDatabaseName = () => {
  const databaseName = testEnvironment.DATABASE_NAME;

  if (!databaseName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to reset database "${databaseName}". Test resets are limited to *test* databases.`,
    );
  }
};

const resetUploadsDirectory = () => {
  const uploadsRoot = path.resolve(process.cwd(), testEnvironment.UPLOAD_DIR);

  rmSync(uploadsRoot, { recursive: true, force: true });
  mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
};

const main = async () => {
  ensureSafeDatabaseName();
  await ensureTestDatabaseExists(testEnvironment);
  resetUploadsDirectory();

  const { AppDataSource } = await import('../config/data-source');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.dropDatabase();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();

  console.log(`Reset test database: ${testEnvironment.DATABASE_NAME}`);
};

void main().catch((error) => {
  console.error('Failed to reset the test database.', error);
  process.exit(1);
});
