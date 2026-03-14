# Inkwell Platform

Inkwell Platform is a full-stack blogging application with a React frontend and an Express + TypeORM backend. It includes user authentication, refresh-token sessions, role-based access control, blog post management, comments, likes, user profiles with avatar upload, and an admin dashboard.

## Tech stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, shadcn-style UI components
- Backend: Node.js, Express, TypeScript, TypeORM, PostgreSQL, JWT authentication
- Tooling: ESLint, Prettier, npm workspaces

## Features

- Register and login with email and password
- JWT access tokens plus refresh-token session renewal
- Create, edit, delete, and read blog posts
- Comment on posts and delete your own comments
- Like and unlike posts
- View and update profile information
- Upload a profile avatar
- Admin dashboard for posts, users, comments, likes, and role changes
- Automatic promotion of the first registered account to `admin` on a fresh database

## Project structure

```text
.
|-- client/   # React application
|-- server/   # Express API and PostgreSQL integration
|-- package.json
`-- README.md
```

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 20+ recommended
- npm 10+ recommended
- PostgreSQL running locally
- A PostgreSQL database created for this app

## Installation

Install all workspace dependencies from the repository root:

```bash
npm install
```

## Environment setup

Create local environment files from the provided examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Backend environment variables

These live in [`server/.env.example`](/Users/a1byn/Documents/Playground/server/.env.example).

| Variable | Description | Example |
|---|---|---|
| `PORT` | Express API port | `4000` |
| `CLIENT_URL` | Frontend origin allowed by CORS | `http://localhost:5173` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_NAME` | PostgreSQL database name | `inkwell` |
| `DATABASE_USER` | PostgreSQL username | `postgres` |
| `DATABASE_PASSWORD` | PostgreSQL password | `postgres` |
| `JWT_ACCESS_SECRET` | Secret used for access tokens | `change-me-access` |
| `JWT_REFRESH_SECRET` | Secret used for refresh tokens | `change-me-refresh` |
| `ACCESS_TOKEN_TTL` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime in days | `7` |
| `AUTO_RUN_MIGRATIONS` | Runs TypeORM migrations on server start | `true` |
| `UPLOAD_DIR` | Local upload folder for avatars | `uploads` |

### Frontend environment variables

These live in [`client/.env.example`](/Users/a1byn/Documents/Playground/client/.env.example).

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base API URL used by the frontend | `http://localhost:4000/api` |

## Database setup

1. Start PostgreSQL locally.
2. Create the database named in `server/.env`.
3. Keep `AUTO_RUN_MIGRATIONS=true` if you want the server to apply migrations automatically at startup.

Example:

```sql
CREATE DATABASE inkwell;
```

If you prefer to run migrations manually instead of auto-running them on startup:

```bash
npm run migration:run --workspace server
```

## Running the app

Start both the frontend and backend from the repository root:

```bash
npm run dev
```

This starts:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

You can also run each side separately:

```bash
npm run dev:server
npm run dev:client
```

## Available scripts

From the repository root:

```bash
npm run dev
npm run dev:server
npm run dev:client
npm run build
npm run lint
npm run format
```

Backend-only:

```bash
npm run dev --workspace server
npm run build --workspace server
npm run migration:run --workspace server
npm run migration:revert --workspace server
```

Frontend-only:

```bash
npm run dev --workspace client
npm run build --workspace client
```

## Build and verification

Production builds for both workspaces can be generated with:

```bash
npm run build
```

Lint both workspaces with:

```bash
npm run lint
```

Format the repository with:

```bash
npm run format
```

## Authentication and roles

- Users authenticate with email and password.
- The backend returns an access token and a refresh token.
- The frontend attaches the access token to authenticated API requests.
- When an access token expires, the frontend attempts to refresh the session automatically.
- The first user registered against a fresh database becomes `admin`.
- Admin users can manage all posts, comments, likes, users, and roles.

## Main API areas

The API is mounted under `/api`.

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- Posts: `/api/posts`
- Comments: `/api/posts/:postId/comments`
- Likes: `/api/posts/:postId/likes`
- Profile: `/api/user/profile`, `/api/user/profile/avatar`
- Admin: `/api/admin/posts`, `/api/admin/users`, `/api/admin/comments`, `/api/admin/likes`

## Uploaded files

- Avatar uploads are stored under `server/uploads/avatars/`
- Uploaded files are served from the backend under `/uploads/...`

## Important implementation notes

- This project intentionally does not include tests, CI/CD, OAuth, or third-party auth providers.
- The backend uses TypeORM migrations rather than schema synchronization.
- Deleting users or posts cascades related records through the database relations.
- Likes are unique per user and post.

## Troubleshooting

### Server fails to start

Check:

- PostgreSQL is running
- The database exists
- Credentials in `server/.env` are correct
- JWT secrets are set

### Frontend cannot reach the API

Check:

- `VITE_API_URL` in `client/.env`
- `CLIENT_URL` in `server/.env`
- The backend is running on the expected port

### Migrations do not apply

Check:

- `AUTO_RUN_MIGRATIONS=true`
- Or run `npm run migration:run --workspace server` manually

## Key files

- Root scripts: [`package.json`](/Users/a1byn/Documents/Playground/package.json)
- Backend entry: [`server/src/index.ts`](/Users/a1byn/Documents/Playground/server/src/index.ts)
- Backend routes: [`server/src/routes/index.ts`](/Users/a1byn/Documents/Playground/server/src/routes/index.ts)
- Initial migration: [`server/src/migrations/1700000000000-InitialSchema.ts`](/Users/a1byn/Documents/Playground/server/src/migrations/1700000000000-InitialSchema.ts)
- Frontend entry: [`client/src/main.tsx`](/Users/a1byn/Documents/Playground/client/src/main.tsx)
- Frontend router: [`client/src/router.tsx`](/Users/a1byn/Documents/Playground/client/src/router.tsx)
