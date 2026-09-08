ALTER TABLE "WorkoutMovementPrescription"
ADD COLUMN "percentage" DECIMAL(5,2),
ADD COLUMN "referenceRepMax" INTEGER,
ADD COLUMN "referenceMovementId" TEXT;

CREATE INDEX "WorkoutMovementPrescription_referenceMovementId_idx"
ON "WorkoutMovementPrescription"("referenceMovementId");

ALTER TABLE "WorkoutMovementPrescription"
ADD CONSTRAINT "WorkoutMovementPrescription_referenceMovementId_fkey"
FOREIGN KEY ("referenceMovementId") REFERENCES "Movement"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
