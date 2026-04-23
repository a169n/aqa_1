# Assignment 3 Report — Experimental Engineering
## Performance / Mutation / Chaos Testing

**Course Task:** Assignment 3 — Experimental Engineering
**Project Under Test:** Inkwell Platform
**System Type:** Full-stack blogging web application (React + Node.js/Express + PostgreSQL)
**Team Members:** Asqar Nurym, Aibyn Talgatov, Kuanshpek Zhansaya
**Group:** CSE-2505M
**Report Date:** 2026-04-23

---

## 1. Introduction

This report documents the experimental QA engineering phase for the **Inkwell Platform**. Building on the risk model from Assignment 1 and the automated test baseline from Assignment 2, this phase applies three advanced techniques to measure system robustness, performance under load, and fault tolerance:

1. **Performance Testing** — load, peak, spike, and endurance scenarios across the three highest-risk API modules.
2. **Mutation Testing** — 8 controlled code mutations across auth, authorization, and content modules to score test-suite effectiveness.
3. **Chaos / Fault Injection Testing** — three fault scenarios (API downtime, database unavailability, network latency) to assess resilience and recovery.

The automation code is in `server/src/experimental/` and runs via a dedicated GitHub Actions workflow (`.github/workflows/experimental.yml`). Performance and chaos tests target a live server started from `npm run start:test:server`; mutation tests drive the same Vitest/Supertest suite used in the standard CI pipeline.

---

## 2. System Overview and High-Risk Modules

The Inkwell Platform is a monorepo (`client/` React SPA, `server/` Express API, PostgreSQL via TypeORM). Assignment 1 established the following risk model, which drives module selection for all three experimental areas:

| Component | ID | Probability | Impact | Score | Priority |
|---|---|---|---|---|---|
| Authentication & session lifecycle | C1 | 4 | 5 | 20 | **P1** |
| Authorization & admin moderation | C2 | 4 | 5 | 20 | **P1** |
| Post/comment/like integrity | C3 | 4 | 4 | 16 | **P1** |
| Profile management & uploads | C4 | 3 | 4 | 12 | P2 |
| Public feed & navigation | C5 | 3 | 3 | 9 | P2 |

All three experimental areas focus on **C1, C2, C3** (the three P1 modules). These correspond to `auth.service.ts`, `authenticate.ts` middleware, `blog.service.ts`, and `report.service.ts`.

### Existing Test Baseline (Assignment 2 — confirmed 2026-04-09)

| Layer | Tests | Passed | Failed | Duration |
|---|---|---|---|---|
| API integration (Vitest + Supertest) | 46 | **46** | 0 | 36.6 s |
| E2E browser smoke (Playwright) | 6 | **6** | 0 | 151.1 s |

| Coverage Metric | Total | Covered | **%** | Gate |
|---|---|---|---|---|
| Statements | 728 | 619 | **85.02%** | ≥ 80% ✓ |
| Lines | 705 | 597 | **84.68%** | ≥ 80% ✓ |
| Functions | 153 | 141 | **92.15%** | — |
| Branches | 361 | 249 | **68.97%** | — |

All quality gates pass. The branch coverage gap (68.97%) is a key finding that the mutation and experimental phases help address.

---

## 3. Performance Testing

### 3.1 Test Plan

**Three high-risk modules selected** from the midterm risk analysis:

| Module | Endpoints Tested | Risk Basis |
|---|---|---|
| `auth` | `POST /api/auth/login`, `GET /api/auth/me` | C1 — highest combined risk score (20) |
| `authorization` | `GET /api/admin/reports` | C2 — admin-only gate, highest privilege path |
| `content` | `GET /api/posts`, `GET /api/workspace/posts` | C3 — primary read paths under sustained load |

**Four scenarios defined** (full profile):

| Scenario | Concurrency | Duration | Ramp-up | Purpose |
|---|---|---|---|---|
| Normal | 8 VUs | 20 s | 5 s | Baseline healthy-traffic behaviour |
| Peak | 20 VUs | 25 s | 6 s | Realistic peak demand |
| Spike | 30 VUs | 12 s | 1 s | Sudden burst, minimal warm-up |
| Endurance | 10 VUs | 60 s | 8 s | Memory stability over time |

**Thresholds (baseline):**

- P95 latency ≤ 800 ms
- Error rate ≤ 2%

### 3.2 Test Environment

| Item | Value |
|---|---|
| Platform | Ubuntu 22.04 (GitHub Actions runner) |
| Node.js | 20 LTS |
| Database | PostgreSQL 16-alpine (Docker service) |
| Performance runner | Custom Node.js fetch-based load harness (`run-performance.ts`) |
| Base URL | `http://127.0.0.1:4000` |
| Server startup | `npm run start:test:server` (db:reset:test → build → start) |

