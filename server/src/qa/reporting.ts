import path from 'node:path';

export interface MetricValue {
  covered: number;
  pct: number;
  total: number;
}

export interface CoverageSummary {
  branches: MetricValue;
  functions: MetricValue;
  lines: MetricValue;
  statements: MetricValue;
}

export type CoverageFileSummary = CoverageSummary;

export interface RiskModuleCoverageSummary extends CoverageSummary {
  lowBranchCoverage: boolean;
  lowLineCoverage: boolean;
  sourceFiles: string[];
}

export interface ScenarioSummary {
  durationMs: number;
  file: string;
  name: string;
  status: 'failed' | 'flaky' | 'passed' | 'skipped';
}

export interface FileSummary {
  durationMs: number;
  failed: number;
  file: string;
  flaky: number;
  passed: number;
  skipped: number;
  total: number;
}

export interface ExecutionSummary {
  durationMs: number;
  failed: number;
  files: FileSummary[];
  flaky: number;
  passed: number;
  scenarios: ScenarioSummary[];
  skipped: number;
  total: number;
}

export interface RiskModuleSummary {
  apiCovered: boolean;
  automationCoveragePct: number;
  coverage: RiskModuleCoverageSummary;
  e2eCovered: boolean;
  evidence: string[];
  id: string;
  name: string;
  priority: 'P1' | 'P2';
}

export interface AutomationCoverageSummary {
  automatedModules: number;
  p1CoveragePct: number;
  totalModules: number;
  totalPct: number;
}

export interface QualityGateResult {
  actual: number;
  id: string;
  metric: string;
  passed: boolean;
  threshold: number;
}

export interface QaSummary {
  api: ExecutionSummary;
  artifacts: {
    coverageSummary: string;
    playwrightReport: string;
    qaSummary: string;
    vitestReport: string;
  };
  automationCoverage: AutomationCoverageSummary;
  coverage: CoverageSummary;
  e2e: ExecutionSummary;
  gates: QualityGateResult[];
  generatedAt: string;
  riskModules: RiskModuleSummary[];
}

export type CoverageSummaryJson = Record<string, CoverageFileSummary | undefined> & {
  total: CoverageFileSummary;
};

export interface VitestJsonReport {
  numFailedTests: number;
  numPassedTests: number;
  numPendingTests: number;
  numTotalTests: number;
  testResults: Array<{
    assertionResults: Array<{
      duration?: number;
      fullName: string;
      status: 'failed' | 'passed' | 'pending' | 'skipped' | 'todo';
    }>;
    endTime: number;
    name: string;
    startTime: number;
  }>;
}

interface PlaywrightJsonResult {
  duration: number;
}

interface PlaywrightJsonTest {
  results: PlaywrightJsonResult[];
  status: 'expected' | 'flaky' | 'skipped' | 'unexpected';
}

interface PlaywrightJsonSpec {
  file: string;
  tests: PlaywrightJsonTest[];
  title: string;
}

interface PlaywrightJsonSuite {
  file?: string;
  specs?: PlaywrightJsonSpec[];
  suites?: PlaywrightJsonSuite[];
  title: string;
}

export interface PlaywrightJsonReport {
  stats: {
    duration: number;
    expected: number;
    flaky: number;
    skipped: number;
    unexpected: number;
  };
  suites: PlaywrightJsonSuite[];
}

export const qaQualityGateThresholds = {
  api: {
    maxFailedTests: 0,
  },
  coverage: {
    lines: 80,
    statements: 80,
  },
  e2e: {
    maxFailedTests: 0,
    maxFlakyTests: 0,
  },
  risk: {
    minP1AutomationCoveragePct: 100,
  },
} as const;

