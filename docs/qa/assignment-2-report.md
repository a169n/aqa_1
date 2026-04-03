# Assignment 2 Report

## Project Information

**Course Task:** Assignment 2
**Project Under Test:** Inkwell Platform
**System Type:** Web Application
**Team Members:** Asqar Nurym, Aibyn Talgatov, Kuanshpek Zhansaya
**Group:** CSE-2505M

## 1. Introduction

This report presents the Assignment 2 QA deliverables for the **Inkwell Platform**, a full-stack blogging web application. The work in this assignment builds directly on the risk assessment, QA strategy, environment setup, and baseline metrics established in Assignment 1.

The purpose of Assignment 2 is to move from planning into controlled implementation. The report therefore focuses on applying automation to the highest-risk parts of the system, defining enforceable quality gates, collecting measurable execution results, and preparing evidence that can be reused in the later research paper sections.

The report is structured according to the required Assignment 2 components:

1. **Automated Test Implementation**
2. **Quality Gate Definition and Integration**
3. **Metrics Collection**
4. **Documentation and Reproducibility Evidence**
5. **Deliverables Checklist**

The document is written as an **academic QA report**. Its purpose is to show (1)what was automated, (2)why those areas were selected, (3)how the automated checks were integrated into CI/CD, and (4)what measurable results were obtained from the current implementation.

## 2. Automated Test Implementation

The automated implementation followed the risk model defined in Assignment 1. Work began with all **`P1`** modules because those components carry the highest combined probability and impact of failure. After those flows were covered, the automation scope was extended with targeted checks for **`P2`** modules to improve overall confidence and evidence quality.

At the current stage, the repository contains:

- **`38`** automated API scenarios executed through **`Vitest + Supertest`**
- **`4`** browser smoke scenarios executed through **`Playwright`**
- reusable helpers for authentication, seeded test data, and repeatable environment reset

### 2.1 Identify Test Scope

| Module / Feature                                 | High-Risk Function                                                                     | Test Priority | Notes / Expected Outcome                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `C1` Authentication and session lifecycle      | registration, login, refresh rotation, logout, authenticated session lookup            | `High`      | Invalid credentials must fail, refresh tokens must rotate, revoked sessions must not be reusable            |
| `C2` Authorization and admin moderation        | admin-only access to users, roles, reports, categories, and tags                       | `High`      | Non-admin users must be blocked; admins must be able to inspect and moderate controlled resources           |
| `C3` Content integrity and moderation workflow | post ownership, publish/archive/restore lifecycle, comments, likes, bookmarks, reports | `High`      | Ownership and lifecycle rules must remain consistent across create, update, moderation, and reporting flows |
| `C4` Profile management and avatar uploads     | profile updates, duplicate email validation, avatar MIME and size validation           | `Medium`    | Account data must remain unique and uploads must be accepted only for valid image files within size limits  |
| `C5` Public browsing and discovery flows       | published feed visibility, filters, bookmark/report UI journeys                        | `Medium`    | Only published content should appear publicly; integrated reader workflows must remain functional           |

### 2.2 Define Test Cases

The full implementation contains more scenarios than can be listed compactly in the report, so the table below records representative test cases that cover the critical behaviors required by the assignment.

| Test Case ID | Module / Feature      | Description                                          | Input Data                                                   | Expected Result                                                             | Scenario Type | Notes                                             |
| ------------ | --------------------- | ---------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `TC01`     | Authentication        | Register first platform user                         | valid name, email, password                                  | user is created as admin and `/api/auth/me` returns authenticated profile | `Positive`  | verifies bootstrap admin path                     |
| `TC02`     | Authentication        | Reject invalid login                                 | valid email with wrong password                              | login returns `401` with `Invalid credentials.`                         | `Negative`  | validates secure failure behavior                 |
| `TC03`     | Session lifecycle     | Rotate refresh token and reject reuse                | valid refresh cookie, then repeated use of old cookie        | first refresh succeeds, reused token returns `401`                        | `Negative`  | protects against session replay                   |
| `TC04`     | Authorization         | Block non-admin user from admin routes               | authenticated regular user requests `/api/admin/users`     | response returns `403` with admin access error                            | `Negative`  | proves role enforcement                           |
| `TC05`     | Content integrity     | Allow author to manage own post                      | authenticated author creates, updates, deletes post          | all operations succeed and deleted post returns `404` afterward           | `Positive`  | validates ownership flow                          |
| `TC06`     | Content integrity     | Prevent outsider from managing another author's post | author, outsider, and admin accounts                         | outsider receives `403`, admin moderation action succeeds                 | `Negative`  | covers ownership + moderation boundary            |
| `TC07`     | Editorial workflow    | Draft to publish to archive to restore               | authenticated author and draft post                          | status transitions follow `draft -> published -> archived -> draft`       | `Positive`  | validates core lifecycle logic                    |
| `TC08`     | Profile / avatar      | Reject unsupported avatar upload                     | authenticated user uploads `text/plain` file               | upload returns `415` with MIME validation message                         | `Negative`  | protects upload surface                           |
| `TC09`     | Security hardening    | Throttle repeated auth attempts                      | repeated invalid login from same forwarded client IP         | first five attempts return `401`, next attempt returns `429`            | `Negative`  | validates basic brute-force protection            |
| `TC10`     | Taxonomy / moderation | Reject duplicate category or tag creation            | authenticated admin sends existing category/tag name         | API returns `409` conflict                                                | `Negative`  | protects admin data integrity                     |
| `TC11`     | Reader workflow       | Bookmark and report published content                | authenticated reader bookmarks post and reports post/comment | bookmark is stored and both reports are created                             | `Positive`  | validates integrated user-facing moderation entry |
| `TC12`     | Browser smoke         | Review reports queue in UI                           | admin logs in and opens reports page                         | open reports are visible and resolvable through UI                          | `Positive`  | confirms end-to-end moderation path               |

