import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { repoRoot } from './common/artifacts';

type PerformanceProfile = 'smoke' | 'full';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
const nodeCommand = process.execPath;
const serverRoot = `${repoRoot}/server`;
const baseUrl = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:4000';
const performanceProfile: PerformanceProfile =
  process.env.EXPERIMENTAL_PERFORMANCE_PROFILE === 'full' ? 'full' : 'smoke';
const runChaos = process.env.EXPERIMENTAL_RUN_CHAOS !== 'false';
const useExistingPerformanceServer = process.env.EXPERIMENTAL_USE_EXISTING_SERVER === 'true';

const commandEnv = {
  ...process.env,
  NODE_ENV: 'performance',
  AUTH_RATE_LIMIT_ENABLED: 'false',
  PERF_BASE_URL: baseUrl,
};

const isPortAvailable = (port: number) =>
  new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '127.0.0.1');
  });

const findAvailablePort = async (preferredPort: number, maxAttempts = 50) => {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = preferredPort + offset;
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to find an available port starting from ${preferredPort}.`);
};

const runCommand = (label: string, command: string, args: string[], env = commandEnv) => {
  console.log(`[experimental] ${label}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}`);
  }
};

const startCommand = (
  label: string,
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) => {
  console.log(`[experimental] ${label}`);
  return spawn(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: options.env ?? commandEnv,
    stdio: 'inherit',
  });
};

const stopProcess = async (child: ChildProcess | null) => {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolve) => child.once('exit', () => resolve())),
    sleep(5000),
  ]);

  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
  }
};

const waitForHealth = async (label: string, healthUrl: string, child?: ChildProcess) => {
  console.log(`[experimental] Waiting for ${label}: ${healthUrl}`);

  for (let attempt = 1; attempt <= 45; attempt += 1) {
    if (child && child.exitCode !== null) {
      throw new Error(`${label} process exited before becoming healthy.`);
    }

    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the startup timeout expires.
    }

    await sleep(2000);
  }

  throw new Error(`${label} did not become healthy within 90 seconds.`);
};

const checkHealth = async (healthUrl: string) => {
  try {
    const response = await fetch(healthUrl);
    return response.ok;
  } catch {
    return false;
  }
};

const assertPerformanceServerCanStart = async () => {
  if (useExistingPerformanceServer) {
    return;
  }

  if (await checkHealth(`${baseUrl}/api/health`)) {
    throw new Error(
      `${baseUrl} is already serving /api/health. Stop the existing server before running ` +
        '`npm run experimental:run`, or set EXPERIMENTAL_USE_EXISTING_SERVER=true intentionally.',
    );
  }
};

const runPerformance = async () => {
  let serverProcess: ChildProcess | null = null;

  try {
    await assertPerformanceServerCanStart();
    runCommand('Seed database for performance run', npmCommand, [
      'run',
      'db:seed',
      '--workspace',
      'server',
    ]);
    runCommand('Build server for performance run', npmCommand, [
      'run',
      'build',
      '--workspace',
      'server',
    ]);

    if (useExistingPerformanceServer) {
      await waitForHealth('existing performance server', `${baseUrl}/api/health`);
    } else {
      serverProcess = startCommand('Start performance server', nodeCommand, ['dist/index.js'], {
        cwd: serverRoot,
      });

      await waitForHealth('performance server', `${baseUrl}/api/health`, serverProcess);
    }

    runCommand(`Run ${performanceProfile} performance profile`, npmCommand, [
      'run',
      `perf:${performanceProfile}`,
    ]);
    runCommand('Generate performance markdown summary', npmCommand, ['run', 'perf:summary']);
  } finally {
    await stopProcess(serverProcess);
  }
};

const runMutation = () => {
  runCommand('Run mutation tests', npmCommand, ['run', 'mutation:test']);
  runCommand('Generate mutation summary', npmCommand, ['run', 'mutation:summary']);
};

const runChaosScenarios = async () => {
  const backendHostPort = await findAvailablePort(
    Number(process.env.CHAOS_BACKEND_HOST_PORT ?? '14000'),
  );
  const dbHostPort = await findAvailablePort(Number(process.env.CHAOS_DB_HOST_PORT ?? '15432'));
  const chaosBaseUrl = process.env.CHAOS_BASE_URL ?? `http://127.0.0.1:${backendHostPort}`;
  const chaosEnv = {
    ...commandEnv,
    CHAOS_BASE_URL: chaosBaseUrl,
    CHAOS_BACKEND_HOST_PORT: String(backendHostPort),
    CHAOS_DB_HOST_PORT: String(dbHostPort),
  };

  console.log(`[experimental] Chaos stack ports: backend=${backendHostPort}, db=${dbHostPort}`);

  try {
    runCommand(
      'Start Docker backend stack for chaos run',
      dockerCommand,
      ['compose', '-f', 'docker-compose.backend.yml', 'up', '-d', '--build'],
      chaosEnv,
    );
    await waitForHealth('Docker backend stack', `${chaosBaseUrl}/api/health`);
    runCommand('Run chaos scenarios', npmCommand, ['run', 'chaos:run'], chaosEnv);
  } finally {
    runCommand(
      'Stop Docker backend stack',
      dockerCommand,
      ['compose', '-f', 'docker-compose.backend.yml', 'down', '-v'],
      chaosEnv,
    );
  }
};

const run = async () => {
  const failures: string[] = [];

  for (const [label, task] of [
    ['performance', runPerformance],
    ['mutation', async () => runMutation()],
    ...(runChaos ? ([['chaos', runChaosScenarios]] as const) : []),
  ] as const) {
    try {
      await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${label}: ${message}`);
      console.error(`[experimental] ${label} failed: ${message}`);
    }
  }

  runCommand('Generate unified experimental summary', npmCommand, ['run', 'experimental:summary']);

  if (failures.length > 0) {
    console.error('[experimental] Completed with failures:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('[experimental] All experimental tests completed.');
};

void run().catch((error) => {
  console.error('[experimental] Run failed', error);
  process.exitCode = 1;
});
