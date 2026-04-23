import { execSync } from 'node:child_process';
import path from 'node:path';
import { repoRoot } from '../common/artifacts';

export type ChaosScenario = 'api-downtime' | 'db-unavailable' | 'network-latency';

const composeFile = process.env.CHAOS_COMPOSE_FILE
  ? path.resolve(process.env.CHAOS_COMPOSE_FILE)
  : path.join(repoRoot, 'docker-compose.backend.yml');
const backendService = process.env.CHAOS_BACKEND_SERVICE ?? 'backend';
const databaseService = process.env.CHAOS_DB_SERVICE ?? 'db';

const runCommand = (command: string) => {
  execSync(command, { stdio: 'inherit' });
};

const runCommandAllowFailure = (command: string) => {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
};

export const injectFault = (scenario: ChaosScenario) => {
  switch (scenario) {
    case 'api-downtime':
      runCommand(`docker compose -f ${composeFile} pause ${backendService}`);
      return { injected: true };
    case 'db-unavailable':
      runCommand(`docker compose -f ${composeFile} stop ${databaseService}`);
      return { injected: true };
    case 'network-latency': {
      const backendContainer = process.env.CHAOS_BACKEND_CONTAINER ?? 'inkwell-backend';
      const delayMs = Number(process.env.CHAOS_NETEM_DELAY_MS ?? 400);
      const success = runCommandAllowFailure(
        `docker exec ${backendContainer} sh -lc "tc qdisc replace dev eth0 root netem delay ${delayMs}ms"`,
      );
      return {
        injected: success,
        note: success
          ? `Applied tc netem delay=${delayMs}ms`
          : 'Unable to apply tc netem delay (tc unavailable or insufficient permissions)',
      };
    }
    default:
      throw new Error(`Unsupported scenario: ${scenario}`);
  }
};

export const restoreFault = (scenario: ChaosScenario) => {
  switch (scenario) {
    case 'api-downtime':
      runCommand(`docker compose -f ${composeFile} unpause ${backendService}`);
      return { restored: true };
    case 'db-unavailable':
      runCommand(`docker compose -f ${composeFile} start ${databaseService}`);
      return { restored: true };
    case 'network-latency': {
      const backendContainer = process.env.CHAOS_BACKEND_CONTAINER ?? 'inkwell-backend';
      const success = runCommandAllowFailure(
        `docker exec ${backendContainer} sh -lc "tc qdisc del dev eth0 root"`,
      );
      return {
        restored: true,
        note: success
          ? 'Removed tc netem rules from backend container'
          : 'No tc netem rule removed (tc unavailable or no prior rule)',
      };
    }
    default:
      throw new Error(`Unsupported scenario: ${scenario}`);
  }
};
