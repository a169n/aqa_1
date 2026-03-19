# QA Test Strategy: Assignment 1

## Scope and objectives

- System type: `Web Application`
- Scope: Inkwell frontend (`client/`), backend API (`server/`), and QA pipeline (`.github/workflows/qa.yml`)
- Objectives:
  - protect authentication/session security
  - protect authorization and moderation boundaries
  - protect content lifecycle and integrity
  - ensure repeatable automated validation in CI

## Risk assessment results and module prioritization

| Priority | Component ID | Module                             | Test emphasis                               |
| -------- | ------------ | ---------------------------------- | ------------------------------------------- |
| `P1`     | `C1`         | Authentication and session flows   | API integration first, plus auth UI smoke   |
| `P1`     | `C2`         | Authorization and admin moderation | API integration first, plus admin smoke     |
| `P1`     | `C3`         | Content integrity                  | API integration first, plus editorial smoke |
| `P2`     | `C4`         | Profile and avatar uploads         | API integration + targeted manual checks    |
| `P2`     | `C5`         | Public feed and navigation         | Browser smoke + manual exploratory checks   |

## Test approach

- High-risk-first automation:
  - `Vitest + Supertest` for backend integration scenarios
  - `Playwright` for critical end-to-end smoke journeys
- Manual support:
  - Swagger UI for endpoint inspection and schema checks
  - Postman collection for reproducible API request evidence
  - exploratory checks for medium-risk UX behavior

## Tool selection and configuration rationale

| Tool                   | Why selected                                                                                  | Configuration source                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `Vitest` + `Supertest` | Already used in repo, fast backend integration coverage without introducing extra frameworks. | `server/package.json`, `server/vitest.config.ts`, `server/src/test/` |
| `@vitest/coverage-v8`  | Native coverage output integrated with existing Vitest workflow.                              | `server/package.json`, `server/vitest.config.ts`                     |
| `Playwright`           | Existing smoke harness with deterministic web server startup and CI artifact support.         | `package.json`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`    |
| `Swagger UI`           | Existing API contract visibility for manual verification and endpoint discovery.              | `server/src/docs/swagger.ts`, `server/src/docs/openapi.ts`           |
| `Postman`              | Existing portable request collection for assignment evidence and manual checks.               | `docs/qa/postman/inkwell-assignment-1.postman_collection.json`       |
| `GitHub Actions`       | Existing CI pipeline enforcing lint/build/test/docker gates on push/PR.                       | `.github/workflows/qa.yml`                                           |

## Entry and exit criteria

- Entry:
  - `npm ci` succeeds
  - PostgreSQL test database is reachable with valid credentials
  - migrations run successfully for test environment
- Exit:
  - `lint`, `build`, `api-tests`, `e2e`, and `docker-build` gates pass in CI
  - QA docs are consistent with repository state
  - no fabricated runtime metrics are reported

## Planned metrics

- High-risk modules identified: `5`
- Automated scenario inventory from code:
  - `23` API integration scenarios (`server/src/test/*.integration.test.ts`)
  - `4` UI smoke scenarios (`tests/e2e/smoke.spec.ts`)
- Coverage plan:
  - target `>= 80%` statements/lines for backend files included in `server/vitest.config.ts` coverage scope
  - collect measured percentages only from a successful `npm run test:coverage` run
- Risk coverage objective:
  - `100%` of `P1` modules mapped to at least one automated test

## Current measurement status (2026-03-19)

- Verified commands:
  - `npm run test:coverage` -> `23/23` tests passed
  - `npm run test:e2e` -> `4/4` smoke tests passed
- Measured backend coverage from current local run:
  - `75.87%` statements
  - `75.35%` lines
- Gap against coverage target:
  - current baseline is below `>= 80%` target and requires additional coverage expansion in lower-covered service modules.
