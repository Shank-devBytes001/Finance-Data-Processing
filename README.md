# Finance backend (Zorvyn assignment)

Node.js + Express + **SQLite** + Prisma + JWT. Role-based access for a finance dashboard API (no database server or password — data lives in `prisma/dev.db`).

## Assumptions

- **Roles**
  - **VIEWER** — `GET /api/dashboard/summary` only (aggregates + recent activity). Cannot access raw financial records or user management.
  - **ANALYST** — Viewer capabilities plus **read-only** access to `GET /api/records` (list, filter, detail).
  - **ADMIN** — Full CRUD on records (create/update/soft-delete), full user management, same dashboard/record visibility as analyst for reads.
- **Dashboard metrics** are **system-wide** (all non–soft-deleted records), suitable for an org-level dashboard.
- **Records** belong to a user (`userId`). Admins may set `userId` when creating/updating a record; others own records under their own id.
- **Soft delete** for records (`isDeleted`); list endpoints hide deleted rows unless `includeDeleted=true` (admin use-case).
- **User delete** is only allowed when the user has **no** linked records (foreign key). Remove or reassign records first.
- **JWT:** routes use **role (and id) from the signed token** for RBAC. **`GET /api/auth/me`** loads the user from the DB so the profile is current (e.g. inactive account).

## Run locally

1. **Create `.env`** in the project root with at least:

   ```
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="your-long-random-secret"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   ```

   Optional: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (see seed section).

2. **Install, migrate, seed, run**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```
   Open `http://localhost:3000/health` — you should see `{ "ok": true }`.

No PostgreSQL install required. The DB file is gitignored (`prisma/*.db`).

Prisma v7 uses `prisma.config.ts` for migrations; the app uses `@prisma/adapter-better-sqlite3` at runtime.

## Seeded logins (after `db:seed`)

| Role    | Email               | Password (default) |
|--------|---------------------|--------------------|
| ADMIN  | admin@zorvyn.local  | Admin12345!        |
| ANALYST| analyst@zorvyn.local | Admin12345!       |
| VIEWER | viewer@zorvyn.local | Admin12345!        |

Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`.

## API overview

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api-docs` | — | — | Swagger UI (OpenAPI) |
| GET | `/health` | — | — | Liveness |
| POST | `/api/auth/login` | — | — | `{ email, password }` → JWT |
| GET | `/api/auth/me` | Bearer | all | Current user profile |
| GET | `/api/dashboard/summary` | Bearer | VIEWER+ | Totals, category breakdown, trends, recent activity |
| GET | `/api/records` | Bearer | ANALYST, ADMIN | Paginated list; query: `type`, `category`, `dateFrom`, `dateTo`, `search`, `page`, `limit`, `includeDeleted` |
| GET | `/api/records/:id` | Bearer | ANALYST, ADMIN | Single record |
| POST | `/api/records` | Bearer | ADMIN | Create record |
| PATCH | `/api/records/:id` | Bearer | ADMIN | Update record |
| DELETE | `/api/records/:id` | Bearer | ADMIN | Soft-delete |
| GET | `/api/users` | Bearer | ADMIN | Paginated users |
| GET | `/api/users/:id` | Bearer | ADMIN | User by id |
| POST | `/api/users` | Bearer | ADMIN | Create user |
| PATCH | `/api/users/:id` | Bearer | ADMIN | Update user |
| DELETE | `/api/users/:id` | Bearer | ADMIN | Delete user |

Send JSON with header `Authorization: Bearer <token>`.

## OpenAPI (interactive docs)

After `npm run dev`, open **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)** for Swagger UI. The machine-readable spec lives at `openapi/openapi.yaml` (OpenAPI 3.0).

### Dashboard query params

- `trendGranularity`: `week` | `month` (default `month`)
- `trendBuckets`: number of buckets (default `6`, max `24`)
- `recentLimit`: recent rows (default `10`, max `50`)

## Project layout

- `src/app.js` — Express app, routes, global error handler
- `src/routes/` — HTTP layer
- `src/services/` — Business logic and Prisma access
- `src/middleware/` — JWT auth, RBAC, Zod validation
- `src/validators/` — Zod schemas
- `openapi/openapi.yaml` — OpenAPI description (served at `/api-docs`)
- `prisma/` — Schema, migrations, seed

## Tradeoffs

- Intentionally small surface area: no rate limiting or automated tests in-repo (easy to add later).
- JWT carries role for authorization; revoking access or role changes mid-session need shorter token TTL or a server-side check if you outgrow this (not needed for this scope).
- Trend bucketing is computed in the service layer from fetched rows; for very large datasets you would push aggregation into SQL.
