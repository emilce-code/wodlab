-- CreateEnum
CREATE TYPE "ScheduledWorkoutStatus" AS ENUM ('PLANNED', 'COMPLETED');

-- CreateTable
CREATE TABLE "ScheduledWorkout" (
    "id" TEXT NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "workoutVariantId" TEXT NOT NULL,
    "prescriptionCategoryId" TEXT,
    "workoutResultId" TEXT,
    "scheduledDate" DATE NOT NULL,
    "status" "ScheduledWorkoutStatus" NOT NULL DEFAULT 'PLANNED',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledWorkout_workoutResultId_key" ON "ScheduledWorkout"("workoutResultId");

-- CreateIndex
CREATE INDEX "ScheduledWorkout_athleteProfileId_status_scheduledDate_idx" ON "ScheduledWorkout"("athleteProfileId", "status", "scheduledDate");

-- CreateIndex
CREATE INDEX "ScheduledWorkout_workoutId_scheduledDate_idx" ON "ScheduledWorkout"("workoutId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_workoutVariantId_fkey" FOREIGN KEY ("workoutVariantId") REFERENCES "WorkoutVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_prescriptionCategoryId_fkey" FOREIGN KEY ("prescriptionCategoryId") REFERENCES "PrescriptionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_workoutResultId_fkey" FOREIGN KEY ("workoutResultId") REFERENCES "WorkoutResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
