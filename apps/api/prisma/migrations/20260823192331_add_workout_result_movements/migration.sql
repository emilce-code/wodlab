-- AlterTable
ALTER TABLE "MovementResult" ADD COLUMN     "sourceWorkoutResultId" TEXT;

-- CreateTable
CREATE TABLE "WorkoutResultMovement" (
    "id" TEXT NOT NULL,
    "workoutResultId" TEXT NOT NULL,
    "workoutMovementId" TEXT NOT NULL,
    "reps" INTEGER,
    "load" DECIMAL(65,30),
    "weightUnit" "WeightUnit",
    "distance" INTEGER,
    "calories" INTEGER,
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutResultMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutResultMovement_workoutMovementId_idx" ON "WorkoutResultMovement"("workoutMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutResultMovement_workoutResultId_workoutMovementId_key" ON "WorkoutResultMovement"("workoutResultId", "workoutMovementId");

-- CreateIndex
CREATE INDEX "MovementResult_sourceWorkoutResultId_idx" ON "MovementResult"("sourceWorkoutResultId");

-- AddForeignKey
ALTER TABLE "MovementResult" ADD CONSTRAINT "MovementResult_sourceWorkoutResultId_fkey" FOREIGN KEY ("sourceWorkoutResultId") REFERENCES "WorkoutResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutResultMovement" ADD CONSTRAINT "WorkoutResultMovement_workoutResultId_fkey" FOREIGN KEY ("workoutResultId") REFERENCES "WorkoutResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutResultMovement" ADD CONSTRAINT "WorkoutResultMovement_workoutMovementId_fkey" FOREIGN KEY ("workoutMovementId") REFERENCES "WorkoutMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
