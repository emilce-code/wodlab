# WODLY

Mobile-first workout tracking, training planning, and coaching platform.

## Requirements

- Node.js 22.12 or later in the Node 22 release line
- pnpm 11.18
- PostgreSQL 17

## Local setup

```bash
pnpm install
docker compose up -d postgres
pnpm --dir apps/api exec prisma migrate deploy
pnpm --dir apps/api exec prisma db seed
```

Run the API and web app in separate terminals:

```bash
pnpm --dir apps/api start:dev
pnpm --dir apps/web dev
```

## Quality checks

Run the complete local release gate:

```bash
pnpm check
```

Run the database-backed API smoke tests after PostgreSQL is available and the
migrations have been applied:

```bash
pnpm test:e2e
```

Pull requests and pushes to `main` run the same lint, unit-test, smoke-test,
type-check, and production-build gates in GitHub Actions.
