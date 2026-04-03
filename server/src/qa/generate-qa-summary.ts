import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildQaSummary,
  type CoverageSummaryJson,
  type PlaywrightJsonReport,
  type VitestJsonReport,
} from './reporting';

const repoRoot = path.resolve(__dirname, '../../..');
const qaDirectory = path.join(repoRoot, '.tmp', 'qa');
const qaSummaryPath = path.join(qaDirectory, 'qa-summary.json');

const readJsonFile = <T>(filePath: string): T => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch (error) {
    throw new Error(`Unable to read QA artifact: ${filePath}`, { cause: error });
  }
};

const coverageReport = readJsonFile<CoverageSummaryJson>(
  path.join(repoRoot, 'server', 'coverage', 'coverage-summary.json'),
);
const vitestReport = readJsonFile<VitestJsonReport>(path.join(qaDirectory, 'vitest-report.json'));
const playwrightReport = readJsonFile<PlaywrightJsonReport>(
  path.join(qaDirectory, 'playwright-report.json'),
);
const summary = buildQaSummary({
  coverageReport,
  playwrightReport,
  repoRoot,
  vitestReport,
});

mkdirSync(qaDirectory, { recursive: true });
writeFileSync(qaSummaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf-8');

console.log(`QA summary written to ${qaSummaryPath}`);