const riskModuleDefinitions = [
  {
    apiFiles: ['server/src/test/auth.integration.test.ts'],
    e2eNameFragments: ['registers admin', 'creates draft then publish'],
    id: 'C1',
    name: 'Authentication and session lifecycle',
    priority: 'P1',
    sourceFiles: [
      'server/src/controllers/auth.controller.ts',
      'server/src/middleware/authenticate.ts',
      'server/src/middleware/security.ts',
      'server/src/services/auth.service.ts',
    ],
  },
  {
    apiFiles: [
      'server/src/test/profile-admin.integration.test.ts',
      'server/src/test/editorial.integration.test.ts',
    ],
    e2eNameFragments: ['taxonomy', 'review reports queue'],
    id: 'C2',
    name: 'Authorization and admin moderation',
    priority: 'P1',
    sourceFiles: [
      'server/src/controllers/admin.controller.ts',
      'server/src/controllers/report.controller.ts',
      'server/src/controllers/taxonomy.controller.ts',
      'server/src/services/report.service.ts',
      'server/src/services/taxonomy.service.ts',
      'server/src/services/user.service.ts',
    ],
  },
  {
    apiFiles: [
      'server/src/test/blog.integration.test.ts',
      'server/src/test/editorial.integration.test.ts',
    ],
    e2eNameFragments: [
      'creates draft then publish',
      'bookmark and report post/comment',
      'review reports queue',
    ],
    id: 'C3',
    name: 'Content integrity and moderation workflow',
    priority: 'P1',
    sourceFiles: [
      'server/src/controllers/post.controller.ts',
      'server/src/controllers/comment.controller.ts',
      'server/src/controllers/like.controller.ts',
      'server/src/controllers/report.controller.ts',
      'server/src/services/blog.service.ts',
      'server/src/services/report.service.ts',
    ],
  },
  {
    apiFiles: ['server/src/test/profile-admin.integration.test.ts'],
    e2eNameFragments: [],
    id: 'C4',
    name: 'Profile management and avatar uploads',
    priority: 'P2',
    sourceFiles: [
      'server/src/controllers/profile.controller.ts',
      'server/src/middleware/upload.ts',
      'server/src/services/user.service.ts',
    ],
  },
  {
    apiFiles: ['server/src/test/editorial.integration.test.ts'],
    e2eNameFragments: ['bookmark and report post/comment'],
    id: 'C5',
    name: 'Public browsing and discovery flows',
    priority: 'P2',
    sourceFiles: [
      'server/src/controllers/post.controller.ts',
      'server/src/services/blog.service.ts',
    ],
  },
] as const;

const riskModuleCoverageThresholds = {
  branches: 70,
  lines: 70,
} as const;

const coverageMetricKeys = ['branches', 'functions', 'lines', 'statements'] as const;

const toPosixPath = (value: string) => value.replaceAll('\\', '/');

const normalizeFilePath = (repoRoot: string, filePath: string) => {
  if (!filePath) {
    return '';
  }

  const relativePath = path.isAbsolute(filePath) ? path.relative(repoRoot, filePath) : filePath;
  return toPosixPath(relativePath);
};

const roundPct = (covered: number, total: number) =>
  total === 0 ? 0 : Number(((covered / total) * 100).toFixed(2));

const buildMetricValue = (covered: number, total: number): MetricValue => ({
  covered,
  pct: roundPct(covered, total),
  total,
});

const createZeroCoverageSummary = (): CoverageSummary => ({
  branches: buildMetricValue(0, 0),
  functions: buildMetricValue(0, 0),
  lines: buildMetricValue(0, 0),
  statements: buildMetricValue(0, 0),
});

const normalizeCoverageEntries = (report: CoverageSummaryJson, repoRoot: string) => {
  const entries = new Map<string, CoverageFileSummary>();

  for (const [filePath, fileSummary] of Object.entries(report)) {
    if (filePath === 'total' || !fileSummary) {
      continue;
    }

    entries.set(normalizeFilePath(repoRoot, filePath), fileSummary);
  }

  return entries;
};

const summarizeRiskModuleCoverage = (
  definition: (typeof riskModuleDefinitions)[number],
  report: CoverageSummaryJson,
  repoRoot: string,
): RiskModuleCoverageSummary => {
  const coverageEntries = normalizeCoverageEntries(report, repoRoot);
  const totals = createZeroCoverageSummary();

  for (const sourceFile of definition.sourceFiles) {
    const fileCoverage = coverageEntries.get(sourceFile);

    if (!fileCoverage) {
      continue;
    }

    for (const metricKey of coverageMetricKeys) {
      totals[metricKey] = buildMetricValue(
        totals[metricKey].covered + fileCoverage[metricKey].covered,
        totals[metricKey].total + fileCoverage[metricKey].total,
      );
    }
  }

  return {
    ...totals,
    lowBranchCoverage: totals.branches.pct < riskModuleCoverageThresholds.branches,
    lowLineCoverage: totals.lines.pct < riskModuleCoverageThresholds.lines,
    sourceFiles: [...definition.sourceFiles],
  };
};

const summarizeScenarioStatuses = (
  scenarios: ScenarioSummary[],
): Pick<ExecutionSummary, 'failed' | 'flaky' | 'passed' | 'skipped' | 'total'> => ({
  failed: scenarios.filter((scenario) => scenario.status === 'failed').length,
  flaky: scenarios.filter((scenario) => scenario.status === 'flaky').length,
  passed: scenarios.filter((scenario) => scenario.status === 'passed').length,
  skipped: scenarios.filter((scenario) => scenario.status === 'skipped').length,
  total: scenarios.length,
});

const mapVitestStatus = (
  status: VitestJsonReport['testResults'][number]['assertionResults'][number]['status'],
): ScenarioSummary['status'] => {
  switch (status) {
    case 'failed':
      return 'failed';
    case 'passed':
      return 'passed';
    default:
      return 'skipped';
  }
};

