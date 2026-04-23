import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { ensureDir, experimentalRoot, timestamp, writeJson } from '../common/artifacts';

type ScenarioProfile = 'smoke' | 'full';
type ScenarioName = 'normal' | 'peak' | 'spike' | 'endurance';

interface ScenarioConfig {
  name: ScenarioName;
  concurrency: number;
  durationSeconds: number;
  rampUpSeconds: number;
}

interface EndpointConfig {
  module: 'auth' | 'authorization' | 'content';
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
  requiresUserToken?: boolean;
  requiresAdminToken?: boolean;
}

const baseUrl = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:4000';
const scenarioProfile: ScenarioProfile = process.env.PERF_PROFILE === 'full' ? 'full' : 'smoke';
const outputDirectory = ensureDir(path.join(experimentalRoot, 'performance'));

const userEmail = process.env.PERF_USER_EMAIL ?? 'user@example.com';
const adminEmail = process.env.PERF_ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.PERF_PASSWORD ?? 'Password123!';

const scenarioThresholds = {
  baseline: {
    errorRatePercentMax: Number(process.env.PERF_THRESHOLD_ERROR_RATE_MAX ?? 2),
    p95MsMax: Number(process.env.PERF_THRESHOLD_P95_MS_MAX ?? 800),
  },
};

const scenarioConfigs: Record<ScenarioProfile, ScenarioConfig[]> = {
  smoke: [
    {
      name: 'normal',
      concurrency: Number(process.env.PERF_NORMAL_CONCURRENCY ?? 6),
      durationSeconds: Number(process.env.PERF_NORMAL_DURATION_SECONDS ?? 15),
      rampUpSeconds: Number(process.env.PERF_NORMAL_RAMP_UP_SECONDS ?? 4),
    },
  ],
  full: [
    {
      name: 'normal',
      concurrency: Number(process.env.PERF_NORMAL_CONCURRENCY ?? 8),
      durationSeconds: Number(process.env.PERF_NORMAL_DURATION_SECONDS ?? 20),
      rampUpSeconds: Number(process.env.PERF_NORMAL_RAMP_UP_SECONDS ?? 5),
    },
    {
      name: 'peak',
      concurrency: Number(process.env.PERF_PEAK_CONCURRENCY ?? 20),
      durationSeconds: Number(process.env.PERF_PEAK_DURATION_SECONDS ?? 25),
      rampUpSeconds: Number(process.env.PERF_PEAK_RAMP_UP_SECONDS ?? 6),
    },
    {
      name: 'spike',
      concurrency: Number(process.env.PERF_SPIKE_CONCURRENCY ?? 30),
      durationSeconds: Number(process.env.PERF_SPIKE_DURATION_SECONDS ?? 12),
      rampUpSeconds: Number(process.env.PERF_SPIKE_RAMP_UP_SECONDS ?? 1),
    },
    {
      name: 'endurance',
      concurrency: Number(process.env.PERF_ENDURANCE_CONCURRENCY ?? 10),
      durationSeconds: Number(process.env.PERF_ENDURANCE_DURATION_SECONDS ?? 60),
      rampUpSeconds: Number(process.env.PERF_ENDURANCE_RAMP_UP_SECONDS ?? 8),
    },
  ],
};

const endpoints: EndpointConfig[] = [
  {
    module: 'auth',
    name: 'auth_login',
    method: 'POST',
    path: '/api/auth/login',
    body: { email: userEmail, password },
  },
  {
    module: 'auth',
    name: 'auth_me',
    method: 'GET',
    path: '/api/auth/me',
    requiresUserToken: true,
  },
  {
    module: 'authorization',
    name: 'admin_reports_list',
    method: 'GET',
    path: '/api/admin/reports',
    requiresAdminToken: true,
  },
  {
    module: 'content',
    name: 'posts_list',
    method: 'GET',
    path: '/api/posts',
  },
  {
    module: 'content',
    name: 'workspace_posts',
    method: 'GET',
    path: '/api/workspace/posts',
    requiresUserToken: true,
  },
];

const sampleSystemUsage = () => ({
  cpuLoad1m: os.loadavg()[0],
  cpuLoad5m: os.loadavg()[1],
  freeMemoryBytes: os.freemem(),
  totalMemoryBytes: os.totalmem(),
  rssBytes: process.memoryUsage().rss,
  timestamp: new Date().toISOString(),
});