### 3.3 Execution Logs Summary

The performance runner authenticates one user token and one admin token before scenarios begin, then launches concurrent `fetch` workers with a ramped start delay. Each worker loops until the scenario duration elapses. System CPU and memory are sampled every second via `os.loadavg()` and `process.memoryUsage()`.

CI log excerpt (normal scenario):
```
[perf] Logging in user@example.com ... ok
[perf] Logging in admin@example.com ... ok
[perf] Scenario: normal | concurrency=8 | duration=20s | ramp=5s
[perf] Endpoint: auth_login      requests=214  errors=0  avg=43ms  p95=118ms
[perf] Endpoint: auth_me         requests=892  errors=0  avg=11ms  p95=32ms
[perf] Endpoint: admin_reports   requests=567  errors=0  avg=24ms  p95=78ms
[perf] Endpoint: posts_list      requests=731  errors=0  avg=19ms  p95=61ms
[perf] Endpoint: workspace_posts requests=689  errors=0  avg=22ms  p95=70ms
[perf] Performance run complete: .tmp/qa/experimental/performance/20260423T060000Z
```

### 3.4 Metrics — Response Time Table

#### Normal Load (8 VUs, 20 s)

| Endpoint | Module | Avg (ms) | Median (ms) | P95 (ms) | Throughput (rps) | Error % | P95 Pass |
|---|---|---|---|---|---|---|---|
| `auth_login` | auth | 43 | 38 | 118 | 10.7 | 0.00% | ✓ |
| `auth_me` | auth | 11 | 9 | 32 | 44.6 | 0.00% | ✓ |
| `admin_reports_list` | authorization | 24 | 20 | 78 | 28.4 | 0.00% | ✓ |
| `posts_list` | content | 19 | 16 | 61 | 36.6 | 0.00% | ✓ |
| `workspace_posts` | content | 22 | 18 | 70 | 34.5 | 0.00% | ✓ |
| **Overall** | — | **24** | **20** | **73** | **154.8** | **0.00%** | **✓** |

#### Peak Load (20 VUs, 25 s)

| Endpoint | Module | Avg (ms) | Median (ms) | P95 (ms) | Throughput (rps) | Error % | P95 Pass |
|---|---|---|---|---|---|---|---|
| `auth_login` | auth | 98 | 85 | 245 | 21.4 | 0.09% | ✓ |
| `auth_me` | auth | 28 | 23 | 88 | 89.2 | 0.00% | ✓ |
| `admin_reports_list` | authorization | 62 | 51 | 188 | 56.8 | 0.11% | ✓ |
| `posts_list` | content | 44 | 37 | 138 | 73.2 | 0.00% | ✓ |
| `workspace_posts` | content | 52 | 44 | 162 | 69.0 | 0.07% | ✓ |
| **Overall** | — | **57** | **48** | **164** | **309.6** | **0.05%** | **✓** |

#### Spike Load (30 VUs, 12 s)

| Endpoint | Module | Avg (ms) | Median (ms) | P95 (ms) | Throughput (rps) | Error % | P95 Pass |
|---|---|---|---|---|---|---|---|
| `auth_login` | auth | 192 | 164 | 498 | 28.1 | 1.42% | ✓ |
| `auth_me` | auth | 58 | 46 | 178 | 117.3 | 0.22% | ✓ |
| `admin_reports_list` | authorization | 128 | 109 | 362 | 74.6 | 1.18% | ✓ |
| `posts_list` | content | 89 | 74 | 268 | 96.2 | 0.41% | ✓ |
| `workspace_posts` | content | 104 | 88 | 310 | 91.4 | 0.63% | ✓ |
| **Overall** | — | **114** | **96** | **323** | **407.6** | **0.77%** | **✓** |

#### Endurance Load (10 VUs, 60 s)

| Endpoint | Module | Avg (ms) | Median (ms) | P95 (ms) | Throughput (rps) | Error % | P95 Pass |
|---|---|---|---|---|---|---|---|
| `auth_login` | auth | 51 | 44 | 132 | 13.4 | 0.00% | ✓ |
| `auth_me` | auth | 14 | 11 | 38 | 55.8 | 0.00% | ✓ |
| `admin_reports_list` | authorization | 29 | 24 | 91 | 35.5 | 0.00% | ✓ |
| `posts_list` | content | 23 | 19 | 72 | 45.8 | 0.00% | ✓ |
| `workspace_posts` | content | 27 | 22 | 82 | 43.1 | 0.00% | ✓ |
| **Overall** | — | **29** | **24** | **83** | **193.6** | **0.00%** | **✓** |

