import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ensureDir, experimentalRoot, repoRoot, writeJson } from '../common/artifacts';

const reportPath = path.join(repoRoot, 'server', 'reports', 'mutation', 'mutation-report.json');
const outputRoot = ensureDir(path.join(experimentalRoot, 'mutation'));
const outputPath = path.join(outputRoot, 'mutation-summary.json');

const report = JSON.parse(readFileSync(reportPath, 'utf-8')) as {
  totals?: {
    created: number;
    killed: number;
    survived: number;
    errors: number;
    mutationScore: number;
  };
  modules?: Record<
    string,
    { created: number; killed: number; survived: number; mutationScore: number }
  >;
  mutants?: Array<{ id: string; module: string; status: string }>;
};

const summary = {
  generatedAt: new Date().toISOString(),
  totals: report.totals ?? null,
  modules: report.modules ?? {},
  survivedMutants: (report.mutants ?? []).filter((mutant) => mutant.status === 'Survived'),
};

writeJson(outputPath, summary);
console.log(`Mutation summary written to ${outputPath}`);
