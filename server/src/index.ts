import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { app } from './app';
import { AppDataSource } from './config/data-source';
import { env } from './config/env';

const bootstrap = async () => {
  mkdirSync(path.resolve(process.cwd(), env.UPLOAD_DIR, 'avatars'), { recursive: true });

  await AppDataSource.initialize();

  if (env.AUTO_RUN_MIGRATIONS) {
    await AppDataSource.runMigrations();
  }

  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
};

void bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

