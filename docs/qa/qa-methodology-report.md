# QA Automation Methodology and Results

## Abstract

This report documents a risk-based QA workflow for the Inkwell Platform, a full-stack blogging application with authentication, role-based moderation, content workflows, and profile management. The work focuses on building a reproducible automation baseline that combines backend integration testing, browser smoke validation, CI quality gates, and machine-readable evidence artifacts. The current implementation achieves full automated coverage of all `P1` risk modules, `38/38` passing API scenarios, `4/4` passing browser smoke scenarios, backend coverage above the `80%` gate, and a clean dependency audit. The results show that a small but well-prioritized automation layer can provide stronger evidence quality than a broader but less disciplined set of ad hoc tests.

## Research questions

1. Can a risk-based automation strategy provide complete automated protection for the highest-impact modules of the system?
2. Do explicit CI quality gates improve reproducibility and reduce ambiguity compared with raw test execution alone?
3. Is the selected technology and tooling stack a better fit for this project than common alternatives when evaluated on maintainability, speed, and evidence quality?

## Introduction

The Inkwell Platform combines frontend and backend behavior that is typical of a modern content product: authentication, authorization, CRUD workflows, moderation actions, uploads, and user-facing discovery. That makes it a useful QA subject because not all failures are equally important. A broken visual detail and a broken authorization rule are both defects, but they do not carry the same risk.

The QA strategy in this repository therefore treats automation as a prioritization problem rather than a scenario-count problem. The goal is not to maximize the number of tests for its own sake. The goal is to ensure that the most damaging failures are covered first, that the validation flow is reproducible, and that the resulting evidence is strong enough to support later analysis and reporting.

## Literature review

This workflow reflects several established QA ideas:

- Risk-based testing argues that test effort should be concentrated where failure probability and business impact intersect most strongly.
- Layered automation models such as the test pyramid recommend keeping most checks below the UI layer because lower-level tests are faster, cheaper, and easier to stabilize.
- Shift-left and CI-oriented quality practices emphasize early, repeatable validation over late manual inspection.
- Secure-by-default guidance, especially around session handling and transport of authentication material, favors reducing token exposure on the client and enforcing consistent server-side controls.

These ideas are complementary in this project. Risk analysis determines what to automate first, the layered strategy determines where to automate it, CI gates determine when the build is acceptable, and secure defaults ensure that the automation does not validate an unsafe baseline.

## System under test

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript + TypeORM
- Database: PostgreSQL
- Core domains:
  - authentication and session lifecycle
  - authorization and admin moderation
  - content creation, publication, archival, and reporting
  - profile updates and avatar upload
  - public browsing and discovery

## Methodology

### Risk model

Five critical components were identified:

| ID | Component | Priority |
| -- | --------- | -------- |
| `C1` | Authentication and session lifecycle | `P1` |
| `C2` | Authorization and admin moderation | `P1` |
| `C3` | Content integrity and moderation workflow | `P1` |
| `C4` | Profile management and avatar uploads | `P2` |
| `C5` | Public browsing and discovery flows | `P2` |

The implementation target was straightforward: every `P1` module must be covered by automation, and the release pipeline must reject builds that fall below the agreed thresholds.

### Test approach

- Backend integration testing is the primary confidence layer.
- Browser smoke testing proves the system works across frontend, backend, database, and auth boundaries.
- Manual tools support inspection and evidence capture but are not the main release decision mechanism.

This leads to a pragmatic execution model:

- `Vitest + Supertest` for high-volume API validation
- `Playwright` for integrated smoke coverage
- `Swagger UI` and Postman for human inspection and demonstration support
- `GitHub Actions` for enforcement and artifact retention

### Development approach

The repo now follows a `risk-based, test-first expansion` pattern:

1. Identify the riskiest missing or weakly covered behavior.
2. Add or strengthen automated tests first.
3. Implement or harden the underlying code.
4. Capture results through coverage, reports, and quality gates.

This approach is closer to disciplined TDD on critical slices than to test-after coding. It fits the current repo better than a pure greenfield TDD model because the project already existed before the QA methodology was formalized.

## Technology stack justification

The selected application stack is appropriate for QA-focused work because it is modular, mainstream, and testable.

