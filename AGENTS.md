# WODLY Project Instructions

WODLY is a web-first CrossFit performance tracking application designed to
support a future mobile application.

The developer is building this project to learn and demonstrate full-stack
engineering skills.

## Development approach

When working on this repository:

- Prefer small, reviewable changes.
- Explain the proposed approach before implementing.
- Identify the files that will be created or modified.
- Do not introduce dependencies without explaining why they are needed.
- Do not implement unrelated features.
- Preserve the API-first architecture.
- Keep core business logic outside the frontend.
- Add or update tests when behavior changes.
- Update documentation when architecture or domain decisions change.
- Avoid premature optimization.
- Avoid premature microservices.

## Technology stack

### Monorepo
- pnpm workspaces
- Turborepo

### Web
- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

### API
- NestJS
- TypeScript
- REST API
- OpenAPI documentation

### Database
- PostgreSQL
- Prisma

### Infrastructure
- Docker Compose for local development

### Future
- React Native
- Expo
- Redis
- BullMQ
- Background workers

Do not add Redis, BullMQ, background workers, or the mobile app until they are
needed by a real feature.

## Architecture principles

WODLY follows an API-first modular monolith architecture.

The web application consumes the NestJS API.

A future mobile application must consume the same NestJS API.

Core business rules belong in the backend or shared domain packages.

Do not place important business logic only inside:

- React components
- Next.js Server Actions
- Next.js route handlers
- UI-specific utilities

## Core domain distinction

These concepts must remain separate:

Workout Definition != Workout Performance != Personal Record

### Workout Definition

Defines what the athlete is expected to perform.

Example:

Fran

21-15-9
Thrusters
Pull-ups

### Workout Performance

Represents one athlete completing a workout at a specific time.

Example:

Fran
Time: 6:12
Rx: true
Performed: 2026-08-07

### Personal Record

Represents or derives the athlete's best result from performance history.

## MVP scope

The initial MVP includes:

- User registration and login
- Athlete profile
- Preferred weight unit
- Movement library
- Workout creation
- For Time workouts
- AMRAP workouts
- Strength workouts
- Max Reps workouts
- Workout result logging
- Rx and scaled results
- Workout history
- Personal records

## Out of scope for the MVP

Do not implement yet:

- Coach dashboards
- Box management
- Class scheduling
- Social feeds
- Leaderboards
- AI recommendations
- AI workout generation
- Advanced analytics
- Payments
- Subscriptions
- Push notifications
- Mobile-specific features
- Health integrations
- Background workers

These may be added later after the core product is stable.

## Repository structure

Expected structure:

wodlab/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── domain/
│   ├── validation/
│   ├── api-client/
│   └── config/
├── docs/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json

Not all packages need to exist immediately.

Create them only when they provide real value.

## Coding guidelines

- Use TypeScript strict typing.
- Avoid `any` unless clearly justified.
- Prefer explicit domain types.
- Keep controllers thin.
- Put business logic in services or domain functions.
- Keep database access behind backend services.
- Validate API inputs.
- Use meaningful names.
- Avoid large files with multiple responsibilities.
- Prefer composition over deeply coupled modules.
- Keep APIs predictable and consistent.

## Testing

When behavior is added:

- Add unit tests for business rules.
- Add integration tests for database-backed behavior where useful.
- Add API tests for important endpoints.
- Add end-to-end tests only for critical user flows.

Do not write tests only to increase coverage percentage.

## Documentation

Update documentation when:

- A new domain concept is introduced.
- The architecture changes.
- A major dependency is introduced.
- A new cross-cutting convention is adopted.
- An important technical decision is made.

Prefer documenting important architectural decisions under:

docs/decisions/