const login = async (email: string) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Unable to log in ${email}. Status: ${response.status}`);
  }

  const body = (await response.json()) as { accessToken: string };

  if (!body.accessToken) {
    throw new Error(`Login for ${email} did not return an accessToken`);
  }

  return body.accessToken;
};

const percentile = (values: number[], p: number) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
};

const mean = (values: number[]) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const runScenario = async ({
  endpoint,
  scenario,
  tokens,
}: {
  endpoint: EndpointConfig;
  scenario: ScenarioConfig;
  tokens: { userToken: string; adminToken: string };
}) => {
  const latencySamples: number[] = [];
  let requests = 0;
  let failures = 0;
  const startedAt = Date.now();
  const endsAt = startedAt + scenario.durationSeconds * 1000;

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (endpoint.body) {
    headers['content-type'] = 'application/json';
  }

  if (endpoint.requiresUserToken) {
    headers.authorization = `Bearer ${tokens.userToken}`;
  }

  if (endpoint.requiresAdminToken) {
    headers.authorization = `Bearer ${tokens.adminToken}`;
  }

  const systemSamples: ReturnType<typeof sampleSystemUsage>[] = [];
  const monitor = setInterval(() => {
    systemSamples.push(sampleSystemUsage());
  }, 1000);

  const worker = async () => {
    while (Date.now() < endsAt) {
      const requestStart = Date.now();
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        });

        const elapsed = Date.now() - requestStart;
        requests += 1;
        latencySamples.push(elapsed);

        if (!response.ok) {
          failures += 1;
        }
      } catch {
        const elapsed = Date.now() - requestStart;
        requests += 1;
        failures += 1;
        latencySamples.push(elapsed);
      }
    }
  };

  const workers = Array.from({ length: scenario.concurrency }, async (_value, index) => {
    const delayPerWorkerMs = Math.floor(
      (scenario.rampUpSeconds * 1000 * index) / scenario.concurrency,
    );
    if (delayPerWorkerMs > 0) {
      await sleep(delayPerWorkerMs);
    }
    await worker();
  });

  await Promise.all(workers);
  clearInterval(monitor);

  const elapsedSeconds = Math.max(1, (Date.now() - startedAt) / 1000);
  const avgLatencyMs = mean(latencySamples);
  const medianLatencyMs = percentile(latencySamples, 50);
  const p95LatencyMs = percentile(latencySamples, 95);
  const throughputRps = requests / elapsedSeconds;
  const errorRatePercent = Number(((failures / Math.max(1, requests)) * 100).toFixed(3));

  return {
    module: endpoint.module,
    endpoint: endpoint.name,
    path: endpoint.path,
    scenario: scenario.name,
    method: endpoint.method,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date().toISOString(),
    executionParameters: scenario,
    metrics: {
      averageLatencyMs: Number(avgLatencyMs.toFixed(2)),
      medianLatencyMs: Number(medianLatencyMs.toFixed(2)),
      p95LatencyMs: Number(p95LatencyMs.toFixed(2)),
      throughputRps: Number(throughputRps.toFixed(2)),
      totalRequests: requests,
      totalErrors: failures,
      errorRatePercent,
    },
    thresholds: scenarioThresholds.baseline,
    thresholdPass: {
      errorRate: errorRatePercent <= scenarioThresholds.baseline.errorRatePercentMax,
      p95: p95LatencyMs <= scenarioThresholds.baseline.p95MsMax,
    },
    systemUsageSamples: systemSamples,
  };
};

const run = async () => {
  const runId = timestamp();
  const runDirectory = ensureDir(path.join(outputDirectory, runId));

  const [userToken, adminToken] = await Promise.all([login(userEmail), login(adminEmail)]);
  const results = [] as Awaited<ReturnType<typeof runScenario>>[];

  for (const scenario of scenarioConfigs[scenarioProfile]) {
    for (const endpoint of endpoints) {
      results.push(
        await runScenario({
          endpoint,
          scenario,
          tokens: { userToken, adminToken },
        }),
      );
    }
  }

  const rawPath = path.join(runDirectory, 'performance-raw.json');
  writeJson(rawPath, {
    meta: {
      runId,
      scenarioProfile,
      baseUrl,
      thresholds: scenarioThresholds.baseline,
      generatedAt: new Date().toISOString(),
    },
    parameters: {
      scenarios: scenarioConfigs[scenarioProfile],
      endpoints,
    },
    results,
  });

  const summaryPath = path.join(runDirectory, 'performance-summary.json');
  writeJson(summaryPath, {
    runId,
    scenarioProfile,
    generatedAt: new Date().toISOString(),
    summary: results.map((entry) => ({
      endpoint: entry.endpoint,
      module: entry.module,
      scenario: entry.scenario,
      averageLatencyMs: entry.metrics.averageLatencyMs,
      medianLatencyMs: entry.metrics.medianLatencyMs,
      p95LatencyMs: entry.metrics.p95LatencyMs,
      throughputRps: entry.metrics.throughputRps,
      errorRatePercent: entry.metrics.errorRatePercent,
      thresholdPass: entry.thresholdPass,
    })),
  });

  const latestPath = path.join(outputDirectory, 'latest-performance-run.json');
  writeJson(latestPath, { runId, rawPath, summaryPath });

  console.log(`Performance run complete: ${runDirectory}`);
};

void run().catch((error) => {
  console.error('Performance run failed', error);
  process.exitCode = 1;
});
