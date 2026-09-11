# WODLY Architecture

## Overview

WODLY uses a web-first, API-first modular monolith architecture.

The initial architecture is:

Browser
|
v
Next.js Web Application
|
v
NestJS REST API
|
v
Prisma
|
v
PostgreSQL

A future React Native application will consume the same NestJS API.

## Architecture goals

The architecture should:

- Support web first.
- Support native mobile later.
- Keep frontend and backend responsibilities separate.
- Keep business rules independent from UI technology.
- Be simple enough for one developer to maintain.
- Allow individual parts to scale later.
- Avoid premature microservices.

## Applications

### apps/web

Technology:

- Next.js
- React
- TypeScript
- Tailwind CSS

Responsibilities:

- User interface
- Routing
- Forms
- Client-side state
- API consumption
- Web-specific rendering
- Public web pages

The web application should not own core business logic.

### apps/api

Technology:

- NestJS
- TypeScript
- Prisma

Responsibilities:

- Authentication
- Authorization
- API validation
- Business rules
- Database access
- Workout logic
- Performance logic
- Personal record logic

## Database

Technology:

- PostgreSQL

ORM:

- Prisma

The database stores:

- Users
- Athlete profiles
- Movements
- Workouts
- Workout components
- Workout performances
- Personal records
- Scheduled workout sessions and their optional completed results

Workout mutations are authorized in the API. Administrators may manage any
workout; regular users may manage only non-official workouts they created.
Structural updates and permanent deletion require the workout to have no
results, scheduled sessions, or program-template references.

## Future mobile application

Future application:

apps/mobile

Technology:

- React Native
- Expo
- TypeScript

The mobile application will consume the same backend API as the web app.

This avoids duplicating backend logic.

## Shared packages

Potential shared packages:

### packages/domain

Contains domain types and pure domain logic that can safely be shared.

Examples:

- Workout type definitions
- Score types
- Weight units
- Domain utility functions

### packages/validation

Contains shared validation schemas where appropriate.

Technology:

- Zod

### packages/api-client

Contains a typed client for communicating with the NestJS API.

This package may eventually be used by both:

- apps/web
- apps/mobile

### packages/config

Contains shared TypeScript or tooling configuration when needed.

Shared packages should only be created when there is real shared behavior.

## Backend architecture

The NestJS application should remain a modular monolith.

Expected modules may include:

src/
├── auth/
├── coaches/
├── users/
├── athlete-profiles/
├── movements/
├── workouts/
├── workout-performances/
├── personal-records/
├── scheduled-workouts/
├── prisma/
└── health/

Each module should own a clear domain responsibility.

## Controller responsibilities

Controllers should:

- Receive HTTP requests.
- Validate request input.
- Call application services.
- Return HTTP responses.

Controllers should not contain substantial business logic.

## Service responsibilities

Services should contain:

- Business rules
- Application workflows
- Domain coordination
- Database operations

## API design

The backend exposes a REST API.

Example future routes:

GET /health

POST /auth/register
POST /auth/login
POST /auth/refresh

GET /me

GET /movements
GET /movements/:id

POST /workouts
GET /workouts
GET /workouts/:id

POST /workout-performances
GET /workout-performances
GET /workout-performances/:id

GET /personal-records

Exact contracts should be defined as features are implemented.

Implemented scheduling routes include:

```text
POST   /scheduled-workouts
GET    /scheduled-workouts
PATCH  /scheduled-workouts/:id
DELETE /scheduled-workouts/:id
```

Scheduled sessions are athlete-owned. Result creation validates the associated
schedule and completes it in the same database transaction. Deleting the linked
result reopens the scheduled session so planning and history remain consistent.

Coach access is represented by an explicit `CoachAthleteRelationship`. Athlete
data access and assignment operations require an active relationship at the API
service layer. Coach assignments extend scheduled workouts with the assigning
coach, programming instructions, review feedback, and review timestamp.

Weekly coach programming reuses `ScheduledWorkout` rather than introducing a
second planning model. The weekly endpoint applies a bounded seven-day query and
marks only planned, result-free assignments created by the current coach as
manageable. Removal is independently authorized by the API. The web proxy
forwards query strings so date-bounded coach requests reach the API unchanged.