const mapPlaywrightStatus = (status: PlaywrightJsonTest['status']): ScenarioSummary['status'] => {
  switch (status) {
    case 'unexpected':
      return 'failed';
    case 'flaky':
      return 'flaky';
    case 'expected':
      return 'passed';
    default:
      return 'skipped';
  }
};

const collectPlaywrightSpecs = (
  suites: PlaywrightJsonSuite[],
  parentTitles: string[] = [],
): Array<{ file: string; titlePath: string[]; tests: PlaywrightJsonTest[] }> => {
  const specs: Array<{ file: string; titlePath: string[]; tests: PlaywrightJsonTest[] }> = [];

  for (const suite of suites) {
    const suiteTitles = suite.title ? [...parentTitles, suite.title] : parentTitles;

    for (const spec of suite.specs ?? []) {
      specs.push({
        file: spec.file,
        tests: spec.tests,
        titlePath: [...suiteTitles, spec.title].filter(Boolean),
      });
    }

    specs.push(...collectPlaywrightSpecs(suite.suites ?? [], suiteTitles));
  }

  return specs;
};

const summarizeRiskModules = (
  apiSummary: ExecutionSummary,
  e2eSummary: ExecutionSummary,
  coverageReport: CoverageSummaryJson,
  repoRoot: string,
): RiskModuleSummary[] => {
  const apiFiles = new Set(apiSummary.files.map((file) => file.file));
  const e2eScenarioNames = e2eSummary.scenarios.map((scenario) => scenario.name.toLowerCase());

  return riskModuleDefinitions.map((definition) => {
    const apiCovered = definition.apiFiles.some((file) => apiFiles.has(file));
    const matchedE2eFragments = definition.e2eNameFragments.filter((fragment) =>
      e2eScenarioNames.some((scenarioName) => scenarioName.includes(fragment.toLowerCase())),
    );
    const e2eCovered = matchedE2eFragments.length > 0;
    const coveredLayers = Number(apiCovered) + Number(e2eCovered);
    const evidence = [
      ...definition.apiFiles.filter((file) => apiFiles.has(file)),
      ...matchedE2eFragments.map((fragment) => `e2e:${fragment}`),
    ];

    return {
      apiCovered,
      automationCoveragePct: coveredLayers === 0 ? 0 : apiCovered && e2eCovered ? 100 : 50,
      coverage: summarizeRiskModuleCoverage(definition, coverageReport, repoRoot),
      e2eCovered,
      evidence,
      id: definition.id,
      name: definition.name,
      priority: definition.priority,
    };
  });
};

const summarizeAutomationCoverage = (
  riskModules: RiskModuleSummary[],
): AutomationCoverageSummary => {
  const automatedModules = riskModules.filter(
    (moduleSummary) => moduleSummary.apiCovered || moduleSummary.e2eCovered,
  ).length;
  const p1Modules = riskModules.filter((moduleSummary) => moduleSummary.priority === 'P1');
  const automatedP1Modules = p1Modules.filter(
    (moduleSummary) => moduleSummary.apiCovered || moduleSummary.e2eCovered,
  ).length;

  return {
    automatedModules,
    p1CoveragePct: p1Modules.length === 0 ? 0 : (automatedP1Modules / p1Modules.length) * 100,
    totalModules: riskModules.length,
    totalPct: riskModules.length === 0 ? 0 : (automatedModules / riskModules.length) * 100,
  };
};

export const summarizeCoverageReport = (report: CoverageSummaryJson): CoverageSummary => ({
  branches: report.total.branches,
  functions: report.total.functions,
  lines: report.total.lines,
  statements: report.total.statements,
});

export const summarizeVitestReport = (
  report: VitestJsonReport,
  repoRoot: string,
): ExecutionSummary => {
  const files = report.testResults.map((fileResult) => {
    const scenarios = fileResult.assertionResults.map((assertionResult) => ({
      durationMs: assertionResult.duration ?? 0,
      file: normalizeFilePath(repoRoot, fileResult.name),
      name: assertionResult.fullName,
      status: mapVitestStatus(assertionResult.status),
    }));
    const statusSummary = summarizeScenarioStatuses(scenarios);

    return {
      durationMs: Math.max(fileResult.endTime - fileResult.startTime, 0),
      file: normalizeFilePath(repoRoot, fileResult.name),
      ...statusSummary,
    };
  });

  const scenarios = files.flatMap(
    (fileSummary) =>
      report.testResults
        .find((fileResult) => normalizeFilePath(repoRoot, fileResult.name) === fileSummary.file)
        ?.assertionResults.map((assertionResult) => ({
          durationMs: assertionResult.duration ?? 0,
          file: fileSummary.file,
          name: assertionResult.fullName,
          status: mapVitestStatus(assertionResult.status),
        })) ?? [],
  );
  const statusSummary = summarizeScenarioStatuses(scenarios);

  return {
    durationMs: files.reduce(
      (totalDuration, fileSummary) => totalDuration + fileSummary.durationMs,
      0,
    ),
    files,
    scenarios,
    ...statusSummary,
  };
};

