import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { experimentalRoot, writeJson } from './common/artifacts';

const safeReadJson = <T>(filePath: string): T | null => {
  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
};

const formatNumber = (value: number | null | undefined, digits = 2) =>
  typeof value === 'number' ? value.toFixed(digits).replace(/\.00$/, '') : 'n/a';

const formatBytesToGiB = (value: number) => `${(value / 1024 ** 3).toFixed(2)} GiB`;

interface PerformanceEntry {
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

interface PerformanceSummary {
  runId: string;
  scenarioProfile: string;
  generatedAt: string;
  summary: PerformanceEntry[];
}

interface MutationSummary {
  generatedAt: string;
  totals: {
    created: number;
    killed: number;
    survived: number;
    errors: number;
    mutationScore: number;
  } | null;
  modules: Record<
    string,
    { created: number; killed: number; survived: number; mutationScore: number }
  >;
  survivedMutants: Array<{ id: string; module: string; description?: string }>;
}

interface ChaosResult {
  scenario: string;
  metrics: {
    availabilityPercent: number;
    totalProbeSamples: number;
    failedProbeSamples: number;
    recoveryMs: number | null;
    degradationMode: string;
  };
}

interface ChaosSummary {
  runId: string;
  generatedAt: string;
  scenarios: string[];
  results: ChaosResult[];
}

const buildPerformanceSection = (summary: PerformanceSummary | null) => {
  if (!summary) {
    return ['## Performance', '', 'No performance artifact found.', ''];
  }

  const lines = [
    '## Performance',
    '',
    `- Run ID: ${summary.runId}`,
    `- Profile: ${summary.scenarioProfile}`,
    `- Generated At: ${summary.generatedAt}`,
    '',
    '| Scenario | Endpoint | Module | Avg (ms) | P95 (ms) | Error % | RPS | Pass |',
    '|---|---|---|---:|---:|---:|---:|---|',
  ];

  for (const entry of summary.summary) {
    const pass = entry.thresholdPass.errorRate && entry.thresholdPass.p95 ? 'Yes' : 'No';
    lines.push(
      `| ${entry.scenario} | ${entry.endpoint} | ${entry.module} | ${formatNumber(entry.averageLatencyMs)} | ${formatNumber(entry.p95LatencyMs)} | ${formatNumber(entry.errorRatePercent, 3)} | ${formatNumber(entry.throughputRps)} | ${pass} |`,
    );
  }

  lines.push('');
  return lines;
};

const buildMutationSection = (summary: MutationSummary | null) => {
  if (!summary) {
    return ['## Mutation', '', 'No mutation artifact found.', ''];
  }

  const lines = [
    '## Mutation',
    '',
    `- Generated At: ${summary.generatedAt}`,
    summary.totals
      ? `- Totals: created=${summary.totals.created}, killed=${summary.totals.killed}, survived=${summary.totals.survived}, errors=${summary.totals.errors}, score=${formatNumber(summary.totals.mutationScore)}%`
      : '- Totals: n/a',
    '',
    '| Module | Created | Killed | Survived | Score % |',
    '|---|---:|---:|---:|---:|',
  ];

  for (const [module, entry] of Object.entries(summary.modules)) {
    lines.push(
      `| ${module} | ${entry.created} | ${entry.killed} | ${entry.survived} | ${formatNumber(entry.mutationScore)} |`,
    );
  }

  lines.push('');
  lines.push('Survived mutants:');
  if (summary.survivedMutants.length === 0) {
    lines.push('- None');
  } else {
    for (const mutant of summary.survivedMutants) {
      lines.push(
        `- ${mutant.id} (${mutant.module})${mutant.description ? `: ${mutant.description}` : ''}`,
      );
    }
  }
  lines.push('');
  return lines;
};

const buildChaosSection = (summary: ChaosSummary | null) => {
  if (!summary) {
    return ['## Chaos', '', 'No chaos artifact found.', ''];
  }

  const lines = [
    '## Chaos',
    '',
    `- Run ID: ${summary.runId}`,
    `- Generated At: ${summary.generatedAt}`,
    '',
    '| Scenario | Availability % | Failed Probes | Recovery (ms) | Degradation |',
    '|---|---:|---:|---:|---|',
  ];

  for (const result of summary.results) {
    lines.push(
      `| ${result.scenario} | ${formatNumber(result.metrics.availabilityPercent)} | ${result.metrics.failedProbeSamples} / ${result.metrics.totalProbeSamples} | ${formatNumber(result.metrics.recoveryMs, 0)} | ${result.metrics.degradationMode} |`,
    );
  }

  lines.push('');
  return lines;
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
  ? safeReadJson<PerformanceSummary>(performanceLatest.summaryPath)
  : null;
const mutationSummaryTyped = mutationSummary as MutationSummary | null;
const chaosSummary = chaosLatest ? safeReadJson<ChaosSummary>(chaosLatest.outputPath) : null;

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
const markdownLines = [
  '# Experimental Summary',
  '',
  `- Generated At: ${summary.generatedAt}`,
  `- Node: ${summary.environment.nodeVersion}`,
  `- Platform: ${summary.environment.platform}`,
  `- CPU: ${summary.environment.cpuModel}`,
  `- Memory: ${formatBytesToGiB(summary.environment.totalMemoryBytes)}`,
  '',
  ...buildPerformanceSection(performanceSummary),
  ...buildMutationSection(mutationSummaryTyped),
  ...buildChaosSection(chaosSummary),
];
const markdownPath = path.join(experimentalRoot, 'experimental-summary.md');
writeFileSync(markdownPath, `${markdownLines.join('\n')}\n`, 'utf-8');
console.log(
  `Experimental summary written to ${path.join(experimentalRoot, 'experimental-summary.json')}`,
);
console.log(`Experimental markdown summary written to ${markdownPath}`);
