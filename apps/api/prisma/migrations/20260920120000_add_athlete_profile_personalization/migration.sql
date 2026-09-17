CREATE TYPE "AthleteTrainingGoal" AS ENUM (
  'GENERAL_FITNESS',
  'STRENGTH',
  'CONDITIONING',
  'GYMNASTICS',
  'WEIGHTLIFTING',
  'COMPETITION'
);

ALTER TABLE "AthleteProfile"
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "trainingGoals" "AthleteTrainingGoal"[] NOT NULL DEFAULT ARRAY[]::"AthleteTrainingGoal"[],
ADD COLUMN "weeklyTrainingTarget" INTEGER,
ADD COLUMN "loadRoundingIncrement" DOUBLE PRECISION;

ALTER TABLE "AthleteProfile"
ADD CONSTRAINT "AthleteProfile_weeklyTrainingTarget_check"
CHECK ("weeklyTrainingTarget" IS NULL OR "weeklyTrainingTarget" BETWEEN 1 AND 7),
ADD CONSTRAINT "AthleteProfile_loadRoundingIncrement_check"
CHECK ("loadRoundingIncrement" IS NULL OR "loadRoundingIncrement" IN (0.5, 1, 2.5, 5));
