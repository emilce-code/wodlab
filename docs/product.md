# WODLY Product Definition

## Overview

WODLY is a CrossFit performance tracking application for athletes who want to
record workouts, track progress, and understand their performance over time.

The first version is web-first.

A native mobile application may be added later using the same backend API.

## Problem

CrossFit athletes often track workouts across:

- Notes applications
- Spreadsheets
- Gym whiteboards
- Messaging apps
- Generic fitness applications

This makes it difficult to maintain structured workout history and understand
progress across movements and benchmark workouts.

WODLY provides a structured system for recording workouts and results while
building useful performance history.

## Primary user

The initial user is an individual CrossFit athlete.

The MVP does not depend on the athlete belonging to a gym or having a coach.

## Core value proposition

WODLY helps an athlete answer:

- What workouts have I completed?
- What score did I get last time?
- What are my current personal records?
- Am I improving?
- Which movements and workouts have I performed recently?

Future versions may answer more advanced questions such as:

- What movements are limiting my performance?
- What pacing strategy should I use?
- How balanced is my training?
- How has my performance changed over time?

## Main user flow

1. Create an account.
2. Create or select a workout.
3. Complete the workout.
4. Record the result.
5. Review workout history.
6. View personal records.
7. Compare current performance with previous results.

## MVP features

### Authentication

Users can:

- Register
- Log in
- Log out

### Athlete profile

Profile fields may include:

- Display name
- Preferred weight unit
- Optional profile photo

Supported weight units:

- Kilograms
- Pounds

### Movement library

Users can browse and search CrossFit movements.

Examples:

- Back Squat
- Front Squat
- Deadlift
- Clean
- Snatch
- Thruster
- Pull-up
- Chest-to-Bar Pull-up
- Toes-to-Bar
- Muscle-up
- Burpee
- Running
- Rowing
- Bike

Movements may have categories such as:

- Weightlifting
- Gymnastics
- Monostructural
- Other

### Workout creation

The MVP supports:

- For Time
- AMRAP
- Strength
- Max Reps

A workout contains one or more components.

A component may include:

- Movement
- Repetitions
- Weight
- Distance
- Duration
- Notes

### Workout performance

Users can record:

- Workout
- Date
- Score
- Rx or scaled status
- Notes
- Weight used
- Rounds
- Repetitions
- Time

The available score fields depend on the workout type.

### Workout history

Users can review previous workout performances.

History should support:

- Date
- Workout name
- Workout type
- Score
- Rx or scaled status
- Notes

### Personal records

Users can track personal records for:

- Strength movements
- Benchmark workouts

Examples:

- Back Squat 1RM
- Clean 1RM
- Snatch 1RM
- Fran best time

## Future features

Possible future capabilities include:

- Advanced performance analytics
- Movement-level trends
- Training volume analysis
- Workout pacing recommendations
- Workout parsing from text
- Coach accounts
- CrossFit box management
- Class programming
- Athlete groups
- Leaderboards
- Mobile applications
- Push notifications
- Offline workout logging
- Apple Health integration
- Health Connect integration
- AI-assisted workout analysis

These features are not part of the initial MVP.

## Product principle

WODLY should be useful even without AI.

AI or advanced analytics should improve an already useful product rather than
being required for the core experience.