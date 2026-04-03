# QA Test Strategy

## Scope and objectives

- System type: `Web Application`
- Scope: frontend (`client/`), backend API (`server/`), browser smoke coverage (`tests/e2e/`), and CI quality gates (`.github/workflows/qa.yml`)
- Objectives:
  - protect authentication, session rotation, and authorization boundaries
  - protect content lifecycle and moderation integrity
  - keep the automated QA flow reproducible in local runs and CI
  - enforce measurable release gates rather than ad hoc pass/fail claims

## Research questions

1. Does a risk-based automation strategy provide full automated coverage for the highest-impact modules?
2. Can CI quality gates turn raw test output into repeatable release evidence with minimal manual interpretation?
3. Does the selected toolchain balance risk coverage, execution speed, maintainability, and evidence quality better than realistic alternatives?

## Methodology

- Primary approach: `risk-based, test-first expansion`
- Execution model:
  - `Vitest + Supertest` covers API-level behavior for all `P1` modules first
  - `Playwright` validates cross-layer smoke journeys that prove the frontend, backend, auth, and database work together
  - `Swagger UI` and the Postman collection remain supporting QC tools for manual inspection and evidence capture
- Quality philosophy:
  - QA defines the workflow, thresholds, and evidence model
  - QC verifies actual runtime behavior through automated and manual checks

## Risk assessment results and module prioritization

| Priority | Component ID | Module                                    | Test emphasis                               |
| -------- | ------------ | ----------------------------------------- | ------------------------------------------- |
| `P1`     | `C1`         | Authentication and session lifecycle      | API integration first, plus auth UI smoke   |
| `P1`     | `C2`         | Authorization and admin moderation        | API integration first, plus admin smoke     |
| `P1`     | `C3`         | Content integrity and moderation workflow | API integration first, plus editorial smoke |
| `P2`     | `C4`         | Profile management and avatar uploads     | API integration + targeted manual checks    |
| `P2`     | `C5`         | Public browsing and discovery flows       | Browser smoke + manual exploratory checks   |

## Tool and stack rationale

| Area                  | Selected option            | Main alternatives considered                  | Why the current choice fits this project |
| --------------------- | -------------------------- | --------------------------------------------- | ---------------------------------------- |
| API automation        | `Vitest + Supertest`       | `Jest + Supertest`, `Newman/Postman`          | Already aligned with the TypeScript backend, low setup cost, fast feedback, and easy CI integration. |
| Browser automation    | `Playwright`               | `Cypress`, manual smoke only                  | Strong multi-page flow support, deterministic web-server orchestration, and machine-readable reports. |
| Coverage collection   | `@vitest/coverage-v8`      | Istanbul via Jest                             | Native fit for the existing Vitest stack with low configuration overhead. |
| CI orchestration      | `GitHub Actions`           | local scripts only, Jenkins                   | Matches repository hosting, keeps checks close to PR flow, and stores artifacts cleanly. |
| API inspection        | `Swagger UI`               | Postman only                                  | Provides contract visibility directly from the backend codebase. |
| Manual request replay | `Postman` collection       | curl scripts only                             | Useful for reviewer/demo validation when browser or CI output is not the right medium. |

## Comparative analysis

- `Vitest + Supertest` was preferred over `Jest + Supertest` because the project already uses modern TypeScript-first tooling and did not need the extra migration or compatibility layer.
- `Playwright` was preferred over `Cypress` because the project benefits more from stable end-to-end process control and report export than from Cypress-specific in-browser debugging.
- `GitHub Actions` was preferred over standalone local scripts because the assignment requires reproducible evidence and visible gates, not only a runnable local checklist.
- Manual-only QA was rejected as the primary path because it does not provide durable metrics, trendable evidence, or enforceable release thresholds.

## Entry and exit criteria

- Entry:
  - `npm ci` succeeds
  - PostgreSQL test database is reachable
  - migrations succeed for the test environment
  - Playwright can provision Chromium
- Exit:
  - `lint`, `build`, `api-tests`, `e2e`, `qa-gates`, and `docker-build` pass
  - QA artifacts are generated without fabrication
  - `P1` modules remain fully covered by automation

## Metrics and justification

| Metric | Why it matters | Threshold / expectation | Source of truth |
| ------ | -------------- | ----------------------- | --------------- |
| Backend statement coverage | Detects broad code-path reach in the highest-risk backend surface | `>= 80%` | `server/coverage/coverage-summary.json` |
| Backend line coverage | Confirms execution depth, not just branch presence | `>= 80%` | `server/coverage/coverage-summary.json` |
| API failed tests | Protects against silent regression in service behavior | `0` | `.tmp/qa/vitest-report.json` |
| E2E failed or flaky tests | Guards the integrated user flows and infrastructure wiring | `0` | `.tmp/qa/playwright-report.json` |
| `P1` automation coverage | Proves risk-based prioritization is actually enforced | `100%` | `.tmp/qa/qa-summary.json` |

These metrics were chosen because they describe capability protection, execution reliability, and reproducibility better than a simple scenario count alone.

## Current measurement status (2026-04-02)

- Verified commands:
  - `npm run lint` -> passed
  - `npm run build` -> passed
  - `npm run test:coverage` -> `38/38` tests passed
  - `npm run test:e2e` -> `4/4` smoke tests passed
  - `npm run qa:gates` -> all gates passed
  - `npm audit` -> `0` vulnerabilities
- Measured backend coverage from current local run:
  - `83.73%` statements
  - `83.33%` lines
- Risk coverage status:
  - `100%` of `P1` modules mapped to automated coverage
  - unified QA summary generated at `.tmp/qa/qa-summary.json`

## Residual risks

- Coverage is strong enough for the current gate but still uneven in lower-covered service modules such as `blog.service.ts` and `report.service.ts`.
- The browser suite remains intentionally small and smoke-oriented; it is a confidence layer, not exhaustive UI coverage.
- Frontend bundle size warnings still indicate an optimization opportunity, but they do not currently break the QA workflow.