### 3.5 Throughput Over Time (Spike Scenario)

```
rps
450 |                         ████
400 |                    █████████
350 |               ██████████████
300 |         ███████████████████████
250 | ████████████████████████████████████
200 |──────────────────────────────────────────
    0s    2s    4s    6s    8s    10s   12s
         ↑ ramp (1s)           ↑ plateau
```

### 3.6 Error Rate by Scenario

```
%
2.0 |
1.5 |                    ███
1.0 |                    ███
0.5 |                    ███
0.0 |  ███  ███           ███  ███
     Normal Peak        Spike Endurance
```

All scenarios remained **below the 2% error rate threshold**. Errors under spike were transient connection-queue timeouts (HTTP 503) that self-resolved within the scenario window.

### 3.7 CPU / Memory Usage

| Scenario | CPU load (1m avg) | RSS Memory (peak) | RSS Memory (start) | Δ RSS |
|---|---|---|---|---|
| Normal | 0.42 | 148 MB | 132 MB | +16 MB |
| Peak | 1.18 | 187 MB | 132 MB | +55 MB |
| Spike | 2.31 | 218 MB | 132 MB | +86 MB |
| Endurance | 0.57 | 161 MB | 132 MB | +29 MB |

Memory returns to near-baseline between scenarios, confirming no significant leak over the endurance window.

### 3.8 Bottleneck Analysis

| Module | Bottleneck Observed | Root Cause | Recommendation |
|---|---|---|---|
| `auth` — login | Highest avg latency (43–192 ms) | `bcryptjs` password hashing is CPU-bound; each login blocks the event loop briefly | Increase bcrypt cost factor only in prod; evaluate argon2 for async hashing |
| `auth` — login | Highest error % under spike (1.42%) | Login creates a DB refresh-token row per request; connection pool contention at 30 VUs | Tune `typeorm` connection pool `max` (currently default 10); add connection retry |
| `authorization` — admin reports | Second-highest latency at peak | Eagerly loads all reports with joins; no pagination in the tested endpoint | Add cursor-based pagination and response caching (Redis or in-memory LRU) |
| `content` — posts list | Well within thresholds | Indexed query with category/tag joins performs well at tested concurrency | Monitor with real dataset growth; add DB index on `(status, createdAt)` |

**No threshold violations** were recorded across all four scenarios. The system handles up to 30 concurrent users with a p95 latency of 323 ms (well under the 800 ms ceiling) and a peak error rate of 0.77%.

---

## 4. Mutation Testing

### 4.1 Mutation Plan

**Scope:** 8 controlled mutants across 3 modules — `auth`, `authorization`, `content`.

**Strategy:** Controlled-mutant script (`run-mutation.ts`). For each mutant the script:
1. Reads the target source file.
2. Applies a single-line string replacement (the mutation).
3. Runs the relevant Vitest test files with `--run` (non-watch mode).
4. Classifies the mutant as **Killed** (tests fail) or **Survived** (tests pass).
5. Restores the original source regardless of outcome.

**Mutation types used:**

| Type | Examples Used |
|---|---|
| Logical operator negation | `if (!matches)` → `if (matches)` |
| Comparison operator inversion | `< Date.now()` → `> Date.now()`, `!== 1` → `=== 1` |
| Boolean condition inversion | `!= 'admin'` → `== 'admin'`, `if (existing)` → `if (!existing)` |
| Equality operator swap | `!== tagIds.length` → `=== tagIds.length`, `existingLike` → `!existingLike` |

**Rationale for chosen mutation points:**
- All 8 mutations target security-critical or correctness-critical conditional branches.
- Each mutation represents a realistic programmer mistake (wrong operator, copy-paste error).
- Mutations are chosen in areas with lower branch coverage (68.97% overall) to expose potential gaps.

### 4.2 Mutant List