### 2.3 Track Script Implementation

| Script ID | Module / Feature                      | Automation Framework   | Script Name / Location                                | Status       | Comments                                                                                                              |
| --------- | ------------------------------------- | ---------------------- | ----------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `S01`   | Authentication and session lifecycle  | `Vitest + Supertest` | `server/src/test/auth.integration.test.ts`          | `Complete` | covers registration, duplicate registration, invalid login, refresh rotation,`/auth/me`, and logout                 |
| `S02`   | Post, comment, and like integrity     | `Vitest + Supertest` | `server/src/test/blog.integration.test.ts`          | `Complete` | focuses on ownership rules, unauthorized mutation blocking, comment validation, and duplicate-like prevention         |
| `S03`   | Editorial workflow and moderation     | `Vitest + Supertest` | `server/src/test/editorial.integration.test.ts`     | `Complete` | covers publish/archive/restore lifecycle, public feed filtering, bookmarks, reports, and admin moderation             |
| `S04`   | Profile management and admin controls | `Vitest + Supertest` | `server/src/test/profile-admin.integration.test.ts` | `Complete` | validates profile updates, avatar upload rules, admin dashboards, role changes, and last-admin protection             |
| `S05`   | Taxonomy administration               | `Vitest + Supertest` | `server/src/test/taxonomy.integration.test.ts`      | `Complete` | covers create, update, delete, duplicate handling, and missing-record paths for categories and tags                   |
| `S06`   | Security hardening checks             | `Vitest + Supertest` | `server/src/test/security.integration.test.ts`      | `Complete` | verifies response headers, no-store auth responses, and auth rate limiting                                            |
| `S07`   | Cross-layer smoke validation          | `Playwright`         | `tests/e2e/smoke.spec.ts`                           | `Complete` | validates taxonomy setup, editorial publish flow, bookmark/report path, and report-queue handling through the browser |

The implementation was kept maintainable by centralizing common API setup in test helpers, resetting the test database between runs, and keeping the browser suite focused on a small set of high-value integrated workflows instead of broad but fragile UI coverage.

### 2.4 Version Control Tracking

The table below lists representative repository milestones that show the implementation history of the automation layer and supporting application changes.

| Commit ID / Hash | Date           | Module / Feature                     | Description of Changes                                                                                                                                       | Author          |
| ---------------- | -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `1b2fd21`      | `2026-03-15` | QA automation baseline               | Added initial QA workflow, backend integration suites, Playwright smoke setup, Docker support, and QA documentation scaffolding                              | `Aibyn`       |
| `6bd6860`      | `2026-03-18` | Editorial API and e2e smoke coverage | Added editorial integration tests and extended Playwright smoke coverage for publish, moderation, and taxonomy flows                                         | `Asqar Nyrym` |
| `8a875c5`      | `2026-04-03` | Assignment 2 automation baseline     | Consolidated the Assignment 2 technical state: security hardening, QA reporting, additional integration coverage, updated documentation, and evidence assets | `Asqar Nyrym` |
| `d84b342`      | `2026-04-03` | CI/CD quality-gate reliability       | Fixed the GitHub Actions artifact restore step so the `qa-gates` stage works correctly on the latest remote workflow run                                   | `Asqar Nyrym` |

### 2.5 Evidence for Research Paper

The automation outputs already generate reproducible evidence artifacts. These files serve as direct input for later reporting, metrics analysis, and screenshot capture during final packaging.

| Evidence ID | Module / Feature                            | Type            | Description                                                                                    | File Location / Link                                  |
| ----------- | ------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `E01`     | Authentication and session lifecycle        | `Log`         | machine-readable API execution output including auth, refresh, and logout scenarios            | `.tmp/qa/vitest-report.json`                        |
| `E02`     | Content integrity and moderation workflow   | `Code`        | source of editorial workflow, bookmark, report, and moderation API checks                      | `server/src/test/editorial.integration.test.ts`     |
| `E03`     | Authorization and admin moderation          | `Code`        | source of admin user, role, report, and moderation checks                                      | `server/src/test/profile-admin.integration.test.ts` |
| `E04`     | Cross-layer smoke validation                | `HTML Report` | browser execution report for taxonomy, publishing, bookmark/report, and report-queue scenarios | `playwright-report/`                                |
| `E05`     | Automation coverage and quality-gate status | `Log`         | unified QA summary combining API results, e2e results, coverage, and gate outcomes             | `.tmp/qa/qa-summary.json`                           |
| `E06`     | Coverage measurement                        | `Report`      | backend coverage summary used later in quality-gate evaluation                                 | `server/coverage/coverage-summary.json`             |

This section demonstrates that the automation work is not only implemented but also traceable through executable scripts, repository history, and reproducible evidence files.

## 3. Quality Gate Definition and Integration

Assignment 2 requires the automation layer to be more than a collection of runnable tests. It must also define explicit pass/fail criteria and enforce them through a repeatable CI/CD flow. In the current implementation, this requirement is satisfied through a combination of:

- repository-level workflow checks in GitHub Actions
- machine-readable QA artifacts generated by test execution
- a dedicated quality-gate evaluation step that reads those artifacts and fails the pipeline when thresholds are not met

The resulting model keeps release decisions based on measurable results rather than on manual interpretation alone. Compared with Assignment 1, the main improvement in this section is that the pipeline no longer stops at test execution only. It now includes a dedicated quality-gate evaluation stage that checks whether the measured results satisfy the agreed thresholds.

### 3.1 Define Pass / Fail Criteria

This subsection defines the formal pass/fail rules used by the QA workflow. The thresholds are evaluated from a unified QA summary generated after the automated runs, but the purpose of this subsection is to record the gate definitions themselves rather than the latest measured outcomes.

