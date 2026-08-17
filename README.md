# CepatUsaha

CepatUsaha is an AI-assisted website builder for creating, editing, previewing, and publishing web projects. The repository is a pnpm and Turborepo monorepo containing the customer workspace, an admin dashboard, a Cloudflare Workers API, shared packages, and PostgreSQL migrations.

## What is included

- **Web workspace**: React application for the authenticated website-building experience.
- **Admin dashboard**: React application for super-admin operations, monitoring, model configuration, and project data.
- **API**: Hono application running on Cloudflare Workers.
- **AI integration**: OpenAI-compatible provider configuration with streaming chat support.
- **Project files**: Read, update, delete, list, and search project files through the API.
- **Assets**: Image and asset uploads backed by Cloudflare R2.
- **Realtime**: Room-based realtime communication backed by a Cloudflare Durable Object.
- **Authentication**: Clerk authentication for the web application, admin dashboard, and API authorization.
- **Data storage**: Neon PostgreSQL accessed from the Workers API.
- **Shared code**: Workspace packages for types, UI components, utilities, and configuration.

## Architecture

```text
apps/
├── web/                 Customer website builder (React + Vite)
└── admin/               Admin dashboard (React + Vite)

workers/                 API (Hono + Cloudflare Workers)
├── src/features/        Feature-oriented API modules
├── src/middleware/      Authentication and cross-cutting middleware
└── test/                Node-based API and utility tests

db/migrations/           PostgreSQL schema and seed migrations

packages/
├── config/              Shared project configuration
├── shared-types/        Shared TypeScript types
├── ui-components/       Shared React UI components
└── utils/               Shared utilities and API helpers
```

The application follows these boundaries:

- The web and admin applications communicate with the API; they do not connect directly to PostgreSQL.
- The Workers API owns authentication checks, database access, file operations, AI requests, and realtime routing.
- Neon is used for PostgreSQL data storage.
- Cloudflare R2 stores uploaded assets.
- A Cloudflare Durable Object provides realtime room handling.
- Secrets stay outside the repository and are provided through local variables or Wrangler secrets.

## Requirements

- Node.js `24.x`
- pnpm `10.13.1`
- A Clerk application
- A Neon PostgreSQL database
- An OpenAI-compatible AI endpoint
- Cloudflare credentials for Workers, R2, and Durable Objects when deploying the API

The repository pins pnpm through the root `package.json`:

```bash
corepack enable
corepack prepare pnpm@10.13.1 --activate
```

## Quick start

Install dependencies from the repository root:

```bash
pnpm install
```

Create `workers/.dev.vars` manually using the variables listed below. Do not commit this file.

Create a frontend environment file for each Vite application:

```bash
# apps/web/.env.local
VITE_API_URL=http://localhost:8787
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key

# apps/admin/.env.local
VITE_API_URL=http://localhost:8787
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

Start all development services:

```bash
pnpm dev
```

The default local URLs are:

| Service | URL |
| --- | --- |
| Web | `http://localhost:5173` |
| Admin | `http://localhost:5174` |
| Workers API | `http://localhost:8787` |

Run an individual service when needed:

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:workers
```

## Environment variables

### Workers API

Set these values in `workers/.dev.vars` for local development. In deployed environments, use Wrangler secrets for sensitive values.

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
AI_BASE_URL=https://your-openai-compatible-endpoint/v1
AI_API_KEY=...
AI_DEFAULT_MODEL=...
```

Optional Workers variables supported by the current implementation include:

```env
AI_VISION_MODEL=...
AI_IMAGE_MODE=tool
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CONVERSATION_LOOP_ENABLED=true
MAX_LOOP_ITERATIONS=10
LOOP_ITERATION_TIMEOUT=120000
DEBUG_LOGS=false
ASSETS_PUBLIC_URL=
```

The Workers configuration also defines rate-limit settings for the chat loop, including `RATE_LIMIT_ENABLED`, `RATE_LIMIT_BASE_DELAY_MS`, `RATE_LIMIT_MAX_DELAY_MS`, `RATE_LIMIT_STRATEGY`, and `RATE_LIMIT_BACKOFF_MULTIPLIER`.

### Vite applications

Both frontend applications require the Clerk publishable key. The web application also supports the API aliases below:

