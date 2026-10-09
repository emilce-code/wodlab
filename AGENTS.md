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

## Delivered product scope

The repository has grown beyond the initial individual-athlete MVP. Existing
features now include:

- Coach dashboards, programming, monitoring, feedback, and analytics
- Multi-tenant Box management and Box-scoped catalogs
- Capacity-limited class scheduling, booking, and attendance
- Privacy-first workout leaderboards
- Training-load and performance analytics
- Installable PWA and offline result submission
- Mobile-first athlete, coach, class, and administration experiences

Preserve and extend these capabilities when implementing new work.

## Deferred scope

Do not implement without a backlog item or explicit request:

- Social feeds
- Payments and subscriptions
- Browser or native push delivery
- Native React Native or Expo applications
- Apple Health or Health Connect integrations
- AI recommendations or workout generation
- Redis, BullMQ, or background workers

The current delivery backlog identifies Box membership lifecycle and invitations
as the next planned phase. Recurring classes, waitlists, attendance reporting,
native mobile, health integrations, and AI remain later work.

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

## Approved UI design-to-code workflow

For changes to user-facing screens, follow the approved feature design contract in `docs/design/<feature>/spec.md` and the reusable QA checklist in `docs/design/visual-qa.md`.

- Approval is explicit and applies only to the approved feature/design version. Do not infer approval from discussions or draft mockups.
- GitHub issues define feature behavior and permissions; approved design specifications define screen layout, hierarchy, interactions and states. When they conflict, halt the affected decision and report it rather than inventing behavior.
- Inspect the actual approved reference images when they are available in the repository. A generated collage, placeholder, or schematic is not a pixel-accurate design token source; written approved scope controls if an illustration contains extras.
- Start from existing WODLY components and `apps/web/app/globals.css`; use dark theme, existing accent/tokens and en/es/pt. Do not add an unrelated visual redesign.
- Implement mobile first. Validate at 375x812, 390x844 and 430x932 CSS pixels; check tablet 768x1024 and desktop 1280x800.
- Run the application and internally verify baseline and relevant interactive states (e.g. bottom sheets, form invalid/saving/success). Compare layout, information order, spacing, component sizes and readability with approved references when available. Do not create or commit screenshots, recordings, mockups or visual QA artifacts.
- Report visual differences and fix significant discrepancies before declaring visual work ready. Never claim screenshot parity if you could not render and inspect the page. Do not pretend that documentation-only wireframes are approved pixel-perfect references.
- Confirm permissions on both UI and API for editing, and test missing/legacy data, loading, error and localized states.
- Per approved Global Design System v1 (#298), UI pull requests deliver only a concise implementation summary, test/build results, PR link and significant blockers. No screenshot evidence or visual reports. Do not merge automatically.

A feature-specific design document may be approved independently from engineering implementation. Do not treat design approval as permission to implement or ship code unless the request explicitly authorizes it.
