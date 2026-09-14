-- Add active Box context to users.
ALTER TABLE "User" ADD COLUMN "activeBoxId" TEXT;

UPDATE "User" AS users
SET "activeBoxId" = (
  SELECT membership."boxId"
  FROM "BoxMembership" AS membership
  WHERE membership."userId" = users."id"
  ORDER BY membership."createdAt" ASC
  LIMIT 1
);

CREATE INDEX "User_activeBoxId_idx" ON "User"("activeBoxId");
ALTER TABLE "User"
ADD CONSTRAINT "User_activeBoxId_fkey"
FOREIGN KEY ("activeBoxId") REFERENCES "Box"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Attach coach-owned data to a Box tenant while retaining legacy rows that
-- cannot be associated safely.
ALTER TABLE "CoachAthleteRelationship" ADD COLUMN "boxId" TEXT;
ALTER TABLE "CoachGroup" ADD COLUMN "boxId" TEXT;
ALTER TABLE "ProgramTemplate" ADD COLUMN "boxId" TEXT;
ALTER TABLE "ScheduledWorkout" ADD COLUMN "boxId" TEXT;

UPDATE "CoachAthleteRelationship" AS relationship
SET "boxId" = (
  SELECT coach_membership."boxId"
  FROM "CoachProfile" AS coach
  JOIN "AthleteProfile" AS athlete
    ON athlete."id" = relationship."athleteProfileId"
  JOIN "BoxMembership" AS coach_membership
    ON coach_membership."userId" = coach."userId"
  JOIN "BoxMembership" AS athlete_membership
    ON athlete_membership."boxId" = coach_membership."boxId"
   AND athlete_membership."userId" = athlete."userId"
  WHERE coach."id" = relationship."coachProfileId"
  ORDER BY coach_membership."createdAt" ASC
  LIMIT 1
);

UPDATE "CoachGroup" AS coach_group
SET "boxId" = coach_user."activeBoxId"
FROM "CoachProfile" AS coach
JOIN "User" AS coach_user ON coach_user."id" = coach."userId"
WHERE coach."id" = coach_group."coachProfileId";

UPDATE "ProgramTemplate" AS template
SET "boxId" = coach_user."activeBoxId"
FROM "CoachProfile" AS coach
JOIN "User" AS coach_user ON coach_user."id" = coach."userId"
WHERE coach."id" = template."coachProfileId";

UPDATE "ScheduledWorkout" AS scheduled
SET "boxId" = coach_user."activeBoxId"
FROM "CoachProfile" AS coach
JOIN "User" AS coach_user ON coach_user."id" = coach."userId"
WHERE coach."id" = scheduled."assignedByCoachProfileId";

ALTER TABLE "CoachAthleteRelationship"
ADD CONSTRAINT "CoachAthleteRelationship_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachGroup"
ADD CONSTRAINT "CoachGroup_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramTemplate"
ADD CONSTRAINT "ProgramTemplate_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledWorkout"
ADD CONSTRAINT "ScheduledWorkout_boxId_fkey"
FOREIGN KEY ("boxId") REFERENCES "Box"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "CoachAthleteRelationship_coachProfileId_athleteProfileId_key";
DROP INDEX "CoachAthleteRelationship_athleteProfileId_status_idx";
DROP INDEX "CoachAthleteRelationship_coachProfileId_status_idx";
DROP INDEX "CoachGroup_coachProfileId_name_key";
DROP INDEX "CoachGroup_coachProfileId_idx";
DROP INDEX "ProgramTemplate_coachProfileId_name_key";
DROP INDEX "ProgramTemplate_coachProfileId_idx";
DROP INDEX IF EXISTS "ScheduledWorkout_athleteProfileId_workoutVariantId_scheduledDate_key";
DROP INDEX IF EXISTS "ScheduledWorkout_athleteProfileId_workoutVariantId_scheduledDat";

CREATE UNIQUE INDEX "CoachAthleteRelationship_boxId_coachProfileId_athleteProfileId_key"
ON "CoachAthleteRelationship"("boxId", "coachProfileId", "athleteProfileId");
CREATE INDEX "CoachAthleteRelationship_boxId_athleteProfileId_status_idx"
ON "CoachAthleteRelationship"("boxId", "athleteProfileId", "status");
CREATE INDEX "CoachAthleteRelationship_boxId_coachProfileId_status_idx"
ON "CoachAthleteRelationship"("boxId", "coachProfileId", "status");
CREATE UNIQUE INDEX "CoachGroup_boxId_coachProfileId_name_key"
ON "CoachGroup"("boxId", "coachProfileId", "name");
CREATE INDEX "CoachGroup_boxId_coachProfileId_idx"
ON "CoachGroup"("boxId", "coachProfileId");
CREATE UNIQUE INDEX "ProgramTemplate_boxId_coachProfileId_name_key"
ON "ProgramTemplate"("boxId", "coachProfileId", "name");
CREATE INDEX "ProgramTemplate_boxId_coachProfileId_idx"
ON "ProgramTemplate"("boxId", "coachProfileId");
CREATE UNIQUE INDEX "ScheduledWorkout_boxId_athleteProfileId_workoutVariantId_scheduledDate_key"
ON "ScheduledWorkout"("boxId", "athleteProfileId", "workoutVariantId", "scheduledDate");
CREATE INDEX "ScheduledWorkout_boxId_scheduledDate_status_idx"
ON "ScheduledWorkout"("boxId", "scheduledDate", "status");
CREATE INDEX "ScheduledWorkout_boxId_athleteProfileId_status_scheduledDate_idx"
ON "ScheduledWorkout"("boxId", "athleteProfileId", "status", "scheduledDate");