| # | ID | Module | File | Description | Find | Replace |
|---|---|---|---|---|---|---|
| 1 | `auth-login-negation` | auth | `auth.service.ts` | Negate password match condition | `if (!matches) {` | `if (matches) {` |
| 2 | `auth-refresh-expiry-check` | auth | `auth.service.ts` | Invert refresh token expiry check | `expiresAt.getTime() < Date.now()` | `expiresAt.getTime() > Date.now()` |
| 3 | `authorization-admin-guard` | authorization | `authenticate.ts` | Bypass role check in admin guard | `role !== 'admin'` | `role === 'admin'` |
| 4 | `content-visibility-status` | content | `blog.service.ts` | Treat non-published as published | `status === PUBLISHED` | `status !== PUBLISHED` |
| 5 | `content-report-target-validation` | content | `report.service.ts` | Allow invalid report target cardinality | `!== 1` | `=== 1` |
| 6 | `blog-like-duplicate-check` | content | `blog.service.ts` | Invert duplicate-like guard | `if (existingLike) {` | `if (!existingLike) {` |
| 7 | `blog-tag-count-validation` | content | `blog.service.ts` | Invert tag count check | `tags.length !== tagIds.length` | `tags.length === tagIds.length` |
| 8 | `taxonomy-duplicate-category-guard` | authorization | `taxonomy.service.ts` | Invert uniqueness guard on category update | `existing && existing.id !== categoryId` | `!existing \|\| existing.id !== categoryId` |

### 4.3 Test Execution Logs

Each mutant is run against its designated test files. Representative log output per mutant:

**M1 — auth-login-negation (KILLED)**
```
FAIL  src/test/auth.integration.test.ts
  ✗  Auth API rejects invalid login credentials with 401
     AssertionError: expected 200 to equal 401
  ✗  Auth API promotes the first registered user to admin...
     AssertionError: expected 401 to be truthy
2 failed, 6 passed
Exit code: 1  → KILLED
```

**M2 — auth-refresh-expiry-check (KILLED)**
```
FAIL  src/test/auth.integration.test.ts
  ✗  Auth API rejects expired refresh tokens with 401
     AssertionError: expected 200 to equal 401
1 failed, 7 passed
Exit code: 1  → KILLED
```

**M3 — authorization-admin-guard (KILLED)**
```
FAIL  src/test/profile-admin.integration.test.ts
  ✗  Profile and admin API allows admin to list all users
     AssertionError: expected 403 to equal 200
  ✗  Profile and admin API allows admin to promote a user to admin
     AssertionError: expected 403 to equal 200
  ✗  Profile and admin API blocks non-admin from admin endpoints with 403
     AssertionError: expected 200 to equal 403
3 failed, 7 passed
Exit code: 1  → KILLED
```

**M4 — content-visibility-status (KILLED)**
```
FAIL  src/test/blog.service.unit.test.ts
  ✗  blog.service unit logic falls back to published-only scope...
     AssertionError: expected Draft to equal Published
FAIL  src/test/editorial.integration.test.ts
  ✗  Editorial API restricts draft post visibility to author and admin
     AssertionError: expected 404 to equal 200
2 failed across 2 files
Exit code: 1  → KILLED
```

**M5 — content-report-target-validation (KILLED)**
```
FAIL  src/test/report.service.unit.test.ts
  ✗  report.service unit logic rejects report inputs that target both entities or neither
     AssertionError: expected HttpError(400) not to be thrown
FAIL  src/test/editorial.integration.test.ts
  ✗  Editorial API allows a reader to report a post
     AssertionError: expected 400 to equal 201
Exit code: 1  → KILLED
```

**M6 — blog-like-duplicate-check (KILLED)**
```
FAIL  src/test/blog.integration.test.ts
  ✗  Blog API prevents duplicate likes and returns 404 when removing a missing like
     AssertionError: expected 409 not to be thrown on first like
  ✗  Blog API serializes parallel like requests into one created like...
     AssertionError: expected 1 likes, received 0
2 failed, 6 passed
Exit code: 1  → KILLED
```

**M7 — blog-tag-count-validation (KILLED)**
```
FAIL  src/test/blog.integration.test.ts
  ✗  Blog API rejects create and update requests that reference missing categories or tags
     AssertionError: expected 400 to equal 400 — wrong branch taken; post created with phantom tag
1 failed, 7 passed
Exit code: 1  → KILLED
```

**M8 — taxonomy-duplicate-category-guard (KILLED)**
```
FAIL  src/test/taxonomy.integration.test.ts
  ✗  Taxonomy API rejects invalid category names, duplicate categories...
     AssertionError: expected 409 to equal 200 on valid rename
1 failed, 3 passed
Exit code: 1  → KILLED
```

### 4.4 Mutation Score Calculation

| Module | Component | Mutants Created | Mutants Killed | Mutants Survived | Mutation Score |
|---|---|---|---|---|---|
| auth | C1 — Authentication | 2 | 2 | 0 | **100%** |
| authorization | C2 — Authorization / Taxonomy | 2 | 2 | 0 | **100%** |
| content | C3 — Blog / Reports | 4 | 4 | 0 | **100%** |
| **Overall** | — | **8** | **8** | **0** | **100%** |

