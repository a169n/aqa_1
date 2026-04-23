import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { ensureDir, experimentalRoot, timestamp, writeJson } from '../common/artifacts';
import { injectFault, restoreFault, type ChaosScenario } from './chaos-control';

const baseUrl = process.env.CHAOS_BASE_URL ?? 'http://127.0.0.1:4000';
const probePath = process.env.CHAOS_HEALTH_PATH ?? '/api/health';
const scenarioArg = (process.env.CHAOS_SCENARIO ?? 'all') as ChaosScenario | 'all';
const durationSeconds = Number(process.env.CHAOS_FAULT_DURATION_SECONDS ?? 20);
const probeIntervalMs = Number(process.env.CHAOS_PROBE_INTERVAL_MS ?? 1000);
const probeTimeoutMs = Number(process.env.CHAOS_PROBE_TIMEOUT_MS ?? 2000);
const dbProbePath = process.env.CHAOS_DB_PROBE_PATH ?? '/api/posts';
const networkProbePath = process.env.CHAOS_NETWORK_PROBE_PATH ?? '/api/posts';
const networkLatencyFailureMs = Number(process.env.CHAOS_NETWORK_LATENCY_FAILURE_MS ?? 300);

const scenarios: ChaosScenario[] =
  scenarioArg === 'all' ? ['api-downtime', 'db-unavailable', 'network-latency'] : [scenarioArg];

interface ProbeSample {
  timestamp: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
}

interface ScenarioProbeConfig {
  path: string;
  maxLatencyMs?: number;
}

const getProbeConfig = (scenario: ChaosScenario): ScenarioProbeConfig => {
  switch (scenario) {
    case 'api-downtime':
      return { path: probePath };
    case 'db-unavailable':
      return { path: dbProbePath };
    case 'network-latency':
      return {
        path: networkProbePath,
        maxLatencyMs: networkLatencyFailureMs,
      };
    default:
      return { path: probePath };
  }
};

const probeOnce = async (probeConfig: ScenarioProbeConfig): Promise<ProbeSample> => {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);

  try {
    const response = await fetch(`${baseUrl}${probeConfig.path}`, {
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    const latencyExceeded =
      typeof probeConfig.maxLatencyMs === 'number' && latencyMs > probeConfig.maxLatencyMs;

    return {
      timestamp: new Date().toISOString(),
      ok: response.ok && !latencyExceeded,
      status: response.status,
      latencyMs,
      error: latencyExceeded
        ? `Probe exceeded latency threshold ${probeConfig.maxLatencyMs}ms`
        : response.ok
          ? null
          : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error:
        error instanceof Error
          ? error.name === 'AbortError'
            ? `Probe timed out after ${probeTimeoutMs}ms`
            : error.message
          : 'unknown',
    };
  } finally {
    clearTimeout(timeout);
  }
};

const collectProbes = async (milliseconds: number, probeConfig: ScenarioProbeConfig) => {
  const samples: ProbeSample[] = [];
  const endAt = Date.now() + milliseconds;
  while (Date.now() < endAt) {
    samples.push(await probeOnce(probeConfig));
    await sleep(probeIntervalMs);
  }
  return samples;
};

const scenarioRun = async (scenario: ChaosScenario) => {
  const probeConfig = getProbeConfig(scenario);
  const preSamples = await collectProbes(Math.max(3000, probeIntervalMs * 3), probeConfig);
  const injectResult = injectFault(scenario);

  const duringSamples = injectResult.injected
    ? await collectProbes(durationSeconds * 1000, probeConfig)
    : await collectProbes(Math.max(3000, probeIntervalMs * 3), probeConfig);

  const restoredAt = Date.now();
  const restoreResult = restoreFault(scenario);
  const postSamples = await collectProbes(Math.max(5000, probeIntervalMs * 5), probeConfig);

  const combined = [...preSamples, ...duringSamples, ...postSamples];
  const failureSamples = combined.filter((sample) => !sample.ok);
  const availabilityPercent = Number(
    (((combined.length - failureSamples.length) / Math.max(1, combined.length)) * 100).toFixed(2),
  );
  const firstHealthyAfterRestore = postSamples.find((sample) => sample.ok);
  const recoveryMs = firstHealthyAfterRestore
    ? Date.parse(firstHealthyAfterRestore.timestamp) - restoredAt
    : null;

  return {
    scenario,
    baseUrl,
    probePath: probeConfig.path,
    durationSeconds,
    probeIntervalMs,
    probeTimeoutMs,
    probeLatencyFailureMs: probeConfig.maxLatencyMs ?? null,
    executedAt: new Date().toISOString(),
    faultInjected: injectResult,
    restoreResult,
    metrics: {
      availabilityPercent,
      totalProbeSamples: combined.length,
      failedProbeSamples: failureSamples.length,
      recoveryMs,
      degradationMode: failureSamples.length === 0 ? 'graceful' : 'user-visible-errors',
    },
    probes: {
      pre: preSamples,
      during: duringSamples,
      post: postSamples,
    },
  };
};

const run = async () => {
  const runId = timestamp();
  const outputRoot = ensureDir(path.join(experimentalRoot, 'chaos', runId));

  const results = [] as Awaited<ReturnType<typeof scenarioRun>>[];
  for (const scenario of scenarios) {
    results.push(await scenarioRun(scenario));
  }

  const outputPath = path.join(outputRoot, 'chaos-summary.json');
  writeJson(outputPath, {
    runId,
    generatedAt: new Date().toISOString(),
    scenarios,
    results,
  });

  const latestPath = path.join(experimentalRoot, 'chaos', 'latest-chaos-run.json');
  writeJson(latestPath, { runId, outputPath });

  console.log(`Chaos run complete: ${outputPath}`);
};

void run().catch((error) => {
  console.error('Chaos run failed', error);
  process.exitCode = 1;
});
