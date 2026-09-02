ALTER TABLE "Workout"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deactivatedAt" TIMESTAMP(3);

CREATE INDEX "Workout_isActive_createdAt_idx"
ON "Workout"("isActive", "createdAt");
