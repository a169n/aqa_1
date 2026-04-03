# Risk Assessment: Inkwell Blogging Platform

## System analysis

Inkwell is a `web application` with:

- Frontend: React + TypeScript (`client/`)
- Backend API: Express + TypeScript (`server/`)
- Data layer: PostgreSQL via TypeORM

The highest failure impact is in access control and content integrity paths because those paths affect account security, moderation authority, and user-visible data correctness.

## Methodology

- Scale: `1-5` for probability and `1-5` for impact.
- Formula: `Risk score = Probability x Impact`.
- Priority bands:
  - `16-25`: `P1` (critical, automate first)
  - `9-15`: `P2` (high, automate with targeted manual backup)
  - `1-8`: `P3` (medium/low, sample/manual where needed)

## Critical components ranked by failure impact

| Failure Impact Rank | Component ID | Component                             | Probability | Impact | Score | Priority | Reasoning                                                                                                        |
| ------------------- | ------------ | ------------------------------------- | ----------- | ------ | ----- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| 1 (highest)         | `C1`         | Authentication and session lifecycle  | 4           | 5      | 20    | `P1`     | Registration/login/refresh/logout and `/api/auth/me` control account access and token validity.                  |
| 1 (highest)         | `C2`         | Authorization and admin moderation    | 4           | 5      | 20    | `P1`     | Admin-only endpoints and role updates can expose all moderation and user management if broken.                   |
| 2                   | `C3`         | Post, comment, and like integrity     | 4           | 4      | 16    | `P1`     | Core content workflows require ownership checks, lifecycle transitions, and uniqueness constraints.              |
| 2                   | `C4`         | Profile management and avatar uploads | 3           | 4      | 12    | `P2`     | Profile updates and upload validation impact account data quality and platform stability.                        |
| 3                   | `C5`         | Public feed and navigation            | 3           | 3      | 9     | `P2`     | Public discovery is important for usability, but failures are usually less severe than auth/moderation failures. |

## Probability vs impact matrix

Legend: each cell contains `C#` component IDs.

| Impact \ Probability | 1   | 2   | 3    | 4        | 5   |
| -------------------- | --- | --- | ---- | -------- | --- |
| 5                    | -   | -   | -    | `C1, C2` | -   |
| 4                    | -   | -   | `C4` | `C3`     | -   |
| 3                    | -   | -   | `C5` | -        | -   |
| 2                    | -   | -   | -    | -        | -   |
| 1                    | -   | -   | -    | -        | -   |

## Assumptions and reasoning

- The repository in this workspace is the system under test.
- Scope is QA planning/baselining, not production load/performance certification.
- No payment, third-party messaging, or external notification services are implemented, so those areas are out of scope.

## Conclusions used by QA strategy

- High-risk module count: `5`
- `P1`: `C1`, `C2`, `C3`
- `P2`: `C4`, `C5`