| Quality Gate ID | Metric / Criterion         | Threshold / Requirement                    | Importance | Notes                                                                  |
| --------------- | -------------------------- | ------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| `QG01`        | Backend statement coverage | `>= 80%`                                 | `High`   | protects execution breadth across backend logic                        |
| `QG02`        | Backend line coverage      | `>= 80%`                                 | `High`   | confirms useful execution depth, not only superficial route access     |
| `QG03`        | API failed tests           | `0` allowed                              | `High`   | any failed API integration scenario blocks the gate                    |
| `QG04`        | E2E failed or flaky tests  | `0` allowed                              | `High`   | flaky browser execution is treated as unacceptable for the smoke layer |
| `QG05`        | `P1` automation coverage | `100%` of `P1` modules must be covered | `High`   | proves the risk-based strategy is actually enforced                    |

These gates were selected because they correspond directly to the Assignment 2 goals:

- coverage gates measure whether automation reaches enough of the critical backend surface
- execution gates measure reliability of API and browser automation
- risk-coverage gate measures whether the most important modules from Assignment 1 were actually automated

In addition to the formal QA gates, the CI pipeline also enforces supporting delivery checks:

- format check
- linting
- build verification
- Docker image build verification

These supporting checks are separate from `QG01-QG05`, but they still act as practical release gates in the workflow.

### 3.2 Integrate Tests into CI/CD Pipeline

The CI/CD implementation uses a GitHub Actions workflow triggered on both `push` and `pull_request`. The pipeline is ordered so that low-cost checks fail early, while heavier automated validation runs only after the repository has passed the earlier gates.

| Pipeline Step       | Description                                                             | Tool / Framework                                              | Trigger                    | Notes                                                                       |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| `1. lint`         | checks formatting and source lint rules                                 | `Prettier`, `ESLint`, `GitHub Actions`                  | `push`, `pull_request` | workflow also verifies that lint autofix does not leave uncommitted changes |
| `2. build`        | compiles frontend and backend workspaces                                | `TypeScript`, workspace build scripts                       | `push`, `pull_request` | ensures test execution uses buildable code only                             |
| `3. api-tests`    | runs backend integration suite with coverage against PostgreSQL service | `Vitest`, `Supertest`, `PostgreSQL`, `GitHub Actions` | `push`, `pull_request` | uploads `vitest-report.json` and backend coverage artifacts               |
| `4. e2e`          | runs browser smoke suite after API validation passes                    | `Playwright`                                                | `push`, `pull_request` | uploads HTML report, failure output, and `playwright-report.json`         |
| `5. qa-gates`     | restores artifacts and evaluates formal QA thresholds                   | custom `qa:summary` and `qa:gates` scripts                | `push`, `pull_request` | converts raw test results into explicit pass/fail gate decisions            |
| `6. docker-build` | verifies backend image can still be packaged successfully               | `Docker`                                                    | `push`, `pull_request` | protects deployment readiness after the QA gates pass                       |

The artifact flow is also important. The pipeline does not evaluate quality gates directly inside the API or browser jobs. Instead, it first collects the generated reports from those stages and then evaluates them centrally in the dedicated `qa-gates` stage. This design improves traceability because the same execution evidence can be:

- used for automated gate decisions
- uploaded for reviewer inspection
- reused later as evidence in the report

**Figure Placeholder 1. CI/CD Pipeline Diagram**

`[Insert Figure: pipeline-overview.png - manually prepared CI/CD pipeline diagram showing lint, build, api-tests, e2e, qa-gates, and docker-build flow]`

**Figure Placeholder 2. Successful Workflow Run**

`[Insert Figure: workflow-pass.png - GitHub Actions QA Pipeline run summary showing the latest successful execution of all workflow jobs]`

### 3.3 Alerting and Failure Handling Procedures

The current repository does not include external Slack or email alerting. The effective alerting channel is the GitHub Actions workflow status itself, together with job logs and uploaded artifacts. This is sufficient for the assignment because failures are visible on `push` and `pull_request`, and each failed stage exposes the specific logs required for investigation.

| Scenario / Event               | Alert Type                                                | Recipient / Channel                                                     | Action Required                                                               | Notes                                                            |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Format or lint failure         | failed GitHub Actions job                                 | repository contributors and reviewers through workflow/PR status        | correct formatting or lint violations, rerun pipeline                         | early failure prevents wasting CI time on heavier jobs           |
| Build failure                  | failed GitHub Actions job                                 | repository contributors and reviewers through workflow/PR status        | fix compilation issue before test stages continue                             | protects against invalid test interpretation on unbuildable code |
| API integration failure        | failed `api-tests` job + machine-readable test artifact | repository contributors via Actions logs and artifacts                  | inspect failing API scenario, fix service or test issue, rerun                | API execution output preserves reproducible evidence             |
| Browser smoke failure or flake | failed `e2e` or `qa-gates` status                     | repository contributors via Actions logs, HTML report, and test results | inspect Playwright report, screenshots, and traces; stabilize or fix workflow | flakes are treated as failures in the formal QA gate             |
| Coverage below threshold       | failed `qa-gates` job                                   | repository contributors via explicit gate output in workflow logs       | expand or improve tests, then rerun                                           | gate output prints actual value and threshold                    |
| `P1` coverage below target   | failed `qa-gates` job                                   | repository contributors via explicit gate output in workflow logs       | add automation for uncovered high-risk module(s) before accepting build       | directly tied to Assignment 1 risk model                         |
| Docker build failure           | failed `docker-build` job                               | repository contributors via workflow status and logs                    | inspect packaging/build changes and repair image build path                   | acts as final deployment-oriented verification                   |

This failure-handling model is intentionally simple and evidence-driven. Each failure produces a visible status, a reproducible log, and in several cases an uploaded artifact that can be reviewed after the run has completed.

### 3.4 Current Quality-Gate Results

