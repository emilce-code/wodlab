ALTER TABLE "WorkoutResultMovement"
ADD COLUMN "workoutMovementPrescriptionId" TEXT,
ADD COLUMN "prescribedPercentage" DECIMAL(5,2),
ADD COLUMN "referenceRepMax" INTEGER,
ADD COLUMN "referenceLoad" DECIMAL(65,30),
ADD COLUMN "referenceWeightUnit" "WeightUnit",
ADD COLUMN "targetLoad" DECIMAL(65,30),
ADD COLUMN "targetWeightUnit" "WeightUnit";

CREATE INDEX "WorkoutResultMovement_workoutMovementPrescriptionId_idx"
ON "WorkoutResultMovement"("workoutMovementPrescriptionId");

ALTER TABLE "WorkoutResultMovement"
ADD CONSTRAINT "WorkoutResultMovement_workoutMovementPrescriptionId_fkey"
FOREIGN KEY ("workoutMovementPrescriptionId")
REFERENCES "WorkoutMovementPrescription"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
