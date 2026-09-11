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

Users can edit workouts they created while those workouts have no results,
scheduled sessions, or program-template references. Referenced workouts retain
their historical structure and can be deactivated instead of deleted. Admins
can manage any workout, including official system workouts.

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

### Training planning

Users can:

- Schedule a workout variation for a specific date
- Review today's and upcoming training
- Use monthly calendar and agenda views
- Reschedule or remove planned sessions
- Open a planned session directly into result logging
- Automatically mark a scheduled session complete when its result is saved
- Revisit completed sessions and their results

### Performance insights

Users can review consistency, performance, and training-balance insights across
selectable periods.

### Coach foundation

Users can optionally create a coach profile while retaining their athlete
profile. Coaches can invite registered athletes, access data only after athlete
approval, assign workout variations, monitor completion, and attach feedback to
completed assignments. Athletes control their coaching relationships and see
coach instructions in their training plan.

### Coach programming and weekly planning

Coaches can open an athlete's weekly plan, move between training weeks, assign
workout variations to individual days, add prescription categories and coaching
notes, remove their own planned assignments, and copy their programming from the
previous week. Completed training remains read-only historical data.

### Coach groups and program templates

Coaches can organize actively connected athletes into groups, build reusable
seven-day program templates, and assign a complete template to every athlete in
a group for a selected week. Existing assignments are preserved and reported as
skipped instead of being overwritten.

### Coach monitoring and athlete feedback

Coaches can monitor assigned training by date, group, athlete, and completion
state. The dashboard highlights overdue sessions and completed assignments that
still need review. Athletes can attach contextual comments to scheduled sessions,
and coaches can respond with feedback that remains visible in training history.

### Coach analytics and group insights

Coaches can compare completion, overdue training, recorded repetition and load
volume, weekly adherence, workout-type distribution, movement-category
distribution, and frequently assigned workouts. Analytics can be scoped by date
range, athlete, or coach-owned group, with drill-down links to athlete details.

### Training calculators and percentage prescriptions

Athletes can calculate weight percentages in KG or LB, apply equipment-aware
rounding, reverse-calculate the percentage represented by a performed weight,
and view per-side barbell loading. Workout creators can prescribe a percentage
of the same movement's exact rep max. When the athlete has that RM recorded,
the workout displays a personalized target in the athlete's preferred unit;
otherwise it clearly identifies the missing RM.

### Notifications and training reminders

Athletes have a mobile-first inbox for upcoming and overdue planned workouts
and pending coach invitations. Notifications can be opened, marked as read, or
dismissed. Each user can independently enable workout and coach updates and
choose how many days before training workout reminders appear.

### Training load and recovery analytics

Athletes can compare their estimated seven-day training load with a rolling
four-week weekly baseline. The progress experience includes an eight-week
trend, normalized weight volume, session and rest-day counts, consecutive
training days, workload status, and conservative recovery guidance. The UI
clearly identifies these values as training estimates rather than medical
advice.

### Installable and offline experience

WODLY can be installed from supported mobile browsers and launches in a
standalone, portrait-oriented experience. Previously opened pages remain
available during connectivity interruptions. New workout and movement results
submitted while offline are queued on the device, clearly identified to the
athlete, and synchronized when connectivity returns. Editing existing results
still requires an active connection to prevent conflicting changes.

### Server pagination and scalable libraries

The movement and workout libraries load compact pages from the API instead of
downloading the complete catalog. Search and benchmark filtering run in the
database, active and archived workout views keep independent pagination state,
and mobile users can progressively load more records without losing the current
filter. Existing unpaginated consumers remain compatible during the transition.

### Smart workout pacing and strategy

Active workout variations include an explainable pacing plan derived from the
workout structure and up to ten comparable athlete attempts. The plan provides
a realistic target range, confidence indicator, section effort progression,
movement break guidance, transition advice, and warnings for high-volume or
heavy-percentage work. First attempts receive conservative structure-based
guidance without pretending that personal performance data exists.

### Workout text import

Workout creators can paste common workout notation and preview a structured
draft before anything is saved. The importer detects common workout formats,
durations, rounds, rep schemes, movement prescriptions, and catalog movements.
Unknown, ambiguous, and dual-load lines stay visible for manual review in the
normal workout editor, which retains its existing validation and final review.

## Future features

Possible future capabilities include:

- Deeper training-volume analytics
- Training volume analysis
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
