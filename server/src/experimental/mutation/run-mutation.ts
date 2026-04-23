import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureDir, experimentalRoot, writeJson } from '../common/artifacts';

interface MutantDefinition {
  id: string;
  module: 'auth' | 'authorization' | 'content';
  filePath: string;
  description: string;
  find: string;
  replace: string;
  tests: string[];
}

const repoRoot = path.resolve(__dirname, '../../../..');

const mutants: MutantDefinition[] = [
  {
    id: 'auth-login-negation',
    module: 'auth',
    filePath: 'server/src/services/auth.service.ts',
    description: 'Negate password match condition during login',
    find: 'if (!matches) {',
    replace: 'if (matches) {',
    tests: ['src/test/auth.integration.test.ts'],
  },
  {
    id: 'auth-refresh-expiry-check',
    module: 'auth',
    filePath: 'server/src/services/auth.service.ts',
    description: 'Invert refresh token expiry check',
    find: 'tokenRecord.expiresAt.getTime() < Date.now()',
    replace: 'tokenRecord.expiresAt.getTime() > Date.now()',
    tests: ['src/test/auth.integration.test.ts'],
  },
  {
    id: 'authorization-admin-guard',
    module: 'authorization',
    filePath: 'server/src/middleware/authenticate.ts',
    description: 'Bypass role check in admin guard',
    find: "if (!request.user || request.user.role !== 'admin') {",
    replace: "if (!request.user || request.user.role === 'admin') {",
    tests: ['src/test/profile-admin.integration.test.ts'],
  },
  {
    id: 'content-visibility-status',
    module: 'content',
    filePath: 'server/src/services/blog.service.ts',
    description: 'Treat non-published status as published in visibility guard',
    find: 'if (post.status === POST_STATUSES.PUBLISHED) {',
    replace: 'if (post.status !== POST_STATUSES.PUBLISHED) {',
    tests: ['src/test/blog.service.unit.test.ts', 'src/test/editorial.integration.test.ts'],
  },
  {
    id: 'content-report-target-validation',
    module: 'content',
    filePath: 'server/src/services/report.service.ts',
    description: 'Allow invalid report target cardinality',
    find: 'if ((postId ? 1 : 0) + (commentId ? 1 : 0) !== 1) {',
    replace: 'if ((postId ? 1 : 0) + (commentId ? 1 : 0) === 1) {',
    tests: ['src/test/report.service.unit.test.ts', 'src/test/editorial.integration.test.ts'],
  },
];

const outputRoot = ensureDir(path.join(experimentalRoot, 'mutation'));
const outputPath = path.join(outputRoot, 'mutation-summary.json');

const runTests = (tests: string[]) => {
  const result = spawnSync('npm', ['run', 'test', '--workspace', 'server', '--', '--run', ...tests], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf-8',
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

const applyMutation = (mutant: MutantDefinition) => {
  const absolutePath = path.join(repoRoot, mutant.filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Mutation file not found: ${mutant.filePath}`);
  }

  const original = readFileSync(absolutePath, 'utf-8');
  if (!original.includes(mutant.find)) {
    throw new Error(`Unable to apply mutant ${mutant.id}; pattern not found.`);
  }

  const mutated = original.replace(mutant.find, mutant.replace);
  writeFileSync(absolutePath, mutated, 'utf-8');

  return () => writeFileSync(absolutePath, original, 'utf-8');
};

const run = async () => {
  mkdirSync(path.join(repoRoot, 'server', 'reports', 'mutation'), { recursive: true });
  const results = [] as Array<{
    id: string;
    module: string;
    filePath: string;
    description: string;
    status: 'Killed' | 'Survived' | 'Error';
    exitCode: number;
    tests: string[];
    error?: string;
    logPath: string;
  }>;

  for (const mutant of mutants) {
    const logPath = path.join(outputRoot, `${mutant.id}.log`);
    let restore: (() => void) | null = null;
    try {
      restore = applyMutation(mutant);
      const testResult = runTests(mutant.tests);
      writeFileSync(logPath, `${testResult.stdout}\n${testResult.stderr}`, 'utf-8');
      results.push({
        id: mutant.id,
        module: mutant.module,
        filePath: mutant.filePath,
        description: mutant.description,
        status: testResult.exitCode === 0 ? 'Survived' : 'Killed',
        exitCode: testResult.exitCode,
        tests: mutant.tests,
        logPath,
      });
    } catch (error) {
      writeFileSync(logPath, `${String(error)}\n`, 'utf-8');
      results.push({
        id: mutant.id,
        module: mutant.module,
        filePath: mutant.filePath,
        description: mutant.description,
        status: 'Error',
        exitCode: 1,
        tests: mutant.tests,
        error: error instanceof Error ? error.message : String(error),
        logPath,
      });
    } finally {
      restore?.();
    }
  }

  const totals = {
    created: results.length,
    killed: results.filter((row) => row.status === 'Killed').length,
    survived: results.filter((row) => row.status === 'Survived').length,
    errors: results.filter((row) => row.status === 'Error').length,
  };

  const mutationScore =
    totals.created === 0 ? 0 : Number(((totals.killed / totals.created) * 100).toFixed(2));

  const moduleSummary = results.reduce<Record<string, typeof results>>((acc, result) => {
    if (!acc[result.module]) {
      acc[result.module] = [];
    }
    acc[result.module].push(result);
    return acc;
  }, {});

  const summary = {
    generatedAt: new Date().toISOString(),
    strategy: 'controlled-mutants-script',
    totals: {
      ...totals,
      mutationScore,
    },
    modules: Object.fromEntries(
      Object.entries(moduleSummary).map(([module, entries]) => {
        const moduleEntries = entries ?? [];
        const created = moduleEntries.length;
        const killed = moduleEntries.filter((row) => row.status === 'Killed').length;
        const survived = moduleEntries.filter((row) => row.status === 'Survived').length;
        return [
          module,
          {
            created,
            killed,
            survived,
            mutationScore: created === 0 ? 0 : Number(((killed / created) * 100).toFixed(2)),
          },
        ];
      }),
    ),
    mutants: results,
  };

  writeJson(outputPath, summary);
  writeJson(path.join(repoRoot, 'server', 'reports', 'mutation', 'mutation-report.json'), summary);
  console.log(`Mutation run complete. Summary: ${outputPath}`);
};

void run().catch((error) => {
  console.error('Mutation run failed', error);
  process.exitCode = 1;
});