Section `3.1` defines the pass/fail criteria. This subsection records the most recent measured outcomes against those criteria. The most recent verified QA baseline was executed on `2026-04-03` both locally and through the latest GitHub Actions workflow run. In both cases, the measured gate values were the same and all stages completed successfully.

| Quality Gate ID | Metric                     |    Actual | Threshold | Status   |
| --------------- | -------------------------- | --------: | --------: | -------- |
| `QG01`        | backend statement coverage | `83.73` |    `80` | `Pass` |
| `QG02`        | backend line coverage      | `83.33` |    `80` | `Pass` |
| `QG03`        | api failed tests           |     `0` |     `0` | `Pass` |
| `QG04`        | e2e failed or flaky tests  |     `0` |     `0` | `Pass` |
| `QG05`        | `P1` automation coverage |   `100` |   `100` | `Pass` |

The latest successful remote workflow also completed the full CI sequence:

1. `lint`
2. `build`
3. `api-tests`
4. `e2e`
5. `qa-gates`
6. `docker-build`

As a result, both the local QA run and the newest pushed workflow confirmed that the current automation layer satisfies the enforced Assignment 2 thresholds in its present state.

**Figure Placeholder 3. Quality Gate Results**

`[Insert Figure: qa-summary.png - screenshot of the QA summary or terminal gate output showing QG01-QG05 and their pass results]`

## 4. Metrics Collection

Assignment 2 requires measurable results, not only implemented scripts. The purpose of this section is therefore to show how much of the risk surface is automated, how long the automated checks take to run, and what the final baseline indicates about defect pressure in relation to the risk model inherited from Assignment 1.

All values in this section reflect the verified baseline from `2026-04-03`, after the latest local run and successful remote workflow execution.

### 4.1 Track Automation Coverage

The risk-based model from Assignment 1 identified five high-risk modules. In the current baseline, all five modules have at least one automated validation layer, and all three `P1` modules have full combined coverage through API automation and browser smoke validation.

Because the Assignment 1 risk register was defined at the **module** level, the coverage calculation below is also performed at module level. The **High-Risk Function** column shows the specific behaviors inside each module that were automated.

Formula used:

**Automation Coverage (%) = (Number of automated high-risk modules / Total high-risk modules) × 100**

| Module / Feature                                 | High-Risk Function                                                           | Test Automated? | Coverage % | Notes                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------- | --------------- | ---------: | ---------------------------------------------------------- |
| `C1` Authentication and session lifecycle      | registration, login, refresh rotation, logout, session lookup                | `Yes`         |    `100` | covered by API integration and browser smoke flows         |
| `C2` Authorization and admin moderation        | admin-only access, moderation queue, role control, taxonomy administration   | `Yes`         |    `100` | covered by API integration and browser smoke flows         |
| `C3` Content integrity and moderation workflow | ownership rules, publish/archive/restore, bookmarks, reports                 | `Yes`         |    `100` | covered by API integration and browser smoke flows         |
| `C4` Profile management and avatar uploads     | profile updates, duplicate email validation, avatar MIME and size validation | `Yes`         |     `50` | covered by API integration only; no browser smoke path yet |
| `C5` Public browsing and discovery flows       | public feed visibility, filters, bookmark/report reader flow                 | `Yes`         |    `100` | covered through API checks and browser smoke validation    |

Current coverage interpretation:

- total high-risk module automation coverage: `100%` (`5/5`)
- `P1` automation coverage: `100%` (`3/3`)
- partial gap remains in `C4`, because the profile/avatar area is validated at API level but not yet represented in the browser smoke suite

This result is stronger than the Assignment 1 baseline, where automation coverage for high-risk modules was planned rather than fully demonstrated.

### 4.2 Track Execution Time

Execution time matters because Assignment 2 does not only ask whether tests exist. It also asks whether they are practical to run repeatedly in CI/CD. The table below records the measured execution time of the automated suites from the latest verified run, using scenario/file durations from `.tmp/qa/qa-summary.json`. Row values are rounded to two decimals; aggregate totals below use the exact summary values.

| Module / Feature                       | Number of Test Cases | Execution Time per Test Case (avg, sec) | Total Execution Time (sec) | Notes                                                                                      |
| -------------------------------------- | -------------------: | --------------------------------------: | -------------------------: | ------------------------------------------------------------------------------------------ |
| Authentication and session lifecycle   |                `6` |                                `0.31` |                   `1.85` | API suite for registration, login, refresh rotation, `/auth/me`, and logout               |
| Content integrity (post/comment/like)  |                `5` |                                `0.45` |                   `2.25` | ownership, mutation blocking, comment validation, and duplicate-like prevention            |
| Database seed/reset support            |                `4` |                                `1.01` |                   `4.04` | support suite that guarantees deterministic state before automated validation              |
| Editorial workflow and moderation      |                `4` |                                `0.61` |                   `2.42` | publish/archive/restore, public feed filtering, bookmarks, reports, and moderation         |
| Profile and admin controls             |               `10` |                                `0.39` |                   `3.95` | largest API suite by scenario count                                                        |
| QA reporting support                   |                `2` |                                `0.08` |                   `0.15` | validates summary generation and quality-gate logic itself                                 |
| Security hardening                     |                `3` |                                `0.57` |                   `1.70` | headers, caching, and rate-limit checks                                                    |
| Taxonomy administration                |                `4` |                                `0.36` |                   `1.46` | category and tag administration rules                                                      |
| Browser smoke flows                    |                `4` |                                `4.51` |                  `18.03` | scenario-level Playwright duration; excludes browser/app startup and artifact overhead     |

Additional observed totals:

- total API execution time across all API and support suites: `17.81` seconds
- total Playwright scenario time: `18.03` seconds
- total Playwright suite wall-clock duration in the QA summary: `47.26` seconds
- combined wall-clock automated duration captured by the QA summary: `65.08` seconds

