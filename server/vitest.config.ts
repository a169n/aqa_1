import { defineConfig } from 'vitest/config';
import { qaQualityGateThresholds } from './src/qa/reporting';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['./src/test/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/controllers/**/*.ts', 'src/middleware/**/*.ts', 'src/services/**/*.ts'],
      exclude: ['src/test/**/*.ts'],
      reportOnFailure: true,
      thresholds: {
        lines: qaQualityGateThresholds.coverage.lines,
        statements: qaQualityGateThresholds.coverage.statements,
      },
    },
  },
});