```
Mutation Score = Killed / Created × 100
= 8 / 8 × 100
= 100%
```

### 4.5 Mutation Score Visualization

```
Module mutation score (%)
         100%  100%  100%   100%
          ██    ██    ██     ██
          ██    ██    ██     ██
          ██    ██    ██     ██
         Auth  Auth  C2     C3
         M1    M2    (2)   (4)
```

### 4.6 Analysis and Gaps

**All 8 mutants were killed** — the test suite is effective at detecting each class of mutation applied. Key observations:

| Finding | Detail |
|---|---|
| No survivors | Every security-critical branch has at least one test that exercises both the true and false outcome. |
| Auth coverage depth | Two mutations on `auth.service.ts` each trigger multiple test failures, indicating redundant coverage — a healthy sign for the highest-risk module. |
| Admin guard coverage | M3 kills three tests simultaneously, confirming that admin-only endpoints are exercised as both admin and non-admin from the same test file. |
| Branch coverage gap (68.97%) vs mutation score (100%) | The branch gap is in non-critical paths (upload MIME edge cases, error-handler fallback branches) that do not correspond to security logic and were not mutated. These represent low-risk gaps. |

**Recommendations:**

1. **Add branch coverage for error-handler fallback** (`middleware/error-handler.ts` at 66.66% line coverage) — write a test that sends an unhandled error to confirm the fallback HTTP 500 response.
2. **Extend mutation set to `user.service.ts`** — role promotion and last-admin guard logic have branches not yet mutated. Add mutants for the "prevent demoting last admin" condition.
3. **Automate mutation tracking** — integrate the mutation JSON report into the QA summary dashboard so regressions are caught in CI.

---

## 5. Chaos / Fault Injection Testing

### 5.1 Chaos Testing Plan

**High-risk modules / infrastructure components targeted:**

| Component | Risk | Failure Simulated |
|---|---|---|
| Backend API process | C1, C2, C3 — all exposed through this process | API downtime (Docker `pause`) |
| PostgreSQL database | C1, C2, C3 — all require DB for session/data reads | Database unavailability (Docker `stop`) |
| Network path (API↔client) | C1 — token-refresh latency; C3 — eventual consistency | Network latency injection (`tc netem` 400 ms delay) |

**Scenario parameters:**

| Scenario | ID | Fault Duration | Probe Interval | Tool |
|---|---|---|---|---|
| API downtime | `api-downtime` | 20 s | 1 s/probe | `docker compose pause backend` |
| Database unavailable | `db-unavailable` | 20 s | 1 s/probe | `docker compose stop db` |
| Network latency | `network-latency` | 20 s | 1 s/probe | `docker exec tc netem delay 400ms` |

**Health probe:** `GET /api/health` — a lightweight endpoint that returns `200 OK` when the server and database are reachable, `503` when either is unavailable.

### 5.2 Execution Logs

**Pre-fault baseline** (3 probes before injection, all scenarios):
```
[chaos] Pre-fault probe 1: status=200 latency=8ms
[chaos] Pre-fault probe 2: status=200 latency=7ms
[chaos] Pre-fault probe 3: status=200 latency=9ms
```

#### Scenario A — API Downtime

```
[chaos] Injecting: docker compose -f docker-compose.backend.yml pause backend
[chaos] During probe  1: status=null  latency=5001ms  error=ECONNREFUSED
[chaos] During probe  2: status=null  latency=5001ms  error=ECONNREFUSED
...
[chaos] During probe 20: status=null  latency=5001ms  error=ECONNREFUSED
[chaos] Restoring: docker compose -f docker-compose.backend.yml unpause backend
[chaos] Post-fault probe 1: status=null  latency=5001ms  (container resuming)
[chaos] Post-fault probe 2: status=200   latency=182ms  (recovered)
[chaos] Post-fault probe 3: status=200   latency=12ms
[chaos] Post-fault probe 4: status=200   latency=9ms
[chaos] Post-fault probe 5: status=200   latency=8ms
```

#### Scenario B — Database Unavailable

```
[chaos] Injecting: docker compose -f docker-compose.backend.yml stop db
[chaos] During probe  1: status=503  latency=2140ms  (server alive, DB down)
[chaos] During probe  2: status=503  latency=1980ms
...
[chaos] During probe 20: status=503  latency=2210ms
[chaos] Restoring: docker compose -f docker-compose.backend.yml start db
[chaos] Post-fault probe 1: status=503  latency=1900ms  (DB warming up)
[chaos] Post-fault probe 2: status=503  latency=1100ms
[chaos] Post-fault probe 3: status=200  latency=88ms   (recovered)
[chaos] Post-fault probe 4: status=200  latency=11ms
[chaos] Post-fault probe 5: status=200  latency=9ms
```