Coach groups and reusable program templates live in the `coach-programming`
module. Group membership is limited to athletes with an active coaching
relationship. Applying a template creates ordinary `ScheduledWorkout` records
with the coach as assigner and relies on the schedule uniqueness constraint plus
`createMany({ skipDuplicates: true })` to preserve existing athlete plans.

## Authentication

The architecture should support both web and future mobile clients.

Web may use:

- Secure HTTP-only cookies

Mobile may use:

- Access tokens
- Refresh tokens
- Secure device storage

Authorization must be enforced by the API.

The frontend must never be the only layer enforcing access control.

## Local development

Local infrastructure uses Docker Compose.

Initial services:

- PostgreSQL

Future services may include:

- Redis

Redis should not be introduced until required.

## Background processing

Background processing is not required for the MVP.

Future use cases may include:

- Notifications
- Imports
- Analytics jobs
- Scheduled tasks
- AI processing

When needed, a worker application may be added:

apps/worker

Potential technology:

- BullMQ
- Redis

## Scalability

The initial application does not require microservices.

The API can initially scale horizontally as a stateless service.

Background workers can scale separately once introduced.

The database can initially use a managed PostgreSQL instance.

Future infrastructure may include:

- Managed PostgreSQL
- Managed Redis
- Object storage
- CDN
- Multiple API instances
- Multiple worker instances

## Architectural principles

- API-first
- Modular monolith
- Explicit domain boundaries
- Shared contracts
- Server-enforced authorization
- Small modules
- Strong typing
- Explicit validation
- No premature microservices
- No premature background processing
- No business logic tied exclusively to one frontend

## Coach monitoring boundary

Coach monitoring queries remain in the `coach-programming` API module and are
scoped by the authenticated coach profile. Athlete comments are written through
the `scheduled-workouts` module, which verifies assignment ownership. Coach
feedback continues through the coach module, which verifies an active coaching
relationship and assignment ownership. The web application proxies these APIs
without duplicating authorization rules.

## Coach analytics

Coach analytics are calculated from coach-owned scheduled assignments within the
modular API. Group and athlete filters are authorized before querying. Aggregates
are derived server-side from assignment completion and linked workout-result
details, while the web dashboard receives a compact presentation contract and
renders dependency-free, accessible visual summaries.

## Training calculator boundary

Standalone percentage and plate-loading arithmetic remains in the web client.
Personalized workout targets are calculated by the authenticated
`training-calculators` API module from structured workout prescriptions and
the athlete's strongest exact-repetition movement result. Unit normalization
and authorization remain server-side; persisted historical results are never
rewritten when a newer rep max is recorded.

## Notification boundary

The notifications API derives time-sensitive reminders from the current
scheduled-workout and coaching relationship state. Per-user preferences and
read/dismiss receipts are persisted separately, avoiding duplicated copies of
domain records. The Next.js notification route performs the authenticated API
proxying, while localized presentation stays in the web application.

## Training load boundary

Training-load aggregates are calculated server-side from existing workout and
standalone movement results. Load volume is normalized to kilograms, multiple
logs on the same UTC date are grouped into one session, and the API returns a
compact eight-week series plus acute and rolling-baseline metrics. The web app
renders these estimates without a charting dependency and labels recovery
recommendations as non-medical training guidance.

## PWA and offline boundary

The web application registers a dependency-free service worker that caches the
manifest, icons, static assets, offline fallback, and successfully visited page
responses. Authenticated API reads are never cached. New result POST requests
can be serialized to an IndexedDB queue after a network failure and replayed
with the active same-origin session. Existing-result PATCH operations are not
queued because conflict resolution is intentionally out of scope. Private page
caches and queued writes are cleared when the user logs out.

## Pagination boundary

Collection endpoints support validated, one-based `page` and bounded
`pageSize` parameters and return items with total-count metadata. Prisma applies
filters, ordering, `skip`, and `take` before records reach the web application.
Pagination is opt-in for backward compatibility with selectors that still need
complete reference collections. The main movement and workout libraries use the
paginated contract and merge additional pages client-side behind mobile-first
load-more controls.