The difference between `18.03` seconds and `47.26` seconds is expected: Playwright scenario durations measure only the executed test bodies, while the suite wall-clock duration also includes browser startup, application bootstrapping, fixture setup, and artifact generation.

The data shows the expected pattern of a healthy test pyramid:

- API automation is relatively fast and carries most of the validation volume
- browser automation is slower, so it is intentionally limited to a small number of critical flows
- the largest API overhead is the deterministic database setup layer, which is acceptable because it protects repeatability of all downstream checks
- the current execution time remains practical for CI use because the smoke layer is controlled and the full QA run still completes in about one minute

**Figure Placeholder 4. Backend Coverage Summary**

`[Insert Figure: coverage-summary.png - screenshot of the backend coverage summary showing statement, line, function, and branch coverage for the current baseline]`

**Figure Placeholder 5. Playwright Smoke Report**

`[Insert Figure: playwright-report.png - screenshot of the Playwright HTML report showing the current passing smoke suite execution]`

### 4.3 Track Defects Found vs Expected Risk

The final baseline run completed without open failures, so the table below compares the expected defect pressure from the Assignment 1 risk model against the number of defects observed in the final measured baseline.

For this comparison, the expected defect pressure is recorded as:

- `2` expected defects for each `P1` module, derived from the Assignment 1 critical-risk band (`16-25`)
- `1` expected defect for each `P2` module, derived from the Assignment 1 high-risk band (`9-15`)

This does not claim that exactly that number of bugs must exist. It is a simple reporting scale derived from the higher risk weight assigned in Assignment 1, used to compare forecasted pressure with the stabilized final run. The repository does not maintain a separate historical defect ledger for pre-baseline fixes, so this table reports the defects visible in the final measured automation baseline.

| Module / Feature                                 | High-Risk Level | Expected Defects | Defects Found | Pass / Fail | Notes                                                                     |
| ------------------------------------------------ | --------------- | ---------------: | ------------: | ----------- | ------------------------------------------------------------------------- |
| `C1` Authentication and session lifecycle      | `High`        |            `2` |         `0` | `Pass`    | session and token handling were stable in the final measured baseline     |
| `C2` Authorization and admin moderation        | `High`        |            `2` |         `0` | `Pass`    | admin access and moderation paths passed without visible baseline defects  |
| `C3` Content integrity and moderation workflow | `High`        |            `2` |         `0` | `Pass`    | editorial lifecycle and ownership rules were stable in the final baseline |
| `C4` Profile management and avatar uploads     | `Medium`      |            `1` |         `0` | `Pass`    | upload validation and profile checks passed in the final API baseline     |
| `C5` Public browsing and discovery flows       | `Medium`      |            `1` |         `0` | `Pass`    | public browsing and reader smoke flow completed successfully              |

Interpretation:

- The risk model correctly prioritized the modules that required the most disciplined automation work.
- The final measured baseline shows `0` visible defects, which means the expected defect pressure was addressed before final evidence was captured.
- The absence of failing final results does not reduce the risk importance of `P1` modules; instead, it indicates that the automation and hardening work were effective enough to stabilize them before submission.

### 4.4 Maintain Detailed Logs

The full automation logs contain all `38` API scenarios and `4` browser smoke scenarios. To keep the report readable, the table below includes a representative excerpt from the final measured baseline window (`2026-04-03 05:52-05:53`, local time) rather than every log line.

| Test Case ID | Module / Feature   | Execution Date / Time | Result   | Defects Found | Execution Time (sec) | Notes                                                   |
| ------------ | ------------------ | --------------------- | -------- | ------------: | -------------------: | ------------------------------------------------------- |
| `TC01`     | Authentication     | `2026-04-03 05:52` | `Pass` |         `0` |             `0.39` | first-user registration and authenticated session check |
| `TC03`     | Session lifecycle  | `2026-04-03 05:52` | `Pass` |         `0` |             `0.33` | refresh rotation and revoked-token reuse rejection      |
| `TC07`     | Editorial workflow | `2026-04-03 05:52` | `Pass` |         `0` |             `0.55` | draft-publish-archive-restore lifecycle                 |
| `TC08`     | Profile / avatar   | `2026-04-03 05:52` | `Pass` |         `0` |             `0.26` | unsupported MIME type rejected correctly                |
| `TC09`     | Security hardening | `2026-04-03 05:52` | `Pass` |         `0` |             `1.14` | repeated invalid auth attempts throttled correctly      |
| `TC12`     | Browser smoke      | `2026-04-03 05:53` | `Pass` |         `0` |             `2.77` | admin report queue resolved successfully in UI          |

This logging approach supports reproducibility because:

- the test runners preserve machine-readable output for the full run
- the report records a concise, human-readable subset of the final measured evidence
- the same evidence can be reviewed both locally and in the GitHub Actions workflow artifacts
- the execution window is traceable to the final artifact timestamps even when the reporters do not emit per-test timestamps for every assertion

### 4.5 Metrics Reporting and Interpretation

The current metrics provide a coherent picture of QA effectiveness:

- automation coverage of high-risk modules reached `100%`
- `P1` risk coverage also reached `100%`
- backend statement coverage reached `83.73%`
- backend line coverage reached `83.33%`
- API suite result was `38/38` passed
- browser smoke result was `4/4` passed
- final baseline recorded `0` visible defects and `0` gate failures

Compared with Assignment 1:

- automated API inventory increased from `23` to `38` scenarios
- backend statement coverage improved from `75.87%` to `83.73%`
- backend line coverage improved from `75.35%` to `83.33%`
- the CI pipeline expanded from `5` to `6` stages because the explicit `qa-gates` stage was added
- `P1` automation coverage moved from a planning target to a measured `100%` outcome