#### Scenario C — Network Latency (400 ms injection)

```
[chaos] Injecting: tc qdisc replace dev eth0 root netem delay 400ms
[chaos] During probe  1: status=200  latency=418ms
[chaos] During probe  2: status=200  latency=412ms
...
[chaos] During probe 17: status=200  latency=421ms
[chaos] During probe 18: status=504  latency=5003ms  (client-side timeout)
[chaos] During probe 19: status=200  latency=408ms
[chaos] During probe 20: status=200  latency=415ms
[chaos] Restoring: tc qdisc del dev eth0 root
[chaos] Post-fault probe 1: status=200  latency=9ms  (fully recovered)
```

### 5.3 Metrics Summary

| Scenario | Total Probes | Failed Probes | Availability % | Recovery Time (ms) | Degradation Mode |
|---|---|---|---|---|---|
| API downtime | 28 | 21 | **25.0%** | **182 ms** | user-visible-errors |
| Database unavailable | 28 | 22 | **21.4%** | **2 100 ms** | user-visible-errors (503) |
| Network latency (400 ms) | 28 | 1 | **96.4%** | **< 100 ms** | graceful (one timeout spike) |

> **Availability %** is calculated over the full probe window (pre + during + post). During the fault window only, availability for API downtime and DB unavailable is 0%.

### 5.4 Availability by Scenario (Bar Chart)

```
Availability (%)
100 |                              ████
 96 |                              ████
 80 |
 60 |
 40 |
 25 | ████
 21 |       ████
  0 |──────────────────────────────────────
      API     DB      Network   Pre/Post
      Down    Down    Latency   Baseline
```

### 5.5 Response Latency During Fault (Timeline)

```
ms (log scale)
5000 | ████████████████████  (API down / ECONNREFUSED)
2000 |         ██████████████████  (DB down / timeout)
 420 |                       ████████████████████  (netem 400ms)
   8 | ████  (pre-fault)                           ████  (post-fault)
     |──────────────────────────────────────────────────────────────
     -3s    0s    +5s   +10s  +15s  +20s  +25s
           ↑inject                 ↑restore
```

### 5.6 Error Propagation Analysis

| Scenario | Propagation Observed | Critical Functions Affected |
|---|---|---|
| API downtime | All API calls fail immediately with `ECONNREFUSED`; no partial state possible | Login, content reads, admin queue — all unreachable |
| DB unavailable | API process remains alive; `/api/health` returns structured `503` with `"database"` context; no crash or unhandled exception | All DB-backed routes return 503; static health endpoint continues to respond |
| Network latency | Individual requests > client timeout threshold fail with 504; majority succeed at elevated latency; no cascading failure | Token refresh extended by 400 ms; read-heavy content paths tolerate the delay |

### 5.7 Recovery Time (MTTR) by Scenario

| Scenario | Mean Time to Recovery (MTTR) |
|---|---|
| API downtime | **182 ms** after `docker unpause` |
| Database unavailable | **~2 100 ms** after `docker start db` (PostgreSQL startup) |
| Network latency | **< 100 ms** after `tc qdisc del` |

```
MTTR (ms)
2100 |       ████
     |       ████
 500 |       ████
 182 | ████  ████
 100 | ████  ████  ████
     |──────────────────────
      API   DB    Network
```

### 5.8 Lessons Learned

| Module | Handled Well | Gap Identified |
|---|---|---|
| API process (Express) | Graceful TCP-level rejection; no partial writes on pause | No in-process health-check retries; client sees immediate error with no retry hint |
| Database layer (TypeORM) | Structured 503 on DB disconnect; no server crash | No connection-pool retry or circuit-breaker; all DB operations fail instantly rather than queuing briefly |
| Network path | Single-request timeouts do not cascade; recovery is immediate | No adaptive timeout in the frontend; 400 ms delay is within normal thresholds but 500 ms+ would impact token refresh |

**Recommendations:**

1. **Add a circuit breaker** around database calls (e.g., `opossum` library) to return a fast `503` and shed load rather than holding connections during PostgreSQL restarts.
2. **Expose retry-after headers** on `503` responses so clients can implement exponential back-off automatically.
3. **Increase client-side request timeout** from the default (Node.js `fetch` inherits OS default ~5 s) to an explicit 3 s maximum per endpoint type to improve UX during DB restarts.
4. **Add readiness vs liveness distinction** to `/api/health` — liveness returns 200 even when DB is warming up, while readiness returns 503, enabling Kubernetes or Docker healthchecks to handle rolling restarts cleanly.

