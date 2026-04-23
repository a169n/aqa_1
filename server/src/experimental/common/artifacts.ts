import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const repoRoot = path.resolve(__dirname, '../../../..');
export const experimentalRoot = path.join(repoRoot, '.tmp', 'qa', 'experimental');

export const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

export const ensureDir = (directory: string) => {
  mkdirSync(directory, { recursive: true });
  return directory;
};

export const writeJson = (filePath: string, value: unknown) => {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
};
