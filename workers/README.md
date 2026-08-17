# Workers API

Cloudflare Workers backend for CepatUsaha.

## Structure

```txt
src/
├─ index.ts              # Hono app bootstrap
├─ routes.ts             # route registration
├─ bindings.ts           # Cloudflare/env bindings
├─ db.ts                 # Neon SQL factory
├─ middleware/           # cross-cutting request middleware
├─ shared/               # reusable errors/logger/types/validation
└─ features/             # feature-sliced modules
   ├─ admin/
   ├─ analytics/
   ├─ assets/
   ├─ chat/
   ├─ files/
   ├─ models/
   ├─ planning/
   ├─ profile/
   ├─ publications/
   ├─ realtime/
   └─ sessions/
```

## Local env

```bash
cp workers/.env.example workers/.dev.vars
```

Required secrets:

```env
DATABASE_URL=
CLERK_SECRET_KEY=
AI_BASE_URL=
AI_API_KEY=
AI_DEFAULT_MODEL=
```

## Commands

```bash
pnpm dev:workers
pnpm --filter=cepatusaha-workers test
pnpm --filter=cepatusaha-workers build
pnpm --filter=cepatusaha-workers deploy
```
