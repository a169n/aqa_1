import { AppDataSource } from '../config/data-source';
import { cleanDatabase } from './db-utils';

const main = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await cleanDatabase(AppDataSource);
  console.log(`Cleaned database: ${AppDataSource.options.database}`);
};

void main()
  .catch((error) => {
    console.error('Failed to clean the database.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