These values are sufficient to support the chart-oriented reporting requested by Assignment 2. The final formatted report should therefore include the following visuals in addition to the tables above:

- bar chart: automation coverage by module
- line chart: execution time by automation suite
- table: expected defect pressure versus defects found in the final baseline

**Figure Placeholder 6. Automation Coverage Chart**

`[Insert Figure: automation-coverage-chart.png - bar chart showing automation coverage percentage for C1-C5 modules]`

**Figure Placeholder 7. Execution Time Trend Chart**

`[Insert Figure: execution-time-chart.png - line chart showing scenario or suite execution times for the current automated baseline]`

## 5. Documentation and Reproducibility Evidence

Assignment 2 requires the technical work to be documented in a form that can be reused directly in the final research paper. This section therefore converts the implementation, quality gates, and metrics into a documented QA strategy update. The present report serves as the primary Assignment 2 document, while repository artifacts provide the executable and visual evidence needed for reproducibility.

### 5.1 Automation Approach and Tool Selection

The automation approach remained explicitly risk-based. Following the Assignment 1 risk register, implementation began with the three `P1` modules (`C1-C3`) because they represent the highest security, authorization, and content-integrity risk. API automation was prioritized first because most critical business rules live in the backend service layer. After that foundation was stable, a controlled browser smoke layer was added to prove that the frontend, backend, authentication, and persistence layers work together on the most important user journeys. Coverage for `P2` modules was then expanded selectively where it improved evidence quality without creating disproportionate maintenance cost.

The selected toolchain is documented below.

| Area                     | Selected Tool / Framework       | Why This Choice Fits the Project                                                                 | Evidence / Location                                     |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| API automation           | `Vitest + Supertest`          | TypeScript-native, low setup cost, fast feedback, and strong request/response validation         | `server/src/test/*.integration.test.ts`               |
| Browser automation       | `Playwright`                  | reliable end-to-end execution, deterministic web-server orchestration, and exportable reports    | `tests/e2e/smoke.spec.ts`, `playwright.config.ts`     |
| Coverage collection      | `@vitest/coverage-v8`         | integrates directly with the existing Vitest stack and produces machine-readable coverage output  | `server/coverage/coverage-summary.json`               |
| QA summary and gate logic| custom QA scripts              | converts raw test and coverage artifacts into measurable quality-gate results                     | `server/src/qa/reporting.ts`, `server/src/qa/check-quality-gates.ts` |
| CI/CD orchestration      | `GitHub Actions`              | keeps automated verification visible on `push` and `pull_request` and stores artifacts centrally | `.github/workflows/qa.yml`                            |
| Supporting manual QC     | `Swagger UI` and `Postman`    | supports contract inspection, demo replay, and reviewer-friendly evidence capture                | `docs/qa/postman/inkwell-qa.postman_collection.json`  |

Maintainability and reusability were treated as documentation concerns, not only coding concerns. The current implementation supports reruns through:

- shared API helpers for registration, login, auth headers, and common entity creation in `server/src/test/helpers.ts`
- centralized integration-test environment reset in `server/src/test/setup.ts`
- explicit database reset protection for test-only environments in `server/src/test/reset-db.ts`
- controlled Playwright server orchestration and artifact reporters in `playwright.config.ts`

This structure satisfies the Assignment 2 requirement to document not only what tools were selected, but also how the automation remains modular and reproducible over repeated runs.

### 5.2 Quality Gate Documentation

Unlike Section `3.1`, which defines the operational pass/fail criteria, and Section `3.4`, which records the latest execution results, this subsection documents the traceability of each gate for the report and the later research paper. Its purpose is to show where each gate is defined, where it is enforced, and which artifact preserves the latest measured result.

The quality gates are therefore documented in three layers:

- definition in the report, where the thresholds and rationale are explained
- enforcement in the repository, where the thresholds are encoded and executed during `qa:gates`
- evidence in generated artifacts, where the latest measured result is preserved for review and reuse

The documentation traceability for the current gate set is shown below.

| Quality Gate ID | Metric / Criterion         | Threshold / Requirement                    | Latest Documented Result (`2026-04-03`) | Report Reference | Enforcement / Evidence Source                                             | Documentation Note                                           |
| --------------- | -------------------------- | ------------------------------------------ | ---------------------------------------- | ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `QG01`        | backend statement coverage | `>= 80%`                                 | `83.73%`                                 | Sections `3.1`, `3.4` | `server/src/qa/reporting.ts`, `server/src/qa/check-quality-gates.ts`, `server/coverage/coverage-summary.json` | documents breadth of backend execution                       |
| `QG02`        | backend line coverage      | `>= 80%`                                 | `83.33%`                                 | Sections `3.1`, `3.4` | `server/src/qa/reporting.ts`, `server/src/qa/check-quality-gates.ts`, `server/coverage/coverage-summary.json` | documents depth of backend execution                         |
| `QG03`        | api failed tests           | `0` allowed                              | `0`                                      | Sections `3.1`, `3.4` | `server/src/qa/reporting.ts`, `server/src/qa/check-quality-gates.ts`, `.tmp/qa/vitest-report.json`, `.tmp/qa/qa-summary.json` | documents backend execution reliability                      |
| `QG04`        | e2e failed or flaky tests  | `0` allowed                              | `0`                                      | Sections `3.1`, `3.4` | `server/src/qa/reporting.ts`, `server/src/qa/check-quality-gates.ts`, `.tmp/qa/playwright-report.json`, `.tmp/qa/qa-summary.json` | documents smoke-suite stability                              |
| `QG05`        | `P1` automation coverage | `100%` of `P1` modules must be covered | `100%`                                   | Sections `3.1`, `3.4` | `server/src/qa/reporting.ts`, `server/src/qa/check-quality-gates.ts`, `.tmp/qa/qa-summary.json` | documents enforcement of the Assignment 1 risk strategy      |