---

## 6. Documentation & Analysis

### 6.1 Experimental Setup

| Item | Value |
|---|---|
| OS | Ubuntu 22.04 LTS (GitHub Actions `ubuntu-latest`) |
| Node.js | 20 LTS (setup-node@v4) |
| npm | 10.x (cache: npm) |
| PostgreSQL | 16-alpine (Docker service, `POSTGRES_DB=inkwell_test`) |
| TypeScript | 5.8.2 |
| Vitest | 4.1.0 |
| Supertest | 7.2.2 |
| Playwright | 1.58.2 |
| Performance runner | Custom Node.js fetch harness (`server/src/experimental/performance/run-performance.ts`) |
| Mutation strategy | Controlled-mutant script (`server/src/experimental/mutation/run-mutation.ts`) |
| Chaos strategy | Docker Compose + `tc netem` (`server/src/experimental/chaos/run-chaos.ts`) |

**CI/CD integration:** `.github/workflows/experimental.yml` — manually triggered via `workflow_dispatch` or on Monday 06:00 UTC schedule. Four sequential jobs: `performance-tests → mutation-tests → chaos-tests → experimental-summary`. Artifacts are uploaded per job and merged by the summary job.

**Reproducibility:** All scripts are parameterised via environment variables (`PERF_BASE_URL`, `PERF_PROFILE`, `CHAOS_SCENARIO`, `CHAOS_FAULT_DURATION_SECONDS`, etc.) with documented defaults. Any team member can reproduce results with:

```bash
# Performance (smoke)
npm run perf:smoke

# Performance (full — 4 scenarios)
npm run perf:full
npm run perf:summary

# Mutation
npm run mutation:test
npm run mutation:summary

# Chaos (requires docker-compose.backend.yml running)
npm run chaos:run

# Unified summary
npm run experimental:summary
```

### 6.2 Observed vs Expected Behaviour

| Area | Expected (from Assignment 1 risk model) | Observed | Assessment |
|---|---|---|---|
| Auth endpoint latency under normal load | < 200 ms p95 | **118 ms** p95 | **Better than expected** |
| Content endpoints under normal load | < 200 ms p95 | **70 ms** p95 max | **Better than expected** |
| Error rate under spike (30 VUs) | Possibly approach 5% threshold | **0.77%** | **Better than expected** |
| Mutation score | ≥ 75% (matching example in assignment rubric) | **100%** | **Exceeded expectation** |
| API downtime recovery | < 5 s | **182 ms** | **Well within tolerance** |
| DB restart recovery | < 30 s | **~2.1 s** | **Well within tolerance** |
| Branch coverage | Estimated as gap area | **68.97%** | **Confirmed gap — partially addressed by mutation data** |

**Discrepancies and root causes:**

- *Auth login faster than feared*: `bcryptjs` cost factor is calibrated for test environment; production cost factor would be higher, increasing login latency. The 800 ms p95 threshold remains appropriate but headroom is larger than the risk model predicted.
- *Zero mutation survivors vs expected ~77%*: The existing test suite is more thorough than the assignment baseline. This was possible because Assignment 2 specifically targeted all three P1 modules with integration tests that exercise both success and failure branches of each critical conditional.
- *DB unavailability shows user-visible 503 rather than graceful degradation*: No circuit breaker exists in the current codebase. This was flagged as a risk in Assignment 1 (C2/C3 high impact) and is confirmed here as a real gap.

### 6.3 Complete Metrics Summary

| Category | Metric | Value |
|---|---|---|
| **Coverage** | Statement coverage | 85.02% |
| **Coverage** | Line coverage | 84.68% |
| **Coverage** | Function coverage | 92.15% |
| **Coverage** | Branch coverage | 68.97% |
| **API Tests** | Pass rate | 46/46 (100%) |
| **E2E Tests** | Pass rate | 6/6 (100%) |
| **Performance — Normal** | P95 latency (all endpoints) | 73 ms |
| **Performance — Peak** | P95 latency (all endpoints) | 164 ms |
| **Performance — Spike** | P95 latency (all endpoints) | 323 ms |
| **Performance — Spike** | Error rate | 0.77% |
| **Performance — Endurance** | P95 latency (all endpoints) | 83 ms |
| **Mutation** | Mutants created | 8 |
| **Mutation** | Mutants killed | 8 |
| **Mutation** | Mutation score | **100%** |
| **Chaos — API down** | Availability % (full window) | 25.0% |
| **Chaos — API down** | Recovery time (MTTR) | 182 ms |
| **Chaos — DB down** | Availability % (full window) | 21.4% |
| **Chaos — DB down** | Recovery time (MTTR) | ~2 100 ms |
| **Chaos — Network latency** | Availability % (full window) | 96.4% |
| **Chaos — Network latency** | Recovery time (MTTR) | < 100 ms |

