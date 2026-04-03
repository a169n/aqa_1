# QA Environment Setup Report

## Repository structure and version control setup

- Monorepo structure:
  - frontend: `client/`
  - backend: `server/`
  - e2e tests: `tests/e2e/`
  - QA docs and artifacts: `docs/qa/`
- Version control: Git repository with CI on `push` and `pull_request` in `.github/workflows/qa.yml`
- QA-relevant tracked assets:
  - API integration suites in `server/src/test/`
  - Browser smoke suite in `tests/e2e/smoke.spec.ts`
  - QA aggregation scripts in `server/src/qa/`
  - Postman collection in `docs/qa/postman/`

## Installed and configured QA tools

| Tool | Installed via | Configuration/evidence |
| ---- | ------------- | ---------------------- |
| `Vitest` | `server/package.json` | `server/vitest.config.ts` |
| `Supertest` | `server/package.json` | `server/src/test/helpers.ts` and integration suites |
| `@vitest/coverage-v8` | `server/package.json` | coverage reporting and thresholds in `server/vitest.config.ts` |
| `Playwright` | root `package.json` | `playwright.config.ts` and `tests/e2e/smoke.spec.ts` |
| `Swagger UI` | `server/package.json` | `server/src/docs/swagger.ts`, `server/src/docs/openapi.ts` |
| `Postman` collection | repository asset | `docs/qa/postman/inkwell-qa.postman_collection.json` |
| `Docker` | project runtime tooling | `docker-compose.backend.yml`, `server/Dockerfile` |

## Local QA setup procedure

1. Install dependencies:

```bash
npm ci
```

2. Start PostgreSQL:

```bash
docker compose -f docker-compose.backend.yml up -d db
```

3. Run the complete QA flow:

```bash
npm run ci
```

4. Optional supporting commands:

```bash
npm run qa:gates
npm audit
npm audit --omit=dev
```

## CI/CD pipeline configuration

- Workflow file: `.github/workflows/qa.yml`
- Triggers: `push`, `pull_request`
- Jobs and order:
  1. `lint`
  2. `build`
  3. `api-tests`
  4. `e2e`
  5. `qa-gates`
  6. `docker-build`
- Pipeline artifacts:
  - `server/coverage`
  - `.tmp/qa/vitest-report.json`
  - `.tmp/qa/playwright-report.json`
  - `.tmp/qa/qa-summary.json`
  - `playwright-report`
  - `test-results`

## Environment hardening notes

- Refresh tokens are now transported in an `HttpOnly` cookie rather than in client storage.
- Auth endpoints are marked `no-store` to avoid caching session material.
- Security headers are applied centrally in the Express app.
- Avatar uploads are constrained by MIME allowlist and size limits.
- Test database resets use schema recreation rather than full database drop, which reduces reset noise and keeps the flow deterministic.

## Verification status during this audit (2026-04-02)

- Local commands executed successfully:
  - `npm run lint`
  - `npm run build`
  - `npm run test:coverage`
  - `npm run test:e2e`
  - `npm run qa:gates`
  - `npm audit`
- Current local results:
  - API integration: `38/38` passed
  - Playwright smoke: `4/4` passed
  - Backend coverage: `83.73%` statements, `83.33%` lines
  - Quality gates: all passed
  - Dependency audit: `0` vulnerabilities

## Screenshot checklist for evidence packaging

- Passing GitHub Actions run summary
- Backend coverage report
- QA summary JSON artifact
- Playwright HTML report
- Backend Docker image build output
- Swagger UI (`/docs`) page
- `docs/qa/` folder structure