export const summarizePlaywrightReport = (report: PlaywrightJsonReport): ExecutionSummary => {
  const specs = collectPlaywrightSpecs(report.suites);
  const scenarios = specs.flatMap((spec) =>
    spec.tests.map((testEntry) => ({
      durationMs: testEntry.results.reduce(
        (totalDuration, result) => totalDuration + result.duration,
        0,
      ),
      file: toPosixPath(spec.file),
      name: spec.titlePath.join(' > '),
      status: mapPlaywrightStatus(testEntry.status),
    })),
  );

  const filesMap = new Map<string, ScenarioSummary[]>();

  for (const scenario of scenarios) {
    const fileScenarios = filesMap.get(scenario.file) ?? [];
    fileScenarios.push(scenario);
    filesMap.set(scenario.file, fileScenarios);
  }

  const files = Array.from(filesMap.entries()).map(([file, fileScenarios]) => ({
    durationMs: fileScenarios.reduce(
      (totalDuration, scenario) => totalDuration + scenario.durationMs,
      0,
    ),
    file,
    ...summarizeScenarioStatuses(fileScenarios),
  }));
  const statusSummary = summarizeScenarioStatuses(scenarios);

  return {
    durationMs: report.stats.duration,
    files,
    scenarios,
    ...statusSummary,
  };
};

export const evaluateQualityGates = (
  summary: Pick<QaSummary, 'api' | 'automationCoverage' | 'coverage' | 'e2e'>,
): QualityGateResult[] => [
  {
    actual: summary.coverage.statements.pct,
    id: 'QG01',
    metric: 'backend statement coverage',
    passed: summary.coverage.statements.pct >= qaQualityGateThresholds.coverage.statements,
    threshold: qaQualityGateThresholds.coverage.statements,
  },
  {
    actual: summary.coverage.lines.pct,
    id: 'QG02',
    metric: 'backend line coverage',
    passed: summary.coverage.lines.pct >= qaQualityGateThresholds.coverage.lines,
    threshold: qaQualityGateThresholds.coverage.lines,
  },
  {
    actual: summary.api.failed,
    id: 'QG03',
    metric: 'api failed tests',
    passed: summary.api.failed <= qaQualityGateThresholds.api.maxFailedTests,
    threshold: qaQualityGateThresholds.api.maxFailedTests,
  },
  {
    actual: summary.e2e.failed + summary.e2e.flaky,
    id: 'QG04',
    metric: 'e2e failed or flaky tests',
    passed:
      summary.e2e.failed <= qaQualityGateThresholds.e2e.maxFailedTests &&
      summary.e2e.flaky <= qaQualityGateThresholds.e2e.maxFlakyTests,
    threshold:
      qaQualityGateThresholds.e2e.maxFailedTests + qaQualityGateThresholds.e2e.maxFlakyTests,
  },
  {
    actual: summary.automationCoverage.p1CoveragePct,
    id: 'QG05',
    metric: 'p1 automation coverage',
    passed:
      summary.automationCoverage.p1CoveragePct >=
      qaQualityGateThresholds.risk.minP1AutomationCoveragePct,
    threshold: qaQualityGateThresholds.risk.minP1AutomationCoveragePct,
  },
];

export const buildQaSummary = (input: {
  coverageReport: CoverageSummaryJson;
  playwrightReport: PlaywrightJsonReport;
  repoRoot: string;
  vitestReport: VitestJsonReport;
}): QaSummary => {
  const coverage = summarizeCoverageReport(input.coverageReport);
  const api = summarizeVitestReport(input.vitestReport, input.repoRoot);
  const e2e = summarizePlaywrightReport(input.playwrightReport);
  const riskModules = summarizeRiskModules(api, e2e, input.coverageReport, input.repoRoot);
  const automationCoverage = summarizeAutomationCoverage(riskModules);

  const artifacts = {
    coverageSummary: 'server/coverage/coverage-summary.json',
    playwrightReport: '.tmp/qa/playwright-report.json',
    qaSummary: '.tmp/qa/qa-summary.json',
    vitestReport: '.tmp/qa/vitest-report.json',
  };

  const summary: QaSummary = {
    api,
    artifacts,
    automationCoverage,
    coverage,
    e2e,
    gates: [],
    generatedAt: new Date().toISOString(),
    riskModules,
  };

  summary.gates = evaluateQualityGates(summary);

  return summary;
};
