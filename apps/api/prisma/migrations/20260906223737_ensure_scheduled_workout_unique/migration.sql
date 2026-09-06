/*
  Warnings:

  - A unique constraint covering the columns `[athleteProfileId,workoutVariantId,scheduledDate]` on the table `ScheduledWorkout` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ScheduledWorkout_athleteProfileId_workoutVariantId_schedule_key" ON "ScheduledWorkout"("athleteProfileId", "workoutVariantId", "scheduledDate");
