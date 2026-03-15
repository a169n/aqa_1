# Risk Assessment: Inkwell Blogging Platform

## System overview

Inkwell is a web-based blogging platform with a React frontend and an Express + PostgreSQL backend. The highest business risk is concentrated around authentication, authorization, content integrity, and moderation because those flows affect access control, user trust, and platform data.

## Methodology

- Scale: `1-5` for probability and `1-5` for impact.
- Formula: `Risk score = Probability x Impact`.
- Priority rule:
  - `16-25`: Critical, automate first.
  - `9-15`: High, automate or cover with a strong manual fallback.
  - `1-8`: Medium/Low, cover later or sample manually.

## Prioritized modules

| Priority | Module                                | Probability | Impact | Score | Reasoning                                                                                                                  |
| -------- | ------------------------------------- | ----------- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| 1        | Authentication and session lifecycle  | 4           | 5      | 20    | Registration, login, refresh, logout, and `/auth/me` directly control account access and token security.                   |
| 2        | Authorization and admin moderation    | 4           | 5      | 20    | Admin-only routes, role changes, and last-admin protection can expose the whole platform if broken.                        |
| 3        | Post, comment, and like integrity     | 4           | 4      | 16    | Core content flows drive the product value and include ownership checks, cascade deletes, and duplicate-like constraints.  |
| 4        | Profile management and avatar uploads | 3           | 4      | 12    | Email uniqueness, personal data updates, and file uploads affect account integrity and reliability.                        |
| 5        | Public feed and navigation            | 3           | 3      | 9     | Public browsing is business-critical for usability, but failures are usually less damaging than auth or moderation issues. |

## Assumptions

- The existing GitHub repository is the submission system under test.
- Assignment 1 focuses on QA setup, prioritization, and baseline automation rather than a production release.
- Payment, notifications outside the browser session, and third-party integrations are out of scope because they do not exist in this system.

## High-risk conclusions

- High-risk module count: `5`
- `P1` modules to automate first:
  - Authentication/session lifecycle
  - Authorization/admin controls
  - Post/comment/like integrity
- `P2` modules:
  - Profile updates and avatar uploads
- `P3` modules:
  - Public browsing and navigation smoke coverage
