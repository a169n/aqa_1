# QA Metrics Baseline and Current Results

## Metric summary

| Metric | Initial baseline | Current result (`2026-04-02`) | Delta |
| ------ | ---------------- | ----------------------------- | ----- |
| High-risk modules count | `5` | `5` | `0` |
| Automated API inventory | `27` scenarios | `38` scenarios | `+11` |
| UI smoke inventory | `4` scenarios | `4` scenarios | `0` |
| API result | `27/27` passed | `38/38` passed | `+11` passing scenarios |
| UI smoke result | `4/4` passed | `4/4` passed | `0` |
| Backend statement coverage | `75.87%` | `83.73%` | `+7.86 pp` |
| Backend line coverage | `75.35%` | `83.33%` | `+7.98 pp` |
| Pipeline stages | `5` | `6` | `+1` (`qa-gates`) |
| `P1` automation coverage | baseline target only | `100%` | target achieved |
| Dependency audit | not recorded | `0` vulnerabilities | new controlled metric |

## High-risk module count detail

- `C1` Authentication and session lifecycle
- `C2` Authorization and admin moderation
- `C3` Content integrity and moderation workflow
- `C4` Profile management and avatar uploads
- `C5` Public browsing and discovery flows

## Coverage and effectiveness plan

| Priority | Module | Coverage focus | Current automated evidence |
| -------- | ------ | -------------- | -------------------------- |
| `P1` | `C1` Authentication/session | API integration + auth refresh/logout behavior | `server/src/test/auth.integration.test.ts`, `server/src/test/security.integration.test.ts`, `tests/e2e/smoke.spec.ts` |
| `P1` | `C2` Authorization/moderation | API integration + admin smoke path | `server/src/test/profile-admin.integration.test.ts`, `server/src/test/editorial.integration.test.ts`, `tests/e2e/smoke.spec.ts` |
| `P1` | `C3` Content integrity | API integration + editorial smoke path | `server/src/test/blog.integration.test.ts`, `server/src/test/editorial.integration.test.ts`, `tests/e2e/smoke.spec.ts` |
| `P2` | `C4` Profile/avatar | API integration + targeted negative upload checks | `server/src/test/profile-admin.integration.test.ts` |
| `P2` | `C5` Public browsing | Smoke + exploratory support | `tests/e2e/smoke.spec.ts` |

## Metric rationale

- Risk coverage matters because the goal is not raw scenario volume; it is protection of the modules with the highest failure impact.
- Pass/fail counts matter because the assignment requires reproducible evidence, not only a design proposal.
- Statement and line coverage matter because they reveal whether the backend automation reaches meaningful execution depth.
- Quality-gate status matters because it turns measurements into enforceable release criteria.
- Dependency audit status matters because security debt in the delivery toolchain undermines the credibility of the QA baseline.

## Reproducibility artifacts

- API execution report: `.tmp/qa/vitest-report.json`
- E2E execution report: `.tmp/qa/playwright-report.json`
- Unified QA summary: `.tmp/qa/qa-summary.json`
- Backend coverage summary: `server/coverage/coverage-summary.json`
- Playwright HTML report: `playwright-report/`

## Measurement status recorded during this audit

- Date: `2026-04-02`
- Commands used:
  - `npm run ci`
  - `npm audit`
  - `npm audit --omit=dev`
- Observed state:
  - all CI gates passed
  - all QA gates passed
  - both full-tree and production-only audits returned `0` vulnerabilities

## Remaining blind spots

- Branch coverage is still lower than statement and line coverage, so some alternative paths remain underexplored.
- Browser automation still prioritizes confidence over breadth; negative UI authorization paths are not yet fully expanded.
- Metrics describe automated quality control well, but exploratory manual review is still required for presentation-level regressions and usability nuance.
