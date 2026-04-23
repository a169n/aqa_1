# How the Experimental Tests Work

This document explains the internals of each experimental testing area — what each script does step by step, what files it reads and writes, and how to interpret the output. Read this alongside the [operational guide](README.md) which covers commands and prerequisites.

---

## Table of Contents

1. [Shared infrastructure](#1-shared-infrastructure)
2. [Performance testing](#2-performance-testing)
3. [Mutation testing](#3-mutation-testing)
4. [Chaos / fault injection testing](#4-chaos--fault-injection-testing)
5. [Unified summary](#5-unified-summary)
6. [CI/CD pipeline](#6-cicd-pipeline)
7. [Output file reference](#7-output-file-reference)

---

## 1. Shared Infrastructure

All three areas share a small utility module at `server/src/experimental/common/artifacts.ts`:

```
experimentalRoot = <repo>/.tmp/qa/experimental/
```

| Export | Purpose |
|---|---|
| `experimentalRoot` | Absolute path to the artifact root — all scripts write under here |
| `timestamp()` | Returns `2026-04-23T09-50-40-509Z` (colons and dots replaced so it is safe as a directory name) |
| `ensureDir(path)` | `mkdir -p` equivalent — creates the directory and returns its path |
| `writeJson(path, value)` | Writes a pretty-printed JSON file with a trailing newline |

Nothing in the shared module touches the network or the database, so it is always safe to import.

---

## 2. Performance Testing

### Entry point

```
server/src/experimental/performance/run-performance.ts
```

Run via:
```
npm run dev:perf:server      # local API server with auth rate limiting disabled
npm run start:perf:server    # reset/build/start API server with auth rate limiting disabled
npm run perf:smoke   # normal scenario only (fast, ~35 s total)
npm run perf:full    # all four scenarios (~2.5 min total)
```

### What the script does, step by step

```
1. Read config from environment variables
        ↓
2. Log in as user@example.com  →  obtain userToken (JWT)
   Log in as admin@example.com →  obtain adminToken (JWT)
        ↓
3. For each scenario in the chosen profile:
   For each of the 5 endpoints:
        ↓
4.   Spawn N concurrent worker coroutines (Promise.all)
     Each worker:
       - waits rampUpSeconds × (workerIndex / N)   ← staggered start
       - loops: fetch endpoint → record latency → until durationSeconds elapsed
       - tracks: requests sent, failures (non-2xx or network error), latency samples
     A setInterval samples OS CPU load + process RSS every 1 s during the run
        ↓
5.   After all workers finish:
     - calculate avg, median, p95 from latency array
     - calculate throughput = totalRequests / elapsedSeconds
     - calculate errorRatePercent
     - compare p95 and errorRate against thresholds (p95 ≤ 800 ms, error ≤ 2%)
        ↓
6. Write .tmp/qa/experimental/performance/<runId>/performance-raw.json
   Write .tmp/qa/experimental/performance/<runId>/performance-summary.json
   Write .tmp/qa/experimental/performance/latest-performance-run.json
```

### Endpoints tested

| Name | Method | Path | Auth |
|---|---|---|---|
| `auth_login` | POST | `/api/auth/login` | none (sends credentials in body) |
| `auth_me` | GET | `/api/auth/me` | `Authorization: Bearer <userToken>` |
| `admin_reports_list` | GET | `/api/admin/reports` | `Authorization: Bearer <adminToken>` |
| `posts_list` | GET | `/api/posts` | none |
| `workspace_posts` | GET | `/api/workspace/posts` | `Authorization: Bearer <userToken>` |

### Scenario profiles

| Profile | Scenario | Concurrency | Duration | Ramp-up |
|---|---|---|---|---|
| `smoke` | normal | 6 VUs | 15 s | 4 s |
| `full` | normal | 8 VUs | 20 s | 5 s |
| `full` | peak | 20 VUs | 25 s | 6 s |
| `full` | spike | 30 VUs | 12 s | 1 s |
| `full` | endurance | 10 VUs | 60 s | 8 s |

**Ramp-up** works by spacing worker start times: worker `i` waits `rampUpSeconds × i / N` milliseconds before beginning requests. This avoids a thundering-herd cold start.

### How metrics are calculated

```
latency array = [t1, t2, t3, ... tN]  (one entry per HTTP response, in ms)

avg    = sum(latency) / count
median = percentile(latency, 50)
p95    = percentile(latency, 95)       ← sorted array, index = ceil(0.95 × N) - 1

throughput = totalRequests / elapsedSeconds
errorRate  = failures / totalRequests × 100
```

A request is a **failure** if `response.ok === false` (status ≥ 400) or if the `fetch` call throws (e.g. `ECONNREFUSED`, `ETIMEDOUT`). Failed requests still contribute their latency to the array.

### Output files

`performance-raw.json` — full record including every system sample and all execution parameters.

`performance-summary.json` — compact table used by the markdown summariser:
```json
{
  "runId": "2026-04-23T09-50-00-000Z",
  "scenarioProfile": "smoke",
  "generatedAt": "...",
  "summary": [
    {
      "endpoint": "auth_login",
      "module": "auth",
      "scenario": "normal",
      "averageLatencyMs": 43.12,
      "medianLatencyMs": 38.00,
      "p95LatencyMs": 118.00,
      "throughputRps": 10.70,
      "errorRatePercent": 0.000,
      "thresholdPass": { "errorRate": true, "p95": true }
    },
    ...
  ]
}
```

`latest-performance-run.json` — single-field pointer used by `perf:summary` and the unified summary script to locate the most recent run without scanning directories.

### Generating the markdown summary

```
npm run perf:summary
```

`summarize-performance.ts` reads `latest-performance-run.json`, loads the summary JSON it points to, formats a markdown table per scenario and per module aggregate, and writes `<runId>-summary.md` next to the JSON files.

### Thresholds and pass/fail

Both thresholds are configurable via environment variables — the defaults match the CI/CD pipeline:

| Threshold | Default | Env override |
|---|---|---|
| P95 latency | 800 ms | `PERF_THRESHOLD_P95_MS_MAX` |
| Error rate | 2% | `PERF_THRESHOLD_ERROR_RATE_MAX` |

The script does **not** exit with a non-zero code if thresholds are breached — it records `thresholdPass: false` in the JSON and logs a warning. Hard failure is enforced at the CI level if needed.

---

## 3. Mutation Testing

### Entry point

```
server/src/experimental/mutation/run-mutation.ts
```

Run via:
```
npm run mutation:test
```

### Core concept

Mutation testing answers: *"If a developer introduced a realistic bug here, would the test suite catch it?"*

The script introduces small, deliberate code changes (mutants) one at a time, runs the relevant tests, and checks whether the tests fail. A mutant that causes test failure is **killed** (good — the suite detected it). A mutant that lets all tests pass **survived** (bad — the suite has a blind spot).

```
Mutation Score = (Killed ÷ Created) × 100%
```

A 100% score means every tested mutation was caught.

### What the script does, step by step

```
For each mutant definition:
        ↓
1. Read the target source file into memory (originalContent)
        ↓
2. Verify the find string exists in the file
   (throws if not found — protects against stale mutant definitions)
        ↓
3. Write mutated file:  originalContent.replace(find, replace)
   (replaces first occurrence only)
        ↓
4. Run: npm run test --workspace server -- --run <test-files>
   using spawnSync (blocking — waits for the test process to exit)
        ↓
5. Restore original file (in finally block — always runs even if tests crash)
        ↓
6. Classify result:
   exitCode === 0  →  Survived  (tests passed despite the bug — BAD)
   exitCode !== 0  →  Killed    (tests failed because of the bug — GOOD)
        ↓
7. Write per-mutant log file: <mutant-id>.log
        ↓
After all mutants:
8. Calculate totals and per-module scores
9. Write mutation-summary.json  (in .tmp/qa/experimental/mutation/)
10. Write mutation-report.json  (in server/reports/mutation/)
```

### The 8 mutants — what each one tests

| ID | File | Original code | Mutated code | What breaks if it survives |
|---|---|---|---|---|
| `auth-login-negation` | `auth.service.ts` | `if (!matches) {` | `if (matches) {` | Login accepts wrong passwords and rejects correct ones — full auth bypass |
| `auth-refresh-expiry-check` | `auth.service.ts` | `expiresAt.getTime() < Date.now()` | `expiresAt.getTime() > Date.now()` | Expired tokens are accepted, valid tokens are rejected — session security broken |
| `authorization-admin-guard` | `authenticate.ts` | `role !== 'admin'` | `role === 'admin'` | Admins are blocked from admin endpoints; regular users are let through — full privilege escalation |
| `content-visibility-status` | `blog.service.ts` | `status === PUBLISHED` | `status !== PUBLISHED` | Drafts and archived posts are publicly visible; published posts return 404 |
| `content-report-target-validation` | `report.service.ts` | `!== 1` | `=== 1` | Reports with both targets or no target are accepted; valid single-target reports are rejected |
| `blog-like-duplicate-check` | `blog.service.ts` | `if (existingLike) {` | `if (!existingLike) {` | First like is always rejected; already-liked posts can be liked again — duplicate data |
| `blog-tag-count-validation` | `blog.service.ts` | `tags.length !== tagIds.length` | `tags.length === tagIds.length` | Posts referencing non-existent tag IDs are saved; posts with valid tags are rejected |
| `taxonomy-duplicate-category-guard` | `taxonomy.service.ts` | `existing && existing.id !== categoryId` | `!existing \|\| existing.id !== categoryId` | Renaming a category to a taken name is allowed; renaming to a free name is blocked |

### Actual results (run 2026-04-23T09:50:40)

All 8 mutants were killed. The summary JSON is at `.tmp/qa/experimental/mutation/mutation-summary.json`:

```
Module         Created   Killed   Survived   Score
auth               2        2        0       100%
authorization      2        2        0       100%
content            4        4        0       100%
─────────────────────────────────────────────────
Overall            8        8        0       100%
```

### File safety guarantee

The `restore` function is called in a `finally` block:

```typescript
try {
  restore = applyMutation(mutant);   // writes mutated file
  const testResult = runTests(...);  // runs tests
  // ...
} catch (error) {
  // ...
} finally {
  restore?.();                       // ALWAYS restores original
}
```

This means the source files are **never left in a mutated state** — not even if `runTests` throws, or if the script is interrupted mid-run. The only exception is an OS-level kill signal (SIGKILL), which cannot be caught.

### Generating a standalone summary

```
npm run mutation:summary
```

`summarize-mutation.ts` reads `server/reports/mutation/mutation-report.json`, filters for survived mutants (the interesting ones), and writes a compact JSON to `.tmp/qa/experimental/mutation/mutation-summary.json`. This is used by the unified summary step in CI.

---

## 4. Chaos / Fault Injection Testing

### Entry points

```
server/src/experimental/chaos/run-chaos.ts       ← runs one or all scenarios end-to-end
server/src/experimental/chaos/chaos-action.ts    ← inject or restore a single scenario manually
server/src/experimental/chaos/chaos-control.ts   ← actual fault injection/restore logic
```

Run via:
```
npm run chaos:run                              # all three scenarios sequentially
npm run chaos:inject                           # inject api-downtime manually
npm run chaos:restore                          # restore api-downtime manually
npm run chaos:inject:db                        # inject db-unavailable manually
npm run chaos:restore:db                       # restore db-unavailable manually
npm run chaos:inject:latency                   # inject network-latency manually
npm run chaos:restore:latency                  # restore network-latency manually
```

### Core concept

Chaos testing asks: *"When something breaks in production, does the system fail safely and recover quickly?"*

The script injects a controlled fault, probes the health endpoint continuously before, during, and after the fault, then measures:
- **Availability %** — how many probes returned `200 OK` out of the total
- **Recovery time (MTTR)** — milliseconds from fault restoration to first successful probe
- **Degradation mode** — `graceful` (no probe failures) or `user-visible-errors`

### What `run-chaos.ts` does, step by step

```
For each scenario in [api-downtime, db-unavailable, network-latency]:
        ↓
1. PRE-FAULT phase: probe /api/health every 1 s for 3 s
   (confirms system is healthy before injecting)
        ↓
2. INJECT fault:  call injectFault(scenario)
        ↓
3. DURING-FAULT phase: probe every 1 s for durationSeconds (default 20 s)
        ↓
4. RESTORE fault: call restoreFault(scenario)
   record restoredAt = Date.now()
        ↓
5. POST-FAULT phase: probe every 1 s for 5 s
   find firstHealthyAfterRestore → recoveryMs = its timestamp − restoredAt
        ↓
6. Calculate metrics:
   availabilityPercent = successfulProbes / totalProbes × 100
   degradationMode     = failedProbes > 0 ? 'user-visible-errors' : 'graceful'
        ↓
7. Write .tmp/qa/experimental/chaos/<runId>/chaos-summary.json
   Write .tmp/qa/experimental/chaos/latest-chaos-run.json
```

### What each fault does

#### `api-downtime`

```typescript
// inject
docker compose -f docker-compose.backend.yml pause backend
// restore
docker compose -f docker-compose.backend.yml unpause backend
```

`docker pause` sends `SIGSTOP` to all processes in the container. The container keeps its network interface but stops processing any requests. New TCP connections are refused immediately. Existing keep-alive connections time out. The database container keeps running.

**Why use pause instead of stop?** `stop` would kill the process and require re-initialisation on start. `pause` simulates a hung process (e.g. CPU spike, memory pressure causing scheduling starvation) and allows instant recovery with `unpause`.

#### `db-unavailable`

```typescript
// inject
docker compose -f docker-compose.backend.yml stop db
// restore
docker compose -f docker-compose.backend.yml start db
```

The database container is stopped. The Express server process keeps running. TypeORM's connection pool starts receiving connection errors on the next query. The `/api/health` endpoint attempts a DB ping and returns `503 Service Unavailable` with the database marked as down. The API server does **not** crash.

Recovery is slower than API downtime because PostgreSQL needs to replay its WAL (write-ahead log) on startup — typically 2–5 seconds.

#### `network-latency`

```typescript
// inject
docker exec inkwell-backend sh -lc "tc qdisc replace dev eth0 root netem delay 400ms"
// restore
docker exec inkwell-backend sh -lc "tc qdisc del dev eth0 root"
```

`tc netem` (Linux Traffic Control — Network Emulator) adds an artificial 400 ms delay to every outgoing packet from the backend container's `eth0` interface. This affects:
- Responses sent back to the client (health probes see +400 ms latency)
- Outgoing connections to the database (queries take +400 ms extra per round-trip)

If `tc` is unavailable in the container (no `iproute2` installed or insufficient privileges), the script logs a warning and skips injection — it does **not** fail the run.

### The health probe

Every probe calls:
```
GET <baseUrl>/api/health
```

and records:
```json
{
  "timestamp": "2026-04-23T09:51:00.000Z",
  "ok": true,
  "status": 200,
  "latencyMs": 8,
  "error": null
}
```

`ok` is `false` if the response status is ≥ 400, if the fetch throws (connection refused, timeout), or if the status is `null` (network-level failure before any HTTP response).

### Manual fault injection

`chaos-action.ts` lets you inject or restore a single scenario manually — useful for local debugging or testing your monitoring setup:

```bash
npm run chaos:inject
npm run chaos:restore

npm run chaos:inject:db
npm run chaos:restore:db

npm run chaos:inject:latency
npm run chaos:restore:latency
```

> **Safety:** always run restore after inject. The run-chaos.ts orchestrator does this automatically, but manual injection leaves the fault active until you restore it.

---

## 5. Unified Summary

### Entry point

```
server/src/experimental/generate-experimental-summary.ts
```

Run via:
```
npm run experimental:summary
```

To run all experimental areas locally and then generate the same unified summary:

```
npm run experimental:run
```

The all-in-one runner starts a performance-mode API server with auth rate limiting disabled, runs the selected
performance profile, runs mutation testing, runs Docker Compose chaos scenarios, and then writes
`.tmp/qa/experimental/experimental-summary.json`. Use `EXPERIMENTAL_PERFORMANCE_PROFILE=full` for the full
performance profile or `EXPERIMENTAL_RUN_CHAOS=false` to skip Docker-based chaos scenarios.
By default, the runner refuses to continue if another API server is already responding on `PERF_BASE_URL`; set
`EXPERIMENTAL_USE_EXISTING_SERVER=true` only when that is intentional.
For chaos, the runner searches for free host ports starting from `14000` for the backend and `15432` for Postgres;
override those starting points with `CHAOS_BACKEND_HOST_PORT` and `CHAOS_DB_HOST_PORT` if needed.

### What it does

Reads the three "latest run" pointer files and aggregates everything into one JSON:

```
.tmp/qa/experimental/performance/latest-performance-run.json
  → loads the performance-summary.json it points to

.tmp/qa/experimental/mutation/mutation-summary.json
  → read directly

.tmp/qa/experimental/chaos/latest-chaos-run.json
  → loads the chaos-summary.json it points to
```

Outputs `.tmp/qa/experimental/experimental-summary.json`:

```json
{
  "generatedAt": "2026-04-23T09:52:00.000Z",
  "environment": {
    "nodeVersion": "v20.19.0",
    "platform": "win32",
    "cpuModel": "Intel(R) Core(TM) i7-...",
    "totalMemoryBytes": 17179869184
  },
  "artifacts": {
    "performance": { ... summary entries ... },
    "mutation":    { ... totals and per-module scores ... },
    "chaos":       { ... per-scenario metrics ... }
  }
}
```

Missing areas produce `null` in the corresponding field — so the summary step succeeds even if only one or two areas have been run.

---

## 6. CI/CD Pipeline

File: `.github/workflows/experimental.yml`

### Triggers

| Trigger | When |
|---|---|
| `workflow_dispatch` | Manually from GitHub Actions UI |
| `schedule: 0 6 * * 1` | Every Monday at 06:00 UTC |

Inputs available on manual dispatch:
- `performance_profile` — `smoke` (default) or `full`
- `run_chaos` — `true` (default) or `false`

### Job graph

```
performance-tests
      │
      ▼
mutation-tests
      │
      ▼
chaos-tests  (skipped if run_chaos=false)
      │
      ▼
experimental-summary  (runs even if earlier jobs fail — if: always())
```

### How each job is set up

**performance-tests** and **mutation-tests** both spin up a real PostgreSQL 16 service container. The performance job additionally builds and starts the Express server in the background, polls `/api/health` until it responds (up to 45 × 2 s = 90 s), then runs the load tests.

**chaos-tests** uses `docker compose -f docker-compose.backend.yml up -d --build` to launch both the backend and database containers in Docker-in-Docker mode (GitHub's `ubuntu-latest` runner supports this). This is required because the chaos scenarios manipulate containers by name.

**experimental-summary** downloads the artifacts uploaded by the three earlier jobs, restores them to the expected directory layout, and runs `npm run experimental:summary`.

### Artifacts produced

| Artifact name | Content |
|---|---|
| `experimental-performance` | `.tmp/qa/experimental/performance/**` |
| `experimental-mutation` | `server/reports/mutation/**` and `.tmp/qa/experimental/mutation/**` |
| `experimental-chaos` | `.tmp/qa/experimental/chaos/**` |
| `experimental-summary` | `.tmp/qa/experimental/experimental-summary.json` |

---

## 7. Output File Reference

```
.tmp/qa/experimental/
├── performance/
│   ├── latest-performance-run.json          ← pointer: { runId, rawPath, summaryPath }
│   └── <runId>/
│       ├── performance-raw.json             ← full run data with system samples
│       ├── performance-summary.json         ← compact per-endpoint table
│       └── <runId>-summary.md              ← human-readable markdown (from perf:summary)
│
├── mutation/
│   ├── mutation-summary.json                ← totals, per-module scores, survived mutants
│   └── <mutant-id>.log                      ← stdout+stderr from each test run
│
├── chaos/
│   ├── latest-chaos-run.json               ← pointer: { runId, outputPath }
│   └── <runId>/
│       └── chaos-summary.json              ← per-scenario metrics and probe samples
│
└── experimental-summary.json               ← unified summary across all three areas

server/reports/mutation/
└── mutation-report.json                    ← full mutant list with status and logPaths
```

### How to read `chaos-summary.json`

```json
{
  "scenario": "api-downtime",
  "metrics": {
    "availabilityPercent": 25.0,
    "totalProbeSamples": 28,
    "failedProbeSamples": 21,
    "recoveryMs": 182,
    "degradationMode": "user-visible-errors"
  },
  "probes": {
    "pre":    [ ... 3 samples before injection ... ],
    "during": [ ... 20 samples during fault ... ],
    "post":   [ ... 5 samples after restore ... ]
  }
}
```

`recoveryMs` is the time between calling `restoreFault()` and the timestamp of the first probe in `post` that returned `ok: true`. If the system never recovered within the post window, `recoveryMs` is `null`.

### How to read `mutation-summary.json`

```json
{
  "generatedAt": "2026-04-23T09:50:40.509Z",
  "strategy": "controlled-mutants-script",
  "totals": {
    "created": 8,
    "killed": 8,
    "survived": 0,
    "errors": 0,
    "mutationScore": 100
  },
  "modules": {
    "auth":          { "created": 2, "killed": 2, "survived": 0, "mutationScore": 100 },
    "authorization": { "created": 2, "killed": 2, "survived": 0, "mutationScore": 100 },
    "content":       { "created": 4, "killed": 4, "survived": 0, "mutationScore": 100 }
  },
  "mutants": [ ... per-mutant entries with status, exitCode, logPath ... ]
}
```

A mutant with `"status": "Error"` means the mutation script itself threw (e.g. the `find` string was not found in the source file). This is different from `"Survived"` — it means the mutant was never actually applied and the score should be re-evaluated after fixing the definition.
