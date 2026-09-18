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

### Local demo data

To preview the application with realistic activity, load the separate local
demo dataset after migrations are applied:

```bash
pnpm seed:demo
```

The command is rerunnable and replaces only records whose IDs start with
`local_demo_`. It creates 30 mock users, two boxes, coaches, workouts, results,
movement history, 90+ days of schedules and classes, notifications, groups, and
program templates. The mock Auth0 subjects are `auth0|local-demo-01` through
`auth0|local-demo-30`; they are database identities only and do not create users
in Auth0.

On a fresh local database, you can attach the first demo user to your own Auth0
identity so the seeded history is visible after login:

```bash
WODLY_DEMO_AUTH0_USER_ID='your-auth0-sub' \
WODLY_DEMO_EMAIL='you@example.com' \
pnpm seed:demo
```

Use this before signing in for the first time; existing non-demo users are never
deleted or overwritten by the demo seed.

Run the API and web app in separate terminals:

```bash
pnpm --dir apps/api start:dev
pnpm --dir apps/web dev
```

## Quality checks

Copy `apps/web/.env.example` to `apps/web/.env.local` and provide the Auth0
application values before running the production web build.

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
