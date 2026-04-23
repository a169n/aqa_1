import { injectFault, restoreFault, type ChaosScenario } from './chaos-control';

const action = process.env.CHAOS_ACTION;
const scenario = process.env.CHAOS_SCENARIO as ChaosScenario | undefined;

if (!action || !scenario) {
  console.error('Missing required env vars: CHAOS_ACTION=[inject|restore], CHAOS_SCENARIO');
  process.exit(1);
}

if (action === 'inject') {
  const result = injectFault(scenario);
  console.log(JSON.stringify({ action, scenario, result }, null, 2));
  process.exit(0);
}

if (action === 'restore') {
  const result = restoreFault(scenario);
  console.log(JSON.stringify({ action, scenario, result }, null, 2));
  process.exit(0);
}

console.error(`Unsupported CHAOS_ACTION: ${action}`);
process.exit(1);
