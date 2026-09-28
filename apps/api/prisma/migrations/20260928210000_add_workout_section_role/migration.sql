CREATE TYPE "WorkoutSectionRole" AS ENUM ('WARM_UP', 'STRENGTH', 'WOD', 'ACCESSORY', 'COOLDOWN', 'CUSTOM');

ALTER TABLE "WorkoutSection"
ADD COLUMN "role" "WorkoutSectionRole" NOT NULL DEFAULT 'WOD';