```env
VITE_API_URL=http://localhost:8787
VITE_API_BASE_URL=http://localhost:8787
VITE_API_PATH=/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Use `VITE_API_URL` unless you specifically need the legacy `VITE_API_BASE_URL` or `VITE_API_PATH` behavior.

## Database migrations

SQL migrations live in [`db/migrations`](./db/migrations). They contain the PostgreSQL schema changes and seed data for sessions, chat messages, files, publications, AI models, admin data, audit logs, and agent skills.

Apply the migrations to the Neon database using the migration workflow used by your database tooling. The repository does not currently expose a root migration script, so do not assume that `pnpm migrate` is available.

The Workers API expects a valid `DATABASE_URL` and fails fast when it is missing.

## API capabilities

The API is registered in [`workers/src/routes.ts`](./workers/src/routes.ts). The current route groups include:

- Chat streaming and stopping: `/api/chat/*`
- Sessions and session messages: `/api/sessions` and `/api/session-messages`
- User profile: `/api/profile`
- Publications and publishing: `/api/list-publications`, `/api/publish-site`, and `/api/delete-publication`
- Analytics: `/api/get-analytics`
- Project files: `/api/projects/:projectId/files` and `/api/files/*`
- Assets and images: `/api/assets/*` and `/api/images/upload`
- Realtime rooms: `/api/realtime/:room`
- Available AI models: `/api/models` and `/models`
- Super-admin APIs: `/api/admin/*`

Most protected routes require a valid Clerk session. Admin routes additionally require the super-admin authorization handled by the API middleware.

## Development commands

Run commands from the repository root:

```bash
# Build every workspace
pnpm build

# Build one application
pnpm build:web
pnpm build:admin

# Type-check every workspace
pnpm typecheck

# Lint every workspace
pnpm lint

# Run workspace tests
pnpm test

# Remove generated files and dependencies
pnpm clean
```

Run Workers-specific commands with pnpm filtering:

```bash
pnpm --filter=cepatusaha-workers build
pnpm --filter=cepatusaha-workers typecheck
pnpm --filter=cepatusaha-workers test
pnpm --filter=cepatusaha-workers deploy
pnpm --filter=cepatusaha-workers deploy:staging
pnpm --filter=cepatusaha-workers deploy:production
```

The web and admin packages currently report `no tests yet`; the Workers package contains the executable test suite.

## Deploy the API

The API is configured in [`workers/wrangler.toml`](./workers/wrangler.toml) with separate development, staging, and production environments.

Before deploying, configure the required secrets for the target environment:

```bash
cd workers
wrangler secret put DATABASE_URL --env development
wrangler secret put CLERK_SECRET_KEY --env development
wrangler secret put AI_BASE_URL --env development
wrangler secret put AI_API_KEY --env development
wrangler secret put AI_DEFAULT_MODEL --env development
```

Then deploy through the workspace script:

```bash
pnpm --filter=cepatusaha-workers deploy:staging
pnpm --filter=cepatusaha-workers deploy:production
```

The Workers deployment uses:

- R2 bucket binding `ASSETS_BUCKET`
- Durable Object binding `REALTIME_ROOM`
- Environment-specific API names and frontend origins
- Wrangler observability

Use `wrangler tail`, or the package scripts below, to inspect deployed logs:

```bash
pnpm --filter=cepatusaha-workers tail
pnpm --filter=cepatusaha-workers tail:staging
pnpm --filter=cepatusaha-workers tail:production
```

## Project conventions

- Keep database access inside `workers`.
- Reuse shared types, UI components, and utilities from `packages` instead of duplicating them in an application.
- Keep secrets in `.dev.vars`, `.env.local`, deployment settings, or Wrangler secrets; never commit credentials.
- Keep API features organized under `workers/src/features`.
- Update or add a migration when changing the PostgreSQL schema.
- Validate changes with the narrowest relevant command first, then run the broader monorepo checks when practical.

## Current implementation notes

- The admin dashboard exposes pages for users, chats, models, tokens, storage, publications, health, functions, analytics, dependencies, audit logs, and settings.
- Several admin API groups are registered but currently return a not-implemented response. The route registration should not be treated as proof that every dashboard operation is backed by a completed backend implementation.
- The web and admin packages currently use placeholder test scripts. Add focused tests when changing non-trivial frontend behavior.
- The Workers package contains the active automated tests for routes and AI/file-processing utilities.

## Repository license

The Workers package declares the MIT license. The repository does not currently provide a separate root-level license file.
