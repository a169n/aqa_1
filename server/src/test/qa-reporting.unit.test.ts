import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildQaSummary,
  evaluateQualityGates,
  qaQualityGateThresholds,
  summarizeCoverageReport,
  summarizePlaywrightReport,
  summarizeVitestReport,
  type CoverageSummaryJson,
  type PlaywrightJsonReport,
  type VitestJsonReport,
} from '../qa/reporting';

const repoRoot = path.resolve(__dirname, '../../..');

const coverageSummaryFixture: CoverageSummaryJson = {
  total: {
    branches: { covered: 18, pct: 81.81, total: 22 },
    functions: { covered: 50, pct: 86.2, total: 58 },
    lines: { covered: 416, pct: 83.2, total: 500 },
    statements: { covered: 420, pct: 84, total: 500 },
  },
};

const vitestReportFixture: VitestJsonReport = {
  numFailedTests: 0,
  numPassedTests: 4,
  numPendingTests: 0,
  numTotalTests: 4,
  testResults: [
    {
      assertionResults: [
        {
          duration: 10,
          fullName:
            'Auth API promotes the first registered user to admin and returns a valid session',
          status: 'passed',
        },
        {
          duration: 8,
          fullName: 'Auth API rejects duplicate registration attempts with 409',
          status: 'passed',
        },
      ],
      endTime: 18,
      name: path.join(repoRoot, 'server', 'src', 'test', 'auth.integration.test.ts'),
      startTime: 0,
    },
    {
      assertionResults: [
        {
          duration: 11,
          fullName:
            'Editorial workspace API supports draft -> publish -> archive -> restore workflow',
          status: 'passed',
        },
        {
          duration: 7,
          fullName:
            'Profile and admin API uploads a valid avatar and persists the returned file path',
          status: 'passed',
        },
      ],
      endTime: 18,
      name: path.join(repoRoot, 'server', 'src', 'test', 'editorial.integration.test.ts'),
      startTime: 0,
    },
  ],
};

const playwrightReportFixture: PlaywrightJsonReport = {
  stats: {
    duration: 240,
    expected: 3,
    flaky: 0,
    skipped: 0,
    unexpected: 0,
  },
  suites: [
    {
      file: 'tests/e2e/smoke.spec.ts',
      specs: [
        {
          file: 'tests/e2e/smoke.spec.ts',
          tests: [{ results: [{ duration: 100 }], status: 'expected' }],
          title: 'registers admin and creates category/tag in taxonomy',
        },
        {
          file: 'tests/e2e/smoke.spec.ts',
          tests: [{ results: [{ duration: 80 }], status: 'expected' }],
          title: 'creates draft then publish/archive/restore from workspace',
        },
        {
          file: 'tests/e2e/smoke.spec.ts',
          tests: [{ results: [{ duration: 60 }], status: 'expected' }],
          title: 'admin can review reports queue',
        },
      ],
      title: 'tests/e2e/smoke.spec.ts',
    },
  ],
};

describe('qa reporting', () => {
  it('summarizes vitest, playwright, and coverage inputs into a single QA summary', () => {
    const summary = buildQaSummary({
      coverageReport: coverageSummaryFixture,
      playwrightReport: playwrightReportFixture,
      repoRoot,
      vitestReport: vitestReportFixture,
    });

    expect(summary.coverage).toEqual(summarizeCoverageReport(coverageSummaryFixture));
    expect(summary.api).toEqual(summarizeVitestReport(vitestReportFixture, repoRoot));
    expect(summary.e2e).toEqual(summarizePlaywrightReport(playwrightReportFixture));
    expect(summary.automationCoverage.p1CoveragePct).toBe(100);
    expect(summary.riskModules.find((moduleSummary) => moduleSummary.id === 'C4')).toMatchObject({
      apiCovered: false,
      automationCoveragePct: 0,
      e2eCovered: false,
    });
    expect(summary.riskModules.find((moduleSummary) => moduleSummary.id === 'C1')).toMatchObject({
      apiCovered: true,
      e2eCovered: true,
    });
  });

  it('fails quality gates when coverage or execution outcomes fall below thresholds', () => {
    const summary = buildQaSummary({
      coverageReport: {
        total: {
          branches: { covered: 18, pct: 81.81, total: 22 },
          functions: { covered: 50, pct: 86.2, total: 58 },
          lines: { covered: 350, pct: 70, total: 500 },
          statements: { covered: 350, pct: 70, total: 500 },
        },
      },
      playwrightReport: {
        ...playwrightReportFixture,
        stats: { ...playwrightReportFixture.stats, expected: 2, unexpected: 1 },
        suites: [
          {
            file: 'tests/e2e/smoke.spec.ts',
            specs: [
              {
                file: 'tests/e2e/smoke.spec.ts',
                tests: [{ results: [{ duration: 90 }], status: 'unexpected' }],
                title: 'registers admin and creates category/tag in taxonomy',
              },
            ],
            title: 'tests/e2e/smoke.spec.ts',
          },
        ],
      },
      repoRoot,
      vitestReport: {
        ...vitestReportFixture,
        numFailedTests: 1,
        numPassedTests: 1,
        numTotalTests: 2,
        testResults: [
          {
            assertionResults: [
              {
                duration: 10,
                fullName: 'Auth API rejects invalid login credentials with 401',
                status: 'failed',
              },
            ],
            endTime: 10,
            name: path.join(repoRoot, 'server', 'src', 'test', 'auth.integration.test.ts'),
            startTime: 0,
          },
        ],
      },
    });

    const failedGateIds = evaluateQualityGates(summary)
      .filter((gate) => !gate.passed)
      .map((gate) => gate.id);

    expect(failedGateIds).toEqual(['QG01', 'QG02', 'QG03', 'QG04', 'QG05']);
    expect(summary.gates.find((gate) => gate.id === 'QG01')?.threshold).toBe(
      qaQualityGateThresholds.coverage.statements,
    );
  });
});
