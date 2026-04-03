# Inkwell Platform

Inkwell Platform is a full-stack blogging application with a React frontend and an Express + TypeORM backend. It includes JWT authentication, refresh-token sessions, role-based access control, blog post management, comments, likes, profile editing with avatar upload, and an admin dashboard.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS
- Backend: Node.js, Express, TypeScript, TypeORM, PostgreSQL
- Auth: JWT access tokens and refresh tokens
- Tooling: ESLint, Prettier, npm workspaces, Swagger UI

## Features

- Register and log in with email and password
- Automatic refresh-token session renewal
- Create, edit, view, and delete blog posts
- Add comments and remove your own comments
- Like and unlike posts
- Update profile name, email, and avatar
- Profile activity view for posts and comments
- Profile notifications for update, upload, and delete actions
- Confirmation modal before deleting posts or comments from the profile page
- Admin dashboard for managing posts, users, comments, likes, and user roles
- Automatic promotion of the first registered user to `admin` on a fresh database
- Interactive Swagger docs for the backend API

## Project Structure

```text
.
|-- client/   # React application
|-- server/   # Express API and PostgreSQL integration
|-- package.json
|-- .prettierrc
|-- .prettierignore
`-- README.md
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL running locally
- A PostgreSQL database created for this app

## Installation

Install workspace dependencies from the repository root:

```bash
npm install
```

## Environment Setup

Create local environment files from the provided examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Backend Environment Variables

Defined in [server/.env.example](server/.env.example).

| Variable                 | Description                             | Example                 |
| ------------------------ | --------------------------------------- | ----------------------- |
| `PORT`                   | Express API port                        | `4000`                  |
| `CLIENT_URL`             | Frontend origin allowed by CORS         | `http://localhost:5173` |
| `DATABASE_HOST`          | PostgreSQL host                         | `localhost`             |
| `DATABASE_PORT`          | PostgreSQL port                         | `5432`                  |
| `DATABASE_NAME`          | PostgreSQL database name                | `inkwell`               |
| `DATABASE_USER`          | PostgreSQL username                     | `postgres`              |
| `DATABASE_PASSWORD`      | PostgreSQL password                     | `postgres`              |
| `JWT_ACCESS_SECRET`      | Secret used for access tokens           | `change-me-access`      |
| `JWT_REFRESH_SECRET`     | Secret used for refresh tokens          | `change-me-refresh`     |
| `ACCESS_TOKEN_TTL`       | Access token lifetime                   | `15m`                   |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime in days          | `7`                     |
| `AUTO_RUN_MIGRATIONS`    | Runs TypeORM migrations on server start | `true`                  |
| `UPLOAD_DIR`             | Local upload folder for avatars         | `uploads`               |

### Frontend Environment Variables

Defined in [client/.env.example](client/.env.example).

| Variable       | Description                       | Example                     |
| -------------- | --------------------------------- | --------------------------- |
| `VITE_API_URL` | Base API URL used by the frontend | `http://localhost:4000/api` |

## Database Setup

1. Start PostgreSQL locally.
2. Create the database named in `server/.env`.
3. Keep `AUTO_RUN_MIGRATIONS=true` if you want migrations to run automatically when the server starts.

Example:

```sql
CREATE DATABASE inkwell;
```

If you prefer to run migrations manually:

```bash
npm run migration:run --workspace server
```

For local/demo data management:

```bash
npm run db:clean
npm run db:seed
```

- `npm run db:clean` truncates the application tables and resets identity sequences without dropping the database.
- `npm run db:seed` runs pending migrations, cleans existing application data, and inserts deterministic demo users, categories, tags, posts, post-tag links, comments, likes, bookmarks, refresh tokens, and a sample report.
- Both commands refuse to run unless `DATABASE_NAME` looks like a local/dev/test database. The default `inkwell` database is allowed.

Seeded demo credentials:

- `admin@example.com` / `Password123!`
- `user@example.com` / `Password123!`

## Running The App

Start both workspaces from the repository root:

```bash
npm run dev
```

This starts:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Swagger UI: `http://localhost:4000/docs`

When the server dev process starts successfully, Swagger UI opens automatically in the browser.

You can also run each side separately:

```bash
npm run dev:server
npm run dev:client
```

## Running The Backend In Docker

1. Create the backend env file if you do not already have one:

```bash
cp server/.env.example server/.env
```

2. Start PostgreSQL and the backend together:

```bash
docker compose -f docker-compose.backend.yml up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- Backend API on `http://localhost:4000`
- Swagger UI on `http://localhost:4000/docs`

The compose setup automatically points the backend container at the `db` service, so you can keep the default database values from `server/.env`.
The Postgres container also creates both `inkwell` and `inkwell_test` automatically on first startup.

To stop the containers:

```bash
docker compose -f docker-compose.backend.yml down
```

To stop them and remove the database volume too:

```bash
docker compose -f docker-compose.backend.yml down -v
```

## QA Automation

Install dependencies from the repository root:

```bash
npm ci
```

Start the dedicated PostgreSQL service for tests:

```bash
docker compose -f docker-compose.backend.yml up -d db
```

Run the automated QA checks:

```bash
npm run ci
```

The automated test flow reuses the PostgreSQL host, port, username, and password from `server/.env`, but it always targets a separate test database. By default that database is `inkwell_test`; set `TEST_DATABASE_NAME` if your machine uses a different test database name.

