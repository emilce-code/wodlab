-- Phase 48 — Box-Scoped Workout Catalog
-- Existing official workouts become GLOBAL.
-- Existing non-official workouts become PERSONAL so private/user-created data
-- is not accidentally exposed as global catalog content.

CREATE TYPE "WorkoutScope" AS ENUM ('GLOBAL', 'BOX', 'PERSONAL');

ALTER TABLE "Workout"
ADD COLUMN "scope" "WorkoutScope",
ADD COLUMN "boxId" TEXT,
ADD COLUMN "sourceWorkoutId" TEXT;

UPDATE "Workout"
SET "scope" = CASE
  WHEN "official" = TRUE THEN 'GLOBAL'::"WorkoutScope"
  ELSE 'PERSONAL'::"WorkoutScope"
END;

ALTER TABLE "Workout"
ALTER COLUMN "scope" SET NOT NULL,
ALTER COLUMN "scope" SET DEFAULT 'PERSONAL';

ALTER TABLE "Workout"
ADD CONSTRAINT "Workout_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workout"
ADD CONSTRAINT "Workout_sourceWorkoutId_fkey"
FOREIGN KEY ("sourceWorkoutId") REFERENCES "Workout"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Workout"
ADD CONSTRAINT "Workout_scope_box_consistency"
CHECK (
  ("scope" = 'BOX' AND "boxId" IS NOT NULL)
  OR
  ("scope" IN ('GLOBAL', 'PERSONAL') AND "boxId" IS NULL)
);

CREATE INDEX "Workout_scope_isActive_createdAt_idx"
ON "Workout"("scope", "isActive", "createdAt");

CREATE INDEX "Workout_boxId_isActive_createdAt_idx"
ON "Workout"("boxId", "isActive", "createdAt");

CREATE INDEX "Workout_createdByUserId_scope_isActive_idx"
ON "Workout"("createdByUserId", "scope", "isActive");

CREATE INDEX "Workout_sourceWorkoutId_idx"
ON "Workout"("sourceWorkoutId");