- React and Vite make frontend behavior easy to drive from browser automation.
- Express exposes routes cleanly for integration testing and security middleware insertion.
- TypeORM and PostgreSQL provide realistic persistence behavior, which matters for auth, moderation, and content workflows.
- The stack is complex enough to produce meaningful QA tradeoffs without introducing enterprise-scale infrastructure that would drown the assignment in setup overhead.

## Tool stack justification

| Tool | Why it was kept |
| ---- | --------------- |
| `Vitest` | Fast TypeScript-native test runner already aligned with the backend workspace. |
| `Supertest` | Direct request/response validation without introducing network or browser noise. |
| `Playwright` | Reliable multi-step browser validation with strong report export. |
| `GitHub Actions` | Native CI fit for the repository and good artifact handling. |
| `Swagger UI` | Makes API contracts inspectable without extra tooling friction. |
| `Postman` | Helpful for manual replay and reviewer-oriented evidence. |

## Comparative analysis

### API automation

- `Vitest + Supertest` was preferred over `Jest + Supertest` because the backend already used modern TypeScript tooling and did not need extra migration or compatibility work.
- `Newman/Postman` was not selected as the primary automated API layer because it is better for replayable request collections than for deep repository-native test maintenance.

### Browser automation

- `Playwright` was preferred over `Cypress` because this project benefits more from deterministic multi-process orchestration and artifact output than from Cypress-specific browser debugging ergonomics.
- Pure manual smoke testing was rejected because it does not generate machine-readable evidence or stable CI enforcement.

### CI orchestration

- `GitHub Actions` was preferred over local-only scripts because the QA workflow needs visible and repeatable gates at PR/push time.
- Heavier CI systems such as Jenkins were unnecessary for the size and scope of the project.

## Metrics justification

The chosen metrics were selected because they answer the research questions directly:

- `P1` automation coverage answers whether the risk model is actually enforced.
- API and E2E pass/fail counts answer whether the automated behavior is stable.
- Statement and line coverage answer whether the backend automation reaches sufficient execution depth.
- Quality-gate status answers whether measurements are actionable rather than merely descriptive.
- Dependency audit status answers whether the validated baseline is also security-conscious at the dependency level.

These metrics are not perfect. Coverage does not guarantee correctness, and smoke tests do not guarantee exhaustive UI quality. However, together they provide a defensible, multi-angle view of QA effectiveness.

## Current implementation results

### Security and system hardening

- Refresh-token transport was moved to an `HttpOnly` cookie.
- Auth endpoints were marked `no-store`.
- Security headers were added centrally.
- Auth routes were protected with a basic rate limiter.
- Avatar upload validation now enforces MIME allowlisting and file-size limits.

### Automation and CI results (`2026-04-02`)

| Result | Value |
| ------ | ----- |
| API scenarios | `38/38` passed |
| Browser smoke scenarios | `4/4` passed |
| Statement coverage | `83.73%` |
| Line coverage | `83.33%` |
| `P1` automation coverage | `100%` |
| Quality gates | all passed |
| Dependency audit | `0` vulnerabilities |

Machine-readable artifacts are generated in:

- `.tmp/qa/vitest-report.json`
- `.tmp/qa/playwright-report.json`
- `.tmp/qa/qa-summary.json`
- `server/coverage/coverage-summary.json`

## Discussion

The results indicate that the QA workflow is effective for the current scope because it is selective rather than bloated. The backend suite covers the highest-risk logic thoroughly enough to exceed the gate. The browser suite remains intentionally small, but it validates the exact integrated flows that would be most damaging if broken. CI closes the loop by converting those raw results into explicit release decisions.

The strongest outcome is not the absolute number of tests. It is the fact that the automation, metrics, and evidence now tell a consistent story. The repo, the pipeline, and the supporting documents describe the same QA state instead of competing versions of it.

## Limitations

- Branch coverage remains lower than line and statement coverage, so some alternate paths still need expansion.
- The browser suite is smoke-oriented rather than exhaustive.
- Frontend performance optimization and bundle-splitting remain outside the current QA gate set.
- Some residual opportunities remain in lower-covered service modules, especially where business logic has more permutations than the current tests exercise.

## Conclusion

The repository now has a coherent QA baseline built around risk-based prioritization, secure session handling, reproducible CI evidence, and enforceable quality gates. The current state is strong enough to support comparative analysis and further expansion without changing the overall methodology. The next useful step is not to widen the stack arbitrarily, but to deepen targeted coverage in the lower-covered service branches while keeping the same evidence model and gate discipline.
