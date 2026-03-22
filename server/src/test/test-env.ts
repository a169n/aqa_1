import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';
import { assertSafeDevelopmentDatabaseName } from '../scripts/db-utils';

const serverRoot = path.resolve(__dirname, '../..');
const LOCAL_TEST_ENV_FILES = ['.env.test.local', '.env.test', '.env.local', '.env'] as const;

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

export interface TestEnvironment {
  NODE_ENV: string;
  PORT: string;
  CLIENT_URL: string;
  DATABASE_HOST: string;
  DATABASE_PORT: string;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL_DAYS: string;
  AUTO_RUN_MIGRATIONS: string;
  UPLOAD_DIR: string;
  OPEN_API_DOCS: string;
  CI: string;
}

export interface TestEnvironmentOptions {
  clientUrl?: string;
  uploadDir?: string;
  jwtAccessSecret?: string;
  jwtRefreshSecret?: string;
  openApiDocs?: string;
  ci?: string;
}

const loadLocalEnvFiles = () => {
  for (const fileName of LOCAL_TEST_ENV_FILES) {
    const envPath = path.join(serverRoot, fileName);

    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }
};

export const buildTestEnvironment = (options: TestEnvironmentOptions = {}): TestEnvironment => {
  loadLocalEnvFiles();

  return {
    NODE_ENV: 'test',
    PORT: process.env.TEST_PORT ?? '4000',
    CLIENT_URL: options.clientUrl ?? process.env.TEST_CLIENT_URL ?? 'http://localhost:5173',
    DATABASE_HOST: process.env.DATABASE_HOST ?? '127.0.0.1',
    DATABASE_PORT: process.env.DATABASE_PORT ?? '5432',
    DATABASE_NAME: process.env.TEST_DATABASE_NAME ?? 'inkwell_test',
    DATABASE_USER: process.env.DATABASE_USER ?? 'postgres',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? 'postgres',
    JWT_ACCESS_SECRET: options.jwtAccessSecret ?? 'test-access-secret',
    JWT_REFRESH_SECRET: options.jwtRefreshSecret ?? 'test-refresh-secret',
    ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? '15m',
    REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS ?? '7',
    AUTO_RUN_MIGRATIONS: 'false',
    UPLOAD_DIR: options.uploadDir ?? process.env.TEST_UPLOAD_DIR ?? '.tmp/uploads-test',
    OPEN_API_DOCS: options.openApiDocs ?? process.env.TEST_OPEN_API_DOCS ?? 'false',
    CI: options.ci ?? process.env.CI ?? 'true',
  };
};

export const applyTestEnvironment = (options: TestEnvironmentOptions = {}): TestEnvironment => {
  const testEnvironment = buildTestEnvironment(options);

  for (const [key, value] of Object.entries(testEnvironment)) {
    process.env[key] = value;
  }

  return testEnvironment;
};

export const ensureTestDatabaseExists = async (
  testEnvironment: Pick<
    TestEnvironment,
    'DATABASE_HOST' | 'DATABASE_PORT' | 'DATABASE_NAME' | 'DATABASE_USER' | 'DATABASE_PASSWORD'
  >,
) => {
  assertSafeDevelopmentDatabaseName(testEnvironment.DATABASE_NAME);

  const adminClient = new Client({
    host: testEnvironment.DATABASE_HOST,
    port: Number(testEnvironment.DATABASE_PORT),
    user: testEnvironment.DATABASE_USER,
    password: testEnvironment.DATABASE_PASSWORD,
    database: 'postgres',
  });

  await adminClient.connect();

  try {
    const databaseName = testEnvironment.DATABASE_NAME;
    const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);

    if (exists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    }
  } finally {
    await adminClient.end();
  }
};