This documentation is important for the research paper because it shows that the thresholds are not rhetorical. Each gate has a defined rule, a version-controlled enforcement point, and a preserved evidence source for the latest measured outcome.

### 5.3 CI/CD Integration Overview

The CI/CD documentation records both the execution order and the evidence produced by the pipeline. The repository uses one GitHub Actions workflow triggered on `push` and `pull_request`, with the quality-gate decision delayed until raw artifacts from API and browser execution have been restored and summarized centrally.

| Pipeline Step       | Tool / Framework                                              | Trigger                    | Description                                                             | Documentation Evidence                              |
| ------------------- | ------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `1. lint`         | `Prettier`, `ESLint`, `GitHub Actions`                  | `push`, `pull_request` | checks formatting, lint rules, and whether autofix leaves file changes  | `.github/workflows/qa.yml`                         |
| `2. build`        | `TypeScript`                                                | `push`, `pull_request` | verifies that frontend and backend workspaces build successfully        | `.github/workflows/qa.yml`                         |
| `3. api-tests`    | `Vitest`, `Supertest`, `PostgreSQL`, `GitHub Actions` | `push`, `pull_request` | runs backend coverage suite and uploads API QA artifacts                | `.github/workflows/qa.yml`, `.tmp/qa/vitest-report.json` |
| `4. e2e`          | `Playwright`                                                | `push`, `pull_request` | runs smoke tests and uploads Playwright reports and failure artifacts   | `.github/workflows/qa.yml`, `playwright-report/`   |
| `5. qa-gates`     | custom `qa:summary` and `qa:gates` scripts                | `push`, `pull_request` | restores artifacts, generates QA summary, and evaluates formal gates    | `.tmp/qa/qa-summary.json`                          |
| `6. docker-build` | `Docker`                                                    | `push`, `pull_request` | verifies that the backend image can still be packaged after QA succeeds | `.github/workflows/qa.yml`                         |

The visual documentation already prepared for this report is:

- `docs/qa/screenshots/pipeline-overview.png` for the logical pipeline diagram
- `docs/qa/screenshots/workflow-pass.png` for the latest successful workflow run

Together, these assets satisfy the Assignment 2 requirement to document triggers, stages, integration flow, and observable execution status.

### 5.4 Initial Results and Coverage Metrics for Documentation

Section 4 contains the detailed metrics tables required by the assignment. For documentation purposes, the baseline values that should be carried forward into the research paper are summarized below.

| Result Area                              | Current Baseline (`2026-04-03`) | Interpretation                                                         | Supporting Evidence                              |
| ---------------------------------------- | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| High-risk module automation coverage     | `100%` (`5/5`)                 | every high-risk module from Assignment 1 now has automated coverage    | `.tmp/qa/qa-summary.json`                       |
| `P1` automation coverage               | `100%` (`3/3`)                 | all critical-risk modules are covered as required                      | `.tmp/qa/qa-summary.json`                       |
| API execution result                     | `38/38` passed                   | backend integration layer is stable in the final baseline              | `.tmp/qa/vitest-report.json`                    |
| Browser smoke execution result           | `4/4` passed                     | integrated critical user journeys remain operational                   | `.tmp/qa/playwright-report.json`, `playwright-report/` |
| Backend statement coverage               | `83.73%`                         | exceeds the formal quality-gate threshold                              | `server/coverage/coverage-summary.json`         |
| Backend line coverage                    | `83.33%`                         | exceeds the formal quality-gate threshold                              | `server/coverage/coverage-summary.json`         |
| Combined automated wall-clock duration   | `65.08` seconds                  | practical for repeated CI/CD execution                                 | `.tmp/qa/qa-summary.json`                       |
| Visible defects in final measured baseline | `0`                            | no open failures remained in the final evidence capture                | `.tmp/qa/qa-summary.json`, `.tmp/qa/vitest-report.json`, `.tmp/qa/playwright-report.json` |

This summary is suitable for the methodology and results chapters of the final research paper because it links the risk-based strategy, measured execution outcomes, and formal QA gates in one documented baseline.

### 5.5 Evidence for Reproducibility

Reproducibility requires more than pass/fail claims. It requires version-controlled scripts, deterministic environment handling, machine-readable reports, and visual artifacts that can be checked independently. The table below records the most important reproducibility assets for the current baseline.

| Evidence ID | Module / Feature                       | Type            | Description                                                                                  | File Location / Link                                  |
| ----------- | -------------------------------------- | --------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `R01`     | Automation strategy                     | `Document`    | repository-level QA strategy and rationale for risk-based automation                         | `docs/qa/test-strategy.md`                           |
| `R02`     | CI/CD pipeline definition               | `Code`        | version-controlled workflow that executes lint, build, tests, gates, and Docker verification | `.github/workflows/qa.yml`                           |
| `R03`     | Integration rerun support               | `Code`        | helpers and setup scripts that reset database, uploads, and auth-related test state          | `server/src/test/helpers.ts`, `server/src/test/setup.ts`, `server/src/test/reset-db.ts` |
| `R04`     | Browser rerun support                   | `Code`        | Playwright configuration that provisions servers, reporters, traces, and screenshots         | `playwright.config.ts`, `tests/e2e/smoke.spec.ts`    |
| `R05`     | API execution evidence                  | `Log`         | machine-readable backend test results for the final baseline                                 | `.tmp/qa/vitest-report.json`                         |
| `R06`     | Browser execution evidence              | `Log`         | machine-readable smoke execution results for the final baseline                              | `.tmp/qa/playwright-report.json`                     |
| `R07`     | Unified QA evidence                     | `Log`         | aggregated summary combining coverage, execution, risk coverage, and gate results            | `.tmp/qa/qa-summary.json`                            |
| `R08`     | Coverage evidence                       | `Report`      | backend statement, line, function, and branch coverage summary                               | `server/coverage/coverage-summary.json`              |
| `R09`     | Pipeline visual evidence                | `Screenshot`  | diagram and successful workflow run for report packaging                                     | `docs/qa/screenshots/pipeline-overview.png`, `docs/qa/screenshots/workflow-pass.png` |
| `R10`     | QA result visual evidence               | `Screenshot`  | coverage, Playwright, and QA-gate screenshots prepared for final report insertion            | `docs/qa/screenshots/coverage-summary.png`, `docs/qa/screenshots/playwright-report.png`, `docs/qa/screenshots/qa-summary.png` |
| `R11`     | Metrics chart evidence                  | `Screenshot`  | chart assets for automation coverage and execution-time reporting                            | `docs/qa/screenshots/automation-coverage-chart.png`, `docs/qa/screenshots/execution-time-chart.png` |

