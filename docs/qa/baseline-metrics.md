# Baseline Metrics (Assignment 1)

## Required baseline metrics

| Required metric                             | Baseline                                                  |
| ------------------------------------------- | --------------------------------------------------------- |
| High-risk modules count                     | `5`                                                       |
| Initial automated inventory (API)           | `27` scenarios in `server/src/test/*.integration.test.ts` |
| Initial automated inventory (UI smoke)      | `4` scenarios in `tests/e2e/smoke.spec.ts`                |
| Current observed API result                 | `27/27` passed                                            |
| Current observed UI smoke result            | `4/4` passed                                              |
| Current observed backend statement coverage | `75.87%`                                                  |
| Current observed backend line coverage      | `75.35%`                                                  |
| Pipeline stages                             | `5` (`lint`, `build`, `api-tests`, `e2e`, `docker-build`) |

## High-risk module count detail

- `C1` Authentication and session lifecycle
- `C2` Authorization and admin moderation
- `C3` Post/comment/like integrity
- `C4` Profile management and avatar uploads
- `C5` Public feed and navigation

## Initial coverage plan

| Priority | Module                        | Planned coverage type                       | Existing baseline assets                                                                                                        |
| -------- | ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `P1`     | `C1` Authentication/session   | API integration first, smoke auth path      | `server/src/test/auth.integration.test.ts`, `tests/e2e/smoke.spec.ts`                                                           |
| `P1`     | `C2` Authorization/moderation | API integration first, admin smoke path     | `server/src/test/profile-admin.integration.test.ts`, `server/src/test/editorial.integration.test.ts`, `tests/e2e/smoke.spec.ts` |
| `P1`     | `C3` Content integrity        | API integration first, editorial smoke path | `server/src/test/blog.integration.test.ts`, `server/src/test/editorial.integration.test.ts`, `tests/e2e/smoke.spec.ts`          |
| `P2`     | `C4` Profile/avatar           | API integration + targeted manual checks    | `server/src/test/profile-admin.integration.test.ts`, Swagger/Postman checks                                                     |
| `P2`     | `C5` Public browsing          | Smoke + exploratory manual checks           | `tests/e2e/smoke.spec.ts`, Swagger/Postman checks                                                                               |

Coverage percentage measurement plan:

- Command: `npm run test:coverage`
- Source of truth: generated `server/coverage` report
- Target: `>= 80%` statements/lines for configured backend coverage scope

## Estimated testing effort

| Work item                                      | Estimate   |
| ---------------------------------------------- | ---------- |
| QA environment verification and docs alignment | `1.5 days` |
| API integration baseline maintenance/extension | `2-3 days` |
| Playwright smoke maintenance/extension         | `1 day`    |
| CI hardening and artifact validation           | `0.5 day`  |
| Final evidence packaging for submission        | `0.5 day`  |

## Measurement status recorded during this audit

- Date: `2026-03-26`
- Coverage and smoke suites were executed successfully in the normalized local environment.
- Known improvement target: raise backend statements/lines from current `~75%` baseline to `>= 80%`.
