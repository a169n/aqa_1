import type { DataSource } from 'typeorm';

export const APPLICATION_TABLES = [
  'reports',
  'bookmarks',
  'post_tags',
  'tags',
  'categories',
  'likes',
  'comments',
  'refresh_tokens',
  'posts',
  'users',
] as const;

const DEVELOPMENT_DATABASE_TOKENS = ['dev', 'local', 'test'];
const DEFAULT_DEVELOPMENT_DATABASES = new Set(['inkwell']);

const quoteIdentifier = (value: string) => `"${value}"`;

const getConfiguredDatabaseName = (dataSource: DataSource) => {
  const databaseName = dataSource.options.database;

  return typeof databaseName === 'string' ? databaseName : '';
};

export const isSafeDevelopmentDatabaseName = (databaseName: string) => {
  const normalizedName = databaseName.trim().toLowerCase();

  if (!normalizedName) {
    return false;
  }

  if (DEFAULT_DEVELOPMENT_DATABASES.has(normalizedName)) {
    return true;
  }

  return DEVELOPMENT_DATABASE_TOKENS.some((token) => normalizedName.includes(token));
};

export const assertSafeDevelopmentDatabaseName = (databaseName: string) => {
  if (isSafeDevelopmentDatabaseName(databaseName)) {
    return;
  }

  throw new Error(
    `Refusing to modify database "${databaseName}". Only local/dev/test databases are allowed. Use "inkwell" or a name containing dev, local, or test.`,
  );
};

const buildTruncateStatement = () => {
  const tableList = APPLICATION_TABLES.map(quoteIdentifier).join(',\n      ');

  return `
    TRUNCATE TABLE
      ${tableList}
    RESTART IDENTITY CASCADE
  `;
};

export interface DatabaseActionOptions {
  databaseName?: string;
  skipSafetyCheck?: boolean;
}

export const cleanDatabase = async (
  dataSource: DataSource,
  options: DatabaseActionOptions = {},
) => {
  const databaseName = options.databaseName ?? getConfiguredDatabaseName(dataSource);

  if (!options.skipSafetyCheck) {
    assertSafeDevelopmentDatabaseName(databaseName);
  }

  await dataSource.query(buildTruncateStatement());
};
