# CepatUsaha

AI website builder monorepo.

## Architecture

```txt
apps/web      User UI (Vite/React)
apps/admin    Admin UI (Vite/React)
workers       Cloudflare Workers API (Hono)
db            Neon/Postgres SQL migrations
packages      Shared types/UI/utils/config
```

Rules:

- Neon = SQL only.
- Workers = API, auth, realtime, file ops, AI proxy.
- Web/Admin = UI only; no direct DB client.
- AI = one OpenAI-compatible endpoint with many model IDs.
- Secrets are never committed.

## Env

Workers secrets:

```env
DATABASE_URL=
CLERK_SECRET_KEY=
AI_BASE_URL=
AI_API_KEY=
AI_DEFAULT_MODEL=
```

Web/Admin public env:

```env
VITE_API_URL=
VITE_CLERK_PUBLISHABLE_KEY=
```

## Development

```bash
nvm use 20
pnpm install
pnpm dev
```

Individual apps:

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:workers
```

## Refactor

See [`REFACTOR_PLAN.md`](./REFACTOR_PLAN.md).
