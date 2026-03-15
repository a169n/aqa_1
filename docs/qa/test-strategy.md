# QA Test Strategy: Assignment 1

## Scope and objectives

- System type: `Web Application`
- Goal: establish a risk-based QA baseline for Inkwell and prove that critical flows are reproducible in local runs and CI.
- Primary objectives:
  - protect account/session security
  - protect authorization boundaries
  - protect blog content integrity
  - prove the app can be validated automatically through CI and Docker build checks

## Test approach

- Automated first:
  - `Vitest + Supertest` for backend API/integration coverage
  - `Playwright` for 3 browser smoke journeys
- Manual support:
  - Swagger inspection for endpoint behavior
  - Postman collection for reproducible request evidence
  - exploratory checklist for medium-risk UX paths

## Risk-to-test mapping

| Risk area                        | Planned coverage                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| Authentication and sessions      | API automation for register, login, refresh rotation, logout, `/auth/me`, invalid-token paths |
| Authorization and admin controls | API automation for `401/403`, role management, and last-admin protection                      |
| Content integrity                | API automation for post CRUD, ownership rules, comments, likes, and duplicate-like prevention |
| Profile and avatar management    | API automation for duplicate email rejection and avatar upload size handling                  |
| Public browsing                  | Playwright smoke tests for auth entry, post creation, and admin page access                   |

## Tools and configuration

- Backend automation: `Vitest`, `Supertest`, `@vitest/coverage-v8`
- Browser smoke tests: `Playwright`
- API documentation and manual validation: `Swagger UI`, `Postman`
- CI/CD: `GitHub Actions`
- Reproducible runtime validation: backend `Dockerfile`

## Entry and exit criteria

- Entry:
  - dependencies install with `npm ci`
  - PostgreSQL test database is available
  - server migrations can run successfully
- Exit:
  - lint and build complete successfully
  - API coverage suite passes
  - Playwright smoke suite passes
  - backend Docker image builds successfully
  - QA documents and baseline metrics are committed

## Planned metrics

- High-risk modules identified: `5`
- Current automated scope:
  - `19` API test scenarios
  - `3` UI smoke scenarios
- Current backend coverage baseline:
  - `85.75%` statements
  - `85.30%` lines
- Coverage target:
  - maintain `>= 80%` statements/lines across controllers, middleware, and services included in the backend coverage scope
- Risk coverage target:
  - `100%` of `P1` modules mapped to at least one automated test
