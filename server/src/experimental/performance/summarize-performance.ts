import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { experimentalRoot } from '../common/artifacts';

interface PerformanceSummaryEntry {
  endpoint: string;
  module: string;
  scenario: string;
  averageLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  throughputRps: number;
  errorRatePercent: number;
  thresholdPass: { errorRate: boolean; p95: boolean };
}

const performanceRoot = path.join(experimentalRoot, 'performance');
const latestRunPath = path.join(performanceRoot, 'latest-performance-run.json');

const latest = JSON.parse(readFileSync(latestRunPath, 'utf-8')) as {
  runId: string;
  summaryPath: string;
};

const summary = JSON.parse(readFileSync(latest.summaryPath, 'utf-8')) as {
  runId: string;
  generatedAt: string;
  summary: PerformanceSummaryEntry[];
};

const grouped = summary.summary.reduce<Record<string, PerformanceSummaryEntry[]>>((acc, entry) => {
  const key = `${entry.module}:${entry.scenario}`;
  acc[key] ??= [];
  acc[key].push(entry);
  return acc;
}, {});

const lines = [
  '# Experimental Performance Summary',
  '',
  `- Run ID: ${summary.runId}`,
  `- Generated At: ${summary.generatedAt}`,
  '',
  '| Module | Scenario | Endpoint | Avg Latency (ms) | Median (ms) | p95 (ms) | Throughput (req/s) | Error Rate (%) | Threshold Pass |',
  '|---|---|---|---:|---:|---:|---:|---:|---|',
  ...summary.summary.map(
    (entry) =>
      `| ${entry.module} | ${entry.scenario} | ${entry.endpoint} | ${entry.averageLatencyMs.toFixed(2)} | ${entry.medianLatencyMs.toFixed(2)} | ${entry.p95LatencyMs.toFixed(2)} | ${entry.throughputRps.toFixed(2)} | ${entry.errorRatePercent.toFixed(3)} | ${entry.thresholdPass.errorRate && entry.thresholdPass.p95 ? 'yes' : 'no'} |`,
  ),
  '',
  '## Scenario Aggregates',
  '',
  ...Object.entries(grouped).map(([key, entries]) => {
    const avgP95 = entries.reduce((total, row) => total + row.p95LatencyMs, 0) / entries.length;
    const avgError = entries.reduce((total, row) => total + row.errorRatePercent, 0) / entries.length;
    return `- ${key}: avg p95=${avgP95.toFixed(2)}ms, avg error=${avgError.toFixed(3)}%`;
  }),
  '',
];

const outputPath = path.join(performanceRoot, `${summary.runId}-summary.md`);
writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf-8');
console.log(`Performance markdown summary written to ${outputPath}`);