Taken together, these artifacts demonstrate that the Assignment 2 automation can be rerun, inspected, and defended as a reproducible QA baseline rather than as a one-time execution claim.

### 5.6 Documentation Deliverables and Best-Practice Alignment

The `Documentation` part of Assignment 2 requires both specific deliverables and evidence that documentation best practices were followed. The current report resolves those requirements as follows.

| Documentation Requirement                    | Current Resolution in the Report                                                                 | Status        | Notes                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| Updated QA Test Strategy Document            | Sections `2-5` plus supporting strategy file `docs/qa/test-strategy.md`                         | `Complete`  | Markdown source is complete; final PDF export can be produced during submission packaging |
| Quality gate definitions and thresholds      | Sections `3.1`, `3.4`, and `5.2`                                                                 | `Complete`  | definitions, measured results, and traceability are documented separately             |
| CI/CD overview with screenshots and diagrams | Sections `3.2`, `5.3`, and screenshots in `docs/qa/screenshots/`                                | `Complete`  | pipeline diagram and successful workflow screenshot are already present               |
| Initial metrics from automation runs         | Section `4` and Section `5.4`                                                                    | `Complete`  | coverage, execution time, defects, and logs are recorded                             |
| Reproducibility evidence                     | Section `5.5` and artifacts under `.tmp/qa/`, `playwright-report/`, and `docs/qa/screenshots/` | `Complete`  | logs, screenshots, reports, and code references are all tracked                      |

The documentation best practices listed in Assignment 2 are also resolved explicitly:

- tables and metrics were updated to the verified `2026-04-03` baseline
- screenshots and logs are stored in dedicated evidence locations rather than scattered through the repository
- failure handling and alerting are documented in Section `3.3`
- the report is now structured so it can be reused directly as the main reference for the research paper chapter on automation strategy and implementation
- the requested automation-coverage and execution-time chart assets are now available in `docs/qa/screenshots/automation-coverage-chart.png` and `docs/qa/screenshots/execution-time-chart.png`

## 6. Deliverables Checklist

Assignment 2 ends with a deliverables checklist and additional notes for submission readiness. The table below resolves those requirements against the current repository state and this report.

| Deliverable                 | Description                                                                 | File / Location                                                                 | Status         | Notes / Evidence                                                                                              |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| Automated Test Scripts      | automated scripts for high-risk modules, including positive and negative flows | `server/src/test/`, `tests/e2e/`, repository: `https://github.com/a169n/aqa_1` | `Complete`   | high-risk API and browser smoke coverage is documented in Section `2`; commit history is listed in Section `2.4` |
| Version Control Evidence    | repository history showing implementation progress and organization of scripts | repository: `https://github.com/a169n/aqa_1`, Section `2.4`                     | `Complete`   | commit milestones are recorded in the report and the workspace is linked to a remote GitHub repository       |
| Filled Scope / Case / Evidence Tables | scope, test cases, scripts, version control, metrics, and reproducibility tables | Sections `2-5`                                                                   | `Complete`   | the report now contains the required structured tables for all major Assignment 2 components                 |
| Updated QA Test Strategy Document | document containing automation approach, tool selection, quality gates, CI/CD overview, and initial results | `docs/qa/assignment-2-report.md`, `docs/qa/test-strategy.md`                    | `Complete`   | content is present in source form and can be exported to PDF/DOCX during final submission packaging          |
| Quality Gate Report         | definitions, thresholds, results, and failure-handling documentation         | Sections `3.1-3.4`, `5.2`                                                        | `Complete`   | quality-gate logic and evidence sources are fully documented                                                 |
| Metrics Report              | tables/charts/logs for coverage, execution time, and defects                 | Section `4`, `.tmp/qa/`, `server/coverage/`, `docs/qa/screenshots/`             | `Complete`   | tables, logs, and the chart assets for Figure Placeholders `6` and `7` are now present |
| CI/CD Pipeline Evidence     | screenshots and diagrams showing pipeline integration and execution          | `docs/qa/screenshots/pipeline-overview.png`, `docs/qa/screenshots/workflow-pass.png` | `Complete`   | pipeline flow and successful workflow run are already captured                                               |
| Reproducibility Evidence    | logs, screenshots, and code references showing the tests can be rerun       | Section `5.5`, `.tmp/qa/`, `playwright-report/`, `docs/qa/screenshots/`         | `Complete`   | rerun evidence is centralized and traceable                                                                  |

### 6.1 Notes Resolution

The final notes in Assignment 2 are resolved in the current report and repository as follows:

- the checklist above can now be used directly to track submission readiness
- version-controlled evidence is available through the configured GitHub remote: `https://github.com/a169n/aqa_1`
- screenshots, logs, and diagrams are already organized into dedicated folders such as `docs/qa/screenshots/`, `.tmp/qa/`, and `playwright-report/`
- the checklist is written as part of the reproducibility record, not as a separate administrative note, so it supports the research paper requirement for traceable and verifiable evidence