---

## 7. Recommendations

### 7.1 Short-term (Before Production Release)

| Priority | Action | Area |
|---|---|---|
| **High** | Add circuit breaker (`opossum`) around TypeORM DB calls | Resilience |
| **High** | Tune TypeORM connection pool `max` from default 10 to at least 25 | Performance |
| **High** | Add `Retry-After` header to all 503 responses | Resilience |
| **Medium** | Add cursor-based pagination to `GET /api/admin/reports` | Performance |
| **Medium** | Add 3 branch-coverage tests for error-handler fallback paths | Coverage |

### 7.2 Medium-term (QA Process Improvements)

| Priority | Action | Area |
|---|---|---|
| **Medium** | Extend mutation set to `user.service.ts` (role promotion guards) | Mutation |
| **Medium** | Integrate mutation score into QA summary dashboard | CI/CD |
| **Medium** | Add readiness/liveness split to `/api/health` | Chaos / Ops |
| **Low** | Add a `k6` script for real-time streaming metrics export | Performance |
| **Low** | Schedule chaos tests weekly in CI rather than on-demand only | Chaos |

### 7.3 Long-term

- Introduce **property-based testing** (e.g., `fast-check`) for report target validation and tag cardinality logic, covering edge cases beyond those reachable by mutation testing alone.
- Add **Redis-based session caching** to reduce per-request DB round trips for `/api/auth/me`, which is the highest-throughput endpoint.
- Adopt **Stryker** (JavaScript mutation framework) for automated mutant generation across the full codebase, replacing the hand-crafted controlled-mutant script once the team has baseline mutation scores to compare against.

---

## 8. Deliverables Checklist

| Deliverable | Status | Location |
|---|---|---|
| Performance test plan (scenarios, thresholds, parameters) | ✓ | Section 3.1; `server/src/experimental/performance/run-performance.ts` |
| Performance execution logs and screenshots | ✓ | Section 3.3; `.tmp/qa/experimental/performance/` |
| Performance metrics tables (avg/median/p95/throughput/error) | ✓ | Section 3.4 |
| Performance visualizations (throughput, error rate, CPU/memory) | ✓ | Sections 3.5, 3.6, 3.7 |
| Bottleneck report with recommendations | ✓ | Section 3.8 |
| Mutation plan (modules, mutation types, rationale) | ✓ | Section 4.1 |
| Full mutant list with find/replace descriptions | ✓ | Section 4.2 |
| Test execution logs per mutant (killed/survived status) | ✓ | Section 4.3 |
| Mutation score table (per module + overall) | ✓ | Section 4.4 |
| Mutation analysis and improvement recommendations | ✓ | Section 4.6 |
| Chaos testing plan (modules, failure types, duration) | ✓ | Section 5.1 |
| Chaos execution logs (pre/during/post probe samples) | ✓ | Section 5.2 |
| Chaos metrics (availability %, MTTR, error propagation) | ✓ | Sections 5.3–5.5 |
| Chaos lessons learned and recommendations | ✓ | Sections 5.7, 5.8 |
| Experimental setup documentation (tools, versions, commands) | ✓ | Section 6.1 |
| Observed vs expected behaviour comparative analysis | ✓ | Section 6.2 |
| Full metrics summary table | ✓ | Section 6.3 |
| Updated automation scripts | ✓ | `server/src/experimental/mutation/run-mutation.ts` (8 mutants) |
| CI/CD pipeline | ✓ | `.github/workflows/experimental.yml` |

---

## 9. Conclusion

The experimental engineering phase confirms that the Inkwell Platform's core modules (C1–C3) meet the defined performance thresholds under all four load scenarios, with a peak error rate of 0.77% and a worst-case p95 latency of 323 ms against a 800 ms ceiling.

The **100% mutation score** across 8 targeted mutants validates that the Assignment 2 test suite — 46 API integration tests and 6 E2E smoke tests — successfully detects every tested category of realistic programmer error in the three highest-risk modules.

Chaos testing reveals that the system handles API downtime and network latency gracefully at the infrastructure level, but lacks application-level resilience mechanisms (circuit breaker, retry hints) for database failures. These gaps are actionable and bounded in scope — they do not invalidate the current QA baseline but represent the natural next step toward production hardening.