-- ---------------------------------------------------------------------------
-- Shared Box workout visibility assertion
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION wodlab_assert_box_workout_visible(
  p_workout_id TEXT,
  p_box_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_scope "WorkoutScope";
  v_box_id TEXT;
BEGIN
  IF p_workout_id IS NULL THEN
    RETURN;
  END IF;

  SELECT "scope", "boxId"
  INTO v_scope, v_box_id
  FROM "Workout"
  WHERE "id" = p_workout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found'
      USING ERRCODE = '23514';
  END IF;

  IF v_scope = 'GLOBAL' THEN
    RETURN;
  END IF;

  IF v_scope = 'BOX'
     AND p_box_id IS NOT NULL
     AND v_box_id = p_box_id THEN
    RETURN;
  END IF;

  RAISE EXCEPTION 'Workout is not visible in this Box'
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- ClassSession
--
-- A class belongs to a Box, so its workout must either be:
--   * GLOBAL
--   * BOX-scoped to that exact Box
--
-- PERSONAL workouts cannot be attached to Box classes.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION wodlab_class_workout_scope_guard()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM wodlab_assert_box_workout_visible(
    NEW."workoutId",
    NEW."boxId"
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ClassSession_workout_scope_guard"
BEFORE INSERT OR UPDATE OF "workoutId", "boxId"
ON "ClassSession"
FOR EACH ROW
EXECUTE FUNCTION wodlab_class_workout_scope_guard();


-- ---------------------------------------------------------------------------
-- ScheduledWorkout
--
-- ScheduledWorkout does not contain boxId.
--
-- Visibility is therefore determined from the workout itself and the athlete:
--
--   GLOBAL:
--     Always valid.
--
--   PERSONAL:
--     Only valid when the workout belongs to the scheduled athlete.
--
--   BOX:
--     The athlete must currently belong to the workout's Box.
--
-- We deliberately do not depend on User.activeBoxId here. A scheduled workout
-- remains valid even when the athlete later changes their currently selected
-- Box.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION wodlab_scheduled_workout_scope_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_scope "WorkoutScope";
  v_workout_box_id TEXT;
  v_workout_creator_id TEXT;
  v_athlete_user_id TEXT;
  v_has_membership BOOLEAN;
BEGIN
  IF NEW."workoutId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    w."scope",
    w."boxId",
    w."createdByUserId"
  INTO
    v_scope,
    v_workout_box_id,
    v_workout_creator_id
  FROM "Workout" w
  WHERE w."id" = NEW."workoutId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found'
      USING ERRCODE = '23514';
  END IF;

  SELECT ap."userId"
  INTO v_athlete_user_id
  FROM "AthleteProfile" ap
  WHERE ap."id" = NEW."athleteProfileId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Athlete profile not found'
      USING ERRCODE = '23514';
  END IF;

  IF v_scope = 'GLOBAL' THEN
    RETURN NEW;
  END IF;

  IF v_scope = 'PERSONAL'
     AND v_workout_creator_id = v_athlete_user_id THEN
    RETURN NEW;
  END IF;

  IF v_scope = 'BOX' AND v_workout_box_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM "BoxMembership" bm
      WHERE bm."boxId" = v_workout_box_id
        AND bm."userId" = v_athlete_user_id
    )
    INTO v_has_membership;

    IF v_has_membership THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'Workout is not visible to this scheduled athlete'
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ScheduledWorkout_workout_scope_guard"
BEFORE INSERT OR UPDATE OF "workoutId", "athleteProfileId"
ON "ScheduledWorkout"
FOR EACH ROW
EXECUTE FUNCTION wodlab_scheduled_workout_scope_guard();


-- ---------------------------------------------------------------------------
-- ProgramTemplateItem
--
-- Box-scoped program templates may use:
--   * GLOBAL workouts
--   * BOX workouts belonging to that Box
--
-- Personal/non-Box coach templates may use:
--   * GLOBAL workouts
--   * PERSONAL workouts created by that coach
--
-- Cross-Box workout references are rejected.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION wodlab_program_template_workout_scope_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_template_box_id TEXT;
  v_coach_user_id TEXT;

  v_workout_scope "WorkoutScope";
  v_workout_box_id TEXT;
  v_workout_creator_id TEXT;
BEGIN
  IF NEW."workoutId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    pt."boxId",
    cp."userId"
  INTO
    v_template_box_id,
    v_coach_user_id
  FROM "ProgramTemplate" pt
  JOIN "CoachProfile" cp
    ON cp."id" = pt."coachProfileId"
  WHERE pt."id" = NEW."programTemplateId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program template not found'
      USING ERRCODE = '23514';
  END IF;

  SELECT
    w."scope",
    w."boxId",
    w."createdByUserId"
  INTO
    v_workout_scope,
    v_workout_box_id,
    v_workout_creator_id
  FROM "Workout" w
  WHERE w."id" = NEW."workoutId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found'
      USING ERRCODE = '23514';
  END IF;

  IF v_workout_scope = 'GLOBAL' THEN
    RETURN NEW;
  END IF;

  IF v_template_box_id IS NOT NULL
     AND v_workout_scope = 'BOX'
     AND v_workout_box_id = v_template_box_id THEN
    RETURN NEW;
  END IF;

  IF v_template_box_id IS NULL
     AND v_workout_scope = 'PERSONAL'
     AND v_workout_creator_id = v_coach_user_id THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Workout is not visible to this program template'
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ProgramTemplateItem_workout_scope_guard"
BEFORE INSERT OR UPDATE OF "workoutId", "programTemplateId"
ON "ProgramTemplateItem"
FOR EACH ROW
EXECUTE FUNCTION wodlab_program_template_workout_scope_guard();


-- ---------------------------------------------------------------------------
-- WorkoutResult
--
-- Results may only be created for workouts visible to the athlete.
--
-- GLOBAL:
--   Available to every athlete.
--
-- PERSONAL:
--   Available only to the athlete that owns the workout.
--
-- BOX:
--   Available only when the athlete is a member of that Box.
--
-- Membership is the durable authorization boundary here. activeBoxId is a UI
-- context selector and should not determine whether historical/result data
-- remains valid.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION wodlab_workout_result_scope_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_scope "WorkoutScope";
  v_workout_box_id TEXT;
  v_creator_user_id TEXT;
  v_athlete_user_id TEXT;
  v_has_membership BOOLEAN;
BEGIN
  IF NEW."workoutId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    w."scope",
    w."boxId",
    w."createdByUserId"
  INTO
    v_scope,
    v_workout_box_id,
    v_creator_user_id
  FROM "Workout" w
  WHERE w."id" = NEW."workoutId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found'
      USING ERRCODE = '23514';
  END IF;

  SELECT ap."userId"
  INTO v_athlete_user_id
  FROM "AthleteProfile" ap
  WHERE ap."id" = NEW."athleteProfileId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Athlete profile not found'
      USING ERRCODE = '23514';
  END IF;

  IF v_scope = 'GLOBAL' THEN
    RETURN NEW;
  END IF;

  IF v_scope = 'PERSONAL'
     AND v_creator_user_id = v_athlete_user_id THEN
    RETURN NEW;
  END IF;

  IF v_scope = 'BOX' AND v_workout_box_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM "BoxMembership" bm
      WHERE bm."boxId" = v_workout_box_id
        AND bm."userId" = v_athlete_user_id
    )
    INTO v_has_membership;

    IF v_has_membership THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'Workout is not visible to this athlete'
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WorkoutResult_workout_scope_guard"
BEFORE INSERT OR UPDATE OF "workoutId", "athleteProfileId"
ON "WorkoutResult"
FOR EACH ROW
EXECUTE FUNCTION wodlab_workout_result_scope_guard();