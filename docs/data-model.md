# WODLab Initial Data Model

## Overview

This document describes the initial WODLab domain model.

The model is intentionally small and will evolve as features are implemented.

The most important distinction is:

Workout Definition != Workout Performance != Personal Record

## User

Represents an authenticated WODLab account.

Fields:

- id
- email
- passwordHash
- createdAt
- updatedAt

Relationships:

- One User has one AthleteProfile.
- One User may create many Workouts.

Notes:

Authentication-specific fields may evolve later.

## AthleteProfile

Represents athlete-specific information associated with a user.

Fields:

- id
- userId
- displayName
- preferredWeightUnit
- createdAt
- updatedAt

Potential future fields:

- profilePhotoUrl
- height
- bodyWeight

These future fields should not be added until required.

Relationships:

- Belongs to one User.
- Has many WorkoutPerformances.
- Has many PersonalRecords.

## WeightUnit

Possible values:

- KG
- LB

## Movement

Represents a movement that can appear inside a workout.

Examples:

- Back Squat
- Clean
- Snatch
- Pull-up
- Toes-to-Bar
- Running
- Rowing

Fields:

- id
- name
- category
- measurementType
- createdAt
- updatedAt

Potential categories:

- WEIGHTLIFTING
- GYMNASTICS
- MONOSTRUCTURAL
- OTHER

Potential measurement types:

- REPS
- WEIGHT
- DISTANCE
- DURATION
- CALORIES

The final enum design should be decided when the Movement feature is built.

## Workout

Represents the definition of a workout.

Examples:

- Fran
- Cindy
- Back Squat 5x5
- Custom gym workout

Fields:

- id
- createdByUserId
- name
- type
- description
- createdAt
- updatedAt

Potential workout types:

- FOR_TIME
- AMRAP
- STRENGTH
- MAX_REPS

Relationships:

- Created by one User.
- Has many WorkoutComponents.
- Has many WorkoutPerformances.

## WorkoutComponent

Represents one structured component inside a Workout.

Examples:

For Fran:

Component 1:
- Thruster
- 21, 15, 9 repetitions
- prescribed weight

Component 2:
- Pull-up
- 21, 15, 9 repetitions

Fields:

- id
- workoutId
- movementId
- order
- repetitions
- weight
- weightUnit
- distance
- duration
- calories
- notes

Not every field applies to every component.

The exact structure may evolve because CrossFit workouts can contain complex
round and rep schemes.

The MVP should avoid over-engineering this model.

## WorkoutPerformance

Represents one athlete completing a workout.

Fields:

- id
- workoutId
- athleteProfileId
- performedAt
- scoreType
- timeSeconds
- rounds
- repetitions
- load
- weightUnit
- isRx
- notes
- createdAt
- updatedAt

Examples:

For Time:

- timeSeconds = 522
- isRx = true

AMRAP:

- rounds = 6
- repetitions = 14

Strength:

- load = 100
- repetitions = 5

Relationships:

- Belongs to one Workout.
- Belongs to one AthleteProfile.
- May be associated with a PersonalRecord.

## ScoreType

Potential values:

- TIME
- ROUNDS_REPS
- LOAD
- REPS

Exact values should be finalized when score logging is implemented.

## PersonalRecord

Represents a best athlete result.

A personal record may relate to either:

- A Movement
- A benchmark Workout

Fields:

- id
- athleteProfileId
- movementId
- workoutId
- workoutPerformanceId
- recordType
- value
- achievedAt
- createdAt
- updatedAt

Examples:

Movement record:

Back Squat
1RM
120 kg

Workout record:

Fran
Best Time
5:42

## Personal record strategy

The long-term implementation must decide whether PersonalRecord is:

1. Persisted as a separate table.
2. Calculated dynamically from WorkoutPerformance history.
3. Persisted as a cached result while WorkoutPerformance remains the source of
   truth.

This decision should be made when implementing personal records.

For now, WorkoutPerformance should be considered the historical source of truth.

## Initial relationship overview

User
  |
  | 1:1
  v
AthleteProfile
  |
  | 1:N
  v
WorkoutPerformance
  |
  | N:1
  v
Workout

User
  |
  | creates
  v
Workout
  |
  | 1:N
  v
WorkoutComponent
  |
  | N:1
  v
Movement

AthleteProfile
  |
  | 1:N
  v
PersonalRecord

## Data modeling principles

- Do not model every possible CrossFit workout format immediately.
- Add complexity only when a real feature requires it.
- WorkoutPerformance is historical data and should not be overwritten when a
  new PR is achieved.
- Core business meaning should not depend on UI structure.
- Prefer explicit fields and enums over unstructured JSON unless flexibility is
  genuinely required.