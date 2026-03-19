# QA Environment Setup Report

## Repository structure and version control setup

- Monorepo structure:
  - frontend: `client/`
  - backend: `server/`
  - e2e tests: `tests/e2e/`
  - QA assignment docs and artifacts: `docs/qa/`
- Version control: Git repository with CI on `push` and `pull_request` (`.github/workflows/qa.yml`)
- QA-related tracked assets:
  - API integration tests in `server/src/test/`
  - Playwright smoke suite in `tests/e2e/smoke.spec.ts`
  - Postman collection in `docs/qa/postman/`

## Installed and configured QA tools

| Tool                  | Installed via           | Configuration/evidence                                                     |
| --------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `Vitest`              | `server/package.json`   | `server/vitest.config.ts` (node env, setup file, coverage scope/reporters) |
| `Supertest`           | `server/package.json`   | Used in `server/src/test/helpers.ts` and integration suites                |
| `@vitest/coverage-v8` | `server/package.json`   | Coverage enabled in `server/vitest.config.ts`                              |
| `Playwright`          | root `package.json`     | `playwright.config.ts` and `tests/e2e/smoke.spec.ts`                       |
| `Swagger UI`          | `server/package.json`   | `server/src/docs/swagger.ts`, `server/src/docs/openapi.ts`                 |
| `Postman` collection  | repository asset        | `docs/qa/postman/inkwell-assignment-1.postman_collection.json`             |
| `Docker`              | project runtime tooling | `docker-compose.backend.yml`, `server/Dockerfile`                          |

## Local QA setup procedure

1. Install dependencies:

```bash
npm ci
```

2. Start PostgreSQL (local service or Docker):

```bash
docker compose -f docker-compose.backend.yml up -d db
```

3. Create test database once:

```bash
docker compose -f docker-compose.backend.yml exec db psql -U postgres -d postgres -c "CREATE DATABASE inkwell_test;"
```

4. Execute API coverage suite:

```bash
npm run test:coverage
```

5. Execute browser smoke suite:

```bash
npx playwright install chromium
npm run test:e2e
```

Notes:

- The Playwright config starts backend and frontend test servers automatically.
- If local PostgreSQL credentials differ from defaults, align test environment variables before running API or e2e suites.

## CI/CD pipeline configuration

- Workflow file: `.github/workflows/qa.yml`
- Triggers: `push`, `pull_request`
- Jobs and order:
  1. `lint`
  2. `build`
  3. `api-tests`
  4. `e2e`
  5. `docker-build`
- Pipeline artifacts:
  - `server/coverage`
  - `playwright-report`
  - `test-results`

## Verification status during this audit (2026-03-19)

- Local commands executed successfully:
  - `npm run lint`
  - `npm run build`
  - `npm run test:coverage`
  - `npm run test:e2e`
- Current local results:
  - API integration: `23/23` passed
  - Playwright smoke: `4/4` passed
  - Backend coverage: `75.87%` statements, `75.35%` lines
- Configuration note:
  - Playwright now supports environment overrides for DB settings while keeping the same defaults, so teammate/local password differences do not break smoke runs.

## Screenshot checklist for final submission evidence

- Passing GitHub Actions run summary
- Backend coverage report from successful run
- Playwright HTML report
- Backend Docker image build output
- Swagger UI (`/docs`) page
- `docs/qa/` folder structure
