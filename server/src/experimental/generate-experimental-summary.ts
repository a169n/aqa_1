import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { experimentalRoot, writeJson } from './common/artifacts';

const safeReadJson = <T>(filePath: string): T | null => {
  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
};

const performanceLatest = safeReadJson<{ runId: string; summaryPath: string }>(
  path.join(experimentalRoot, 'performance', 'latest-performance-run.json'),
);
const mutationSummary = safeReadJson<unknown>(
  path.join(experimentalRoot, 'mutation', 'mutation-summary.json'),
);
const chaosLatest = safeReadJson<{ runId: string; outputPath: string }>(
  path.join(experimentalRoot, 'chaos', 'latest-chaos-run.json'),
);

const performanceSummary = performanceLatest
  ? safeReadJson<unknown>(performanceLatest.summaryPath)
  : null;
const chaosSummary = chaosLatest ? safeReadJson<unknown>(chaosLatest.outputPath) : null;

const summary = {
  generatedAt: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    cpuModel: os.cpus()[0]?.model ?? 'unknown',
    totalMemoryBytes: os.totalmem(),
  },
  artifacts: {
    performance: performanceSummary,
    mutation: mutationSummary,
    chaos: chaosSummary,
  },
};

writeJson(path.join(experimentalRoot, 'experimental-summary.json'), summary);
console.log(`Experimental summary written to ${path.join(experimentalRoot, 'experimental-summary.json')}`);
