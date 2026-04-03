import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { type QaSummary } from './reporting';

const repoRoot = path.resolve(__dirname, '../../..');
const qaSummaryPath = path.join(repoRoot, '.tmp', 'qa', 'qa-summary.json');

if (!existsSync(qaSummaryPath)) {
  console.error(`QA summary not found at ${qaSummaryPath}. Run qa:summary first.`);
  process.exit(1);
}

const summary = JSON.parse(readFileSync(qaSummaryPath, 'utf-8')) as QaSummary;
const failedGates = summary.gates.filter((gate) => !gate.passed);

for (const gate of summary.gates) {
  const status = gate.passed ? 'PASS' : 'FAIL';
  console.log(
    `${status} ${gate.id} ${gate.metric}: actual=${gate.actual} threshold=${gate.threshold}`,
  );
}

if (failedGates.length > 0) {
  console.error(`Quality gate check failed: ${failedGates.map((gate) => gate.id).join(', ')}`);
  process.exit(1);
}

console.log('All quality gates passed.');
