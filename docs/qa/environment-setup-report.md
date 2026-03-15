# QA Environment Setup Report

## Repository and QA structure

- Application code: `client/` and `server/`
- QA deliverables: `docs/qa/`
- API integration tests: `server/src/test/`
- Browser smoke tests: `tests/e2e/`
- CI pipeline: `.github/workflows/qa.yml`
- Manual API evidence: `docs/qa/postman/inkwell-assignment-1.postman_collection.json`

## Installed QA tooling

- `Vitest`, `Supertest`, `@vitest/coverage-v8`
- `Playwright`
- Existing project tooling reused for quality gates:
  - `ESLint`
  - `TypeScript`
  - `Docker`
  - `Swagger UI`

## Local setup steps

1. Install dependencies from the repository root:

```bash
npm ci
```

2. Start PostgreSQL locally or with Docker:

```bash
docker compose -f docker-compose.backend.yml up -d db
```

3. Create the dedicated test database once:

```bash
docker compose -f docker-compose.backend.yml exec db psql -U postgres -d postgres -c "CREATE DATABASE inkwell_test;"
```

4. Run the API coverage suite:

```bash
npm run test:coverage
```

5. Run the Playwright smoke suite:

```bash
npx playwright install chromium
npm run test:e2e
```

The smoke suite starts:

- a reset backend on `http://127.0.0.1:4000`
- a built frontend preview on `http://127.0.0.1:4173`

## CI/CD pipeline summary

- Workflow: `.github/workflows/qa.yml`
- Trigger: `push` and `pull_request`
- Jobs:
  - `lint`
  - `build`
  - `api-tests`
  - `e2e`
  - `docker-build`
- Lint-stage commands:
  - `npm run format:check`
  - `npm run lint`
  - `npm run lint:fix`
  - `git diff --exit-code` to fail if autofixes were needed
- CI artifacts:
  - backend coverage report
  - Playwright HTML report
  - Playwright failure screenshots/traces/videos

## Docker validation

- Backend container build is validated in CI with:

```bash
docker build -f server/Dockerfile .
```

- Runtime stack for local verification:

```bash
docker compose -f docker-compose.backend.yml up --build
```

## Screenshot checklist for the assignment report

- Passing GitHub Actions workflow run
- Backend coverage summary
- Playwright HTML report
- Backend Docker build or running containers
- Swagger UI at `/docs`
- `docs/qa/` folder structure
