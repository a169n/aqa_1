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
  [path.join(repoRoot, 'server', 'src', 'controllers', 'auth.controller.ts')]: {
    branches: { covered: 2, pct: 50, total: 4 },
    functions: { covered: 6, pct: 100, total: 6 },
    lines: { covered: 19, pct: 100, total: 19 },
    statements: { covered: 20, pct: 100, total: 20 },
  },
  [path.join(repoRoot, 'server', 'src', 'middleware', 'authenticate.ts')]: {
    branches: { covered: 13, pct: 92.85, total: 14 },
    functions: { covered: 5, pct: 100, total: 5 },
    lines: { covered: 31, pct: 93.93, total: 33 },
    statements: { covered: 31, pct: 93.93, total: 33 },
  },
  [path.join(repoRoot, 'server', 'src', 'middleware', 'security.ts')]: {
    branches: { covered: 13, pct: 68.42, total: 19 },
    functions: { covered: 7, pct: 100, total: 7 },
    lines: { covered: 40, pct: 95.23, total: 42 },
    statements: { covered: 40, pct: 95.23, total: 42 },
  },
  [path.join(repoRoot, 'server', 'src', 'services', 'auth.service.ts')]: {
    branches: { covered: 20, pct: 74.07, total: 27 },
    functions: { covered: 9, pct: 100, total: 9 },
    lines: { covered: 47, pct: 87.03, total: 54 },
    statements: { covered: 49, pct: 87.5, total: 56 },
  },
  [path.join(repoRoot, 'server', 'src', 'controllers', 'post.controller.ts')]: {
    branches: { covered: 9, pct: 75, total: 12 },
    functions: { covered: 10, pct: 83.33, total: 12 },
    lines: { covered: 23, pct: 88.46, total: 26 },
    statements: { covered: 23, pct: 88.46, total: 26 },
  },
  [path.join(repoRoot, 'server', 'src', 'controllers', 'comment.controller.ts')]: {
    branches: { covered: 0, pct: 100, total: 0 },
    functions: { covered: 2, pct: 100, total: 2 },
    lines: { covered: 4, pct: 80, total: 5 },
    statements: { covered: 4, pct: 80, total: 5 },
  },
  [path.join(repoRoot, 'server', 'src', 'controllers', 'like.controller.ts')]: {
    branches: { covered: 0, pct: 100, total: 0 },
    functions: { covered: 2, pct: 100, total: 2 },
    lines: { covered: 5, pct: 100, total: 5 },
    statements: { covered: 5, pct: 100, total: 5 },
  },
  [path.join(repoRoot, 'server', 'src', 'controllers', 'report.controller.ts')]: {
    branches: { covered: 1, pct: 50, total: 2 },
    functions: { covered: 3, pct: 100, total: 3 },
    lines: { covered: 6, pct: 100, total: 6 },
    statements: { covered: 6, pct: 100, total: 6 },
  },
  [path.join(repoRoot, 'server', 'src', 'controllers', 'profile.controller.ts')]: {
    branches: { covered: 2, pct: 100, total: 2 },
    functions: { covered: 3, pct: 100, total: 3 },
    lines: { covered: 9, pct: 100, total: 9 },
    statements: { covered: 9, pct: 100, total: 9 },
  },
  [path.join(repoRoot, 'server', 'src', 'middleware', 'upload.ts')]: {
    branches: { covered: 3, pct: 75, total: 4 },
    functions: { covered: 3, pct: 100, total: 3 },
    lines: { covered: 12, pct: 100, total: 12 },
    statements: { covered: 12, pct: 100, total: 12 },
  },
  [path.join(repoRoot, 'server', 'src', 'services', 'blog.service.ts')]: {
    branches: { covered: 83, pct: 55.7, total: 149 },
    functions: { covered: 44, pct: 89.79, total: 49 },
    lines: { covered: 184, pct: 74.19, total: 248 },
    statements: { covered: 195, pct: 75, total: 260 },
  },
  [path.join(repoRoot, 'server', 'src', 'services', 'report.service.ts')]: {
    branches: { covered: 33, pct: 68.75, total: 48 },
    functions: { covered: 7, pct: 100, total: 7 },
    lines: { covered: 40, pct: 75.47, total: 53 },
    statements: { covered: 43, pct: 76.78, total: 56 },
  },
  [path.join(repoRoot, 'server', 'src', 'services', 'user.service.ts')]: {
    branches: { covered: 21, pct: 70, total: 30 },
    functions: { covered: 10, pct: 100, total: 10 },
    lines: { covered: 43, pct: 86, total: 50 },
    statements: { covered: 45, pct: 86.53, total: 52 },
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
      coverage: {
        lowLineCoverage: false,
      },
      e2eCovered: false,
    });
    expect(summary.riskModules.find((moduleSummary) => moduleSummary.id === 'C1')).toMatchObject({
      apiCovered: true,
      coverage: {
        lines: {
          pct: 92.57,
        },
        lowBranchCoverage: false,
      },
      e2eCovered: true,
    });
    expect(summary.riskModules.find((moduleSummary) => moduleSummary.id === 'C3')).toMatchObject({
      coverage: {
        branches: {
          pct: 59.72,
        },
        lowBranchCoverage: true,
        lowLineCoverage: false,
      },
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
