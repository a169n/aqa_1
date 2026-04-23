# Assignment 3 Experimental Engineering (Operational Guide)

This guide documents how to run the code/pipeline side of Assignment 3 in a reproducible way.

## Prerequisites

- Node.js 20+
- npm
- Docker + Docker Compose (required for chaos scenarios, optional for local Postgres)
- Postgres reachable for server tests (or run `docker compose -f docker-compose.backend.yml up -d db`)

## Artifact Layout

All generated artifacts are stored under:

- `.tmp/qa/experimental/performance`
- `.tmp/qa/experimental/mutation`
- `.tmp/qa/experimental/chaos`
- `.tmp/qa/experimental/experimental-summary.json`

## Performance Testing

High-risk module coverage:

- Authentication/session lifecycle
- Authorization/admin moderation
- Content/editorial workflows

### Commands

- `npm run perf:smoke` → single normal-load profile
- `npm run perf:full` → normal, peak, spike, endurance scenarios
- `npm run perf:summary` → markdown summary from latest run

### Required Environment

- API server running and seeded with default users (`admin@example.com`, `user@example.com`, password `Password123!`)
- `PERF_BASE_URL` (default: `http://127.0.0.1:4000`)

### Auth Rate-Limit Note For Load Tests

The authentication endpoints are protected by rate limiting in normal operation. For controlled performance runs,
disable or raise this limiter to avoid skewed 429-heavy results on `/api/auth/login`.

Useful overrides:

- `AUTH_RATE_LIMIT_ENABLED=false`
- `AUTH_RATE_LIMIT_MAX_REQUESTS=<large number>`
- `AUTH_RATE_LIMIT_WINDOW_MS=<window size>`

### Optional Threshold Overrides

- `PERF_THRESHOLD_P95_MS_MAX`
- `PERF_THRESHOLD_ERROR_RATE_MAX`
- `PERF_THRESHOLD_AUTH_LOGIN_P95_MS_MAX`

These are experimental baselines, not business SLA values.

## Mutation Testing

Mutation scope uses controlled mutants against critical logic files:

- `src/services/auth.service.ts`
- `src/services/blog.service.ts`
- `src/services/report.service.ts`
- `src/middleware/authenticate.ts`

### Commands

- `npm run mutation:test`
- `npm run mutation:summary`

### Reports

- Raw report: `server/reports/mutation/mutation-report.json`
- Assignment artifact summary: `.tmp/qa/experimental/mutation/mutation-summary.json`
- Per-mutant execution logs: `.tmp/qa/experimental/mutation/*.log`

## Chaos / Fault Injection Testing

Implemented scenarios:

1. API downtime (`backend` container paused)
2. Database unavailable (`db` container stopped)
3. Network latency injection (best-effort `tc netem` in backend container; may report unsupported if unavailable)

### Commands

- `npm run chaos:run` (runs all scenarios by default)
- `CHAOS_SCENARIO=api-downtime CHAOS_ACTION=inject npm run chaos:inject`
- `CHAOS_SCENARIO=api-downtime CHAOS_ACTION=restore npm run chaos:restore`

### Important Safety Notes

- Chaos scripts operate on `docker-compose.backend.yml` services only.
- Faults are short-lived and reversible.
- Always run restore if interrupted.

## Unified Experimental Summary

After running one or more areas:

- `npm run experimental:summary`

This generates `.tmp/qa/experimental/experimental-summary.json` with aggregated artifacts and environment metadata.

## CI/CD

Use the separate workflow:

- `.github/workflows/experimental.yml`

Features:

- manual trigger (`workflow_dispatch`)
- optional scheduled run
- dedicated jobs for performance, mutation, chaos, summary
- uploads experimental artifacts separately from the fast QA workflow