Helpful scripts:

```bash
npm run db:clean
npm run db:seed
npm run test:api
npm run test:coverage
npm run test:e2e
npm run qa:gates
npm audit
npm run ci
npm run docker:build:backend
```

The browser smoke tests automatically start the backend and frontend with CI-friendly settings, reset the dedicated test database, and save reports to `playwright-report/`, `test-results/`, and `.tmp/qa/`.

Current verified QA snapshot (`2026-04-02`):

- `npm run lint` -> passed
- `npm run build` -> passed
- `npm run test:coverage` -> `38/38` backend integration tests passed
- `npm run test:e2e` -> `4/4` Playwright smoke tests passed
- `npm run qa:gates` -> all quality gates passed
- `npm audit` -> `0` vulnerabilities
- Backend coverage -> `83.73%` statements, `83.33%` lines

## QA Deliverables

The QA documentation and evidence scaffolding live under `docs/qa/`:

- `docs/qa/risk-assessment.md`
- `docs/qa/test-strategy.md`
- `docs/qa/environment-setup-report.md`
- `docs/qa/baseline-metrics.md`
- `docs/qa/qa-methodology-report.md`
- `docs/qa/postman/inkwell-qa.postman_collection.json`
- `docs/qa/screenshots/`

## Available Scripts

From the repository root:

```bash
npm run dev
npm run dev:server
npm run dev:client
npm run db:clean
npm run db:seed
npm run build
npm run lint
npm run lint:fix
npm run test:api
npm run test:coverage
npm run test:e2e
npm run ci
npm run docker:build:backend
npm run format
npm run format:check
```

Server-only:

```bash
npm run dev --workspace server
npm run build --workspace server
npm run db:clean --workspace server
npm run db:seed --workspace server
npm run migration:run --workspace server
npm run migration:revert --workspace server
```

Client-only:

```bash
npm run dev --workspace client
npm run build --workspace client
```

## API Docs

Swagger UI is available locally at `http://localhost:4000/docs`.

The raw OpenAPI document is available at `http://localhost:4000/docs.json`.

Main API areas:

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- Posts: `/api/posts`, `/api/posts/:id`, `/api/posts/:id/publish`, `/api/posts/:id/archive`, `/api/posts/:id/restore`
- Comments: `/api/posts/:postId/comments`
- Likes: `/api/posts/:postId/likes`
- Taxonomy: `/api/categories`, `/api/tags`
- Workspace: `/api/workspace/posts`
- Bookmarks: `/api/bookmarks`, `/api/posts/:id/bookmarks`
- Reports: `/api/reports`, `/api/admin/reports`
- Profile: `/api/user/profile`, `/api/user/profile/avatar`
- Admin: `/api/admin/posts`, `/api/admin/users`, `/api/admin/comments`, `/api/admin/likes`, `/api/admin/categories`, `/api/admin/tags`

## Formatting And Linting

Prettier is configured at the repo root in [`.prettierrc`](.prettierrc), with generated output ignored through [`.prettierignore`](.prettierignore).

Useful commands:

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Authentication And Roles

- Users authenticate with email and password.
- The backend returns an access token and a refresh token.
- The frontend attaches the access token to authenticated requests.
- When an access token expires, the frontend attempts to refresh the session automatically.
- The first user registered against a fresh database becomes `admin`.
- Admin users can manage all posts, comments, likes, users, and roles.

## Uploaded Files

- Avatar uploads are stored under `server/uploads/avatars/`
- Uploaded files are served from the backend under `/uploads/...`

## Important Notes

- The backend uses TypeORM migrations instead of schema synchronization.
- Deleting users or posts cascades related records through the database relations.
- Likes are unique per user and post.
- The repository now includes API integration tests, Playwright smoke tests, and a GitHub Actions QA pipeline.

## Troubleshooting

### Server Fails To Start

Check:

- PostgreSQL is running
- The database exists
- Credentials in `server/.env` are correct
- JWT secrets are set

### Frontend Cannot Reach The API

Check:

- `VITE_API_URL` in `client/.env`
- `CLIENT_URL` in `server/.env`
- The backend is running on the expected port

### Swagger Does Not Open Automatically

Check:

- The server actually started on `http://localhost:4000`
- Your OS allows browser launch from local scripts
- Swagger is still reachable directly at `http://localhost:4000/docs`

### Migrations Do Not Apply

Check:

- `AUTO_RUN_MIGRATIONS=true`
- Or run `npm run migration:run --workspace server` manually

## Key Files

- Root scripts: [package.json](package.json)
- Root formatter config: [.prettierrc](.prettierrc)
- Root formatter ignore: [.prettierignore](.prettierignore)
- Backend entry: [server/src/index.ts](server/src/index.ts)
- Backend app setup: [server/src/app.ts](server/src/app.ts)
- Swagger setup: [server/src/docs/swagger.ts](server/src/docs/swagger.ts)
- OpenAPI document: [server/src/docs/openapi.ts](server/src/docs/openapi.ts)
- Backend routes: [server/src/routes/index.ts](server/src/routes/index.ts)
- Frontend router: [client/src/router.tsx](client/src/router.tsx)
- Profile page: [client/src/pages/profile-page.tsx](client/src/pages/profile-page.tsx)
