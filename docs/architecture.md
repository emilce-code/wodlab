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
├── users/
├── athlete-profiles/
├── movements/
├── workouts/
├── workout-performances/
├── personal-records/
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

GET    /health

POST   /auth/register
POST   /auth/login
POST   /auth/refresh

GET    /me

GET    /movements
GET    /movements/:id

POST   /workouts
GET    /workouts
GET    /workouts/:id

POST   /workout-performances
GET    /workout-performances
GET    /workout-performances/:id

GET    /personal-records

Exact contracts should be defined as features are implemented.

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